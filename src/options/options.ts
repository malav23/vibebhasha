import { UserSession, LanguageCode, ObjectiveType } from '../shared/types';
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
const upgradeBtn = document.getElementById('upgrade-btn')!;
const signoutBtn = document.getElementById('signout-btn')!;
const shortcutKey = document.getElementById('shortcut-key')!;
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
  // Set version
  versionDisplay.textContent = `v${chrome.runtime.getManifest().version}`;

  // Update keyboard shortcut display for platform
  const isMac = navigator.platform.toLowerCase().includes('mac');
  shortcutKey.textContent = isMac ? '⌘' : 'Ctrl';

  // Populate language selector
  populateLanguageSelector();

  // Setup event listeners
  setupEventListeners();

  // Load settings
  await loadSettings();

  // Check auth status
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
  // Settings change listeners
  preferredLanguageSelect.addEventListener('change', () => saveSetting(STORAGE_KEYS.PREFERRED_LANGUAGE, preferredLanguageSelect.value));
  autoStopSelect.addEventListener('change', () => saveSetting(SETTINGS_KEYS.AUTO_STOP, parseInt(autoStopSelect.value)));
  maxDurationSelect.addEventListener('change', () => saveSetting(SETTINGS_KEYS.MAX_DURATION, parseInt(maxDurationSelect.value)));
  defaultObjectiveSelect.addEventListener('change', () => saveSetting(SETTINGS_KEYS.DEFAULT_OBJECTIVE, defaultObjectiveSelect.value));
  autoInsertCheckbox.addEventListener('change', () => saveSetting(SETTINGS_KEYS.AUTO_INSERT, autoInsertCheckbox.checked));

  // Auth links
  signinLink.addEventListener('click', (e) => {
    e.preventDefault();
    openPopup();
  });

  signoutBtn.addEventListener('click', handleSignOut);
  upgradeBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://lovable-voice-helper.com/upgrade' });
  });

  // Shortcuts link
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

  // Language
  if (storage[STORAGE_KEYS.PREFERRED_LANGUAGE]) {
    preferredLanguageSelect.value = storage[STORAGE_KEYS.PREFERRED_LANGUAGE];
  }

  // Auto-stop
  if (storage[SETTINGS_KEYS.AUTO_STOP] !== undefined) {
    autoStopSelect.value = storage[SETTINGS_KEYS.AUTO_STOP].toString();
  }

  // Max duration
  if (storage[SETTINGS_KEYS.MAX_DURATION] !== undefined) {
    maxDurationSelect.value = storage[SETTINGS_KEYS.MAX_DURATION].toString();
  }

  // Default objective
  if (storage[SETTINGS_KEYS.DEFAULT_OBJECTIVE]) {
    defaultObjectiveSelect.value = storage[SETTINGS_KEYS.DEFAULT_OBJECTIVE];
  }

  // Auto-insert
  if (storage[SETTINGS_KEYS.AUTO_INSERT] !== undefined) {
    autoInsertCheckbox.checked = storage[SETTINGS_KEYS.AUTO_INSERT];
  }
}

async function saveSetting(key: string, value: string | number | boolean): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
  showSaveToast();
}

function showSaveToast(): void {
  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Show toast
  saveToast.classList.remove('hidden');
  requestAnimationFrame(() => {
    saveToast.classList.add('visible');
  });

  // Hide after 2 seconds
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

  // Hide warning
  authWarning.classList.add('hidden');

  // Show user info
  userAvatar.src = currentSession.user.avatar_url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="%23e2e8f0"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>';
  userName.textContent = currentSession.user.name || 'User';
  userEmail.textContent = currentSession.user.email;

  // Show subscription info
  subscriptionInfo.classList.remove('hidden');
  signoutBtn.classList.remove('hidden');
}

function showUnauthenticatedState(): void {
  // Show warning
  authWarning.classList.remove('hidden');

  // Reset user info
  userAvatar.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="%23e2e8f0"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>';
  userName.textContent = 'Not signed in';
  userEmail.textContent = '';

  // Hide subscription info
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
  // Can't directly open popup, so open the extension
  chrome.action.openPopup?.() || chrome.tabs.create({ url: 'popup.html' });
}

// Communication with background script
function sendMessage(message: { type: string; [key: string]: unknown }): Promise<{
  isAuthenticated?: boolean;
  session?: UserSession;
  error?: string;
}> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || {});
    });
  });
}
