import { UserSession, LanguageCode, UserPlan } from '../shared/types';
import { SUPPORTED_LANGUAGES, ALL_LANGUAGE_CODES } from '../shared/constants/languages';
import { STORAGE_KEYS } from '../shared/constants';

// DOM Elements
const authWarning = document.getElementById('auth-warning')!;
const signinLink = document.getElementById('signin-link')!;
const shortcutsLink = document.getElementById('shortcuts-link')!;

const preferredLanguageSelect = document.getElementById('preferred-language') as HTMLSelectElement;
const autoStopSelect = document.getElementById('auto-stop') as HTMLSelectElement;
const maxDurationSelect = document.getElementById('max-duration') as HTMLSelectElement;
const defaultObjectiveSelect = document.getElementById('default-objective') as HTMLSelectElement;
const autoInsertCheckbox = document.getElementById('auto-insert') as HTMLInputElement;

const userAvatar = document.getElementById('user-avatar') as HTMLImageElement;
const userName = document.getElementById('user-name')!;
const userEmail = document.getElementById('user-email')!;
const subscriptionInfo = document.getElementById('subscription-info')!;
const planDisplay = document.getElementById('plan-display')!;
const planDetails = document.getElementById('plan-details')!;
const upgradeBtn = document.getElementById('upgrade-btn')!;
const manageSubscription = document.getElementById('manage-subscription');
const signoutBtn = document.getElementById('signout-btn')!;
const versionDisplay = document.getElementById('version')!;

const saveToast = document.getElementById('save-toast')!;

// Settings storage keys
const SETTINGS_KEYS = {
  AUTO_STOP: 'auto_stop_seconds',
  MAX_DURATION: 'max_duration_seconds',
  DEFAULT_OBJECTIVE: 'default_objective',
  AUTO_INSERT: 'auto_insert',
};

// State
let currentSession: UserSession | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init(): Promise<void> {
  versionDisplay.textContent = `v${chrome.runtime.getManifest().version}`;
  populateLanguageSelector();
  setupEventListeners();
  await loadSettings();
  await checkAuthStatus();
}

