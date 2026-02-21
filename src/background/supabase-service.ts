import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, STORAGE_KEYS } from '../shared/constants';
import { UserSession, UsageLimitResult } from '../shared/types';

class SupabaseService {
  private client: SupabaseClient;
  private session: UserSession | null = null;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Load session from storage
    this.loadSession();
  }

  private async loadSession(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.SESSION);
      if (result[STORAGE_KEYS.SESSION]) {
        this.session = result[STORAGE_KEYS.SESSION];
        this.setSupabaseSession(this.session);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }

  private setSupabaseSession(session: UserSession | null): void {
    if (session) {
      // Manually set the session for Supabase client
      this.client.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    }
  }

  async storeSession(session: UserSession): Promise<void> {
    this.session = session;
    await chrome.storage.local.set({ [STORAGE_KEYS.SESSION]: session });
    this.setSupabaseSession(session);
  }

  async clearSession(): Promise<void> {
    this.session = null;
    await chrome.storage.local.remove(STORAGE_KEYS.SESSION);
    await this.client.auth.signOut();
  }

  getSession(): UserSession | null {
    return this.session;
  }

  isAuthenticated(): boolean {
    if (!this.session) return false;

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    return this.session.expires_at > now;
  }

  async refreshSession(): Promise<UserSession | null> {
    if (!this.session?.refresh_token) {
      return null;
    }

    try {
      const { data, error } = await this.client.auth.refreshSession({
        refresh_token: this.session.refresh_token,
      });

      if (error) {
        console.error('Failed to refresh session:', error);
        await this.clearSession();
        return null;
      }

      if (data.session) {
        const newSession: UserSession = {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || this.session.refresh_token,
          expires_at: data.session.expires_at || 0,
          user: {
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: data.session.user.user_metadata?.full_name || '',
            avatar_url: data.session.user.user_metadata?.avatar_url || '',
          },
        };

        await this.storeSession(newSession);
        return newSession;
      }

      return null;
    } catch (error) {
      console.error('Session refresh error:', error);
      return null;
    }
  }

  async checkUsageLimit(): Promise<UsageLimitResult> {
    if (!this.session) {
      return { allowed: false, remaining: 0 };
    }

    try {
      const { data, error } = await this.client.rpc('check_usage_limit', {
        p_user_id: this.session.user.id,
      });

      if (error) {
        console.error('Failed to check usage limit:', error);
        return { allowed: false, remaining: 0 };
      }

      return {
        allowed: data.allowed,
        remaining: data.remaining,
      };
    } catch (error) {
      console.error('Usage limit check error:', error);
      return { allowed: false, remaining: 0 };
    }
  }

  async incrementUsage(): Promise<void> {
    if (!this.session) return;

    try {
      await this.client.rpc('increment_usage', {
        p_user_id: this.session.user.id,
      });
    } catch (error) {
      console.error('Failed to increment usage:', error);
    }
  }

  async logUsage(params: {
    sourceLanguage: string;
    objective?: string;
    additionalContext?: string;
    audioDurationSeconds?: number;
    originalTextLength?: number;
    elaboratedTextLength?: number;
    tokensUsed?: number;
  }): Promise<void> {
    if (!this.session) return;

    try {
      await this.client.from('usage_logs').insert({
        user_id: this.session.user.id,
        source_language: params.sourceLanguage,
        objective: params.objective,
        additional_context: params.additionalContext,
        audio_duration_seconds: params.audioDurationSeconds,
        original_text_length: params.originalTextLength,
        elaborated_text_length: params.elaboratedTextLength,
        tokens_used: params.tokensUsed,
      });
    } catch (error) {
      console.error('Failed to log usage:', error);
    }
  }

  async getUserProfile() {
    if (!this.session) return null;

    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', this.session.user.id)
        .single();

      if (error) {
        console.error('Failed to get user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  async updateUserProfile(updates: {
    preferred_language?: string;
    name?: string;
  }): Promise<boolean> {
    if (!this.session) return false;

    try {
      const { error } = await this.client
        .from('profiles')
        .update(updates)
        .eq('id', this.session.user.id);

      if (error) {
        console.error('Failed to update profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      return false;
    }
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAccessToken(): string | null {
    return this.session?.access_token || null;
  }
}

// Singleton instance
export const supabaseService = new SupabaseService();
