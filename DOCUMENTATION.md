# VibeBhasha - Documentation

## Objective

Millions of developers worldwide think and communicate in languages other than English, but AI coding platforms like Lovable.dev only accept English prompts. VibeBhasha removes this barrier by letting developers speak in their native language and automatically converting their voice into optimized English prompts ready for Lovable's AI code generation.

## Flow

```
Speak in your language -> Gemini transcribes -> Review & edit -> Select objective -> Gemini translates & elaborates -> Preview -> Insert into Lovable
```

## Features

- **Voice-first input** - click the microphone button or press `Ctrl+Shift+I` to start recording
- **18 languages supported** - 14 Indic + 4 international languages
- **Native language review** - see and edit your transcription before processing
- **Smart elaboration** - prompts are optimized for Lovable's stack (React, TypeScript, Tailwind, shadcn/ui)
- **Objective-based prompts** - select New Feature, Bug Fix, Design Improvement, or Other for tailored output
- **Google sign-in** - one-click authentication
- **Usage tiers** - Free (5/day), Pro (100/day), Unlimited

## How to Use

### 1. Install the Extension

```bash
npm install
npm run build
```

- Open Chrome and go to `chrome://extensions/`
- Turn on **Developer mode** (top-right toggle)
- Click **Load unpacked** and select the `dist/` folder

### 2. Sign In

- Click the VibeBhasha icon in the toolbar
- Click **Sign in with Google**

### 3. Use Voice Input on Lovable.dev

1. Go to [lovable.dev](https://lovable.dev) and open a project
2. Click the **microphone button** next to Lovable's input field (or press `Ctrl+Shift+I` / `Cmd+Shift+I`)
3. **Speak your prompt** in your native language
4. Click **Stop** when done (auto-stops after 60 seconds)
5. **Review the transcription** - edit if needed
6. **Select an objective** - New Feature, Bug Fix, Design Improvement, or Other
7. **Preview the final prompt** in English
8. Click **Insert** to send it to Lovable

### Example

> You say (in Hindi): "ek login page banao jisme email aur password field ho, aur Google se bhi login ho sake"
>
> VibeBhasha generates: "Create a login page with email and password input fields using shadcn/ui components. Add form validation for email format and password requirements. Include a 'Sign in with Google' button using OAuth integration. Style with Tailwind CSS and ensure responsive layout for mobile and desktop."

## Supported Languages

**Indic (14):** Hindi, Bengali, Tamil, Telugu, Marathi, Kannada, Gujarati, Malayalam, Punjabi, Odia, Assamese, Sanskrit, Nepali, Kashmiri

**International (4):** Spanish, German, Mandarin Chinese, Bahasa Indonesia

## Tech Stack

| Layer | Technology |
|-------|------------|
| Extension | Chrome Manifest V3, TypeScript, Webpack |
| Speech-to-Text | Google Gemini 2.0 Flash |
| Translation | Google Gemini 2.0 Flash |
| Backend | Supabase (PostgreSQL, Edge Functions, Auth) |
| Auth | Google OAuth 2.0 |

## Privacy

- Audio is deleted immediately after transcription
- All data encrypted in transit (HTTPS/TLS)
- See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for details

## License

MIT
