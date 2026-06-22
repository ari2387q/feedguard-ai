<div align="center">

<img src="https://img.shields.io/badge/-FeedGuard%20AI-6366f1?style=for-the-badge&logo=googlechrome&logoColor=white" alt="FeedGuard AI"/>

# 🛡️ FeedGuard AI

### *Reclaim your feed. Protect your mind.*

An AI-powered browser extension that silently guards your YouTube and X (Twitter) feeds in real time — filtering clickbait, detecting toxic content, preventing doomscrolling, and summarising videos on hover. Backed by a multi-layer intelligence stack: **local heuristics → custom-trained Logistic Regression ML model → Groq LLM**.

<br/>

[![Manifest](https://img.shields.io/badge/Manifest-V3-6366f1?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-f7931e?style=flat-square&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)
[![Groq](https://img.shields.io/badge/Groq-LLM-f97316?style=flat-square)](https://groq.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47a248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)

</div>

---

## 📖 Table of Contents

- [What Is FeedGuard AI?](#-what-is-feedguard-ai)
- [The Intelligence Stack](#-the-intelligence-stack)
- [Full System Architecture](#-full-system-architecture)
- [Feature Deep-Dive](#-feature-deep-dive)
  - [Clickbait Filter — YouTube](#1--clickbait-filter--youtube)
  - [Toxic Content & Rage Bait Filter — X/Twitter](#2--toxic-content--rage-bait-filter--xtwitter)
  - [ML Spam Classifier — Python Service](#3--ml-spam-classifier--python-service)
  - [AI Video Summariser — YouTube](#4--ai-video-summariser--youtube)
  - [Doomscroll Timer — YouTube](#5--doomscroll-timer--youtube)
  - [Analytics Dashboard](#6--analytics-dashboard)
  - [Extension Popup Controls](#7--extension-popup-controls)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#️-environment-variables)
- [API Reference](#-api-reference)
- [The ML Model — How It Was Built](#-the-ml-model--how-it-was-built)
- [Data Flow — End to End](#-data-flow--end-to-end)

---

## 🌟 What Is FeedGuard AI?

Modern social media platforms are engineered to maximise engagement at any cost — clickbait thumbnails, outrage-inducing posts, and infinite scroll designed to trap you. FeedGuard AI fights back.

It is a **Chrome browser extension** with a full backend ecosystem that works silently in the background, analysing every video and tweet you encounter before it reaches your eyes. Rather than relying on any single technique, FeedGuard uses a **three-layer intelligence pipeline** — starting with fast local heuristics, escalating to a custom-trained machine learning model, and finally to a large language model for nuanced cases.

Everything is **individually toggleable**, **privacy-respecting** (text is only sent to AI when needed), and backed by a **live analytics dashboard** so you can see exactly how much noise your feed has been producing.

---

## 🧠 The Intelligence Stack

FeedGuard is not just an LLM wrapper. It uses three distinct layers of intelligence, each with a specific role:

```
Layer 1 — Heuristics        (Zero latency, zero cost, runs 100% locally)
    ↓ only if flagged
Layer 2 — ML Classifier     (Fast, deterministic, custom-trained Logistic Regression)
    ↓ only if still uncertain
Layer 3 — Groq LLM          (Deep contextual understanding, used sparingly)
```

This design means:
- **95% of content** is evaluated instantly with no network call
- **The ML model** handles borderline cases efficiently
- **The LLM** is reserved for nuanced toxic/ragebait content that simpler methods miss
- **API costs stay minimal** — the LLM is never called for clean content

---

## 🏗️ Full System Architecture

```
╔══════════════════════════════════════════════════════════════════════╗
║                        Google Chrome Browser                         ║
║                                                                      ║
║  ┌────────────────────────────────────────────────────────────────┐  ║
║  │                   Content Scripts (per tab)                    │  ║
║  │                                                                │  ║
║  │   youtube.com                    x.com / twitter.com           │  ║
║  │  ┌──────────────────┐          ┌──────────────────┐            │  ║
║  │  │  youtube.js      │          │  twitter.js      │            │  ║
║  │  │                  │          │                  │            │  ║
║  │  │ • Clickbait      │          │ • Heuristic scan │            │  ║
║  │  │   scoring engine │          │ • ML spam check  │            │  ║
║  │  │ • Blur overlays  │          │ • LLM analysis   │            │  ║
║  │  │ • Hover tooltips │          │ • Warning badges │            │  ║
║  │  │ • Doomscroll     │          │ • Blur + reveal  │            │  ║
║  │  │   timer          │          │                  │            │  ║
║  │  └────────┬─────────┘          └────────┬─────────┘            │  ║
║  └───────────┼────────────────────────────┼────────────────────────┘  ║
║              │   chrome.runtime.sendMessage│                           ║
║              └──────────────┬─────────────┘                           ║
║                             ▼                                         ║
║  ┌──────────────────────────────────────────────────────────────┐     ║
║  │                Background Service Worker                      │     ║
║  │                    (background.js)                            │     ║
║  │                                                               │     ║
║  │  Message Router → GET_SETTINGS, UPDATE_STATS, GET_STATS,     │     ║
║  │                   SUMMARIZE, ANALYZE_TWEET, CHECK_SPAM        │     ║
║  │                                                               │     ║
║  │  chrome.storage.sync  ←→  Settings (per user, cross-device)  │     ║
║  │  chrome.storage.local ←→  Daily stats (today's counts)       │     ║
║  │  chrome.alarms        →   Daily stats reset (every 60 min)   │     ║
║  └───────────────────────────────┬──────────────────────────────┘     ║
║                                  │                                     ║
║  ┌──────────────────────┐        │                                     ║
║  │  Popup UI            │        │                                     ║
║  │  (React + Vite)      │        │                                     ║
║  │                      │        │                                     ║
║  │  • 4 feature toggles │        │                                     ║
║  │  • Time limit slider │        │                                     ║
║  │  • Today's stats     │        │                                     ║
║  │  • Dashboard link    │        │                                     ║
║  └──────────────────────┘        │                                     ║
╚══════════════════════════════════│══════════════════════════════════════╝
                                   │ HTTP (localhost:3001)
                                   ▼
╔══════════════════════════════════════════════════════════════════════╗
║              Node.js + Express + TypeScript Backend (:3001)          ║
║                                                                      ║
║   POST /api/summarize  ──► groq.ts ──► Groq LLM ──► 2-sentence sum  ║
║   POST /api/analyze    ──► groq.ts ──► Groq LLM ──► JSON flags      ║
║   POST /api/spam       ──────────────────────────────────────────┐   ║
║   POST /api/user       ──► userService ──► MongoDB (upsert)      │   ║
║   GET  /api/user       ──► userService ──► MongoDB (fetch)       │   ║
║   GET  /api/health     ──► { status: 'ok' }                      │   ║
║                                                                   │   ║
║    ┌─────────────────────────┐                                    │   ║
║    │     MongoDB Atlas        │                                   │   ║
║    │  User { userId,          │                                   │   ║
║    │    videosFiltered,       │                                   │   ║
║    │    toxicBlocked,         │                                   │   ║
║    │    timeSpent,            │                                   │   ║
║    │    dailyStats[] }        │                                   │   ║
║    └─────────────────────────┘                                   │   ║
╚══════════════════════════════════════════════════════════════════│═══╝
                                                                   │ HTTP (localhost:8000)
                                                                   ▼
╔══════════════════════════════════════════════════════════════════════╗
║            Python FastAPI ML Service (:8000)                         ║
║                                                                      ║
║   POST /predict                                                      ║
║       text → TF-IDF Vectorizer → Logistic Regression Model          ║
║            → { label: "SPAM"|"HAM", confidence: 94.2 }              ║
║                                                                      ║
║   Model trained on:  SMS Spam Collection Dataset (5,572 messages)   ║
║   Vectorizer:        TF-IDF (unigrams + bigrams, 5000 features)     ║
║   Classifier:        Logistic Regression (max_iter=1000)            ║
║   Serialised as:     spam_model.pkl + vectorizer.pkl (joblib)       ║
╚══════════════════════════════════════════════════════════════════════╝
                              │
                              ▼
╔══════════════════════════════════════════════════════════════════════╗
║              Next.js 14 Dashboard (:3000)                            ║
║                                                                      ║
║   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             ║
║   │  Time Saved  │  │  Clickbait   │  │Toxic Blocked │  StatCards  ║
║   │    KPI card  │  │  Filtered    │  │  KPI card    │             ║
║   └──────────────┘  └──────────────┘  └──────────────┘             ║
║   ┌──────────────────────────────┐  ┌────────────────────────────┐  ║
║   │  Weekly Usage (Recharts)     │  │  Recent Activity Feed      │  ║
║   │  Bar chart from dailyStats[] │  │  Live, refreshes every 30s │  ║
║   └──────────────────────────────┘  └────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## ✨ Feature Deep-Dive

### 1. 🚨 Clickbait Filter — YouTube

A **client-side heuristic scoring engine** processes every video card in your YouTube feed the moment it appears in the DOM, with zero network latency.

#### How the Score Is Calculated

Each video title passes through five independent signal checks. Scores are capped at 100.

| Signal | Points | Detection Logic |
|---|---|---|
| Clickbait keywords | +20 | Matches against a 30+ word dictionary: *"you won't believe", "exposed", "shocking", "not clickbait"*, etc. |
| Excessive CAPS | +25 | Uppercase character ratio > 50% of total title length |
| Excessive punctuation | +15 | Two or more consecutive `!` or `?` characters |
| Large numbers | +10 | Any 4+ digit number (e.g. "1000 ways to...") |
| Emoji overload | +10 | More than 2 Unicode emojis in the title |

#### Score Tiers & Visual Responses

| Score | Response | Visual |
|---|---|---|
| ≥ 30 | **Likely Bait** | ⚠️ Amber badge pinned to top-left of thumbnail |
| ≥ 60 | **Clickbait** | 🚨 Red badge + video counted in daily stats |
| ≥ 70 | **Filtered** | 🛡 Full blur overlay with "Filtered" label |

The blur overlay has a **"click to reveal"** interaction — a single click removes the overlay and shows the video normally.

A `Set<string>` of processed video IDs prevents any card from being scored twice, even as YouTube's single-page app re-renders the feed during scroll.

---

### 2. ☣️ Toxic Content & Rage Bait Filter — X/Twitter

A **three-stage progressive analysis pipeline** ensures every tweet is evaluated accurately while keeping API costs at zero for clean content.

#### Stage 1 — Local Heuristic Pre-Screen

Two curated keyword lists are checked instantly with no API call:

**Toxic keywords** (`TOXIC_KEYWORDS`): insults, hate speech, self-harm phrases — *"idiot", "kill yourself", "brain dead", "worthless"*, etc.

**Rage-bait keywords** (`RAGEBAIT_KEYWORDS`): outrage-engineering phrases — *"unpopular opinion", "change my mind", "the media won't show", "they're hiding", "you need to hear this"*, etc.

If neither list matches → tweet is marked **clean**, no further processing.

#### Stage 2 — ML Spam Classifier

If the heuristic flags the tweet, the text is sent to the **Python ML service** via the Node backend proxy:

```
twitter.js → background.js → POST /api/spam → POST :8000/predict
                                    ↓
              { label: "SPAM", confidence: 94.2 }
```

If the ML model classifies it as `SPAM`, a warning badge is immediately injected — no LLM call needed.

#### Stage 3 — Groq LLM Deep Analysis

If the heuristic flagged the tweet but the ML model returned `HAM` (not spam), the text is escalated to the Groq LLM for contextual understanding:

```json
{
  "toxic": true,
  "ragebait": false,
  "clickbait": false,
  "reason": "Contains dehumanizing language targeting a specific group."
}
```

#### The Warning Banner

Flagged tweets receive a colour-coded banner injected **above the tweet content**:

- 🔴 Red left border + `☣️` icon → **"Toxic Content Detected"**
- 🟡 Amber left border + `⚠️` icon → **"Rage Bait Detected"**

The tweet text itself is **blurred** (`filter: blur(4px)`). A **"Show tweet anyway"** button removes the blur and the banner on demand.

An in-memory `Map<string, AnalysisResult>` caches every result — repeated tweets are never re-analysed.

---

### 3. 🤖 ML Spam Classifier — Python Service

A dedicated **FastAPI microservice** hosts a custom-trained machine learning classifier for spam detection.

#### The Model

| Component | Detail |
|---|---|
| **Algorithm** | Logistic Regression (`sklearn.linear_model.LogisticRegression`) |
| **Feature Extraction** | TF-IDF Vectorizer — unigrams + bigrams, 5,000 features, English stop words removed |
| **Training Data** | SMS Spam Collection Dataset — 5,572 labelled messages (ham/spam) |
| **Train/Test Split** | 80% / 20%, `random_state=42` for reproducibility |
| **Serialisation** | `spam_model.pkl` + `vectorizer.pkl` via `joblib` |

#### Training Pipeline

```python
# 1. Load & label data
df = pd.read_csv(url, sep='\t', names=['label', 'message'])
df['label_num'] = df['label'].map({'ham': 0, 'spam': 1})

# 2. Split
X_train, X_test, y_train, y_test = train_test_split(
    df['message'], df['label_num'], test_size=0.2, random_state=42
)

# 3. Vectorise (TF-IDF with bigrams)
vectorizer = TfidfVectorizer(stop_words='english', max_features=5000, ngram_range=(1,2))
X_train_tfidf = vectorizer.fit_transform(X_train)

# 4. Train
model = LogisticRegression(max_iter=1000)
model.fit(X_train_tfidf, y_train)

# 5. Evaluate
print(classification_report(y_test, model.predict(X_test_tfidf)))
```

#### Why Logistic Regression?

- **Interpretable** — you can inspect feature weights to understand what words drive spam predictions
- **Fast** — inference is near-instant (no GPU required)
- **Effective** — TF-IDF + LR is a well-proven baseline for text classification
- **Explainable** — `predict_proba()` returns confidence scores, not just binary labels

#### The API

```
POST /predict
Body: { "text": "Free entry in 2 a wkly comp..." }

Response: {
  "label": "SPAM",
  "confidence": 98.3,
  "message": "Free entry in 2 a wkly comp..."
}
```

#### Sample Predictions

| Input | Label | Confidence |
|---|---|---|
| "Free entry in 2 a wkly comp to win FA Cup final tkts!" | SPAM | ~98% |
| "WINNER!! You have been selected to receive a £900 prize!" | SPAM | ~99% |
| "Txt to claim your prize 83600" | SPAM | ~97% |
| "Hey are we still meeting tomorrow?" | HAM | ~99% |

---

### 4. 🔍 AI Video Summariser — YouTube

Hover over any YouTube thumbnail for **600 milliseconds** and an AI-generated summary floats above the card — no clicking, no page navigation.

**What happens under the hood:**
1. A 600ms debounce timer starts on `mouseenter`
2. A tooltip is injected into the thumbnail DOM with "⏳ Loading AI summary…"
3. `chrome.runtime.sendMessage({ type: 'SUMMARIZE' })` is sent to the background worker
4. Background worker calls `POST /api/summarize` on the Node backend
5. Backend sends the video title to Groq LLM with a carefully tuned prompt:
   - Temperature: `0.3` (factual, low creativity)
   - Max tokens: `150` (concise output)
   - System prompt: *"You summarize YouTube videos in exactly 2 concise sentences. No markdown, no bullet points."*
6. Summary appears in the tooltip, styled with an indigo border

On `mouseleave` → tooltip is removed from DOM immediately.

**Fallback states:**
- `⚠️ Summary unavailable` — backend returned an error
- `⚠️ Backend not reachable` — connection refused (backend offline)

---

### 5. ⏱️ Doomscroll Timer — YouTube

A passive background timer tracks how long you've been on YouTube in the current session and intervenes when your configured limit is reached.

**How it works:**
- A `setInterval` fires **every 5 seconds** while YouTube is open
- Increments `timeSpentSeconds` by 5 on each tick
- Skips ticking when `document.hidden === true` (tab not in focus)
- When `timeSpentSeconds >= timeLimit × 60`:

A full-screen, blurred overlay appears:

```
          🛡️
   Time Limit Reached
   
   You've been on YouTube for 32 minutes.
   Take a break — your future self will thank you.
   
   [  Snooze 10 min  ]   [ Dismiss ]
```

- **Snooze 10 min** → resets `timeSpentSeconds = 0`, dismisses overlay
- **Dismiss** → closes overlay, timer continues from current value

Time spent is reported to the background worker via `UPDATE_STATS` and synced to MongoDB.

---

### 6. 📊 Analytics Dashboard

A **Next.js 14 Server Components** dashboard that pulls real data from MongoDB and displays it in a clean dark UI.

**Data source:** `GET http://localhost:3001/api/user?userId=demo` (revalidated every 10 seconds via Next.js ISR)

| Widget | Data Source | Description |
|---|---|---|
| **Time Saved** | `dailyStats[today].timeSpent` | Formatted as `Xh Ym Zs` |
| **Clickbait Filtered** | `dailyStats[today].filtered` | Count of videos blurred today |
| **Toxic Posts Blocked** | `user.toxicBlocked` | Cumulative blocked tweets |
| **Weekly Usage Chart** | `dailyStats[]` (last 7 entries) | Recharts `BarChart` |
| **Recent Activity Feed** | `dailyStats[]` sorted by date | Auto-refreshes every 30 seconds |

The dashboard reflects **real extension activity** — every time the background worker syncs a delta to the backend, MongoDB is updated and the dashboard picks it up within 10 seconds.

---

### 7. 🎛️ Extension Popup Controls

A React-powered popup (340×480px) provides full control over all features:

| Control | Type | Default | Description |
|---|---|---|---|
| 🚨 Clickbait Filter | Toggle | ✅ On | YouTube heuristic scoring |
| ⏱️ Doomscroll Timer | Toggle | ✅ On | Time limit overlay |
| 🤖 AI Summarize | Toggle | ✅ On | Hover tooltip summaries |
| ☣️ Toxic Filter | Toggle | ✅ On | Twitter ML + LLM analysis |
| Time Limit Slider | 5–120 min | 30 min | Doomscroll threshold |

Settings are saved to `chrome.storage.sync` — they persist across browser restarts and sync across Chrome profiles. A **"✓ Saved"** badge appears briefly after any change.

---

## 🛠 Tech Stack

### Chrome Extension
| | Technology | Purpose |
|---|---|---|
| 📋 | Manifest V3 | Modern Chrome extension standard |
| ⚛️ | React 18 + TypeScript | Popup UI |
| ⚡ | Vite | Popup build tool |
| 🟨 | Vanilla JavaScript (IIFE) | Content scripts (youtube.js, twitter.js) |
| 🔧 | Service Worker | Background message routing |
| 💾 | `chrome.storage.sync/local` | Settings + stats persistence |
| ⏰ | `chrome.alarms` | Daily stats reset |

### Node.js Backend
| | Technology | Purpose |
|---|---|---|
| 🟢 | Node.js + TypeScript | Runtime + type safety |
| 🚂 | Express.js 4 | HTTP server + routing |
| 🤖 | `groq-sdk` | Groq LLM integration |
| 🍃 | Mongoose 8 | MongoDB ODM |
| 🔒 | `dotenv` + `cors` | Config + security |

### Python ML Service
| | Technology | Purpose |
|---|---|---|
| 🐍 | Python 3.9+ | Runtime |
| ⚡ | FastAPI | High-performance API framework |
| 📊 | scikit-learn | TF-IDF + Logistic Regression |
| 🐼 | pandas | Data loading + preprocessing |
| 💾 | joblib | Model serialisation |
| 🌐 | uvicorn | ASGI server |

### Dashboard
| | Technology | Purpose |
|---|---|---|
| ▲ | Next.js 14 (App Router) | React framework + SSR |
| 📘 | TypeScript | Type safety |
| 🎨 | Tailwind CSS 3 | Utility-first styling |
| 📈 | Recharts 2 | Weekly usage bar chart |

---

## 📁 Project Structure

```
feedguard-ai/                         ← Main repository
│
├── extension/                        ← Chrome Extension (load unpacked from here)
│   ├── manifest.json                 ← MV3 manifest, permissions, host_permissions
│   ├── background.js                 ← Service worker: message router, stats sync
│   ├── content/
│   │   ├── youtube.js                ← Clickbait engine, hover tooltips, doomscroll
│   │   └── twitter.js                ← Heuristics, ML pipeline, LLM escalation
│   ├── popup/                        ← Compiled popup (output of popup-src build)
│   └── icons/                        ← 16px, 48px, 128px extension icons
│
├── popup-src/                        ← React source for the popup
│   └── src/
│       ├── App.tsx                   ← Root: loads settings/stats, renders controls
│       ├── components/
│       │   ├── Toggle.tsx            ← Feature toggle row component
│       │   ├── Timer.tsx             ← Time limit slider
│       │   └── Stats.tsx             ← Today's stats display
│       ├── index.css                 ← CSS variables & animation keyframes
│       └── main.tsx                  ← Vite entry point
│
├── backend/                          ← Node.js + Express API
│   ├── src/
│   │   ├── index.ts                  ← App bootstrap, MongoDB connection, port config
│   │   ├── lib/
│   │   │   └── groq.ts               ← Groq SDK client, generateSummary(), analyzeContent()
│   │   ├── controllers/
│   │   │   ├── analyzeController.ts  ← Handles POST /api/analyze
│   │   │   ├── summarizeController.ts← Handles POST /api/summarize
│   │   │   └── userController.ts     ← Handles GET/POST /api/user
│   │   ├── services/
│   │   │   ├── analyzeService.ts     ← Calls groq.analyzeContent()
│   │   │   ├── summarizeService.ts   ← Calls groq.generateSummary()
│   │   │   └── userService.ts        ← MongoDB upsert + fetch logic
│   │   ├── models/
│   │   │   └── User.ts               ← Mongoose schema: userId, videosFiltered, dailyStats[]
│   │   ├── routes/
│   │   │   ├── analyze.ts
│   │   │   ├── summarize.ts
│   │   │   ├── spam.ts               ← Proxies to Python :8000/predict
│   │   │   └── user.ts
│   │   └── middleware/
│   │       └── corsconfig.ts
│   ├── .env.example
│   └── package.json
│
├── dashboard/                        ← Next.js 14 analytics dashboard
│   └── app/
│       ├── layout.tsx                ← Root layout with Navbar
│       ├── page.tsx                  ← Server Component: fetches & renders stats
│       └── components/
│           ├── Navbar.tsx
│           ├── StatCard.tsx          ← KPI metric tile
│           ├── UsageChart.tsx        ← Recharts weekly bar chart
│           └── RecentActivity.tsx    ← Live activity feed (30s polling)
│
└── README.md

─────────────────────────────────────────────
ml-service/                           ← Python ML Spam Classifier (separate folder)
├── train.py                          ← TF-IDF + Logistic Regression training script
├── main.py                           ← FastAPI server exposing POST /predict
├── spam_model.pkl                    ← Serialised trained model (joblib)
├── vectorizer.pkl                    ← Serialised TF-IDF vectorizer (joblib)
└── requirements.txt                  ← pandas, scikit-learn, fastapi, uvicorn, joblib
```

---

## 🚀 Getting Started

You need **4 things running** simultaneously for the full feature set:

| Service | Port | Tech | Command |
|---|---|---|---|
| Python ML Service | `:8000` | FastAPI | `uvicorn main:app --reload` |
| Node Backend | `:3001` | Express | `npm run dev` |
| Next.js Dashboard | `:3000` | Next.js | `npm run dev` |
| Chrome Extension | — | MV3 | Load unpacked in Chrome |

---

### Step 1 — Train & Start the Python ML Service

```bash
cd ml-service

# Install dependencies
pip install -r requirements.txt

# Train the model (creates spam_model.pkl and vectorizer.pkl)
python train.py

# Start the API server
uvicorn main:app --reload --port 8000
```

Verify it's running:
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "Congratulations! You have won a free iPhone!"}'

# Expected: {"label":"SPAM","confidence":98.1,"message":"..."}
```

---

### Step 2 — Start the Node.js Backend

```bash
cd backend

# Copy and fill in environment variables
cp .env.example .env

npm install
npm run dev
```

Verify:
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

### Step 3 — Start the Next.js Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### Step 4 — Build & Load the Extension

```bash
# Build the React popup
cd popup-src
npm install
npm run build
# This outputs compiled files into extension/popup/
```

Load into Chrome:
1. Navigate to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder
5. The 🛡️ FeedGuard icon appears in your toolbar

---

## ⚙️ Environment Variables

Create `backend/.env` from the example:

```env
# ─── FeedGuard AI Backend ────────────────────────────────
# Copy this file to .env and fill in real values.

# Groq API key — free at https://console.groq.com/keys
GROQ_API_KEY=gsk_your_key_here

# MongoDB connection string (local or Atlas)
MONGODB_URI=mongodb://localhost:27017/feedguard

# Server port
PORT=3001
```

---

## 📡 API Reference

All Node.js endpoints are at `http://localhost:3001`.

### `POST /api/summarize`
Generate a 2-sentence AI summary for a YouTube video.
```json
// Request
{ "title": "10 Things You Won't Believe About Space", "description": "" }

// Response
{ "summary": "This video explores surprising and counterintuitive facts about outer space. It covers topics ranging from black holes to the scale of the universe." }
```

---

### `POST /api/analyze`
Classify a tweet/post for toxicity, rage-bait, and clickbait using Groq LLM.
```json
// Request
{ "text": "This is why I can't stand people who think like this" }

// Response
{
  "toxic": false,
  "ragebait": true,
  "clickbait": false,
  "reason": "Post is vague and designed to provoke group-vs-group outrage."
}
```

---

### `POST /api/spam`
Proxy to the Python ML classifier — returns a spam prediction.
```json
// Request
{ "text": "WINNER!! Click here to claim your £500 reward NOW" }

// Response
{ "label": "SPAM", "confidence": 98.3, "message": "WINNER!! Click here..." }
```

---

### `POST /api/user`
Upsert a user's stats — called automatically by the background service worker.
```json
// Request
{
  "userId": "demo",
  "videosFiltered": 3,
  "toxicBlocked": 1,
  "timeSpent": 300
}

// Response
{ "success": true, "user": { ... } }
```

---

### `GET /api/user?userId=demo`
Fetch a user's complete stats and daily history.
```json
// Response
{
  "user": {
    "userId": "demo",
    "videosFiltered": 47,
    "toxicBlocked": 12,
    "timeSpent": 43200,
    "dailyStats": [
      { "date": "2026-06-22", "timeSpent": 1800, "filtered": 5 },
      { "date": "2026-06-21", "timeSpent": 2400, "filtered": 8 }
    ],
    "createdAt": "2026-06-01T00:00:00.000Z",
    "updatedAt": "2026-06-22T17:00:00.000Z"
  }
}
```

---

### `GET /api/health`
```json
{ "status": "ok", "timestamp": "2026-06-22T17:00:00.000Z" }
```

---

### `GET /` _(Python ML Service)_
```json
{ "message": "Spam Detector API is running" }
```

---

### `POST /predict` _(Python ML Service)_
```json
// Request
{ "text": "Free entry in 2 a wkly comp to win FA Cup final tkts!" }

// Response
{ "label": "SPAM", "confidence": 98.1, "message": "Free entry..." }
```

---

## 🔬 The ML Model — How It Was Built

### Why TF-IDF + Logistic Regression?

**TF-IDF (Term Frequency-Inverse Document Frequency)** converts raw text into a numerical feature matrix. It weighs words that appear frequently in a specific message but rarely across all messages — making it excellent at picking up spam-specific vocabulary ("prize", "winner", "free entry", "claim now").

Adding **bigrams** (`ngram_range=(1,2)`) captures two-word patterns like "free entry", "click here", and "you won" — phrases that are far more indicative of spam than individual words alone.

**Logistic Regression** is chosen over more complex models because:
- It's fully interpretable — you can inspect which TF-IDF features drive spam predictions
- It converges reliably on text classification tasks of this size
- `predict_proba()` gives calibrated confidence scores (not just a 0/1 label)
- Inference time is sub-millisecond — critical for real-time extension use

### The Training Data

The **SMS Spam Collection Dataset** contains 5,572 SMS messages labelled as `ham` (legitimate) or `spam`. It's a standard NLP benchmark dataset that captures the vocabulary, punctuation patterns, and urgency-language typical of spam messages.

### Integration with FeedGuard

The trained model is serialised to disk using `joblib`:
```
spam_model.pkl     ← The trained LogisticRegression object
vectorizer.pkl     ← The fitted TfidfVectorizer object
```

When FastAPI starts, it loads both files into memory once. Every `/predict` call reuses the same in-memory objects — no disk I/O per request.

---

## 🔄 Data Flow — End to End

### Clickbait Detection (YouTube)

```
YouTube loads a video card
        ↓
content/youtube.js sees DOM mutation (MutationObserver)
        ↓
scoreClickbait(title) runs locally
        ↓ score ≥ 30
injectClickbaitBadge(card, score, reasons)
        ↓ score ≥ 70
applyBlurToCard(card, score)
        ↓ score ≥ 60
chrome.runtime.sendMessage({ type: 'UPDATE_STATS', payload: { videosFiltered: 1 } })
        ↓
background.js merges delta into chrome.storage.local
        ↓
background.js POSTs delta to /api/user → MongoDB upsert
        ↓
Dashboard picks up new stats within 10 seconds
```

---

### Tweet Analysis (X/Twitter)

```
New tweet appears in DOM
        ↓
content/twitter.js MutationObserver fires
        ↓
analyzeTweet(article) called
        ↓
Check analysisCache (Map) — if cached, use result immediately
        ↓ not cached
quickHeuristicCheck(text) — local keyword scan
        ↓ flagged
chrome.runtime.sendMessage({ type: 'CHECK_SPAM' })
        ↓
background.js → POST /api/spam → Python FastAPI :8000/predict
        ↓
TF-IDF transform → LogisticRegression.predict_proba()
        ↓ label === 'SPAM'
injectWarningBadge(article, spamResult) ← done, no LLM needed
        ↓ label === 'HAM' but heuristic was triggered
chrome.runtime.sendMessage({ type: 'ANALYZE_TWEET' })
        ↓
background.js → POST /api/analyze → Groq LLM
        ↓
{ toxic, ragebait, clickbait, reason }
        ↓ toxic || ragebait === true
injectWarningBadge(article, result)
        ↓
chrome.runtime.sendMessage({ type: 'UPDATE_STATS', payload: { toxicBlocked: 1 } })
        ↓
MongoDB updated → Dashboard reflects within 10s
```

---

<div align="center">

Built with ❤️ to make the internet a calmer, more intentional place.

**🛡️ FeedGuard AI — Your feed, your rules. Your mind, protected.**

</div>
