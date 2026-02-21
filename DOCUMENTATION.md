# VibeBhasha - Complete Documentation

> A Chrome extension that enables multilingual voice input for [Lovable.dev](https://lovable.dev), allowing developers worldwide to speak prompts in their native language and have them automatically transcribed, translated, and elaborated into optimized English prompts.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Development](#development)
- [Core Modules](#core-modules)
- [User Flow](#user-flow)
- [Authentication](#authentication)
- [Database Schema](#database-schema)
- [Edge Functions](#edge-functions)
- [Usage Limits & Pricing](#usage-limits--pricing)
- [Supported Languages](#supported-languages)
- [Security](#security)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

VibeBhasha (Lovable Voice Helper) bridges the language gap for developers using Lovable.dev's vibe-coding platform. Instead of typing English prompts, users can:

1. Speak in any of 18 supported languages
2. Review the transcription in their native language
3. Select a development objective (new feature, bug fix, design improvement, etc.)
4. Receive an AI-elaborated English prompt optimized for Lovable's React/TypeScript/Tailwind stack
5. Insert the prompt directly into Lovable's input field

### Key Features

- **Voice-first input** via microphone button or `Ctrl+Shift+I` keyboard shortcut
- **18 languages supported** including 14 Indic languages and 4 international languages
- **Native language confirmation** - review and edit transcription before processing
- **AI-powered elaboration** - prompts are optimized for Lovable's tech stack (React, TypeScript, Tailwind CSS, shadcn/ui)
- **Usage tracking** with free and paid tiers
- **Google OAuth** authentication with secure session management

---

## Architecture

The extension follows Chrome Manifest V3 architecture with four main components:

```
+-------------------+     +-------------------+     +-------------------+
|   Content Script  |<--->| Background Worker |<--->|   Supabase Cloud  |
| (lovable.dev DOM) |     |  (Service Worker) |     | (DB + Edge Funcs) |
+-------------------+     +-------------------+     +-------------------+
        |                         |                         |
  - Mic button injection    - Message routing          - PostgreSQL DB
  - Audio recording         - Google OAuth             - Whisper API proxy
  - Modal UIs               - Supabase client          - GPT API proxy
  - DOM manipulation        - Usage limit cache        - Auth & RLS
        |                         |
+-------------------+     +-------------------+
|      Popup        |     |     Options        |
| (Dashboard & Auth)|     |  (User Settings)   |
+-------------------+     +-------------------+
```

### Communication Flow

All components communicate via Chrome's `chrome.runtime.sendMessage` API. The background service worker acts as a central message hub, routing requests between the content script and Supabase backend.

**Message types:**

| Message | Direction | Purpose |
|---------|-----------|---------|
| `SIGN_IN` | Popup -> Background | Initiate Google OAuth |
| `SIGN_OUT` | Popup -> Background | Clear session |
| `GET_SESSION` | Any -> Background | Retrieve current auth session |
| `CHECK_USAGE` | Content -> Background | Verify usage limits |
| `TRANSCRIBE_AUDIO` | Content -> Background | Send audio for Whisper transcription |
| `TRANSLATE_ELABORATE` | Content -> Background | Send text for translation + elaboration |
| `LOG_USAGE` | Content -> Background | Record usage analytics |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Extension** | Chrome Manifest V3 | Extension framework |
| **Language** | TypeScript (strict mode) | Type-safe development |
| **Build** | Webpack 5 + ts-loader | Module bundling |
| **Speech-to-Text** | OpenAI Whisper API | Audio transcription |
| **Translation** | OpenAI GPT-4o-mini | Translation & prompt elaboration |
| **Backend** | Supabase | PostgreSQL, Edge Functions, Auth |
| **Edge Runtime** | Deno | Serverless function execution |
| **Auth** | Google OAuth 2.0 | User authentication |
| **Storage** | Chrome Storage API | Local session persistence |

### Dependencies

**Runtime (1 package):**
- `@supabase/supabase-js` ^2.39.3

**Development:**
- TypeScript, Webpack, ts-loader
- ESLint with TypeScript plugin
- Chrome type definitions (`@types/chrome`)
- CSS extraction and asset copying plugins

---

## Project Structure

```
vibe-code-translator/
├── manifest.json                    # Chrome extension manifest (v3)
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── webpack.config.js                # Webpack build config
├── .eslintrc.js                     # ESLint config
├── .gitignore                       # Git ignore rules
├── README.md                        # Quick-start guide
├── DOCUMENTATION.md                 # This file
├── PRIVACY_POLICY.md                # Privacy policy
│
├── src/
│   ├── background/                  # Service worker (runs in background)
│   │   ├── index.ts                 # Message router & dispatcher
│   │   ├── google-auth.ts           # Google OAuth implementation
│   │   ├── supabase-service.ts      # Supabase client & DB operations
│   │   ├── openai-service.ts        # Whisper & GPT API calls
│   │   ├── usage-limiter.ts         # Usage limit enforcement & caching
│   │   └── session-manager.ts       # Session refresh logic
│   │
│   ├── content-scripts/             # Injected into lovable.dev pages
│   │   ├── index.ts                 # Main flow controller
│   │   ├── audio-recorder.ts        # MediaRecorder wrapper
│   │   ├── recording-ui.ts          # Recording modal with waveform
│   │   ├── confirmation-modal.ts    # Transcription review modal
│   │   ├── preview-modal.ts         # Final prompt preview modal
│   │   ├── upgrade-modal.ts         # Upgrade upsell modal
│   │   ├── keyboard-handler.ts      # Ctrl+Shift+I shortcut handler
│   │   ├── lovable-adapter.ts       # DOM interaction with Lovable.dev
│   │   └── content-styles.css       # Modal styling
│   │
│   ├── popup/                       # Extension popup (click icon)
│   │   ├── popup.ts                 # Dashboard, sign-in, usage stats
│   │   ├── popup.html               # Popup HTML template
│   │   └── popup.css                # Popup styling
│   │
│   ├── options/                     # Extension settings page
│   │   ├── options.ts               # User preferences logic
│   │   ├── options.html             # Settings HTML
│   │   └── options.css              # Settings styling
│   │
│   └── shared/                      # Shared across all modules
│       ├── types/
│       │   └── index.ts             # TypeScript interfaces (25+)
│       ├── constants/
│       │   ├── index.ts             # API endpoints, limits, keys
│       │   ├── languages.ts         # 18 language definitions
│       │   ├── prompts.ts           # System prompts for GPT
│       │   └── confirmation-ui.ts   # UI string translations
│       └── utils/
│           └── audio-utils.ts       # Audio encoding/decoding
│
├── supabase/
│   ├── config.toml                  # Supabase local dev config
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Full database schema
│   └── functions/
│       ├── transcribe-audio/
│       │   └── index.ts             # Whisper API edge function
│       └── translate-elaborate/
│           └── index.ts             # GPT translation edge function
│
├── assets/
│   └── icons/
│       ├── icon16.png               # 16x16 extension icon
│       ├── icon32.png               # 32x32 extension icon
│       ├── icon48.png               # 48x48 extension icon
│       ├── icon128.png              # 128x128 extension icon
│       └── generate-icons.sh        # Icon generation script
│
└── dist/                            # Build output (git-ignored)
```

---

## Installation & Setup

### Prerequisites

- **Node.js** 18 or later
- **npm** or yarn
- **Supabase** account (free tier works)
- **OpenAI** API key (for Whisper and GPT)
- **Google Cloud** project with OAuth credentials

### Step 1: Install Dependencies

```bash
git clone https://github.com/your-username/vibe-code-translator.git
cd vibe-code-translator
npm install
```

### Step 2: Configure Supabase Credentials

Edit `src/shared/constants/index.ts`:

```typescript
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
```

### Step 3: Configure Google OAuth

Edit `manifest.json`:

```json
{
  "oauth2": {
    "client_id": "your-client-id.apps.googleusercontent.com",
    "scopes": ["openid", "email", "profile"]
  }
}
```

**Google Cloud Console setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the Google+ API
4. Navigate to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Select "Chrome Extension" as application type
6. Add your extension ID to authorized origins
7. Copy the client ID into `manifest.json`

### Step 4: Set Up Supabase Backend

```bash
# Run database migrations
supabase db push

# Deploy edge functions
supabase functions deploy transcribe-audio
supabase functions deploy translate-elaborate

# Set OpenAI API key as secret
supabase secrets set OPENAI_API_KEY=your-openai-api-key
```

### Step 5: Enable Google Auth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth client ID and secret

### Step 6: Build & Load Extension

```bash
# Build for production
npm run build

# Load in Chrome:
# 1. Navigate to chrome://extensions/
# 2. Enable "Developer mode" (top right toggle)
# 3. Click "Load unpacked"
# 4. Select the `dist/` folder
```

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development build with file watching |
| `npm run build` | Production build (minified, optimized) |
| `npm run clean` | Remove the `dist/` folder |
| `npm run lint` | Run ESLint on all TypeScript files |
| `npm run typecheck` | Run TypeScript compiler in check mode |
| `npm run package` | Build and create `.zip` for Chrome Web Store |

### Development Workflow

1. Run `npm run dev` to start the watcher
2. Make changes to source files in `src/`
3. Webpack automatically rebuilds to `dist/`
4. Go to `chrome://extensions/` and click the reload button on your extension
5. Refresh the Lovable.dev tab to load updated content scripts

### Webpack Configuration

The build has 4 entry points:

| Entry | Source | Output |
|-------|--------|--------|
| `background` | `src/background/index.ts` | `dist/background.js` |
| `content-script` | `src/content-scripts/index.ts` | `dist/content-script.js` |
| `popup` | `src/popup/popup.ts` | `dist/popup.js` |
| `options` | `src/options/options.ts` | `dist/options.js` |

TypeScript path aliases are configured:
- `@shared/*` -> `src/shared/*`
- `@background/*` -> `src/background/*`
- `@content/*` -> `src/content-scripts/*`

---

## Core Modules

### Background Service Worker

**`src/background/index.ts`** - Central message hub that routes all inter-component messages to appropriate handlers.

**`src/background/google-auth.ts`** - Implements Google OAuth using Chrome's Identity API. Generates a cryptographic nonce, launches the web auth flow, and creates a Supabase session from the Google ID token.

**`src/background/supabase-service.ts`** - Wraps the Supabase JS client. Handles session management, user profile operations, and database queries.

**`src/background/openai-service.ts`** - Makes API calls to Supabase Edge Functions that proxy requests to OpenAI's Whisper (transcription) and GPT-4o-mini (translation/elaboration) APIs.

**`src/background/usage-limiter.ts`** - Enforces daily usage limits based on the user's subscription plan. Implements a 60-second cache to reduce database queries.

**`src/background/session-manager.ts`** - Handles session token refresh and expiration detection.

### Content Scripts

**`src/content-scripts/index.ts`** - Orchestrates the entire voice input flow: authentication check -> usage check -> recording -> transcription -> confirmation -> elaboration -> preview -> insertion.

**`src/content-scripts/audio-recorder.ts`** - Wraps the Web MediaRecorder API. Records audio at 16kHz mono with a 60-second maximum duration. Outputs base64-encoded audio data.

**`src/content-scripts/lovable-adapter.ts`** - Interacts with Lovable.dev's DOM. Finds the prompt input field, injects the microphone button, and inserts the final elaborated prompt.

**`src/content-scripts/recording-ui.ts`** - Renders the recording modal with a waveform visualization and stop/cancel buttons.

**`src/content-scripts/confirmation-modal.ts`** - Shows the transcribed text in the user's native language. Allows editing before proceeding. Provides objective selection (new feature, bug fix, design improvement, other).

**`src/content-scripts/preview-modal.ts`** - Displays the final translated and elaborated English prompt. User can approve (inserts into Lovable) or go back to edit.

**`src/content-scripts/upgrade-modal.ts`** - Shown when a user exceeds their daily limit. Presents upgrade options.

**`src/content-scripts/keyboard-handler.ts`** - Listens for `Ctrl+Shift+I` keyboard shortcut to trigger voice recording.

### Shared Modules

**`src/shared/types/index.ts`** - Contains 25+ TypeScript interfaces including `UserSession`, `TranscriptionResult`, `TranslationResult`, `ExtensionMessage`, `UsageLimit`, `LanguageConfig`, etc.

**`src/shared/constants/languages.ts`** - Defines all 18 supported languages with their codes, names, native names, and Whisper support status.

**`src/shared/constants/prompts.ts`** - System prompts used for GPT-4o-mini translation and elaboration. Prompts are tailored to output Lovable-compatible instructions referencing React, TypeScript, Tailwind CSS, and shadcn/ui.

**`src/shared/constants/index.ts`** - Central configuration: Supabase URL/key, API endpoints, usage tier limits, and cache durations.

**`src/shared/utils/audio-utils.ts`** - Utility functions for audio base64 encoding/decoding and format conversion.

---

## User Flow

```
                    +------------------+
                    |  User visits     |
                    |  lovable.dev     |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Content script   |
                    |  injects mic btn  |
                    +--------+---------+
                             |
              User clicks mic or Ctrl+Shift+I
                             |
                    +--------v---------+
                    |  Authenticated?   |
                    +---+----------+---+
                        |          |
                       No         Yes
                        |          |
               +--------v---+  +--v-----------+
               | Open popup |  | Check usage  |
               | for sign-in|  | limits       |
               +------------+  +--+---------+-+
                                  |         |
                              Under limit  Over limit
                                  |         |
                    +-------------v-+  +----v----------+
                    | Start audio   |  | Show upgrade  |
                    | recording     |  | modal         |
                    | (60s max)     |  +---------------+
                    +-------+-------+
                            |
                   User stops recording
                            |
                    +-------v-------+
                    | Send audio to |
                    | Whisper API   |
                    +-------+-------+
                            |
                    +-------v-----------+
                    | Confirmation modal |
                    | (native language)  |
                    | - Edit text        |
                    | - Select objective |
                    | - Add context      |
                    +-------+-----------+
                            |
                    +-------v-----------+
                    | Send to GPT for   |
                    | translation &     |
                    | elaboration       |
                    +-------+-----------+
                            |
                    +-------v-----------+
                    | Preview modal     |
                    | (English prompt)  |
                    +---+----------+---+
                        |          |
                    Approve      Edit
                        |          |
               +--------v----+    (go back)
               | Insert into |
               | Lovable.dev |
               | input field |
               +--------+----+
                        |
               +--------v----+
               | Log usage   |
               +-------------+
```

---

## Authentication

### Google OAuth Flow

1. User clicks "Sign in with Google" in the extension popup
2. Background script generates a random nonce and SHA-256 hash
3. `chrome.identity.launchWebAuthFlow` opens a Google consent dialog
4. Google returns an ID token containing the user's profile
5. The ID token + raw nonce are sent to Supabase Auth
6. Supabase verifies the nonce hash and creates a session
7. Session tokens are stored in `chrome.storage.local`
8. Access token is included in all subsequent API calls as a Bearer token

### Session Management

- Sessions are stored locally using Chrome Storage API
- The session manager periodically checks for token expiration
- Expired tokens are automatically refreshed using Supabase's refresh token flow
- Sign-out clears all local session data

---

## Database Schema

### Tables

#### `profiles`
Stores user account information, created automatically on sign-up.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | References `auth.users` |
| `email` | TEXT | User's email |
| `name` | TEXT | Display name |
| `avatar_url` | TEXT | Profile picture URL |
| `preferred_language` | TEXT | Default: `'hi'` (Hindi) |
| `created_at` | TIMESTAMPTZ | Account creation time |
| `updated_at` | TIMESTAMPTZ | Last profile update |

#### `subscription_plans`
Defines available pricing tiers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | `'free'`, `'pro'`, `'unlimited'` |
| `name` | TEXT | Display name |
| `daily_limit` | INT | Max prompts/day (-1 = unlimited) |
| `price_cents` | INT | Monthly price in cents |

#### `subscriptions`
Links users to their active plan.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Subscription ID |
| `user_id` | UUID (FK) | References `auth.users` |
| `plan_id` | TEXT (FK) | References `subscription_plans` |
| `status` | TEXT | `active`, `cancelled`, `expired` |
| `current_period_start` | TIMESTAMPTZ | Billing period start |
| `current_period_end` | TIMESTAMPTZ | Billing period end |
| `stripe_subscription_id` | TEXT | Stripe integration field |

#### `daily_usage`
Tracks per-user daily prompt counts for limit enforcement.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Usage record ID |
| `user_id` | UUID (FK) | References `auth.users` |
| `date` | DATE | Usage date |
| `prompt_count` | INT | Number of prompts used |

Unique constraint on `(user_id, date)`.

#### `usage_logs`
Detailed analytics for each voice prompt.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Log entry ID |
| `user_id` | UUID (FK) | References `auth.users` |
| `source_language` | TEXT | Detected language code |
| `objective` | TEXT | Selected objective type |
| `audio_duration_seconds` | FLOAT | Recording length |
| `original_text_length` | INT | Characters in transcription |
| `translated_text_length` | INT | Characters in translation |
| `elaborated_text_length` | INT | Characters in elaboration |
| `tokens_used` | INT | OpenAI tokens consumed |
| `created_at` | TIMESTAMPTZ | Timestamp |

### Database Functions (PL/pgSQL)

| Function | Purpose |
|----------|---------|
| `check_usage_limit(user_id)` | Returns remaining prompts and whether the user is allowed |
| `increment_usage(user_id)` | Increments the daily prompt counter |
| `handle_new_user()` | Trigger: auto-creates profile + free subscription on sign-up |
| `update_updated_at()` | Trigger: updates `updated_at` timestamp on row changes |

### Row-Level Security (RLS)

All tables have RLS enabled. Policies ensure users can only read and modify their own data:

- `profiles`: SELECT/UPDATE restricted to `auth.uid() = id`
- `subscriptions`: SELECT restricted to `auth.uid() = user_id`
- `daily_usage`: SELECT/INSERT/UPDATE restricted to `auth.uid() = user_id`
- `usage_logs`: SELECT/INSERT restricted to `auth.uid() = user_id`

---

## Edge Functions

### `transcribe-audio`

Proxies audio data to OpenAI's Whisper API for speech-to-text conversion.

**Endpoint:** `POST /functions/v1/transcribe-audio`

**Request:**
```json
{
  "audio": "<base64-encoded-audio>",
  "language": "hi"
}
```

**Response:**
```json
{
  "text": "transcribed text in original language",
  "detected_language": "hi"
}
```

**Authentication:** Requires valid Supabase access token in the `Authorization` header.

### `translate-elaborate`

Translates text to English and elaborates it into a Lovable-optimized prompt using GPT-4o-mini.

**Endpoint:** `POST /functions/v1/translate-elaborate`

**Request:**
```json
{
  "text": "original transcribed text",
  "source_language": "hi",
  "objective": "new_feature",
  "additional_context": "optional user context"
}
```

**Response:**
```json
{
  "translated_text": "English translation",
  "elaborated_text": "Detailed prompt optimized for Lovable...",
  "tokens_used": 450
}
```

**Authentication:** Requires valid Supabase access token in the `Authorization` header.

---

## Usage Limits & Pricing

| Plan | Daily Limit | Price |
|------|-------------|-------|
| **Free** | 5 prompts/day | $0 |
| **Pro** | 100 prompts/day | Configurable |
| **Unlimited** | Unlimited | Configurable |

Usage limits are enforced server-side via the `check_usage_limit` database function. The extension caches the limit check result for 60 seconds to reduce API calls.

When a user exceeds their daily limit, the extension displays an upgrade modal instead of starting the recording flow.

---

## Supported Languages

### Indic Languages (14)

| Code | Language | Native Name | Whisper Support |
|------|----------|-------------|-----------------|
| `hi` | Hindi | हिन्दी | Full |
| `bn` | Bengali | বাংলা | Full |
| `ta` | Tamil | தமிழ் | Full |
| `te` | Telugu | తెలుగు | Full |
| `mr` | Marathi | मराठी | Full |
| `kn` | Kannada | ಕನ್ನಡ | Full |
| `gu` | Gujarati | ગુજરાતી | Full |
| `ml` | Malayalam | മലയാളം | Full |
| `pa` | Punjabi | ਪੰਜਾਬੀ | Full |
| `or` | Odia | ଓଡ଼ିଆ | Limited |
| `as` | Assamese | অসমীয়া | Limited |
| `sa` | Sanskrit | संस्कृतम् | Limited |
| `ne` | Nepali | नेपाली | Full |
| `ks` | Kashmiri | कॉशुर | Limited |

### International Languages (4)

| Code | Language | Native Name | Whisper Support |
|------|----------|-------------|-----------------|
| `es` | Spanish | Espanol | Full |
| `de` | German | Deutsch | Full |
| `zh` | Mandarin | 中文 | Full |
| `id` | Bahasa Indonesia | Bahasa Indonesia | Full |

**Note:** Languages marked "Limited" may have lower transcription accuracy. Users are encouraged to review and edit transcriptions in the confirmation modal.

---

## Security

### Authentication Security
- **OAuth nonce verification** prevents token replay and injection attacks
- **SHA-256 hashing** of nonces before sending to Google
- Sessions stored in `chrome.storage.local` (isolated per extension)

### Data Security
- **HTTPS/TLS** encryption for all data in transit
- **Row-Level Security (RLS)** on all database tables ensures users can only access their own data
- **Bearer token authentication** on all Supabase API requests
- **Edge Function authorization** verifies the user's identity before processing

### Audio Privacy
- Audio is recorded locally and transmitted over HTTPS
- Audio is deleted immediately after transcription - it is never stored permanently
- Only the transcribed text is retained (see [Privacy Policy](PRIVACY_POLICY.md))

### Extension Permissions
The extension requests only the minimum required permissions:

| Permission | Reason |
|------------|--------|
| `activeTab` | Interact with the current Lovable.dev tab |
| `storage` | Store session tokens and user preferences |
| `identity` | Google OAuth authentication |
| `host_permissions: lovable.dev` | Content script injection |

---

## API Reference

### Chrome Extension Messages

All internal communication uses `chrome.runtime.sendMessage` with typed message objects.

```typescript
// Sign in
{ type: 'SIGN_IN' }

// Sign out
{ type: 'SIGN_OUT' }

// Get current session
{ type: 'GET_SESSION' }
// Response: { session: UserSession | null }

// Check usage limits
{ type: 'CHECK_USAGE' }
// Response: { allowed: boolean, remaining: number, limit: number }

// Transcribe audio
{ type: 'TRANSCRIBE_AUDIO', audio: string, language: string }
// Response: { text: string, detected_language: string }

// Translate and elaborate
{
  type: 'TRANSLATE_ELABORATE',
  text: string,
  source_language: string,
  objective: string,
  additional_context?: string
}
// Response: { translated_text: string, elaborated_text: string, tokens_used: number }

// Log usage
{
  type: 'LOG_USAGE',
  source_language: string,
  objective: string,
  audio_duration_seconds: number,
  original_text_length: number,
  translated_text_length: number,
  elaborated_text_length: number,
  tokens_used: number
}
```

---

## Configuration

### Extension Settings (Options Page)

Users can configure:

| Setting | Description | Default |
|---------|-------------|---------|
| **Preferred Language** | Default language for voice input | Hindi |
| **Auto-stop Duration** | Automatically stop recording after N seconds | 60s |
| **Default Objective** | Pre-selected development objective | New Feature |
| **Auto-insert** | Automatically insert prompt without preview | Off |

### Developer Configuration

Key configuration values in `src/shared/constants/index.ts`:

| Constant | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `MAX_RECORDING_DURATION` | Maximum recording length (ms) |
| `USAGE_CACHE_TTL` | Usage limit cache duration (ms) |
| `FREE_DAILY_LIMIT` | Free tier daily prompt limit |
| `PRO_DAILY_LIMIT` | Pro tier daily prompt limit |

---

## Troubleshooting

### Common Issues

**Microphone button doesn't appear on Lovable.dev**
- Ensure the extension is enabled in `chrome://extensions/`
- Refresh the Lovable.dev page
- Check that the content script has host permission for the correct Lovable.dev URL

**"Not authenticated" error**
- Click the extension icon and sign in with Google
- If sign-in fails, verify your Google OAuth client ID in `manifest.json`
- Check that Google Auth is enabled in your Supabase project

**Audio not recording**
- Allow microphone permission when prompted by Chrome
- Check that no other application is using the microphone
- Try reloading the extension

**Transcription is inaccurate**
- Speak clearly and at a moderate pace
- Use the confirmation modal to edit the transcription
- Languages marked "Limited" may have lower accuracy

**"Usage limit exceeded" appears immediately**
- Check your subscription plan in the popup dashboard
- Usage resets daily at midnight UTC
- Consider upgrading to the Pro plan

**Build errors**
- Delete `node_modules/` and run `npm install`
- Ensure Node.js 18+ is installed
- Run `npm run typecheck` to identify TypeScript errors

### Debug Logging

To view extension logs:

1. Open `chrome://extensions/`
2. Find VibeBhasha and click "Service Worker" to open DevTools for the background script
3. Right-click the extension icon on Lovable.dev and select "Inspect" for content script logs

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following the existing code style
4. Run linting and type checks: `npm run lint && npm run typecheck`
5. Build and test the extension: `npm run build`
6. Load the updated `dist/` folder in Chrome and verify
7. Commit your changes and push to your fork
8. Open a Pull Request with a clear description

### Code Style

- TypeScript strict mode enabled
- ESLint with `@typescript-eslint` rules
- Use path aliases (`@shared/`, `@background/`, `@content/`) for imports
- Follow existing patterns for message handling and module structure

---

## License

MIT License - see [LICENSE](LICENSE) for details.
