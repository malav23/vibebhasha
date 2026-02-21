import { LanguageCode, RecordingState, TranscriptionResult, ElaborationResult } from '../shared/types';
import { checkAudioSupport } from '../shared/utils/audio-utils';
import { isLanguageSupported } from '../shared/constants/languages';

import { getAudioRecorder } from './audio-recorder';
import { getRecordingUI } from './recording-ui';
import { getConfirmationModal } from './confirmation-modal';
import { getPreviewModal } from './preview-modal';
import { getUpgradeModal } from './upgrade-modal';
import { getKeyboardHandler } from './keyboard-handler';
import { getLovableAdapter, LovableAdapter } from './lovable-adapter';

class VoiceInputController {
  private audioRecorder = getAudioRecorder();
  private recordingUI = getRecordingUI();
  private confirmationModal = getConfirmationModal();
  private previewModal = getPreviewModal();
  private upgradeModal = getUpgradeModal();
  private keyboardHandler = getKeyboardHandler();
  private lovableAdapter = getLovableAdapter();

  private state: RecordingState = 'idle';
  private currentLanguage: LanguageCode = 'hi';

  async init(): Promise<void> {
    // Check if we're on Lovable
    if (!LovableAdapter.isLovablePage()) {
      console.log('Lovable Voice Helper: Not on Lovable.dev, extension inactive');
      return;
    }

    // Check audio support
    const audioSupport = checkAudioSupport();
    if (!audioSupport.supported) {
      console.error('Lovable Voice Helper: Audio not supported -', audioSupport.error);
      return;
    }

    // Initialize Lovable adapter
    await this.lovableAdapter.init();

    // Setup event handlers
    this.setupEventHandlers();

    console.log('Lovable Voice Helper: Initialized successfully');
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
      return true; // Keep message channel open for async response
    });
  }

  private async handleMicrophoneClick(): Promise<void> {
    console.log('VibeBhasha: Mic button clicked, current state:', this.state);

    try {
      if (this.state === 'recording') {
        // Stop recording
        await this.stopRecording();
      } else if (this.state === 'idle') {
        // Check authentication first
        console.log('VibeBhasha: Checking authentication...');
        const authResult = await this.checkAuth();
        console.log('VibeBhasha: Auth result:', authResult);

        if (!authResult.isAuthenticated) {
          alert('Please sign in first! Click the VibeBhasha extension icon in the toolbar to sign in with Google.');
          return;
        }

        // Check usage limit
        console.log('VibeBhasha: Checking usage limit...');
        const usageResult = await this.checkUsage();
        console.log('VibeBhasha: Usage result:', usageResult);

        if (!usageResult.allowed) {
          this.showUpgradeModal();
          return;
        }

        // Start recording
        console.log('VibeBhasha: Starting recording...');
        await this.startRecording();
      }
    } catch (error) {
      console.error('VibeBhasha: Error in handleMicrophoneClick:', error);
      alert(`Error: ${(error as Error).message}`);
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
      this.state = 'processing';
      this.lovableAdapter.setMicButtonState('processing');
      this.recordingUI.updateState('processing', this.currentLanguage);

      // Stop recording and get audio data
      const { audioData, duration } = await this.audioRecorder.stopRecording();

      // Send to background script for transcription
      const transcriptionResult = await this.transcribeAudio(audioData);

      // Hide recording UI
      this.recordingUI.hide();

      if (transcriptionResult.error) {
        throw new Error(transcriptionResult.error);
      }

      // Update detected language
      if (isLanguageSupported(transcriptionResult.language)) {
        this.currentLanguage = transcriptionResult.language as LanguageCode;
      }

      // Show confirmation modal
      await this.showConfirmation(transcriptionResult);
    } catch (error) {
      console.error('Failed to process recording:', error);
      this.handleError(error as Error);
    }
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

    // Get the final text (edited or original)
    const finalText = result.editedText || transcription.text;

    // Elaborate the prompt
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

      // Show preview
      await this.showPreview(
        elaborationResult,
        transcription.text
      );
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
      const textToInsert = result.editedPrompt || elaboration.elaborated;
      const inserted = this.lovableAdapter.insertTextIntoInput(textToInsert);

      if (!inserted) {
        console.error('Failed to insert text into Lovable');
      }
    }

    this.resetState();
  }

  private showUpgradeModal(): void {
    this.upgradeModal.show(
      () => {
        // Open upgrade page
        window.open('https://lovable-voice-helper.com/upgrade', '_blank');
      },
      () => {
        // Dismissed
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

    // Could show an error notification here
    alert(`Error: ${error.message}`);
  }

  // Communication with background script
  private async checkAuth(): Promise<{ isAuthenticated: boolean }> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
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
        console.log('VibeBhasha: CHECK_USAGE response:', response);
        // Handle nested result structure
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
