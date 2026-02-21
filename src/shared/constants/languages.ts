import { LanguageCode, LanguageInfo } from '../types';

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  // Indic Languages (14)
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    speechSupport: 'full',
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    speechSupport: 'full',
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    speechSupport: 'full',
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    speechSupport: 'full',
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    speechSupport: 'full',
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    speechSupport: 'full',
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    speechSupport: 'full',
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    speechSupport: 'full',
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    speechSupport: 'full',
  },
  or: {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    speechSupport: 'limited',
  },
  as: {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    speechSupport: 'limited',
  },
  sa: {
    code: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    speechSupport: 'limited',
  },
  ne: {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    speechSupport: 'full',
  },
  ks: {
    code: 'ks',
    name: 'Kashmiri',
    nativeName: 'कॉशुर',
    speechSupport: 'limited',
  },

  // International Languages (4)
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    speechSupport: 'full',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    speechSupport: 'full',
  },
  zh: {
    code: 'zh',
    name: 'Mandarin',
    nativeName: '中文',
    speechSupport: 'full',
  },
  id: {
    code: 'id',
    name: 'Bahasa Indonesia',
    nativeName: 'Bahasa Indonesia',
    speechSupport: 'full',
  },
};

export const INDIC_LANGUAGES: LanguageCode[] = [
  'hi', 'bn', 'ta', 'te', 'mr', 'kn', 'gu', 'ml', 'pa', 'or', 'as', 'sa', 'ne', 'ks'
];

export const INTERNATIONAL_LANGUAGES: LanguageCode[] = ['es', 'de', 'zh', 'id'];

export const ALL_LANGUAGE_CODES: LanguageCode[] = [...INDIC_LANGUAGES, ...INTERNATIONAL_LANGUAGES];

export function getLanguageInfo(code: LanguageCode): LanguageInfo {
  return SUPPORTED_LANGUAGES[code];
}

export function getLanguageName(code: LanguageCode): string {
  return SUPPORTED_LANGUAGES[code]?.name || code;
}

export function getLanguageNativeName(code: LanguageCode): string {
  return SUPPORTED_LANGUAGES[code]?.nativeName || code;
}

export function isLanguageSupported(code: string): code is LanguageCode {
  return code in SUPPORTED_LANGUAGES;
}
