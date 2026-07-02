/**
 * Human-friendly error message mapping.
 * Maps technical error patterns to user-friendly messages with optional actions.
 */

interface FriendlyError {
  message: string;
  actionLabel?: string;
}

const ERROR_MAP: Array<{ pattern: RegExp; friendly: FriendlyError }> = [
  {
    pattern: /transcription failed.*5\d{2}/i,
    friendly: { message: "Couldn't process audio — try speaking louder or closer to the mic", actionLabel: 'Try Again' },
  },
  {
    pattern: /transcription failed/i,
    friendly: { message: 'Voice recognition had trouble — please try again', actionLabel: 'Try Again' },
  },
  {
    pattern: /elaboration failed.*5\d{2}/i,
    friendly: { message: 'Our servers are having a moment — retrying...', actionLabel: 'Try Again' },
  },
  {
    pattern: /elaboration failed/i,
    friendly: { message: "Couldn't enhance your prompt — please try again", actionLabel: 'Try Again' },
  },
  {
    pattern: /not authenticated/i,
    friendly: { message: 'Please sign in to use voice input', actionLabel: 'Sign In' },
  },
  {
    pattern: /daily limit|limit reached/i,
    friendly: { message: "You've used all 5 free prompts — upgrade for unlimited", actionLabel: 'Go Pro' },
  },
  {
    pattern: /permission.*denied|not allowed/i,
    friendly: { message: 'Microphone access is needed — please allow it in your browser settings' },
  },
  {
    pattern: /no recording in progress/i,
    friendly: { message: 'Recording was interrupted — please try again', actionLabel: 'Try Again' },
  },
  {
    pattern: /recording already in progress/i,
    friendly: { message: 'Already recording — click stop when ready' },
  },
  {
    pattern: /network|fetch|failed to fetch/i,
    friendly: { message: "Can't reach our servers — check your internet connection", actionLabel: 'Retry' },
  },
  {
    pattern: /timeout/i,
    friendly: { message: 'Request timed out — please try again', actionLabel: 'Try Again' },
  },
  {
    pattern: /audio.*not supported/i,
    friendly: { message: 'Your browser doesn\'t support audio recording — try Chrome or Edge' },
  },
  {
    pattern: /5\d{2}/,
    friendly: { message: 'Something went wrong on our end — please try again', actionLabel: 'Try Again' },
  },
];

export function getFriendlyError(error: Error | string): FriendlyError {
  const errorMessage = typeof error === 'string' ? error : error.message;

  for (const { pattern, friendly } of ERROR_MAP) {
    if (pattern.test(errorMessage)) {
      return friendly;
    }
  }

  return {
    message: 'Something went wrong — please try again',
    actionLabel: 'Try Again',
  };
}

export function isRetryableError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return /5\d{2}|network|fetch|timeout/i.test(errorMessage);
}

export function isOffline(): boolean {
  return !navigator.onLine;
}
