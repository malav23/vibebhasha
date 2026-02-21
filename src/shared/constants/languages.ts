import { LanguageCode, LanguageInfo } from '../types';

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  // Indic Languages (14)
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    whisperSupport: 'full',
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    whisperSupport: 'full',
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    whisperSupport: 'full',
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    whisperSupport: 'full',
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    whisperSupport: 'full',
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    whisperSupport: 'full',
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    whisperSupport: 'full',
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    whisperSupport: 'full',
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    whisperSupport: 'full',
  },
  or: {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    whisperSupport: 'limited',
  },
  as: {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    whisperSupport: 'limited',
  },
  sa: {
    code: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    whisperSupport: 'limited',
  },
  ne: {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    whisperSupport: 'full',
  },
  ks: {
    code: 'ks',
    name: 'Kashmiri',
    nativeName: 'कॉशुर',
    whisperSupport: 'limited',
  },

  // International Languages (4)
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    whisperSupport: 'full',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    whisperSupport: 'full',
  },
  zh: {
    code: 'zh',
    name: 'Mandarin',
    nativeName: '中文',
    whisperSupport: 'full',
  },
  id: {
    code: 'id',
    name: 'Bahasa Indonesia',
    nativeName: 'Bahasa Indonesia',
    whisperSupport: 'full',
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
