import { refreshSession, isAuthenticated, getSession } from './google-auth';

// Alarm name for session refresh
const SESSION_REFRESH_ALARM = 'session-refresh';

// Refresh session 5 minutes before expiry
const REFRESH_MARGIN_MINUTES = 5;

/**
 * Initialize the session manager
 * Sets up automatic token refresh
 */
export function initSessionManager(): void {
  // Clear any existing alarms
  chrome.alarms.clear(SESSION_REFRESH_ALARM);

  // Create periodic alarm for session refresh (every 55 minutes)
  chrome.alarms.create(SESSION_REFRESH_ALARM, {
    periodInMinutes: 55,
  });

  // Listen for alarm
  chrome.alarms.onAlarm.addListener(handleAlarm);

  // Check session on startup
  checkAndRefreshSession();
}

/**
 * Handle alarm events
 */
async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  if (alarm.name === SESSION_REFRESH_ALARM) {
    await checkAndRefreshSession();
  }
}

/**
 * Check if session needs refresh and refresh if necessary
 */
async function checkAndRefreshSession(): Promise<void> {
  const session = getSession();
  if (!session) {
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = session.expires_at - now;

  // Refresh if token expires in less than 5 minutes
  if (expiresIn < REFRESH_MARGIN_MINUTES * 60) {
    console.log('Session expiring soon, refreshing...');
    try {
      await refreshSession();
      console.log('Session refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }
}

/**
 * Stop the session manager
 */
export function stopSessionManager(): void {
  chrome.alarms.clear(SESSION_REFRESH_ALARM);
  chrome.alarms.onAlarm.removeListener(handleAlarm);
}

/**
 * Get remaining session time in seconds
 */
export function getSessionRemainingTime(): number {
  const session = getSession();
  if (!session) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, session.expires_at - now);
}

/**
 * Check if session is valid and not expired
 */
export function isSessionValid(): boolean {
  return isAuthenticated() && getSessionRemainingTime() > 0;
}
