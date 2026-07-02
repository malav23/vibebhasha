import { LanguageCode, RecordingState, TranscriptionResult, ElaborationResult, UserPlan } from '../shared/types';
import { checkAudioSupport } from '../shared/utils/audio-utils';
import { getFriendlyError, isRetryableError, isOffline } from '../shared/utils/error-messages';
import { isLanguageSupported } from '../shared/constants/languages';
import { STORAGE_KEYS, FREE_TIER_TOTAL_LIMIT } from '../shared/constants';

import { getAudioRecorder } from './audio-recorder';
import { getRecordingUI } from './recording-ui';
import { getConfirmationModal } from './confirmation-modal';
import { getPreviewModal } from './preview-modal';
import { getUpgradeModal } from './upgrade-modal';
import { getKeyboardHandler } from './keyboard-handler';
import { getLovableAdapter, LovableAdapter } from './lovable-adapter';
import { getToast } from './toast-notification';

class VoiceInputController {
  private audioRecorder = getAudioRecorder();
  private recordingUI = getRecordingUI();
  private confirmationModal = getConfirmationModal();
  private previewModal = getPreviewModal();
  private upgradeModal = getUpgradeModal();
  private keyboardHandler = getKeyboardHandler();
  private lovableAdapter = getLovableAdapter();
  private toast = getToast();

  private state: RecordingState = 'idle';
  private currentLanguage: LanguageCode = 'hi';
  private userPlan: UserPlan = 'free';
  private remainingPrompts: number = FREE_TIER_TOTAL_LIMIT;
  private lastTranscribedText: string = '';
  private retryCount: number = 0;
  private maxRetries: number = 1;

  async init(): Promise<void> {
    // Check if we're on Lovable
    if (!LovableAdapter.isLovablePage()) {
      console.log('VibeBhasha: Not on Lovable.dev, extension inactive');
      return;
    }

    // Check audio support
    const audioSupport = checkAudioSupport();
    if (!audioSupport.supported) {
      console.error('VibeBhasha: Audio not supported -', audioSupport.error);
      return;
    }

    // Load user preferences
    await this.loadPreferences();

    // Initialize Lovable adapter
    await this.lovableAdapter.init();

    // Setup event handlers
    this.setupEventHandlers();

    // Setup offline detection
    this.setupOfflineDetection();

    // Update usage badge
    await this.updateUsageBadge();

    console.log('VibeBhasha: Initialized successfully');
  }

  private async loadPreferences(): Promise<void> {
    try {
      const storage = await chrome.storage.local.get([
        STORAGE_KEYS.PREFERRED_LANGUAGE,
        STORAGE_KEYS.USER_PLAN,
      ]);
      if (storage[STORAGE_KEYS.PREFERRED_LANGUAGE]) {
        this.currentLanguage = storage[STORAGE_KEYS.PREFERRED_LANGUAGE];
      }
      if (storage[STORAGE_KEYS.USER_PLAN]) {
        this.userPlan = storage[STORAGE_KEYS.USER_PLAN];
      }
    } catch (e) {
      console.warn('VibeBhasha: Could not load preferences', e);
    }
  }

  private setupOfflineDetection(): void {
    window.addEventListener('offline', () => {
      this.toast.warning("You're offline — voice input needs an internet connection");
    });
    window.addEventListener('online', () => {
      this.toast.success("You're back online");
    });
  }

  private setupEventHandlers(): void {
    // Microphone button click
    this.lovableAdapter.setMicButtonClickHandler(() => {
      this.handleMicrophoneClick();
    });

    // Keyboard shortcut
    this.keyboardHandler.start(() => {
      this.handleMicrophoneClick();
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      this.handleBackgroundMessage(message, sendResponse);
      return true;
    });
  }

