# Signal Stack — Local Development & Deployment Setup Guide

Welcome to **Signal Stack**, an autonomous Company Intelligence & Executive Briefing Engine. This guide provides comprehensive, step-by-step instructions to set up, run, seed, and verify the entire application locally or in production.

---

## 1. System Prerequisites

Ensure you have the following installed on your machine:

| Component | Minimum Version | Recommended Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Python** | 3.11+ | 3.12.x | Backend API, Crawling & Intelligence Engine |
| **Node.js** | 18.17+ | 20.x LTS | Next.js 14 Frontend Application |
| **npm** / **pnpm** | 9.x+ | 10.x | Frontend Package Manager |
| **Git** | 2.40+ | Latest | Version Control |
| **Ollama** *(Optional)* | 0.3+ | Latest | Local LLM inference (`llama3.2` / `mistral`) |

> [!NOTE]
> **Zero Cloud API Keys Required**: Signal Stack includes an integrated heuristic fallback engine. If local Ollama or cloud LLM keys are absent, the application runs 100% offline with zero external dependencies and zero cost.

---

## 2. Repository Cloning & Project Layout

```bash
git clone https://github.com/khrishChauhan/SIGNAL-STACK.git
cd SIGNAL-STACK
```

### Directory Structure Overview
```
SIGNAL-STACK/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/routes/      # REST API Endpoints (11 modules)
│   │   ├── core/            # Config, Security, Database engine, Logging
│   │   ├── models/          # 16 SQLAlchemy 2.0 Async Models
│   │   ├── schemas/         # Pydantic v2 Request/Response validation
│   │   ├── services/        # AI Agents, Crawlers, Ranking, RAG, Briefs
│   │   └── db/              # Migrations, Session management, Seed data
│   ├── tests/               # 23 Pytest Unit & Integration Tests
│   ├── scripts/             # End-to-end verification and audit scripts
│   └── requirements.txt     # Python backend dependencies
├── frontend/                 # Next.js 14 App Router Application
│   ├── app/                 # 14 App Router routes & pages
│   ├── components/          # Reusable UI & shadcn/ui components
│   ├── lib/                 # API client, TypeScript interfaces, Utils
│   └── package.json         # Frontend dependencies
├── docs/                     # Architectural specs, API, Schema, Guides
├── data/                     # Persistent SQLite DB and uploaded documents
└── README.md                 # Root documentation & quickstart
```

---

## 3. Backend Setup & Startup

### Step 3.1: Python Virtual Environment

Open a terminal in the project root:

```powershell
# Windows PowerShell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

### Step 3.2: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3.3: Environment Configuration

Copy the example environment configuration:

```powershell
cp ../.env.example ../.env
```

The default `.env` is pre-configured for instant zero-setup execution with SQLite:
```env
DATABASE_URL=sqlite+aiosqlite:///./data/signal_stack.db
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
SECRET_KEY=signal-stack-super-secret-key-change-in-production
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

### Step 3.4: Seed Database with Primary Demo Data

Populate the database with verified production data for **MeetUniversity**, **Postman**, and **Linear**:

```powershell
# From the project root with .venv active:
python -m backend.app.db.seed
```

This seeds:
- Primary Demo: **MeetUniversity** with 21 approved sources, 5 competitors, raw research, and verified briefs.
- Company 2: **Postman** (Developer Tools / API Platform).
- Company 3: **Linear** (Project Management SaaS).

### Step 3.5: Run Backend API Server

```powershell
# From the project root:
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

- API Base: `http://localhost:8000`
- Swagger Interactive Docs: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

---

## 4. Frontend Setup & Startup

Open a second terminal window in the project root:

```bash
cd frontend
npm install
```

### Run Frontend Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

### Key Pages Available:
- **Dashboard Overview**: `http://localhost:3000/overview`
- **Company Setup / Onboarding**: `http://localhost:3000/companies/new`
- **Company Intelligence Profile**: `http://localhost:3000/companies`
- **Adaptive 10-Question Interview**: `http://localhost:3000/interview`
- **Signal Stack Source Manager**: `http://localhost:3000/sources`
- **Intelligence Signal Feed**: `http://localhost:3000/signals`
- **Competitor Matrix**: `http://localhost:3000/competitors`
- **Monday Morning Intelligence Brief**: `http://localhost:3000/briefs`
- **Internal Documents & RAG**: `http://localhost:3000/documents`
- **Automation & Scheduled Workflows**: `http://localhost:3000/automation`

---

## 5. Verification & Testing

### Run Backend Unit & Integration Tests
```powershell
# From project root with .venv active:
pytest backend/tests -v
```
All 23 tests should pass with green status.

### Run Phase 6 End-to-End Audit & Assignment Validation
```powershell
python backend/scripts/run_phase6_audit.py
```
This comprehensive script tests:
1. Primary demonstration on **MeetUniversity** (>= 20 approved sources, 5 competitors, real crawling, ranking, and 10-section brief).
2. Reusability across **MeetUniversity**, **Postman**, and **Linear** (>= 30 intelligence records).
3. Dynamic context shift audit for **Linear** (Enterprise Compliance).
4. APScheduler background engine execution.
5. SQL injection immunity and file upload validation.

### Verify Production Frontend Build
```bash
cd frontend
npm run build
```
Builds all 14 routes statically with 0 errors.

---

## 6. Optional: Local Ollama Setup

If you wish to use local LLM inference rather than the built-in fallback engine:

1. Download Ollama from [ollama.com](https://ollama.com).
2. Start Ollama and pull the lightweight Llama 3.2 model:
   ```bash
   ollama pull llama3.2
   ```
3. Signal Stack will automatically detect `http://localhost:11434` and use it for question generation, claim extraction, and executive brief synthesis.
