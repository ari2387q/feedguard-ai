<div align="center">

<img src="https://img.shields.io/badge/-FeedGuard%20AI%20v2-6366f1?style=for-the-badge&logo=googlechrome&logoColor=white" alt="FeedGuard AI v2"/>

# 🛡️ FeedGuard AI v2

### *Reclaim your Twitter feed. Protect your mind.*

FeedGuard AI v2 is a next-generation browser extension and full-stack ecosystem focused on silently guarding your X (Twitter) feed in real time. It detects toxic content and rage bait to protect you from engagement-farming algorithms. Backed by a powerful **Tri-Layer Intelligence Stack**: **Local Heuristics → Custom Logistic Regression ML Model → Groq LLM**.

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

> **Demo Video Placeholder**  
> ![Demo Video](/path/to/demo_video_placeholder.mp4)  
> *Watch FeedGuard AI v2 in action.*

---

## 📖 Table of Contents

- [What Is FeedGuard AI v2?](#-what-is-feedguard-ai-v2)
- [The Tri-Layer Intelligence Stack](#-the-tri-layer-intelligence-stack)
- [Full System Architecture](#-full-system-architecture)
- [Feature Deep-Dive](#-feature-deep-dive)
  - [1. Toxic Content & Rage Bait Filter — X/Twitter](#1--toxic-content--rage-bait-filter--xtwitter)
  - [2. ML Spam Classifier — Python Service](#2--ml-spam-classifier--python-service)
  - [3. Analytics Dashboard](#3--analytics-dashboard)
  - [4. Extension Popup Controls](#4--extension-popup-controls)
- [Future Scope (YouTube Integration)](#-future-scope-youtube-integration)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#️-environment-variables)
- [API Reference](#-api-reference)
- [The ML Model — How It Was Built](#-the-ml-model--how-it-was-built)
- [Data Flow — End to End](#-data-flow--end-to-end)

---

## 🌟 What Is FeedGuard AI v2?

Modern social media platforms are engineered to maximise engagement at any cost — outrage-inducing posts and infinite scroll designed to trap you. **FeedGuard AI v2** fights back.

It is a comprehensive **Chrome browser extension** currently focused on **X (Twitter)**, operating silently in the background. Every tweet is analysed before it reaches your eyes. Instead of relying on a single slow or expensive technique, FeedGuard v2 uses a highly optimised **Tri-Layer Intelligence Stack**, combining rapid local processing with advanced machine learning and state-of-the-art LLMs.

Everything is **individually toggleable**, **privacy-respecting** (text is only sent to AI when strictly necessary), and backed by a **live Next.js analytics dashboard** to monitor exactly how much noise your feed has been producing.

---

> **Dashboard UI Placeholder**  
> ![Dashboard Analytics Dashboard](/path/to/dashboard_placeholder.png)  
> *Real-time telemetry dashboard.*

---

## 🧠 The Tri-Layer Intelligence Stack

FeedGuard v2 is fundamentally designed for low latency and high accuracy. It cascades through three distinct layers:

```mermaid
graph TD
    A[New Tweet Appears in Feed] --> B{Layer 1: Local Heuristics}
    B -- Clean --> C[Allow Tweet]
    B -- Suspicious --> D{Layer 2: ML Classifier}
    D -- Spam/Toxic --> E[Block/Blur Tweet]
    D -- Uncertain --> F{Layer 3: Groq LLM}
    F -- Clean --> C
    F -- Ragebait/Toxic --> E
```

- **Layer 1 — Heuristics (Zero latency, zero cost):** Runs 100% locally in the browser. 95% of content is evaluated instantly without any network overhead.
- **Layer 2 — ML Classifier (Fast, deterministic):** A custom-trained Logistic Regression model evaluates borderline cases efficiently.
- **Layer 3 — Groq LLM (Deep context):** Reserved exclusively for highly nuanced toxic/ragebait content that simpler methods miss, keeping API costs minimal.

---

## 🏗️ Full System Architecture

FeedGuard v2 is a full-stack monorepo consisting of 4 integrated services interacting seamlessly:

```text
╔══════════════════════════════════════════════════════════════════════╗
║                        Google Chrome Browser                         ║
║  ┌────────────────────────────────────────────────────────────────┐  ║
║  │                   Content Scripts (per tab)                    │  ║
║  │                        x.com / twitter.com                     │  ║
║  │                      ┌──────────────────┐                      │  ║
║  │                      │ • ML spam proxy  │                      │  ║
║  │                      │ • LLM analysis   │                      │  ║
║  │                      │ • Blur + reveal  │                      │  ║
║  │                      └────────┬─────────┘                      │  ║
║  └───────────────────────────────┼────────────────────────────────┘  ║
║                                  ▼                                   ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │   Background Service Worker (Message Router & Data Sync)     │    ║
║  └──────────────────────────────┬───────────────────────────────┘    ║
╚═════════════════════════════════│════════════════════════════════════╝
                                  │ HTTP (localhost:3001)
                                  ▼
╔══════════════════════════════════════════════════════════════════════╗
║              Node.js + Express + TypeScript Backend (:3001)          ║
║   POST /api/analyze    ──► Groq SDK ──► Groq LLM                     ║
║   POST /api/spam       ──► Proxies to Python ML Service              ║
║   GET/POST /api/user   ──► MongoDB Atlas (Stats & History)           ║
╚══════════════════════════════════════════════════════════════════│═══╝
                                                                   │ 
                                                                   ▼
╔══════════════════════════════════════════════════════════════════════╗
║            Python FastAPI ML Service (:8000)                         ║
║   POST /predict                                                      ║
║       text → TF-IDF Vectorizer → Logistic Regression Model          ║
║            → { label: "SPAM", confidence: 94.2 }                    ║
╚══════════════════════════════════════════════════════════════════════╝
```

*(Note: The Next.js Analytics Dashboard on `:3000` consumes the Node.js backend to display telemetry.)*

---

> **Extension Action Placeholder**  
> ![Browser Extension Popup](/path/to/popup_placeholder.png)  
> *The FeedGuard v2 Popup UI.*

---

## ✨ Feature Deep-Dive

### 1. ☣️ Toxic Content & Rage Bait Filter — X/Twitter

A three-stage progressive pipeline evaluating tweet text:

1. **Pre-Screen:** Instantly checks local keyword dictionaries (`TOXIC_KEYWORDS`, `RAGEBAIT_KEYWORDS`).
2. **ML Classifier:** Escalates suspicious tweets to the Python ML Service for high-speed spam detection.
3. **Groq LLM:** For nuanced posts, queries Groq for deep contextual analysis.
4. **Result:** Injects a dynamic warning banner (Toxic or Rage Bait) and blurs the text. Users can manually unblur.

### 2. 🤖 ML Spam Classifier — Python Service

A dedicated **FastAPI microservice** running a custom `scikit-learn` pipeline.

- **Training Data:** 5,572 messages from the SMS Spam Collection Dataset.
- **Algorithm:** TF-IDF Vectorizer + Logistic Regression.
- **Why LR?:** Fast, interpretable, and provides calibrated confidence probabilities (e.g. `98.3% SPAM`).

### 3. 📊 Analytics Dashboard

A stunning **Next.js 14 Server Components** dashboard pulling from MongoDB via ISR.
- Tracks `Time Saved` and `Toxic Posts Blocked`.
- Visualises weekly usage through beautiful Recharts bar charts.
- Provides a live, auto-refreshing activity feed.

### 4. 🎛️ Extension Popup Controls

The sleek React 18 popup UI acts as the command centre:
- Toggle individual filters (Toxic, Ragebait).
- Displays immediate daily stats.

---

## 🔮 Future Scope (YouTube Integration)

While v2 is currently heavily optimized for X (Twitter), we plan to introduce powerful YouTube-focused capabilities in future releases:

- **🚨 YouTube Clickbait Filter:** A client-side heuristic engine to instantly score thumbnails and blur misleading clickbait content.
- **🔍 AI Video Summariser:** Hover over any thumbnail for a brief period to generate a crisp 2-sentence summary powered by Groq LLM, preventing unnecessary clicks.
- **⏱️ Doomscroll Timer:** A background monitor for active tab focus with customizable limits to intervene via full-screen overlays when you've been watching for too long.

---

## 🛠 Tech Stack

| Domain | Technologies |
|---|---|
| **Extension** | Manifest V3, React 18, TypeScript, Vite, Vanilla JS (Content Scripts) |
| **Backend** | Node.js, Express.js 4, Mongoose 8, Groq SDK |
| **ML Service** | Python 3.9+, FastAPI, scikit-learn, pandas, joblib |
| **Dashboard** | Next.js 14 (App Router), Tailwind CSS 3, Recharts 2 |
| **Database** | MongoDB Atlas |

---

## 📁 Project Structure

```text
feedguard-ai/
├── extension/          ← Chrome Extension (Compiled manifest & scripts)
├── popup-src/          ← React source for the extension popup
├── backend/            ← Node.js + Express API (Mongoose & Groq integrations)
├── dashboard/          ← Next.js 14 analytics dashboard
├── ml-service/         ← Python FastAPI ML Classifier (Model training & API)
└── README.md
```

---

## 🚀 Getting Started

You need **4 things running** simultaneously for the full local experience:

### Step 1 — Python ML Service
```bash
cd ml-service
pip install -r requirements.txt
python train.py # Creates spam_model.pkl and vectorizer.pkl
uvicorn main:app --reload --port 8000
```

### Step 2 — Node.js Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Step 3 — Next.js Dashboard
```bash
cd dashboard
npm install
npm run dev
```

### Step 4 — Chrome Extension
```bash
cd popup-src
npm install
npm run build
```
Load the `extension/` folder in Chrome via `chrome://extensions/` with **Developer mode** enabled.

---

## ⚙️ Environment Variables

Create `backend/.env`:
```env
GROQ_API_KEY=gsk_your_key_here
MONGODB_URI=mongodb+srv://aryanthegoat345_db_user:OWlDEsvkq1PGQuJ0@feedguard-ai.rj4c0ex.mongodb.net/?appName=feedguard-ai
PORT=3001
```

---

## 📡 API Reference

- **`POST /api/analyze`** — Classifies tweet toxicity/ragebait via Groq.
- **`POST /api/spam`** — Proxies classification to Python ML service.
- **`GET /api/user?userId=demo`** — Fetches full stat history from MongoDB.
- **`POST /predict`** *(Port 8000)* — Directly predicts SPAM/HAM via scikit-learn model.
- **`POST /predict-toxic`** *(Port 8000)* — Directly predicts toxicity levels via custom ML model.

---

## 🔬 The ML Model — How It Was Built

**TF-IDF (Term Frequency-Inverse Document Frequency)** combined with bigrams (`ngram_range=(1,2)`) effectively transforms raw text into a powerful numerical matrix, weighing unique spam vocabulary heavily. 

**Logistic Regression** processes these features, chosen specifically for its minimal inference time, reliable convergence, and explainable feature weighting. Every `/predict` call leverages in-memory `joblib` objects to ensure sub-millisecond classification overhead.

---

## 🔄 Data Flow — End to End

1. **DOM Mutation:** `content.js` identifies a new tweet card.
2. **Local Processing:** Immediate keyword and heuristic evaluation.
3. **Escalation:** If flagged, `background.js` proxies the request to the Node.js API.
4. **AI Inference:** The API dispatches to the ML Service or Groq LLM.
5. **UI Update:** Warning badges and blurs are dynamically injected back into the DOM.
6. **Telemetry:** Stats (`toxicBlocked`) are asynchronously synced to MongoDB, instantly reflecting in the Next.js dashboard.

---

<div align="center">
Built with ❤️ to make the internet a calmer, more intentional place.

**🛡️ FeedGuard AI v2 — Your feed, your rules. Your mind, protected.**
</div>
