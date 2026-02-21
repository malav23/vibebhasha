import { UserSession, LanguageCode } from '../shared/types';
import { SUPPORTED_LANGUAGES, ALL_LANGUAGE_CODES } from '../shared/constants/languages';
import { STORAGE_KEYS, FREE_TIER_DAILY_LIMIT } from '../shared/constants';

// DOM Elements
const loadingState = document.getElementById('loading-state')!;
const loginState = document.getElementById('login-state')!;
const dashboardState = document.getElementById('dashboard-state')!;
const errorState = document.getElementById('error-state')!;

const googleSignInBtn = document.getElementById('google-signin-btn')!;
const signOutBtn = document.getElementById('signout-btn')!;
const optionsBtn = document.getElementById('options-btn')!;
const upgradeBtn = document.getElementById('upgrade-btn')!;
const retryBtn = document.getElementById('retry-btn')!;

const userAvatar = document.getElementById('user-avatar') as HTMLImageElement;
const userName = document.getElementById('user-name')!;
const userEmail = document.getElementById('user-email')!;

const usageProgress = document.getElementById('usage-progress')!;
const usageText = document.getElementById('usage-text')!;
const upgradeBanner = document.getElementById('upgrade-banner')!;

const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
const shortcutDisplay = document.getElementById('shortcut-display')!;
const errorMessage = document.getElementById('error-message')!;

// State
let currentSession: UserSession | null = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', init);

async function init(): Promise<void> {
  try {
    // Setup event listeners
    setupEventListeners();

    // Populate language selector
    populateLanguageSelector();

    // Update keyboard shortcut display for platform
    updateShortcutDisplay();

    // Check auth status
    await checkAuthStatus();
  } catch (error) {
    showError((error as Error).message);
  }
}

function setupEventListeners(): void {
  googleSignInBtn.addEventListener('click', handleSignIn);
  signOutBtn.addEventListener('click', handleSignOut);
  optionsBtn.addEventListener('click', openOptions);
  upgradeBtn.addEventListener('click', openUpgrade);
  retryBtn.addEventListener('click', () => location.reload());
  languageSelect.addEventListener('change', handleLanguageChange);
}

function populateLanguageSelector(): void {
  languageSelect.innerHTML = '';

  ALL_LANGUAGE_CODES.forEach((code) => {
    const lang = SUPPORTED_LANGUAGES[code];
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${lang.nativeName} (${lang.name})`;
    languageSelect.appendChild(option);
  });
}

function updateShortcutDisplay(): void {
  const isMac = navigator.platform.toLowerCase().includes('mac');
  shortcutDisplay.textContent = isMac ? '⌘+Shift+I' : 'Ctrl+Shift+I';
}

async function checkAuthStatus(): Promise<void> {
  showLoading();

  try {
    const response = await sendMessage({ type: 'CHECK_AUTH' });

    if (response.isAuthenticated && response.session) {
      currentSession = response.session;
      await showDashboard();
    } else {
      showLogin();
    }
  } catch (error) {
    showError('Failed to check authentication status');
  }
}

async function handleSignIn(): Promise<void> {
  googleSignInBtn.setAttribute('disabled', 'true');
  googleSignInBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;margin-right:8px;"></span> Signing in...';

  try {
    const response = await sendMessage({ type: 'SIGN_IN' });

    if (response.isAuthenticated && response.session) {
      currentSession = response.session;
      await showDashboard();
    } else {
      throw new Error(response.error || 'Sign in failed');
    }
  } catch (error) {
    showError((error as Error).message);
  } finally {
    googleSignInBtn.removeAttribute('disabled');
    googleSignInBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      <span>Sign in with Google</span>
    `;
  }
}

async function handleSignOut(): Promise<void> {
  try {
    await sendMessage({ type: 'SIGN_OUT' });
    currentSession = null;
    showLogin();
  } catch (error) {
    showError('Failed to sign out');
  }
}

function openOptions(): void {
  chrome.runtime.openOptionsPage();
}

function openUpgrade(): void {
  chrome.tabs.create({ url: 'https://lovable-voice-helper.com/upgrade' });
}

async function handleLanguageChange(): Promise<void> {
  const selectedLanguage = languageSelect.value as LanguageCode;

  // Save to storage
  await chrome.storage.local.set({
    [STORAGE_KEYS.PREFERRED_LANGUAGE]: selectedLanguage,
  });
}

async function showDashboard(): Promise<void> {
  if (!currentSession) {
    showLogin();
    return;
  }

  // Update user info
  userAvatar.src = currentSession.user.avatar_url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="%23e2e8f0"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>';
  userName.textContent = currentSession.user.name || 'User';
  userEmail.textContent = currentSession.user.email;

  // Get usage info
  try {
    const usageResponse = await sendMessage({ type: 'CHECK_USAGE' });

    if (usageResponse.result) {
      const { remaining } = usageResponse.result;
      const used = FREE_TIER_DAILY_LIMIT - remaining;
      const percentage = (used / FREE_TIER_DAILY_LIMIT) * 100;

      usageProgress.style.width = `${percentage}%`;
      usageText.textContent = `${used} / ${FREE_TIER_DAILY_LIMIT} prompts`;

      // Show upgrade banner if limit is close
      if (remaining <= 1) {
        upgradeBanner.classList.remove('hidden');
      }
    }
  } catch {
    usageText.textContent = '-- / 5 prompts';
  }

  // Load preferred language
  const storage = await chrome.storage.local.get(STORAGE_KEYS.PREFERRED_LANGUAGE);
  if (storage[STORAGE_KEYS.PREFERRED_LANGUAGE]) {
    languageSelect.value = storage[STORAGE_KEYS.PREFERRED_LANGUAGE];
  }

  // Show dashboard
  hideAllStates();
  dashboardState.classList.remove('hidden');
}

function showLogin(): void {
  hideAllStates();
  loginState.classList.remove('hidden');
}

function showLoading(): void {
  hideAllStates();
  loadingState.classList.remove('hidden');
}

function showError(message: string): void {
  errorMessage.textContent = message;
  hideAllStates();
  errorState.classList.remove('hidden');
}

function hideAllStates(): void {
  loadingState.classList.add('hidden');
  loginState.classList.add('hidden');
  dashboardState.classList.add('hidden');
  errorState.classList.add('hidden');
}

// Communication with background script
function sendMessage(message: { type: string; [key: string]: unknown }): Promise<{
  isAuthenticated?: boolean;
  session?: UserSession;
  result?: { allowed: boolean; remaining: number };
  error?: string;
}> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || {});
    });
  });
}
