# YELLOVERSE — AI Caption Studio

> **YOUR POSTER. OUR WORDS. SEMMA CAPTION.**

A complete, functional AI-powered caption-writing studio for student clubs, technical communities, hackathons, and creators. Generates platform-tailored Instagram, WhatsApp, and LinkedIn captions in authentic **Tanglish** (natural Tamil written in Latin script + English), grounded directly in your own reference caption dataset.

Powered by **Groq** high-speed inference via the official `@groq/groq-sdk`.

---

## ⚡ Key Highlights

- **AI Provider**: Groq SDK (`groq-sdk`) using your `GROQ_API_KEY` and configurable `GROQ_MODEL` (default: `qwen/qwen3.8-27b`).
- **Authentic Tanglish**: Conversational Chennai student-creator tone ("makkale", "semma", "vaanga", "spot-ah lock pannunga"), never awkward robot translations.
- **Reference RAG Library**: 20 pre-seeded authentic community captions + full search, filtering, and dataset import (JSON, CSV, TXT, Markdown).
- **Poster Understanding**: Vision analysis and OCR information extraction for event posters, filling confirmed facts into an editable form for user review.
- **Fact Conservation**: Guaranteed verbatim retention of dates, venues, registration URLs, ticket prices, and prize pools.
- **Conversational Refinement**: Session-backed interactive chat to tweak hooks, tone, or specific platform variants without rewriting unrelated sections.
- **Neo-Brutalist UI**: Bold 2–3px black borders, hard non-blurred offset shadows, vivid Yellove palette (`#FFD83D`), and crisp typography.

---

## 🚀 Quick Setup & Running

### 1. Prerequisites
- **Node.js** v18+ or v24+
- A free or existing **Groq API key** from [console.groq.com/keys](https://console.groq.com/keys)

### 2. Environment Configuration
Create or edit `.env` in the project root:

```env
# Groq API Key
GROQ_API_KEY=gsk_your_actual_key_here

# Groq Model (default supports fast Tanglish generation & vision)
GROQ_MODEL=qwen/qwen3.8-27b

# Server port and parameters
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/yelloverse.db
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Both Backend & Frontend
```bash
npm run dev
```

Or run them in separate terminals:
```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **Health Endpoint**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check returning Groq connectivity, active model status, and DB counts |
| `POST` | `/api/captions/generate` | Generates distinct platform captions (Instagram, WhatsApp, LinkedIn) using reference RAG |
| `POST` | `/api/captions/refine` | Chat-driven conversational refinement with session context and history |
| `POST` | `/api/poster/analyze` | Extracts event details from uploaded poster images (Vision + OCR fallback) |
| `GET` | `/api/references` | Search and filter reference captions |
| `GET` | `/api/references/stats` | Aggregated statistics by platform, tone, and post type |
| `POST` | `/api/references/import` | Import new reference captions from JSON, CSV, or raw text |
| `PATCH` | `/api/references/:id` | Update a reference example |
| `DELETE` | `/api/references/:id` | Delete a reference example |

---

## 🎨 Design System

- **Primary Yellow**: `#FFD83D`
- **Secondary Yellow**: `#FFF08A`
- **Pale Yellow**: `#FFF8D6`
- **Warm Background**: `#FFFDF5`
- **Ink Black**: `#171717`
- **Accent Orange**: `#FF8A35`

*Built for student communities and creator clubs. Semma captions only. 🟡*