function populateLanguageSelector(): void {
  preferredLanguageSelect.innerHTML = '';
  ALL_LANGUAGE_CODES.forEach((code) => {
    const lang = SUPPORTED_LANGUAGES[code];
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${lang.nativeName} (${lang.name})`;
    preferredLanguageSelect.appendChild(option);
  });
}

function setupEventListeners(): void {
  preferredLanguageSelect.addEventListener('change', () => saveSetting(STORAGE_KEYS.PREFERRED_LANGUAGE, preferredLanguageSelect.value));
  autoStopSelect.addEventListener('change', () => saveSetting(SETTINGS_KEYS.AUTO_STOP, parseInt(autoStopSelect.value)));
  maxDurationSelect.addEventListener('change', () => saveSetting(SETTINGS_KEYS.MAX_DURATION, parseInt(maxDurationSelect.value)));
  defaultObjectiveSelect.addEventListener('change', () => saveSetting(SETTINGS_KEYS.DEFAULT_OBJECTIVE, defaultObjectiveSelect.value));
  autoInsertCheckbox.addEventListener('change', () => saveSetting(SETTINGS_KEYS.AUTO_INSERT, autoInsertCheckbox.checked));

  signinLink.addEventListener('click', (e) => {
    e.preventDefault();
    openPopup();
  });

  signoutBtn.addEventListener('click', handleSignOut);

  upgradeBtn.addEventListener('click', () => {
    sendMessage({ type: 'CREATE_CHECKOUT' }).then((response) => {
      if (response.url) {
        chrome.tabs.create({ url: response.url });
      } else {
        chrome.tabs.create({ url: 'https://vibebhasha.com/pricing' });
      }
    });
  });

  manageSubscription?.addEventListener('click', (e) => {
    e.preventDefault();
    // Open Stripe Customer Portal
    chrome.tabs.create({ url: 'https://billing.stripe.com/p/login/vibebhasha' });
  });

  shortcutsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
}

async function loadSettings(): Promise<void> {
  const storage = await chrome.storage.local.get([
    STORAGE_KEYS.PREFERRED_LANGUAGE,
    SETTINGS_KEYS.AUTO_STOP,
    SETTINGS_KEYS.MAX_DURATION,
    SETTINGS_KEYS.DEFAULT_OBJECTIVE,
    SETTINGS_KEYS.AUTO_INSERT,
  ]);

  if (storage[STORAGE_KEYS.PREFERRED_LANGUAGE]) {
    preferredLanguageSelect.value = storage[STORAGE_KEYS.PREFERRED_LANGUAGE];
  }
  if (storage[SETTINGS_KEYS.AUTO_STOP] !== undefined) {
    autoStopSelect.value = storage[SETTINGS_KEYS.AUTO_STOP].toString();
  }
  if (storage[SETTINGS_KEYS.MAX_DURATION] !== undefined) {
    maxDurationSelect.value = storage[SETTINGS_KEYS.MAX_DURATION].toString();
  }
  if (storage[SETTINGS_KEYS.DEFAULT_OBJECTIVE]) {
    defaultObjectiveSelect.value = storage[SETTINGS_KEYS.DEFAULT_OBJECTIVE];
  }
  if (storage[SETTINGS_KEYS.AUTO_INSERT] !== undefined) {
    autoInsertCheckbox.checked = storage[SETTINGS_KEYS.AUTO_INSERT];
  }
}

async function saveSetting(key: string, value: string | number | boolean): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
  showSaveToast();
}

function showSaveToast(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveToast.classList.remove('hidden');
  requestAnimationFrame(() => {
    saveToast.classList.add('visible');
  });
  saveTimeout = setTimeout(() => {
    saveToast.classList.remove('visible');
    setTimeout(() => {
      saveToast.classList.add('hidden');
    }, 300);
  }, 2000);
}

async function checkAuthStatus(): Promise<void> {
  try {
    const response = await sendMessage({ type: 'CHECK_AUTH' });

    if (response.isAuthenticated && response.session) {
      currentSession = response.session;
      showAuthenticatedState();
    } else {
      showUnauthenticatedState();
    }
  } catch {
    showUnauthenticatedState();
  }
}

function showAuthenticatedState(): void {
  if (!currentSession) return;

  authWarning.classList.add('hidden');

  userAvatar.src = currentSession.user.avatar_url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="%23e2e8f0"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>';
  userName.textContent = currentSession.user.name || 'User';
  userEmail.textContent = currentSession.user.email;

  // Show plan info
  const plan: UserPlan = currentSession.plan || 'free';

  if (plan === 'pro' || plan === 'team') {
    planDisplay.textContent = `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
    planDisplay.className = 'plan-badge pro';
    planDetails.textContent = 'Unlimited prompts';
    upgradeBtn.classList.add('hidden');
    manageSubscription?.classList.remove('hidden');
  } else {
    planDisplay.textContent = 'Free Plan';
    planDisplay.className = 'plan-badge free';
    planDetails.textContent = '5 free prompts';
    upgradeBtn.classList.remove('hidden');
    manageSubscription?.classList.add('hidden');
  }

  subscriptionInfo.classList.remove('hidden');
  signoutBtn.classList.remove('hidden');
}

function showUnauthenticatedState(): void {
  authWarning.classList.remove('hidden');

  userAvatar.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="%23e2e8f0"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>';
  userName.textContent = 'Not signed in';
  userEmail.textContent = '';

  subscriptionInfo.classList.add('hidden');
  signoutBtn.classList.add('hidden');
}

async function handleSignOut(): Promise<void> {
  try {
    await sendMessage({ type: 'SIGN_OUT' });
    currentSession = null;
    showUnauthenticatedState();
  } catch (error) {
    console.error('Sign out failed:', error);
  }
}

function openPopup(): void {
  chrome.action.openPopup?.() || chrome.tabs.create({ url: 'popup.html' });
}

// Communication with background script
function sendMessage(message: { type: string; [key: string]: unknown }): Promise<{
  isAuthenticated?: boolean;
  session?: UserSession;
  url?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || {});
    });
  });
}
