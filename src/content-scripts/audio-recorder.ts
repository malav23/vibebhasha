import { blobToBase64, getBestMimeType, MAX_AUDIO_DURATION_SECONDS } from '../shared/utils/audio-utils';

export type RecordingCallback = (state: 'started' | 'stopped' | 'error', data?: string | Error) => void;

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private recordingStartTime: number = 0;
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
  private isRecording: boolean = false;

  /**
   * Request microphone permission and start recording
   */
  async startRecording(onStateChange?: RecordingCallback): Promise<void> {
    if (this.isRecording) {
      throw new Error('Recording already in progress');
    }

    try {
      this.audioChunks = [];

      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Optimal for Whisper
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create MediaRecorder with best available MIME type
      const mimeType = getBestMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Handle recording errors
      this.mediaRecorder.onerror = (event) => {
        const error = new Error(`Recording error: ${(event as ErrorEvent).message || 'Unknown error'}`);
        this.cleanup();
        onStateChange?.('error', error);
      };

      // Start recording with 1-second timeslices
      this.mediaRecorder.start(1000);
      this.recordingStartTime = Date.now();
      this.isRecording = true;

      // Set maximum duration timer
      this.maxDurationTimer = setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording().catch(console.error);
        }
      }, MAX_AUDIO_DURATION_SECONDS * 1000);

      onStateChange?.('started');
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  /**
   * Stop recording and return the audio as a base64 encoded string
   */
  async stopRecording(): Promise<{ audioData: string; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const duration = (Date.now() - this.recordingStartTime) / 1000;
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
          const audioData = await blobToBase64(audioBlob);

          this.cleanup();
          resolve({ audioData, duration });
        } catch (error) {
          this.cleanup();
          reject(error);
        }
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  /**
   * Cancel recording and discard all data
   */
  cancelRecording(): void {
    this.cleanup();
  }

  /**
   * Get the current recording duration in seconds
   */
  getRecordingDuration(): number {
    if (!this.isRecording) {
      return 0;
    }
    return (Date.now() - this.recordingStartTime) / 1000;
  }

  /**
   * Check if currently recording
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Clean up all resources
   */
  private cleanup(): void {
    // Clear the max duration timer
    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }

    // Stop all audio tracks
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Reset recorder state
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingStartTime = 0;
  }
}

// Singleton instance for the content script
let recorderInstance: AudioRecorder | null = null;

export function getAudioRecorder(): AudioRecorder {
  if (!recorderInstance) {
    recorderInstance = new AudioRecorder();
  }
  return recorderInstance;
}
