import { UserSession, LanguageCode, UserPlan } from '../shared/types';
import { SUPPORTED_LANGUAGES, ALL_LANGUAGE_CODES } from '../shared/constants/languages';
import { STORAGE_KEYS, FREE_TIER_TOTAL_LIMIT } from '../shared/constants';

// DOM Elements
const loadingState = document.getElementById('loading-state')!;
const onboardingState = document.getElementById('onboarding-state')!;
const loginState = document.getElementById('login-state')!;
const dashboardState = document.getElementById('dashboard-state')!;
const errorState = document.getElementById('error-state')!;

const googleSignInBtn = document.getElementById('google-signin-btn')!;
const onboardingGoogleBtn = document.getElementById('onboarding-google-btn');
const signOutBtn = document.getElementById('signout-btn')!;
const optionsBtn = document.getElementById('options-btn')!;
const upgradeBtn = document.getElementById('upgrade-btn')!;
const retryBtn = document.getElementById('retry-btn')!;

const userAvatar = document.getElementById('user-avatar') as HTMLImageElement;
const userName = document.getElementById('user-name')!;
const userEmail = document.getElementById('user-email')!;
const planBadge = document.getElementById('plan-badge')!;

const usageRingFill = document.getElementById('usage-ring-fill');
const usageCount = document.getElementById('usage-count');
const usageLimit = document.getElementById('usage-limit');
const usageText = document.getElementById('usage-text')!;
const upgradeBanner = document.getElementById('upgrade-banner')!;

const languageSelect = document.getElementById('language-select') as HTMLSelectElement;
const shortcutDisplay = document.getElementById('shortcut-display')!;
const errorMessage = document.getElementById('error-message')!;

// Onboarding
const onboardingPrev = document.getElementById('onboarding-prev') as HTMLButtonElement;
const onboardingNext = document.getElementById('onboarding-next') as HTMLButtonElement;
const onboardingSignin = document.getElementById('onboarding-signin');

// State
let currentSession: UserSession | null = null;
let currentSlide = 0;
const totalSlides = 3;

// Initialize popup
document.addEventListener('DOMContentLoaded', init);

async function init(): Promise<void> {
  try {
    setupEventListeners();
    populateLanguageSelector();
    updateShortcutDisplay();

    // Check if onboarding is needed
    const storage = await chrome.storage.local.get(STORAGE_KEYS.ONBOARDING_COMPLETE);
    const onboardingDone = storage[STORAGE_KEYS.ONBOARDING_COMPLETE];

    if (!onboardingDone) {
      showOnboarding();
      return;
    }

    await checkAuthStatus();
  } catch (error) {
    showError((error as Error).message);
  }
}

function setupEventListeners(): void {
  googleSignInBtn.addEventListener('click', handleSignIn);
  onboardingGoogleBtn?.addEventListener('click', handleOnboardingSignIn);
  signOutBtn.addEventListener('click', handleSignOut);
  optionsBtn.addEventListener('click', openOptions);
  upgradeBtn.addEventListener('click', openUpgrade);
  retryBtn.addEventListener('click', () => location.reload());
  languageSelect.addEventListener('change', handleLanguageChange);

  // Onboarding navigation
  onboardingPrev?.addEventListener('click', () => navigateSlide(-1));
  onboardingNext?.addEventListener('click', () => navigateSlide(1));

  // Dot navigation
  document.querySelectorAll('.dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const slideIdx = parseInt((dot as HTMLElement).dataset.dot || '0');
      goToSlide(slideIdx);
    });
  });
}

// ============================================
// Onboarding
// ============================================
function showOnboarding(): void {
  hideAllStates();
  onboardingState.classList.remove('hidden');
  goToSlide(0);
}

function navigateSlide(direction: number): void {
  const next = currentSlide + direction;
  if (next >= 0 && next < totalSlides) {
    goToSlide(next);
  }
}

function goToSlide(index: number): void {
  currentSlide = index;

  // Update slides
  document.querySelectorAll('.onboarding-slide').forEach((slide) => {
    slide.classList.remove('active');
  });
  const activeSlide = document.querySelector(`[data-slide="${index}"]`);
  activeSlide?.classList.add('active');

  // Update dots
  document.querySelectorAll('.dot').forEach((dot) => {
    dot.classList.remove('active');
  });
  document.querySelector(`[data-dot="${index}"]`)?.classList.add('active');

  // Update navigation
  if (onboardingPrev) {
    onboardingPrev.classList.toggle('hidden', index === 0);
  }

  if (index === totalSlides - 1) {
    // Last slide: hide Next, show sign-in
    onboardingNext.classList.add('hidden');
    onboardingSignin?.classList.remove('hidden');
  } else {
    onboardingNext.classList.remove('hidden');
    onboardingNext.textContent = 'Next';
    onboardingSignin?.classList.add('hidden');
  }
}

