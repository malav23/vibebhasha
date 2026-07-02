// Re-export all constants
export * from './languages';
export * from './prompts';
export * from './confirmation-ui';

// API endpoints (injected at build time via .env)
export const SUPABASE_URL = process.env.SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

// Edge function endpoints
export const EDGE_FUNCTIONS = {
  TRANSCRIBE_AUDIO: '/functions/v1/transcribe-audio',
  TRANSLATE_ELABORATE: '/functions/v1/translate-elaborate',
  CREATE_CHECKOUT: '/functions/v1/create-checkout',
  STRIPE_WEBHOOK: '/functions/v1/stripe-webhook',
} as const;

// Usage limits
export const FREE_TIER_TOTAL_LIMIT = 5; // 5 free prompts total (lifetime), not per day
export const FREE_TIER_DAILY_LIMIT = FREE_TIER_TOTAL_LIMIT; // Alias for backward compat
export const PRO_TIER_DAILY_LIMIT = -1; // Unlimited
export const UNLIMITED_TIER_DAILY_LIMIT = -1; // -1 means unlimited

// Pricing
export const PRICING = {
  PRO_MONTHLY_CENTS: 499,
  PRO_YEARLY_CENTS: 3999,
  TEAM_MONTHLY_CENTS: 999,
} as const;

// Session storage keys
export const STORAGE_KEYS = {
  SESSION: 'supabase_session',
  PREFERRED_LANGUAGE: 'preferred_language',
  LAST_USED_OBJECTIVE: 'last_used_objective',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  FIRST_INSERT_DONE: 'first_insert_done',
  USER_PLAN: 'user_plan',
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_RECORDING: {
    key: 'v',
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    altKey: true, // Alt+V for Windows/Linux
  },
  TOGGLE_RECORDING_MAC: {
    key: 'v',
    ctrlKey: false,
    shiftKey: false,
    metaKey: false,
    altKey: true, // Alt+V for Mac too (Option+V)
  },
} as const;

// CSS class prefixes (to avoid conflicts with Lovable's styles)
export const CSS_PREFIX = 'lvh-';

// Animation durations in milliseconds
export const ANIMATION = {
  FADE_IN: 200,
  FADE_OUT: 150,
  SLIDE_UP: 300,
} as const;
