/**
 * Convert a Blob to a base64 encoded string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert a base64 encoded string to a Blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'audio/webm'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Convert a base64 encoded string to a File object
 */
export function base64ToFile(base64: string, filename: string, mimeType: string = 'audio/webm'): File {
  const blob = base64ToBlob(base64, mimeType);
  return new File([blob], filename, { type: mimeType });
}

/**
 * Get the duration of an audio Blob in seconds
 */
export async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = reject;
    audio.src = URL.createObjectURL(blob);
  });
}

/**
 * Format duration in seconds to a display string (e.g., "1:30")
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Check if the browser supports the required audio APIs
 */
export function checkAudioSupport(): { supported: boolean; error?: string } {
  if (!navigator.mediaDevices) {
    return { supported: false, error: 'MediaDevices API not supported' };
  }

  if (!navigator.mediaDevices.getUserMedia) {
    return { supported: false, error: 'getUserMedia not supported' };
  }

  if (!window.MediaRecorder) {
    return { supported: false, error: 'MediaRecorder API not supported' };
  }

  // Check for WebM/Opus support
  if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    // Fall back to check other formats
    if (!MediaRecorder.isTypeSupported('audio/webm')) {
      return { supported: false, error: 'WebM audio recording not supported' };
    }
  }

  return { supported: true };
}

/**
 * Get the best supported MIME type for audio recording
 */
export function getBestMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'audio/webm'; // Default fallback
}

/**
 * Calculate the approximate file size of a base64 string in bytes
 */
export function getBase64FileSize(base64: string): number {
  // Base64 encoding increases size by ~33%
  // Each 4 base64 characters represent 3 bytes of data
  const padding = (base64.match(/=/g) || []).length;
  return (base64.length * 3) / 4 - padding;
}

/**
 * Maximum allowed audio duration in seconds
 */
export const MAX_AUDIO_DURATION_SECONDS = 60;

/**
 * Maximum allowed file size in bytes (25MB - Whisper API limit)
 */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