async function handleOnboardingSignIn(): Promise<void> {
  if (!onboardingGoogleBtn) return;

  onboardingGoogleBtn.setAttribute('disabled', 'true');
  onboardingGoogleBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;margin-right:8px;"></span> Signing in...';

  try {
    const response = await sendMessage({ type: 'SIGN_IN' });

    // Mark onboarding as complete
    await chrome.storage.local.set({ [STORAGE_KEYS.ONBOARDING_COMPLETE]: true });

    if (response.isAuthenticated && response.session) {
      currentSession = response.session;
      await showDashboard();
    } else {
      throw new Error(response.error || 'Sign in failed');
    }
  } catch (error) {
    showError((error as Error).message);
  }
}

// ============================================
// Auth & Dashboard
// ============================================
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
  shortcutDisplay.textContent = 'Alt+V';
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
  } catch {
    showError('Failed to check authentication status');
  }
}

async function handleSignIn(): Promise<void> {
  googleSignInBtn.setAttribute('disabled', 'true');
  googleSignInBtn.innerHTML = '<span class="spinner" style="width:16px;height:16px;margin-right:8px;"></span> Signing in...';

  try {
    const response = await sendMessage({ type: 'SIGN_IN' });

    // Mark onboarding as complete on any sign-in
    await chrome.storage.local.set({ [STORAGE_KEYS.ONBOARDING_COMPLETE]: true });

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
  } catch {
    showError('Failed to sign out');
  }
}

function openOptions(): void {
  chrome.runtime.openOptionsPage();
}

function openUpgrade(): void {
  // Request checkout URL from background
  sendMessage({ type: 'CREATE_CHECKOUT' }).then((response) => {
    if (response.url) {
      chrome.tabs.create({ url: response.url });
    } else {
      chrome.tabs.create({ url: 'https://vibebhasha.com/pricing' });
    }
  });
}

async function handleLanguageChange(): Promise<void> {
  const selectedLanguage = languageSelect.value as LanguageCode;
  await chrome.storage.local.set({
    [STORAGE_KEYS.PREFERRED_LANGUAGE]: selectedLanguage,
  });
}

async function showDashboard(): Promise<void> {
  if (!currentSession) {
    showLogin();
    return;
  }

  const plan: UserPlan = currentSession.plan || 'free';

  // Update user info
  userAvatar.src = currentSession.user.avatar_url || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="%23e2e8f0"><circle cx="12" cy="8" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>';
  userName.textContent = currentSession.user.name || 'User';
  userEmail.textContent = currentSession.user.email;

  // Plan badge
  if (plan !== 'free') {
    planBadge.textContent = plan.toUpperCase();
    planBadge.classList.remove('hidden');
  } else {
    planBadge.classList.add('hidden');
  }

  // Get usage info
  const dailyLimit = plan === 'free' ? FREE_TIER_TOTAL_LIMIT : -1;

  try {
    const usageResponse = await sendMessage({ type: 'CHECK_USAGE' });

    if (usageResponse.result) {
      const { remaining } = usageResponse.result;

      if (plan === 'free') {
        const used = FREE_TIER_TOTAL_LIMIT - remaining;
        const percentage = (used / FREE_TIER_TOTAL_LIMIT) * 100;

        // Update ring
        if (usageRingFill) {
          usageRingFill.setAttribute('stroke-dasharray', `${percentage}, 100`);
        }
        if (usageCount) usageCount.textContent = `${used}`;
        if (usageLimit) usageLimit.textContent = `${FREE_TIER_TOTAL_LIMIT}`;
        usageText.textContent = `${used} / ${FREE_TIER_TOTAL_LIMIT} prompts used`;

        // Show upgrade banner
        upgradeBanner.classList.remove('hidden');
      } else {
        // Pro user
        if (usageRingFill) {
          usageRingFill.setAttribute('stroke-dasharray', '0, 100');
          usageRingFill.setAttribute('stroke', '#22c55e');
        }
        if (usageCount) usageCount.textContent = '\u221E'; // infinity symbol
        if (usageLimit) usageLimit.textContent = '';
        usageText.textContent = 'Unlimited prompts';
        upgradeBanner.classList.add('hidden');
      }
    }
  } catch {
    usageText.textContent = `-- / ${dailyLimit === -1 ? '\u221E' : dailyLimit} prompts`;
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
  onboardingState.classList.add('hidden');
  loginState.classList.add('hidden');
  dashboardState.classList.add('hidden');
  errorState.classList.add('hidden');
}

// Communication with background script
function sendMessage(message: { type: string; [key: string]: unknown }): Promise<{
  isAuthenticated?: boolean;
  session?: UserSession;
  result?: { allowed: boolean; remaining: number };
  url?: string;
  error?: string;
}> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || {});
    });
  });
}
