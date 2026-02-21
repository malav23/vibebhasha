// Re-export all constants
export * from './languages';
export * from './prompts';
export * from './confirmation-ui';

// API endpoints
export const SUPABASE_URL = 'https://ugwhgbsprbwgdkggekpw.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnd2hnYnNwcmJ3Z2RrZ2dla3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODY1MDQsImV4cCI6MjA4NzE2MjUwNH0.Pt-Dx-jlsvJEq3VywLyJyoz2Bt-Y2EKVEHr_48UGKUM';

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
