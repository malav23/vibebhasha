import { CSS_PREFIX, ANIMATION } from '../shared/constants';
import { LanguageCode, RecordingState } from '../shared/types';
import { getRecordingStrings, RECORDING_STRINGS } from '../shared/constants/confirmation-ui';
import { formatDuration, MAX_AUDIO_DURATION_SECONDS } from '../shared/utils/audio-utils';

export class RecordingUI {
  private container: HTMLElement | null = null;
  private durationInterval: ReturnType<typeof setInterval> | null = null;
  private longWaitTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentDuration: number = 0;
  private processingStartTime: number = 0;
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private onStopCallback: (() => void) | null = null;
  private onCancelCallback: (() => void) | null = null;
  private analyserNode: AnalyserNode | null = null;
  private animationFrameId: number | null = null;

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

    this.hide();

    const strings = getRecordingStrings(language);

    this.container = document.createElement('div');
    this.container.className = `${CSS_PREFIX}modal-overlay`;
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'true');
    this.container.setAttribute('aria-label', 'Recording voice input');
    this.container.innerHTML = this.createModalHTML(strings);

    document.body.appendChild(this.container);

    requestAnimationFrame(() => {
      this.container?.classList.add(`${CSS_PREFIX}modal-visible`);
    });

    this.setupEventListeners();
    this.startDurationCounter();
  }

  /**
   * Connect an audio stream for real-time level visualization
   */
  connectAudioStream(stream: MediaStream): void {
    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      this.analyserNode = audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;
      source.connect(this.analyserNode);
      this.startAudioVisualization();
    } catch (e) {
      console.warn('VibeBhasha: Could not connect audio visualizer', e);
    }
  }

  private startAudioVisualization(): void {
    if (!this.analyserNode || !this.container) return;

    const bars = this.container.querySelectorAll(`.${CSS_PREFIX}waveform-bar`);
    if (bars.length === 0) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const animate = () => {
      if (!this.analyserNode || !this.container) return;

      this.analyserNode.getByteFrequencyData(dataArray);

      // Map frequency data to bar heights
      const barCount = bars.length;
      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * dataArray.length);
        const value = dataArray[dataIndex] || 0;
        const height = Math.max(8, (value / 255) * 40);
        (bars[i] as HTMLElement).style.height = `${height}px`;
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
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
    } else if (state === 'transcribing') {
      if (statusEl) statusEl.innerHTML = `${strings.transcribing}<span class="${CSS_PREFIX}ellipsis"></span>`;
      if (subStatusEl) subStatusEl.textContent = '';
      if (stopButton) {
        stopButton.disabled = true;
        stopButton.textContent = strings.processing;
      }
      waveform?.classList.remove(`${CSS_PREFIX}waveform-active`);
      this.stopDurationCounter();
      this.stopAudioVisualization();
      this.startProcessingTimer();
    } else if (state === 'translating') {
      if (statusEl) statusEl.innerHTML = `Translating<span class="${CSS_PREFIX}ellipsis"></span>`;
      if (subStatusEl) subStatusEl.textContent = '';
      if (stopButton) {
        stopButton.disabled = true;
        stopButton.textContent = strings.processing;
      }
      waveform?.classList.remove(`${CSS_PREFIX}waveform-active`);
    } else if (state === 'processing') {
      if (statusEl) statusEl.innerHTML = `${strings.processing}<span class="${CSS_PREFIX}ellipsis"></span>`;
      if (subStatusEl) subStatusEl.textContent = strings.transcribing;
      if (stopButton) {
        stopButton.disabled = true;
        stopButton.textContent = strings.processing;
      }
      waveform?.classList.remove(`${CSS_PREFIX}waveform-active`);
      this.stopDurationCounter();
      this.stopAudioVisualization();
    }
  }

  private startProcessingTimer(): void {
    this.processingStartTime = Date.now();
    this.clearProcessingInterval();

    this.processingInterval = setInterval(() => {
      if (!this.container) {
        this.clearProcessingInterval();
        return;
      }

      const elapsed = Math.floor((Date.now() - this.processingStartTime) / 1000);
      const subStatusEl = this.container.querySelector(`.${CSS_PREFIX}substatus-text`);

      if (elapsed >= 5 && subStatusEl) {
        subStatusEl.textContent = `Still working — longer recordings take a moment (${elapsed}s)`;
      } else if (subStatusEl && elapsed > 0) {
        subStatusEl.textContent = `Processing... (${elapsed}s)`;
      }
    }, 1000);
  }

  private clearProcessingInterval(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Show transcribed text inside the recording modal
   */
  showTranscribedText(text: string): void {
    if (!this.container) return;

    const existing = this.container.querySelector(`.${CSS_PREFIX}transcribed-text`);
    if (existing) existing.remove();

    const subStatusEl = this.container.querySelector(`.${CSS_PREFIX}substatus-text`);
    if (subStatusEl) {
      const textDiv = document.createElement('div');
      textDiv.className = `${CSS_PREFIX}transcribed-text`;
      textDiv.textContent = text;
      subStatusEl.after(textDiv);
    }
  }

  /**
   * Hide and remove the modal
   */
  hide(): void {
    this.stopDurationCounter();
    this.stopAudioVisualization();
    this.clearProcessingInterval();

    if (this.longWaitTimeout) {
      clearTimeout(this.longWaitTimeout);
      this.longWaitTimeout = null;
    }

    if (this.container) {
      this.container.classList.remove(`${CSS_PREFIX}modal-visible`);
      setTimeout(() => {
        this.container?.remove();
        this.container = null;
      }, ANIMATION.FADE_OUT);
    }
  }

  private stopAudioVisualization(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.analyserNode = null;
  }

  private createModalHTML(strings: typeof RECORDING_STRINGS['hi']): string {
    // Create 8 bars for better visualization
    const bars = Array(8).fill(0).map(() =>
      `<div class="${CSS_PREFIX}waveform-bar"></div>`
    ).join('');

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
            ${bars}
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

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.onCancelCallback?.();
      }
    });

    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.onCancelCallback?.();
    }
  };

  private startDurationCounter(): void {
    this.currentDuration = 0;
    this.updateDurationDisplay();

    this.durationInterval = setInterval(() => {
      this.currentDuration += 1;
      this.updateDurationDisplay();

      if (this.currentDuration >= MAX_AUDIO_DURATION_SECONDS) {
        this.onStopCallback?.();
      }
    }, 1000);
  }

  private stopDurationCounter(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private updateDurationDisplay(): void {
    if (!this.container) return;

    const durationEl = this.container.querySelector(`.${CSS_PREFIX}duration-text`);
    if (durationEl) {
      durationEl.textContent = `${formatDuration(this.currentDuration)} / ${formatDuration(MAX_AUDIO_DURATION_SECONDS)}`;
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
