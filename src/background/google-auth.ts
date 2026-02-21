import { supabaseService } from './supabase-service';
import { UserSession } from '../shared/types';

// Get client ID from manifest
const getClientId = (): string => {
  const manifest = chrome.runtime.getManifest();
  return (manifest as any).oauth2?.client_id || '';
};

/**
 * Initiate Google OAuth sign-in flow using Chrome Identity API
 * Uses launchWebAuthFlow to get an ID token for Supabase
 */
export async function signInWithGoogle(): Promise<UserSession> {
  console.log('Starting Google sign-in flow...');

  // Step 1: Get Google ID token using launchWebAuthFlow
  const { idToken, rawNonce } = await getGoogleIdToken();
  console.log('Got Google ID token');

  // Step 2: Sign in to Supabase with the ID token and raw nonce
  const session = await signInToSupabaseWithIdToken(idToken, rawNonce);
  console.log('Supabase session created');

  // Step 3: Store session
  await supabaseService.storeSession(session);
  console.log('Session stored');

  return session;
}

/**
 * Generate a random nonce for OAuth security
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SHA256
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get Google ID token using launchWebAuthFlow
 * Returns both the ID token and the raw nonce for Supabase verification
 */
async function getGoogleIdToken(): Promise<{ idToken: string; rawNonce: string }> {
  const clientId = getClientId();
  const redirectUri = chrome.identity.getRedirectURL();

  // Generate raw nonce and hash it for Google
  const rawNonce = generateNonce();
  const hashedNonce = await sha256(rawNonce);

  // Build Google OAuth URL requesting ID token
  // Send HASHED nonce to Google - it will be included in the ID token
  // Supabase will hash our raw nonce and compare to this
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'id_token');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('nonce', hashedNonce);
  authUrl.searchParams.set('prompt', 'select_account');

  console.log('Redirect URI:', redirectUri);

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl.toString(),
        interactive: true,
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          console.error('Auth flow error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!responseUrl) {
          reject(new Error('No response URL received'));
          return;
        }

        console.log('Response URL received');

        // Parse ID token from URL fragment
        const url = new URL(responseUrl);
        const hashParams = new URLSearchParams(url.hash.slice(1));
        const idToken = hashParams.get('id_token');

        if (!idToken) {
          console.error('No ID token in response. Hash:', url.hash);
          reject(new Error('No ID token received from Google'));
          return;
        }

        resolve({ idToken, rawNonce });
      }
    );
  });
}

/**
 * Sign in to Supabase using Google ID token
 * Pass the RAW nonce - Supabase will hash it to verify against the token
 */
async function signInToSupabaseWithIdToken(idToken: string, rawNonce: string): Promise<UserSession> {
  const supabase = supabaseService.getClient();

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    nonce: rawNonce,
  });

  if (error) {
    console.error('Supabase signInWithIdToken error:', error);
    throw new Error(`Failed to sign in: ${error.message}`);
  }

  if (!data.session || !data.user) {
    throw new Error('No session returned from Supabase');
  }

  return createUserSession(data.session, data.user);
}

/**
 * Create UserSession from Supabase session
 */
function createUserSession(session: any, user: any): UserSession {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token || '',
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
    },
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  // Clear any cached tokens
  try {
    const token = await new Promise<string | undefined>((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        resolve(token);
      });
    });

    if (token) {
      await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
      await new Promise<void>((resolve) => {
        chrome.identity.removeCachedAuthToken({ token }, () => {
          resolve();
        });
      });
    }
  } catch (e) {
    console.warn('Error revoking Google token:', e);
  }

  await supabaseService.clearSession();
}

/**
 * Get the current session
 */
export function getSession(): UserSession | null {
  return supabaseService.getSession();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return supabaseService.isAuthenticated();
}

/**
 * Refresh the session token
 */
export async function refreshSession(): Promise<UserSession | null> {
  return supabaseService.refreshSession();
}
