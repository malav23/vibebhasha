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
} as const;

// Usage limits
export const FREE_TIER_DAILY_LIMIT = 5;
export const PRO_TIER_DAILY_LIMIT = 100;
export const UNLIMITED_TIER_DAILY_LIMIT = -1; // -1 means unlimited

// Session storage keys
export const STORAGE_KEYS = {
  SESSION: 'supabase_session',
  PREFERRED_LANGUAGE: 'preferred_language',
  LAST_USED_OBJECTIVE: 'last_used_objective',
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_RECORDING: {
    key: 'I',
    ctrlKey: true,
    shiftKey: true,
    metaKey: false, // For Windows/Linux
  },
  TOGGLE_RECORDING_MAC: {
    key: 'I',
    ctrlKey: false,
    shiftKey: true,
    metaKey: true, // For Mac (Command)
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
