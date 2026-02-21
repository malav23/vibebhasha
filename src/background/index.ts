import { signInWithGoogle, signOut, isAuthenticated, getSession } from './google-auth';
import { initSessionManager } from './session-manager';
import { checkUsageLimit, recordUsage, clearUsageCache } from './usage-limiter';
import { transcribeAudio, translateAndElaborate, estimateTokens } from './gemini-service';
import {
  ExtensionMessage,
  TranscriptionResponse,
  ElaborationResponse,
  AuthResponse,
  UsageResponse,
  LanguageCode,
  ObjectiveType,
} from '../shared/types';

// Initialize session manager on service worker start
initSessionManager();

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true; // Keep message channel open for async response
  }
);

/**
 * Handle incoming messages
 */
async function handleMessage(
  message: ExtensionMessage,
  sendResponse: (response: unknown) => void
): Promise<void> {
  try {
    switch (message.type) {
      case 'CHECK_AUTH':
        await handleCheckAuth(sendResponse);
        break;

      case 'SIGN_IN':
        await handleSignIn(sendResponse);
        break;

      case 'SIGN_OUT':
        await handleSignOut(sendResponse);
        break;

      case 'CHECK_USAGE':
        await handleCheckUsage(sendResponse);
        break;

      case 'START_TRANSCRIPTION':
        await handleTranscription(message.audioData, sendResponse);
        break;

      case 'ELABORATE_PROMPT':
        await handleElaboration(
          message.text,
          message.sourceLanguage,
          message.objective,
          message.additionalContext,
          sendResponse
        );
        break;

      case 'OPEN_POPUP':
        // Can't programmatically open popup, but we can show a notification
        // and trigger the popup via action click
        try {
          await chrome.action.openPopup();
        } catch {
          // openPopup may not be available, show notification instead
          console.log('Please click the extension icon to sign in');
        }
        sendResponse({ status: 'ok' });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Message handler error:', error);
    sendResponse({ error: (error as Error).message });
  }
}

/**
 * Handle auth check request
 */
async function handleCheckAuth(sendResponse: (response: AuthResponse) => void): Promise<void> {
  const authenticated = isAuthenticated();
  const session = getSession();

  sendResponse({
    type: 'AUTH_RESULT',
    isAuthenticated: authenticated,
    session: session || undefined,
  });
}

/**
 * Handle sign in request
 */
async function handleSignIn(sendResponse: (response: AuthResponse) => void): Promise<void> {
  try {
    const session = await signInWithGoogle();
    clearUsageCache(); // Clear usage cache on new login

    sendResponse({
      type: 'AUTH_RESULT',
      isAuthenticated: true,
      session,
    });
  } catch (error) {
    sendResponse({
      type: 'AUTH_RESULT',
      isAuthenticated: false,
      error: (error as Error).message,
    });
  }
}

/**
 * Handle sign out request
 */
async function handleSignOut(sendResponse: (response: AuthResponse) => void): Promise<void> {
  await signOut();
  clearUsageCache();

  sendResponse({
    type: 'AUTH_RESULT',
    isAuthenticated: false,
  });
}

/**
 * Handle usage check request
 */
async function handleCheckUsage(sendResponse: (response: UsageResponse) => void): Promise<void> {
  const result = await checkUsageLimit();

  sendResponse({
    type: 'USAGE_RESULT',
    result,
  });
}

/**
 * Handle transcription request
 */
async function handleTranscription(
  audioData: string,
  sendResponse: (response: TranscriptionResponse) => void
): Promise<void> {
  // Verify authentication
  if (!isAuthenticated()) {
    sendResponse({
      type: 'TRANSCRIPTION_RESULT',
      error: 'Not authenticated',
    });
    return;
  }

  // Check usage limit
  const usageCheck = await checkUsageLimit();
  if (!usageCheck.allowed) {
    sendResponse({
      type: 'TRANSCRIPTION_RESULT',
      error: 'Daily limit reached',
    });
    return;
  }

  try {
    const result = await transcribeAudio(audioData);

    sendResponse({
      type: 'TRANSCRIPTION_RESULT',
      result,
    });
  } catch (error) {
    sendResponse({
      type: 'TRANSCRIPTION_RESULT',
      error: (error as Error).message,
    });
  }
}

/**
 * Handle elaboration request
 */
async function handleElaboration(
  text: string,
  sourceLanguage: LanguageCode,
  objective: ObjectiveType,
  additionalContext: string | undefined,
  sendResponse: (response: ElaborationResponse) => void
): Promise<void> {
  // Verify authentication
  if (!isAuthenticated()) {
    sendResponse({
      type: 'ELABORATION_RESULT',
      error: 'Not authenticated',
    });
    return;
  }

  try {
    const result = await translateAndElaborate({
      text,
      sourceLanguage,
      objective,
      additionalContext,
    });

    // Record usage after successful elaboration
    await recordUsage({
      sourceLanguage,
      objective,
      additionalContext,
      originalTextLength: text.length,
      elaboratedTextLength: result.elaborated.length,
      tokensUsed: estimateTokens(text) + estimateTokens(result.elaborated),
    });

    sendResponse({
      type: 'ELABORATION_RESULT',
      result,
    });
  } catch (error) {
    sendResponse({
      type: 'ELABORATION_RESULT',
      error: (error as Error).message,
    });
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Lovable Voice Helper installed');
    // Could open welcome/onboarding page here
  } else if (details.reason === 'update') {
    console.log('Lovable Voice Helper updated to version', chrome.runtime.getManifest().version);
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-recording') {
    // Send message to active tab's content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_RECORDING' });
    }
  }
});

console.log('Lovable Voice Helper background service worker started');
