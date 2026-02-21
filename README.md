# Lovable Voice Helper

A Chrome extension for **Lovable.dev** that enables users to **speak prompts in their native language**. The extension records voice input, transcribes speech using Google Gemini, and translates/elaborates prompts in English for optimal results with Lovable.

## Features

- **Voice-first input**: Click the microphone or press `Ctrl+Shift+I` to start recording
- **18 languages supported**: Hindi, Bengali, Tamil, Telugu, Marathi, Kannada, Gujarati, Malayalam, Punjabi, Odia, Assamese, Sanskrit, Nepali, Kashmiri, Spanish, German, Mandarin, and Bahasa Indonesia
- **Native language confirmation**: Review your transcription in your own language before processing
- **AI-powered elaboration**: Prompts are optimized for Lovable's tech stack (React, TypeScript, Tailwind, shadcn/ui)
- **Usage limits**: Free tier includes 5 voice prompts per day

## Tech Stack

- **Extension**: Chrome Manifest V3, TypeScript, Webpack
- **Speech-to-Text**: Google Gemini 2.0 Flash
- **Translation/Elaboration**: Google Gemini 2.0 Flash
- **Backend**: Supabase (PostgreSQL, Edge Functions, Google Auth)

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project
- Gemini API key
- Google OAuth credentials

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/lovable-voice-helper.git
   cd lovable-voice-helper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**

   Update `src/shared/constants/index.ts` with your Supabase credentials:
   ```typescript
   export const SUPABASE_URL = 'your-supabase-url';
   export const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
   ```

   Update `manifest.json` with your Google OAuth client ID:
   ```json
   {
     "oauth2": {
       "client_id": "your-google-client-id.apps.googleusercontent.com"
     }
   }
   ```

4. **Setup Supabase**

   Run the database migration:
   ```bash
   supabase db push
   ```

   Deploy Edge Functions:
   ```bash
   supabase functions deploy transcribe-audio
   supabase functions deploy translate-elaborate
   ```

   Set secrets:
   ```bash
   supabase secrets set GEMINI_API_KEY=your-gemini-api-key
   ```

5. **Build the extension**
   ```bash
   npm run build
   ```

6. **Load in Chrome**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Development

```bash
# Start development build with watch mode
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build

# Package for Chrome Web Store
npm run package
```

## Project Structure

```
lovable-voice-helper/
├── manifest.json          # Chrome extension manifest
├── src/
│   ├── background/        # Service worker
│   ├── content-scripts/   # Injected into lovable.dev
│   ├── popup/             # Extension popup UI
│   ├── options/           # Settings page
│   └── shared/            # Shared types, constants, utils
├── supabase/
│   ├── migrations/        # Database schema
│   └── functions/         # Edge functions
└── assets/
    └── icons/             # Extension icons
```

## User Flow

1. User clicks microphone button on lovable.dev (or presses Ctrl+Shift+I)
2. Recording modal appears, user speaks in their native language
3. Audio is sent to Gemini API for transcription
4. Confirmation modal shows transcription in detected language
5. User selects objective and adds optional context
6. Text is translated to English and elaborated for Lovable
7. Preview modal shows the final prompt
8. User approves and prompt is inserted into Lovable's input

## Supported Languages

### Indic Languages (14)
| Code | Language | Speech Support |
|------|----------|-----------------|
| hi | Hindi | Full |
| bn | Bengali | Full |
| ta | Tamil | Full |
| te | Telugu | Full |
| mr | Marathi | Full |
| kn | Kannada | Full |
| gu | Gujarati | Full |
| ml | Malayalam | Full |
| pa | Punjabi | Full |
| or | Odia | Limited |
| as | Assamese | Limited |
| sa | Sanskrit | Limited |
| ne | Nepali | Full |
| ks | Kashmiri | Limited |

### International Languages (4)
| Code | Language | Speech Support |
|------|----------|-----------------|
| es | Spanish | Full |
| de | German | Full |
| zh | Mandarin | Full |
| id | Bahasa Indonesia | Full |

## Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Chrome Extension type)
5. Add your extension ID to authorized origins
6. Copy the client ID to `manifest.json`

### Supabase Setup

1. Create a new Supabase project
2. Enable Google Auth provider in Authentication settings
3. Add your Google OAuth credentials
4. Run the database migration
5. Deploy Edge Functions

## Privacy

- Audio recordings are processed server-side and not stored permanently
- Only transcribed text and usage metadata are logged
- See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for details

## License

MIT License - see [LICENSE](LICENSE) for details
