import { signInWithGoogle, signOut, isAuthenticated, getSession } from './google-auth';
import { initSessionManager } from './session-manager';
import { checkUsageLimit, recordUsage, clearUsageCache } from './usage-limiter';
import { transcribeAudio, translateAndElaborate, estimateTokens } from './gemini-service';
import { supabaseService } from './supabase-service';
import {
  ExtensionMessage,
  TranscriptionResponse,
  ElaborationResponse,
  AuthResponse,
  UsageResponse,
  LanguageCode,
  ObjectiveType,
  UserPlan,
} from '../shared/types';
import { SUPABASE_URL, SUPABASE_ANON_KEY, EDGE_FUNCTIONS, STORAGE_KEYS } from '../shared/constants';

// Initialize session manager on service worker start
initSessionManager();

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener(
  (message: { type: string; [key: string]: unknown }, _sender, sendResponse) => {
    handleMessage(message, sendResponse);
    return true; // Keep message channel open for async response
  }
);

/**
 * Handle incoming messages
 */
async function handleMessage(
  message: { type: string; [key: string]: unknown },
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
        await handleTranscription(message.audioData as string, sendResponse);
        break;

      case 'ELABORATE_PROMPT':
        await handleElaboration(
          message.text as string,
          message.sourceLanguage as LanguageCode,
          message.objective as ObjectiveType,
          message.additionalContext as string | undefined,
          sendResponse
        );
        break;

      case 'CREATE_CHECKOUT':
        await handleCreateCheckout(message.planType as string | undefined, sendResponse);
        break;

      case 'CHECK_PLAN':
        await handleCheckPlan(sendResponse);
        break;

      case 'OPEN_POPUP':
        try {
          await chrome.action.openPopup();
        } catch {
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
async function handleCheckAuth(sendResponse: (response: unknown) => void): Promise<void> {
  const authenticated = isAuthenticated();
  const session = getSession();

  // Check plan from profile if authenticated
  let plan: UserPlan = 'free';
  if (authenticated && session) {
    const profile = await supabaseService.getUserProfile();
    if (profile?.plan) {
      plan = profile.plan as UserPlan;
    }
  }

  sendResponse({
    type: 'AUTH_RESULT',
    isAuthenticated: authenticated,
    session: session ? { ...session, plan } : undefined,
  });
}

/**
 * Handle sign in request
 */
async function handleSignIn(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const session = await signInWithGoogle();
    clearUsageCache();

    // Get plan from profile
    let plan: UserPlan = 'free';
    const profile = await supabaseService.getUserProfile();
    if (profile?.plan) {
      plan = profile.plan as UserPlan;
    }

    await chrome.storage.local.set({ [STORAGE_KEYS.USER_PLAN]: plan });

    sendResponse({
      type: 'AUTH_RESULT',
      isAuthenticated: true,
      session: { ...session, plan },
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
async function handleSignOut(sendResponse: (response: unknown) => void): Promise<void> {
  await signOut();
  clearUsageCache();
  await chrome.storage.local.remove(STORAGE_KEYS.USER_PLAN);

  sendResponse({
    type: 'AUTH_RESULT',
    isAuthenticated: false,
  });
}

/**
 * Handle usage check request
 */
async function handleCheckUsage(sendResponse: (response: unknown) => void): Promise<void> {
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
  sendResponse: (response: unknown) => void
): Promise<void> {
  if (!isAuthenticated()) {
    sendResponse({ type: 'TRANSCRIPTION_RESULT', error: 'Not authenticated' });
    return;
  }

  const usageCheck = await checkUsageLimit();
  if (!usageCheck.allowed) {
    sendResponse({ type: 'TRANSCRIPTION_RESULT', error: 'Daily limit reached' });
    return;
  }

  try {
    const result = await transcribeAudio(audioData);
    sendResponse({ type: 'TRANSCRIPTION_RESULT', result });
  } catch (error) {
    sendResponse({ type: 'TRANSCRIPTION_RESULT', error: (error as Error).message });
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
  sendResponse: (response: unknown) => void
): Promise<void> {
  if (!isAuthenticated()) {
    sendResponse({ type: 'ELABORATION_RESULT', error: 'Not authenticated' });
    return;
  }

  try {
    const result = await translateAndElaborate({
      text,
      sourceLanguage,
      objective,
      additionalContext,
    });

    await recordUsage({
      sourceLanguage,
      objective,
      additionalContext,
      originalTextLength: text.length,
      elaboratedTextLength: result.elaborated.length,
      tokensUsed: estimateTokens(text) + estimateTokens(result.elaborated),
    });

    sendResponse({ type: 'ELABORATION_RESULT', result });
  } catch (error) {
    sendResponse({ type: 'ELABORATION_RESULT', error: (error as Error).message });
  }
}

/**
 * Handle Stripe checkout creation
 */
async function handleCreateCheckout(
  planType: string | undefined,
  sendResponse: (response: unknown) => void
): Promise<void> {
  if (!isAuthenticated()) {
    sendResponse({ error: 'Not authenticated' });
    return;
  }

  try {
    const session = getSession();
    if (!session) {
      sendResponse({ error: 'No session' });
      return;
    }

    const response = await fetch(`${SUPABASE_URL}${EDGE_FUNCTIONS.CREATE_CHECKOUT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-user-token': session.access_token,
      },
      body: JSON.stringify({ planType: planType || 'monthly' }),
    });

    const data = await response.json();

    if (data.url) {
      sendResponse({ url: data.url, sessionId: data.sessionId });
    } else {
      sendResponse({ error: data.error || 'Failed to create checkout' });
    }
  } catch (error) {
    sendResponse({ error: (error as Error).message });
  }
}

/**
 * Handle plan check — polls Supabase for latest plan status
 */
async function handleCheckPlan(sendResponse: (response: unknown) => void): Promise<void> {
  try {
    const profile = await supabaseService.getUserProfile();
    const plan = (profile?.plan as UserPlan) || 'free';

    await chrome.storage.local.set({ [STORAGE_KEYS.USER_PLAN]: plan });

    // Notify content scripts of plan change
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'PLAN_UPDATED', plan });
    }

    sendResponse({ type: 'PLAN_RESULT', plan });
  } catch (error) {
    sendResponse({ error: (error as Error).message });
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('VibeBhasha installed');
  } else if (details.reason === 'update') {
    console.log('VibeBhasha updated to version', chrome.runtime.getManifest().version);
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-recording') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_RECORDING' });
    }
  }
});

// Poll for plan changes periodically (every 5 minutes) to catch webhook updates
chrome.alarms.create('check-plan', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'check-plan' && isAuthenticated()) {
    const profile = await supabaseService.getUserProfile();
    if (profile?.plan) {
      const currentPlan = (await chrome.storage.local.get(STORAGE_KEYS.USER_PLAN))[STORAGE_KEYS.USER_PLAN];
      if (profile.plan !== currentPlan) {
        await chrome.storage.local.set({ [STORAGE_KEYS.USER_PLAN]: profile.plan });

        // Notify active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'PLAN_UPDATED', plan: profile.plan });
        }
      }
    }
  }
});

console.log('VibeBhasha background service worker started');
