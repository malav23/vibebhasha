import { CSS_PREFIX, ANIMATION } from '../shared/constants';
import { LanguageCode, RecordingState } from '../shared/types';
import { getRecordingStrings, RECORDING_STRINGS } from '../shared/constants/confirmation-ui';
import { formatDuration, MAX_AUDIO_DURATION_SECONDS } from '../shared/utils/audio-utils';

export class RecordingUI {
  private container: HTMLElement | null = null;
  private durationInterval: ReturnType<typeof setInterval> | null = null;
  private currentDuration: number = 0;
  private onStopCallback: (() => void) | null = null;
  private onCancelCallback: (() => void) | null = null;

  /**
   * Show the recording modal
   */
  show(
    onStop: () => void,
    onCancel: () => void,
    language: LanguageCode = 'hi'
  ): void {
    this.onStopCallback = onStop;
    this.onCancelCallback = onCancel;

    // Remove any existing modal
    this.hide();

    const strings = getRecordingStrings(language);

    // Create the modal container
    this.container = document.createElement('div');
    this.container.className = `${CSS_PREFIX}modal-overlay`;
    this.container.innerHTML = this.createModalHTML(strings);

    // Add to DOM
    document.body.appendChild(this.container);

    // Animate in
    requestAnimationFrame(() => {
      this.container?.classList.add(`${CSS_PREFIX}modal-visible`);
    });

    // Setup event listeners
    this.setupEventListeners();

    // Start duration counter
    this.startDurationCounter();
  }

  /**
   * Update the modal state
   */
  updateState(state: RecordingState, language: LanguageCode = 'hi'): void {
    if (!this.container) return;

    const strings = getRecordingStrings(language);
    const statusEl = this.container.querySelector(`.${CSS_PREFIX}status-text`);
    const subStatusEl = this.container.querySelector(`.${CSS_PREFIX}substatus-text`);
    const stopButton = this.container.querySelector(`.${CSS_PREFIX}stop-btn`) as HTMLButtonElement;
    const waveform = this.container.querySelector(`.${CSS_PREFIX}waveform`);

    if (state === 'recording') {
      if (statusEl) statusEl.textContent = strings.recording;
      if (subStatusEl) subStatusEl.textContent = strings.speakInYourLanguage;
      if (stopButton) {
        stopButton.textContent = strings.stopRecording;
        stopButton.disabled = false;
      }
      waveform?.classList.add(`${CSS_PREFIX}waveform-active`);
    } else if (state === 'processing') {
      if (statusEl) statusEl.textContent = strings.processing;
      if (subStatusEl) subStatusEl.textContent = strings.transcribing;
      if (stopButton) {
        stopButton.disabled = true;
        stopButton.textContent = strings.processing;
      }
      waveform?.classList.remove(`${CSS_PREFIX}waveform-active`);
      this.stopDurationCounter();
    }
  }

  /**
   * Hide and remove the modal
   */
  hide(): void {
    this.stopDurationCounter();

    if (this.container) {
      this.container.classList.remove(`${CSS_PREFIX}modal-visible`);
      setTimeout(() => {
        this.container?.remove();
        this.container = null;
      }, ANIMATION.FADE_OUT);
    }
  }

  /**
   * Create the modal HTML
   */
  private createModalHTML(strings: typeof RECORDING_STRINGS['hi']): string {
    return `
      <div class="${CSS_PREFIX}modal">
        <div class="${CSS_PREFIX}modal-content ${CSS_PREFIX}recording-modal">
          <div class="${CSS_PREFIX}recording-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>

          <div class="${CSS_PREFIX}waveform ${CSS_PREFIX}waveform-active">
            <div class="${CSS_PREFIX}waveform-bar"></div>
            <div class="${CSS_PREFIX}waveform-bar"></div>
            <div class="${CSS_PREFIX}waveform-bar"></div>
            <div class="${CSS_PREFIX}waveform-bar"></div>
            <div class="${CSS_PREFIX}waveform-bar"></div>
          </div>

          <div class="${CSS_PREFIX}status-text">${strings.recording}</div>
          <div class="${CSS_PREFIX}duration-text">0:00 / ${formatDuration(MAX_AUDIO_DURATION_SECONDS)}</div>
          <div class="${CSS_PREFIX}substatus-text">${strings.speakInYourLanguage}</div>

          <div class="${CSS_PREFIX}modal-actions">
            <button class="${CSS_PREFIX}stop-btn ${CSS_PREFIX}btn-primary">
              ${strings.stopRecording}
            </button>
            <button class="${CSS_PREFIX}cancel-btn ${CSS_PREFIX}btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.container) return;

    const stopBtn = this.container.querySelector(`.${CSS_PREFIX}stop-btn`);
    const cancelBtn = this.container.querySelector(`.${CSS_PREFIX}cancel-btn`);
    const overlay = this.container;

    stopBtn?.addEventListener('click', () => {
      this.onStopCallback?.();
    });

    cancelBtn?.addEventListener('click', () => {
      this.onCancelCallback?.();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.onCancelCallback?.();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.onCancelCallback?.();
    }
  };

  /**
   * Start the duration counter
   */
  private startDurationCounter(): void {
    this.currentDuration = 0;
    this.updateDurationDisplay();

    this.durationInterval = setInterval(() => {
      this.currentDuration += 1;
      this.updateDurationDisplay();

      // Auto-stop at max duration
      if (this.currentDuration >= MAX_AUDIO_DURATION_SECONDS) {
        this.onStopCallback?.();
      }
    }, 1000);
  }

  /**
   * Stop the duration counter
   */
  private stopDurationCounter(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Update the duration display
   */
  private updateDurationDisplay(): void {
    if (!this.container) return;

    const durationEl = this.container.querySelector(`.${CSS_PREFIX}duration-text`);
    if (durationEl) {
      const progress = (this.currentDuration / MAX_AUDIO_DURATION_SECONDS) * 100;
      durationEl.textContent = `${formatDuration(this.currentDuration)} / ${formatDuration(MAX_AUDIO_DURATION_SECONDS)}`;

      // Update progress bar if exists
      const progressBar = this.container.querySelector(`.${CSS_PREFIX}progress-bar`) as HTMLElement;
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
    }
  }
}

// Singleton instance
let recordingUIInstance: RecordingUI | null = null;

export function getRecordingUI(): RecordingUI {
  if (!recordingUIInstance) {
    recordingUIInstance = new RecordingUI();
  }
  return recordingUIInstance;
}