  private async handleMicrophoneClick(): Promise<void> {
    console.log('VibeBhasha: Mic button clicked, current state:', this.state);

    // Check offline first
    if (isOffline()) {
      this.toast.warning("You're offline — check your internet connection");
      return;
    }

    try {
      if (this.state === 'recording') {
        await this.stopRecording();
      } else if (this.state === 'idle') {
        // Check authentication first
        const authResult = await this.checkAuth();

        if (!authResult.isAuthenticated) {
          chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
          this.toast.info('Please sign in to use voice input');
          return;
        }

        // Check usage limit
        const usageResult = await this.checkUsage();
        this.remainingPrompts = usageResult.remaining;

        if (!usageResult.allowed) {
          this.showUpgradeModal();
          return;
        }

        // Show last prompt warning
        if (this.remainingPrompts === 1) {
          this.toast.warning('Last free prompt — upgrade for unlimited');
        }

        await this.startRecording();
      }
    } catch (error) {
      console.error('VibeBhasha: Error in handleMicrophoneClick:', error);
      this.handleError(error as Error);
    }
  }

  private async startRecording(): Promise<void> {
    try {
      this.state = 'recording';
      this.lovableAdapter.setMicButtonState('recording');

      // Show recording UI
      this.recordingUI.show(
        () => this.stopRecording(),
        () => this.cancelRecording(),
        this.currentLanguage
      );

      // Start audio recording
      await this.audioRecorder.startRecording((state, data) => {
        if (state === 'error') {
          console.error('Recording error:', data);
          this.handleError(data as Error);
        }
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.handleError(error as Error);
    }
  }

  private async stopRecording(): Promise<void> {
    try {
      this.state = 'transcribing';
      this.lovableAdapter.setMicButtonState('processing');
      this.recordingUI.updateState('transcribing', this.currentLanguage);

      const { audioData } = await this.audioRecorder.stopRecording();

      // Transcribe with auto-retry on 5xx
      const transcriptionResult = await this.withRetry(() => this.transcribeAudio(audioData));

      if (transcriptionResult.error) {
        throw new Error(transcriptionResult.error);
      }

      // Smart language detection — auto-update and persist
      if (isLanguageSupported(transcriptionResult.language)) {
        const newLang = transcriptionResult.language as LanguageCode;
        if (newLang !== this.currentLanguage) {
          const oldLang = this.currentLanguage;
          this.currentLanguage = newLang;
          await chrome.storage.local.set({ [STORAGE_KEYS.PREFERRED_LANGUAGE]: newLang });

          // One-time detection toast
          const langName = this.getLanguageDisplayName(newLang);
          if (langName) {
            this.toast.info(`Detected ${langName} — language updated`);
          }
        }
      }

      this.lastTranscribedText = transcriptionResult.text;
      this.recordingUI.showTranscribedText(transcriptionResult.text);
      this.state = 'translating';
      this.recordingUI.updateState('translating', this.currentLanguage);

      // Use detected objective or default
      const objective = transcriptionResult.suggestedObjective || 'new_feature';

      // Elaborate with auto-retry on 5xx
      const elaborationResult = await this.withRetry(() =>
        this.elaboratePrompt(transcriptionResult.text, this.currentLanguage, objective)
      );

      if (elaborationResult.error) {
        throw new Error(elaborationResult.error);
      }

      // Show "Pro users skip this wait" flash for free users
      if (this.userPlan === 'free') {
        this.showProFlash();
      }

      this.recordingUI.hide();

      // Prepare text — add watermark for free tier
      let textToInsert = elaborationResult.elaborated;
      if (this.userPlan === 'free') {
        textToInsert += '\n\n— Prompted via VibeBhasha (vibebhasha.com)';
      }

      const inserted = this.lovableAdapter.insertTextIntoInput(textToInsert);

      if (inserted) {
        // Success feedback
        await this.showSuccessFeedback();
      } else {
        this.toast.error('Failed to insert prompt into input field');
      }

      // Update usage count
      this.remainingPrompts = Math.max(0, this.remainingPrompts - 1);
      await this.updateUsageBadge();

      this.resetState();
    } catch (error) {
      console.error('Failed to process recording:', error);
      this.handleError(error as Error);
    }
  }

  private async withRetry<T extends { error?: string }>(
    fn: () => Promise<T>
  ): Promise<T> {
    this.retryCount = 0;
    let result = await fn();

    while (result.error && isRetryableError(result.error) && this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`VibeBhasha: Retrying (${this.retryCount}/${this.maxRetries})...`);
      await new Promise(r => setTimeout(r, 1000));
      result = await fn();
    }

    this.retryCount = 0;
    return result;
  }

  private showProFlash(): void {
    const flash = document.createElement('div');
    flash.className = 'lvh-pro-flash';
    flash.textContent = 'Pro users skip this wait';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 2500);
  }

