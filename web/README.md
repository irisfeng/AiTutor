# Web Frontend

The Web frontend is a Next.js 14 application that provides the user interface for the AiTutor system.

## 📋 Overview

The frontend provides:

- 实时语音 AI 交互
- 对话历史管理
- 多语言支持（中文/English）
- 优雅的深色主题 UI
- 实时音频可视化

## 🏗️ Architecture

```
web/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Home page (redirects to /realtime-voice)
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── realtime-voice/       # Realtime voice interaction page
│       └── page.tsx          # Main voice interaction page
├── components/               # React components
│   └── realtime-voice/       # Voice interaction components
│       ├── AudioVisualizer.tsx      # Audio waveform visualization
│       ├── ConversationBubble.tsx   # Conversation message bubbles
│       ├── ConversationPanel.tsx    # Conversation history panel
│       ├── MicrophoneButton.tsx     # Microphone control button
│       ├── ParticleBackground.tsx   # Animated particle background
│       ├── SettingsPanel.tsx        # Settings modal panel
│       └── StatusIndicator.tsx      # Voice status indicator
├── lib/                      # Utilities
│   ├── i18n.ts               # Internationalization configuration
│   ├── locales/              # Language files (zh.json, en.json)
│   └── stepfun-realtime.ts   # StepFun Realtime API client
├── types/                    # TypeScript type definitions
│   └── voice.ts              # Voice-related types
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── server.js                 # WebSocket proxy server
└── postcss.config.mjs        # PostCSS configuration
```

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide React icons
- **Animations**: Framer Motion
- **i18n**: react-i18next
- **Realtime API**: StepFun Realtime API
- **WebSocket**: ws (for WebSocket proxy server)

## 📦 Dependencies

### Core Dependencies

```json
{
  "next": "14.0.3",
  "react": "^18",
  "react-dom": "^18",
  "lucide-react": "^0.294.0",
  "framer-motion": "^10.16.4",
  "i18next": "^25.7.3",
  "react-i18next": "^16.5.1",
  "ws": "^8.0.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

## 🚀 Getting Started

### Installation

```bash
cd web
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Build

```bash
npm run build
npm start
```

## 📁 Key Components

### Main Page (app/realtime-voice/page.tsx)

Main voice interaction page featuring:

- Realtime voice conversation with AI
- Conversation history display
- Settings panel (API Key, language)
- Status indicators (connecting, listening, thinking, speaking)

### StepFun Realtime Client (lib/stepfun-realtime.ts)

WebSocket client for StepFun Realtime API:

```typescript
import { StepFunRealtimeClient } from "@/lib/stepfun-realtime";

const client = new StepFunRealtimeClient({
  apiKey: "your-api-key",
  voice: "qingchunshaonv",  // or "wenrounansheng"
  instructions: "You are an AI tutor...",
});

await client.connect(
  onStateChange,  // (state: VoiceState) => void
  onTextUpdate,   // (text: string) => void
  onAudioData     // (audioData: string) => Promise<void>
);
```

### Voice Components

- **MicrophoneButton**: Central microphone control button
- **StatusIndicator**: Voice status indicator (idle, connecting, listening, thinking, speaking)
- **AudioVisualizer**: Real-time audio waveform visualization
- **ConversationPanel**: Conversation history display
- **ConversationBubble**: Individual message bubbles
- **SettingsPanel**: Settings modal (API Key, language)
- **ParticleBackground**: Animated particle background

## 🔌 API Integration

### StepFun Realtime API

The app uses StepFun's Realtime API for voice interaction:

```typescript
// WebSocket connection
wss://api.stepfun.com/v1/realtime?authorization=<API_KEY>

// Audio format
- Input: PCM16, 24kHz, mono
- Output: PCM16, 24kHz, mono
```

### Features

- **Server VAD**: Automatic voice activity detection
- **Bidirectional interruption**: Natural conversation flow
- **Context management**: Automatic multi-turn conversation context
- **Multilingual**: Chinese (zh) and English (en) support

## 🎨 Styling

### Tailwind CSS

The project uses Tailwind CSS for styling. Configuration in `tailwind.config.ts`.

### Design System

- **Colors**: Deep space theme with cyan and violet accents
- **Typography**: Inter font family
- **Effects**: Glass morphism, smooth animations
- **Responsive**: Mobile and desktop friendly

## 🌍 Internationalization

The app supports multiple languages using react-i18next:

- **Languages**: Chinese (zh), English (en)
- **Language files**: `lib/locales/zh.json`, `lib/locales/en.json`
- **Configuration**: `lib/i18n.ts`

## 🛠️ Development

### Adding a New Language

1. Create a new language file in `lib/locales/`:

   ```json
   // lib/locales/fr.json
   {
     "translation": {
       "header": {
         "title": "AI Tutor",
         "subtitle": "Assistant d'apprentissage intelligent"
       }
     }
   }
   ```

2. Update `lib/i18n.ts`:

   ```typescript
   import fr from './locales/fr.json';

   const resources = {
     zh: { translation: zh.translation },
     en: { translation: en.translation },
     fr: { translation: fr.translation },
   };
   ```

### Customizing AI Instructions

Edit the `instructions` parameter in `app/realtime-voice/page.tsx`:

```typescript
instructions: language === "zh"
  ? "你是 AI 导师，擅长启发思考..."
  : "You are an AI tutor who inspires thinking...",
```

## ⚠️ Notes

1. **API Key**: Required for StepFun Realtime API
2. **WebSocket Proxy**: Uses proxy server in `server.js` to avoid CORS issues
3. **Audio Permissions**: Requires microphone access
4. **Browser Support**: Best experience in Chrome/Edge browsers

## 📄 License

MIT License
