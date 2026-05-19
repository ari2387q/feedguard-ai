# FeedGuard AI 🛡️

FeedGuard AI is an AI-powered browser extension and dashboard designed to curate your YouTube and Twitter (X) feeds. It filters out clickbait, prevents doomscrolling, summarizes videos on hover before you watch them, and flags toxic or rage-bait content.

---

## Repository Structure

```text
feedguard/
├── extension/             # Chrome Extension (Manifest V3) unpacked folder
│   ├── manifest.json
│   ├── background.js
│   ├── icons/             # Extension icons
│   └── content/
│       ├── youtube.js     # YouTube content script
│       └── twitter.js     # Twitter/X content script
├── popup-src/             # Extension React + TypeScript + Vite popup source
│   ├── src/
│   │   ├── components/    # Toggle, Timer, and Stats components
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
├── backend/               # Express + Mongoose + TypeScript Backend API
│   ├── src/
│   │   ├── routes/        # summarize, analyze, and user routes
│   │   ├── models/        # Mongoose schemas
│   │   ├── lib/           # Groq client & YouTube transcript stubs
│   │   └── index.ts       # Server entry point
│   ├── tsconfig.json
│   └── .env.example
└── dashboard/             # Next.js 14 App Router + Tailwind CSS Dashboard
    ├── app/
    │   ├── components/    # Navbar, StatCard, UsageChart
    │   ├── layout.tsx
    │   ├── globals.css
    │   └── page.tsx
    ├── tailwind.config.ts
    └── package.json
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **MongoDB**: A running local or Atlas instance (for user analytics persistence)
- **Groq API Key**: Free API key from the [Groq Console](https://console.groq.com/keys)

---

### 2. Setup the Backend API

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` and fill in your details:
   - `GROQ_API_KEY`: Your real Groq API key (`gsk_...`)
   - `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb://localhost:27017/feedguard`)
5. Start the backend in development mode:
   ```bash
   npm run dev
   ```
   The backend will start on [http://localhost:3001](http://localhost:3001).

---

### 3. Build & Load the Chrome Extension

The popup is built using React and TypeScript, which needs to be compiled to the extension directory.

1. Navigate to the `popup-src/` directory:
   ```bash
   cd popup-src
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the popup React code:
   ```bash
   npm run build
   ```
   *Note: This compiles and writes the static web bundle into the `extension/popup` directory as configured in `vite.config.ts`.*

4. **Install the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Toggle **Developer mode** (top-right corner).
   - Click **Load unpacked** (top-left corner).
   - Select the `extension/` directory (the one containing `manifest.json` and the newly built `popup/` folder) from this repository.

---

### 4. Setup the Dashboard

1. Navigate to the `dashboard/` directory:
   ```bash
   cd dashboard
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Access the dashboard at [http://localhost:3000](http://localhost:3000).

---

## Features

- **Clickbait Badge & Blur**: YouTube titles are scored against dynamic heuristics. Video cards containing clickbait are flagged with badges and can optionally be blurred out automatically.
- **AI Summary on Hover**: Hover over any video thumbnail on YouTube for 600ms, and FeedGuard will query the backend Groq service to display a factual 2-sentence summary of the video content.
- **Doomscroll Prevention**: Set a time limit in the popup. If you browse YouTube feeds past your threshold, a beautiful full-screen overlay blocks interaction and prompts you to take a break.
- **Toxic Content Filter**: Tweets on X (Twitter) are evaluated for rage-bait/toxicity. Flagged tweets are blurred out with an explanations banner explaining why, along with a click-to-reveal toggle.
- **Interactive Dashboard**: Track your stats (time spent, items filtered, toxic content blocked) via Next.js dashboards powered by Recharts.