  private async showSuccessFeedback(): Promise<void> {
    this.toast.success('Prompt inserted!');

    // First-time confetti
    const storage = await chrome.storage.local.get(STORAGE_KEYS.FIRST_INSERT_DONE);
    if (!storage[STORAGE_KEYS.FIRST_INSERT_DONE]) {
      this.showConfetti();
      await chrome.storage.local.set({ [STORAGE_KEYS.FIRST_INSERT_DONE]: true });
    }
  }

  private showConfetti(): void {
    const container = document.createElement('div');
    container.className = 'lvh-confetti-container';
    document.body.appendChild(container);

    const colors = ['#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

    for (let i = 0; i < 30; i++) {
      const piece = document.createElement('div');
      piece.className = 'lvh-confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top = `${-10 + Math.random() * 20}%`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      piece.style.animationDuration = `${1.5 + Math.random() * 1}s`;
      container.appendChild(piece);
    }

    setTimeout(() => container.remove(), 3000);
  }

  private async updateUsageBadge(): Promise<void> {
    try {
      const authResult = await this.checkAuth();
      if (!authResult.isAuthenticated) return;

      const usageResult = await this.checkUsage();
      this.remainingPrompts = usageResult.remaining;

      if (this.userPlan !== 'free') {
        this.lovableAdapter.updateUsageBadge(-1); // No badge for pro
        return;
      }

      this.lovableAdapter.updateUsageBadge(this.remainingPrompts);
    } catch (e) {
      console.warn('VibeBhasha: Could not update usage badge', e);
    }
  }

  private getLanguageDisplayName(code: LanguageCode): string | null {
    const names: Record<string, string> = {
      hi: 'Hindi', bn: 'Bengali', ta: 'Tamil', te: 'Telugu', mr: 'Marathi',
      kn: 'Kannada', gu: 'Gujarati', ml: 'Malayalam', pa: 'Punjabi', or: 'Odia',
      as: 'Assamese', sa: 'Sanskrit', ne: 'Nepali', ks: 'Kashmiri',
      es: 'Spanish', de: 'German', zh: 'Mandarin', id: 'Indonesian',
    };
    return names[code] || null;
  }

  private cancelRecording(): void {
    this.audioRecorder.cancelRecording();
    this.recordingUI.hide();
    this.resetState();
  }

  private async showConfirmation(transcription: TranscriptionResult): Promise<void> {
    this.state = 'confirming';

    const result = await this.confirmationModal.show(
      transcription.text,
      this.currentLanguage
    );

    if (!result.confirmed) {
      this.resetState();
      return;
    }

    const finalText = result.editedText || transcription.text;

    this.state = 'processing';
    this.lovableAdapter.setMicButtonState('processing');

    try {
      const elaborationResult = await this.elaboratePrompt(
        finalText,
        this.currentLanguage,
        result.objective,
        result.additionalContext
      );

      if (elaborationResult.error) {
        throw new Error(elaborationResult.error);
      }

      await this.showPreview(elaborationResult, transcription.text);
    } catch (error) {
      console.error('Failed to elaborate prompt:', error);
      this.handleError(error as Error);
    }
  }

  private async showPreview(
    elaboration: ElaborationResult,
    originalText: string
  ): Promise<void> {
    this.state = 'previewing';

    const result = await this.previewModal.show(
      elaboration.elaborated,
      originalText,
      elaboration.translated
    );

    if (result.action === 'insert') {
      let textToInsert = result.editedPrompt || elaboration.elaborated;

      // Add watermark for free tier
      if (this.userPlan === 'free') {
        textToInsert += '\n\n— Prompted via VibeBhasha (vibebhasha.com)';
      }

      const inserted = this.lovableAdapter.insertTextIntoInput(textToInsert);

      if (inserted) {
        await this.showSuccessFeedback();
      } else {
        this.toast.error('Failed to insert prompt into input field');
      }
    }

    this.resetState();
  }

  private showUpgradeModal(): void {
    this.upgradeModal.show(
      this.lastTranscribedText,
      () => {
        // Open Stripe checkout via background
        chrome.runtime.sendMessage({ type: 'CREATE_CHECKOUT' }, (response) => {
          if (response?.url) {
            window.open(response.url, '_blank');
          } else {
            this.toast.error('Could not start checkout — please try again');
          }
        });
      },
      () => {
        // Dismissed
        this.toast.info('Upgrade anytime to unlock unlimited prompts');
      }
    );
  }

  private resetState(): void {
    this.state = 'idle';
    this.lovableAdapter.setMicButtonState('idle');
  }

  private handleError(error: Error): void {
    console.error('Voice Input Error:', error);
    this.recordingUI.hide();
    this.confirmationModal.hide();
    this.previewModal.hide();
    this.resetState();

    const friendly = getFriendlyError(error);

    if (friendly.actionLabel === 'Try Again') {
      this.toast.error(friendly.message, {
        label: friendly.actionLabel,
        onClick: () => this.handleMicrophoneClick(),
      });
    } else if (friendly.actionLabel === 'Sign In') {
      this.toast.error(friendly.message, {
        label: friendly.actionLabel,
        onClick: () => chrome.runtime.sendMessage({ type: 'OPEN_POPUP' }),
      });
    } else if (friendly.actionLabel === 'Go Pro') {
      this.toast.error(friendly.message, {
        label: friendly.actionLabel,
        onClick: () => this.showUpgradeModal(),
      });
    } else {
      this.toast.error(friendly.message);
    }
  }

  // Communication with background script
  private async checkAuth(): Promise<{ isAuthenticated: boolean }> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
        if (response?.session?.plan) {
          this.userPlan = response.session.plan;
        }
        resolve(response || { isAuthenticated: false });
      });
    });
  }

  private async checkUsage(): Promise<{ allowed: boolean; remaining: number }> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'CHECK_USAGE' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('VibeBhasha: CHECK_USAGE error:', chrome.runtime.lastError);
          resolve({ allowed: false, remaining: 0 });
          return;
        }
        if (response?.result) {
          resolve(response.result);
        } else {
          resolve(response || { allowed: false, remaining: 0 });
        }
      });
    });
  }

  private async transcribeAudio(audioData: string): Promise<TranscriptionResult & { error?: string }> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'START_TRANSCRIPTION', audioData },
        (response) => {
          if (response?.result) {
            resolve(response.result);
          } else {
            resolve({
              text: '',
              language: 'hi' as LanguageCode,
              duration: 0,
              remaining: 0,
              error: response?.error || 'Transcription failed',
            });
          }
        }
      );
    });
  }

  private async elaboratePrompt(
    text: string,
    sourceLanguage: LanguageCode,
    objective: string,
    additionalContext?: string
  ): Promise<ElaborationResult & { error?: string }> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: 'ELABORATE_PROMPT',
          text,
          sourceLanguage,
          objective,
          additionalContext,
        },
        (response) => {
          if (response?.result) {
            resolve(response.result);
          } else {
            resolve({
              original: text,
              translated: '',
              elaborated: '',
              error: response?.error || 'Elaboration failed',
            });
          }
        }
      );
    });
  }

  private handleBackgroundMessage(
    message: { type: string; [key: string]: unknown },
    sendResponse: (response: unknown) => void
  ): void {
    switch (message.type) {
      case 'PING':
        sendResponse({ status: 'ok' });
        break;

      case 'TOGGLE_RECORDING':
        this.handleMicrophoneClick();
        sendResponse({ status: 'ok' });
        break;

      case 'PLAN_UPDATED':
        this.userPlan = (message.plan as UserPlan) || 'free';
        chrome.storage.local.set({ [STORAGE_KEYS.USER_PLAN]: this.userPlan });
        this.updateUsageBadge();
        if (this.userPlan !== 'free') {
          this.toast.success('Welcome to VibeBhasha Pro! Unlimited prompts unlocked.');
        }
        sendResponse({ status: 'ok' });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }
}

// Log to verify script is running
console.log('VibeBhasha: Content script loaded on', window.location.href);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new VoiceInputController().init();
  });
} else {
  new VoiceInputController().init();
}
