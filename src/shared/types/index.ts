// Language codes supported by the extension
export type LanguageCode =
  | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'kn' | 'gu' | 'ml'
  | 'pa' | 'or' | 'as' | 'sa' | 'ne' | 'ks'
  | 'es' | 'de' | 'zh' | 'id';

// Objective types for prompt elaboration
export type ObjectiveType = 'new_feature' | 'bug_fix' | 'design_improvement' | 'other';

// User session stored in chrome.storage.local
export interface UserSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    name: string;
    avatar_url: string;
  };
}

// Transcription result from Whisper API
export interface TranscriptionResult {
  text: string;
  language: LanguageCode;
  duration: number;
  remaining: number;
}

// Translation and elaboration result
export interface ElaborationResult {
  original: string;
  translated: string;
  elaborated: string;
}

// Usage limit check result
export interface UsageLimitResult {
  allowed: boolean;
  remaining: number;
}

// Recording state
export type RecordingState = 'idle' | 'recording' | 'processing' | 'confirming' | 'previewing' | 'error';

// Message types for communication between content script and service worker
export type MessageType =
  | 'START_TRANSCRIPTION'
  | 'TRANSCRIPTION_RESULT'
  | 'ELABORATE_PROMPT'
  | 'ELABORATION_RESULT'
  | 'CHECK_AUTH'
  | 'AUTH_RESULT'
  | 'SIGN_IN'
  | 'SIGN_OUT'
  | 'CHECK_USAGE'
  | 'USAGE_RESULT'
  | 'OPEN_POPUP'
  | 'ERROR';

// Base message interface
export interface BaseMessage {
  type: MessageType;
}

// Transcription request message
export interface TranscriptionRequest extends BaseMessage {
  type: 'START_TRANSCRIPTION';
  audioData: string; // Base64 encoded audio
}

// Transcription response message
export interface TranscriptionResponse extends BaseMessage {
  type: 'TRANSCRIPTION_RESULT';
  result?: TranscriptionResult;
  error?: string;
}

// Elaboration request message
export interface ElaborationRequest extends BaseMessage {
  type: 'ELABORATE_PROMPT';
  text: string;
  sourceLanguage: LanguageCode;
  objective: ObjectiveType;
  additionalContext?: string;
}

// Elaboration response message
export interface ElaborationResponse extends BaseMessage {
  type: 'ELABORATION_RESULT';
  result?: ElaborationResult;
  error?: string;
}

// Auth check request
export interface AuthCheckRequest extends BaseMessage {
  type: 'CHECK_AUTH';
}

// Auth result response
export interface AuthResponse extends BaseMessage {
  type: 'AUTH_RESULT';
  isAuthenticated: boolean;
  session?: UserSession;
  error?: string;
}

// Sign in request
export interface SignInRequest extends BaseMessage {
  type: 'SIGN_IN';
}

// Sign out request
export interface SignOutRequest extends BaseMessage {
  type: 'SIGN_OUT';
}

// Usage check request
export interface UsageCheckRequest extends BaseMessage {
  type: 'CHECK_USAGE';
}

// Usage result response
export interface UsageResponse extends BaseMessage {
  type: 'USAGE_RESULT';
  result?: UsageLimitResult;
  error?: string;
}

// Error message
export interface ErrorMessage extends BaseMessage {
  type: 'ERROR';
  error: string;
}

// Open popup request
export interface OpenPopupRequest extends BaseMessage {
  type: 'OPEN_POPUP';
}

// Union type for all messages
export type ExtensionMessage =
  | TranscriptionRequest
  | TranscriptionResponse
  | ElaborationRequest
  | ElaborationResponse
  | AuthCheckRequest
  | AuthResponse
  | SignInRequest
  | SignOutRequest
  | UsageCheckRequest
  | UsageResponse
  | OpenPopupRequest
  | ErrorMessage;

// Language info
export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  whisperSupport: 'full' | 'limited';
}

// Confirmation UI strings for a single language
export interface ConfirmationUIStrings {
  youSaid: string;
  isCorrect: string;
  edit: string;
  objectiveLabel: string;
  options: {
    newFeature: string;
    bugFix: string;
    design: string;
    other: string;
  };
  contextLabel: string;
  contextPlaceholder: string;
  proceed: string;
  cancel: string;
}

// Recording UI strings
export interface RecordingUIStrings {
  recording: string;
  processing: string;
  transcribing: string;
  detectingLanguage: string;
  stopRecording: string;
  speakInYourLanguage: string;
}

// Preview UI strings
export interface PreviewUIStrings {
  elaboratedPrompt: string;
  insertIntoLovable: string;
  edit: string;
  cancel: string;
}

// Upgrade modal strings
export interface UpgradeUIStrings {
  title: string;
  message: string;
  upgradeButton: string;
  dismissButton: string;
}

// Subscription plan
export interface SubscriptionPlan {
  id: string;
  name: string;
  dailyLimit: number;
  priceCents: number;
}

// User profile
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  preferredLanguage: LanguageCode;
  createdAt: string;
}

// Daily usage record
export interface DailyUsage {
  id: string;
  userId: string;
  date: string;
  promptCount: number;
}

// Usage log entry
export interface UsageLog {
  id: string;
  userId: string;
  sourceLanguage: LanguageCode;
  objective: ObjectiveType | null;
  additionalContext: string | null;
  audioDurationSeconds: number | null;
  originalTextLength: number | null;
  elaboratedTextLength: number | null;
  tokensUsed: number | null;
  createdAt: string;
}
