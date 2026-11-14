# Signal Stack — Company Intelligence & Executive Briefing Engine

Signal Stack is an autonomous, evidence-backed intelligence engine designed for startup founders and executive leadership. It researches any company domain, executes an adaptive 10-question strategic calibration interview, builds a customized intelligence stack across customers, competitors, and markets, conducts real website crawling, and synthesizes an actionable **Monday Morning Intelligence Brief**.

---

## Architecture & Technology Stack

- **Backend**: FastAPI (Python 3.12+), SQLAlchemy 2.0 (Async), Pydantic v2
- **Database**: SQLite (local development with zero setup) & PostgreSQL (production)
- **AI Engine**: Ollama local models (`llama3.2`) with structured JSON, retry/timeout resilience, and a deterministic offline fallback engine
- **Crawler & NLP**: HTTPX (async client), BeautifulSoup4, Trafilatura, Feedparser, DuckDuckGo Search (`ddgs`)
- **Document Processing (RAG)**: PyMuPDF (`pymupdf`), python-docx, Pandas, openpyxl, ChromaDB
- **Automation & Scheduling**: APScheduler (`AsyncIOScheduler`) with configurable days, times, timezones, and job history logging
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide icons, Recharts

---

## Directory Structure

```
SIGNAL STACK/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application initialization & APScheduler lifecycle
│   │   ├── core/                      # Configuration, logging, custom errors
│   │   ├── db/                        # Async sessionmaker, base, schema initialization & seeding
│   │   ├── models/                    # 16 SQLAlchemy 2.0 relational models
│   │   ├── schemas/                   # Pydantic v2 request/response models
│   │   ├── services/                  # Domain services (crawling, interview, brief, health audit, scheduler)
│   │   │   └── ai/                    # Multi-provider AI abstraction layer (Ollama / Fallback)
│   │   └── api/                       # REST API router & endpoint handlers
│   ├── tests/                         # Pytest test suite (23 unit & integration tests)
│   ├── data/                          # SQLite database, uploaded files, ChromaDB vector store
│   ├── requirements.txt               # Backend Python dependencies
│   ├── Dockerfile                     # Production container spec
│   └── run.py                         # Local development server startup script
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js 14 App Router pages & layouts
│   │   │   ├── page.tsx               # 1. Executive Dashboard Overview (Recharts metrics)
│   │   │   ├── intelligence/company/  # 2. Company Intelligence Profile & grounding
│   │   │   ├── interview/             # 3. Adaptive 10-Question Strategic Calibration
│   │   │   ├── sources/stack/         # 4. Signal Stack Curation (4 pillars)
│   │   │   ├── signals/               # 5. Chronological Intelligence Feed & Evidence Drawer
│   │   │   ├── competitors/           # 6. Competitor Tracking Matrix
│   │   │   ├── briefs/                # 7. Monday Morning Intelligence Brief (10 Sections, Print/MD Export)
│   │   │   ├── documents/             # 8. Internal Knowledge Repository (ChromaDB Vector Store)
│   │   │   ├── sources/               # 9. Granular Source Manager & Latency Telemetry
│   │   │   ├── automation/            # 10. Autonomous Workflows, Schedules & Source Health Audits
│   │   │   └── settings/              # 11. Entity & Engine Settings
│   │   ├── components/                # Reusable UI components, Sidebar, TopNavbar, Modals
│   │   ├── context/                   # CompanyContext (multi-tenant organization switcher)
│   │   ├── lib/                       # Typed API client with rewrites proxy
│   │   └── types/                     # TypeScript API schemas
│   ├── package.json                   # React 18, Tailwind, Lucide, Recharts, TanStack Query
│   └── Dockerfile                     # Production Next.js container spec
├── docker-compose.yml                 # Dual-container orchestration (FastAPI + Next.js)
├── docs/                              # Architectural blueprints & specifications
├── pytest.ini                         # Pytest configuration
└── README.md
```

---

## Quickstart Setup Instructions

### Option A: Run via Docker Compose (Recommended)
```powershell
docker-compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Run Locally (Development)

#### 1. Backend Setup
```powershell
# Navigate to project root
cd "SIGNAL STACK"

# Create Python virtual environment
py -3.12 -m venv backend/.venv

# Activate virtual environment
.\backend\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI server on port 8000
python backend/run.py
```
Backend API will be active at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

#### 2. Frontend Setup
In a separate terminal:
```powershell
# Navigate to frontend directory
cd "SIGNAL STACK/frontend"

# Install Node dependencies
npm install

# Start Next.js development server on port 3000
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. All API requests are automatically proxied to the backend at `http://localhost:8000`.
The server will automatically initialize SQLite database tables on startup at `backend/data/signal_stack.db`.
- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **API Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## Running the Automated Test Suite

The test suite exercises all 16 database models, API endpoints, AI providers, crawler services, brief generation, and the full Phase 3 Intelligence Engine (agents, vector RAG retrieval, deduplication, revision tracking, and ranking).

```powershell
# Run all pytest tests
$env:PYTHONPATH="."
.\backend\.venv\Scripts\pytest.exe -v backend\tests
```

All 18 test suites pass cleanly:
```
backend/tests/test_ai_provider.py::test_ollama_provider_health_check_offline PASSED
backend/tests/test_ai_provider.py::test_ollama_provider_raises_error_when_offline PASSED
backend/tests/test_ai_provider.py::test_fallback_provider_deterministic_operations PASSED
backend/tests/test_briefs.py::test_monday_morning_brief_generation PASSED
backend/tests/test_companies.py::test_company_creation_and_lifecycle PASSED
backend/tests/test_crawling.py::test_crawl_trigger_and_history PASSED
backend/tests/test_database.py::test_database_crud_operations PASSED
backend/tests/test_documents.py::test_file_upload_validation_and_listing PASSED
backend/tests/test_intelligence.py::test_signal_creation_and_evidence PASSED
backend/tests/test_intelligence_engine.py::test_company_research_agent_structure_and_separation PASSED
backend/tests/test_intelligence_engine.py::test_adaptive_interview_agent_context_and_weight_synthesis PASSED
backend/tests/test_intelligence_engine.py::test_source_discovery_agent_meetuniversity_20_sources PASSED
backend/tests/test_intelligence_engine.py::test_competitor_discovery_agent_dynamic_identification PASSED
backend/tests/test_intelligence_engine.py::test_signal_ranking_engine_transparent_formula PASSED
backend/tests/test_intelligence_engine.py::test_rag_engine_chunking_and_vector_retrieval PASSED
backend/tests/test_intelligence_engine.py::test_crawling_engine_revision_tracking_and_deduplication PASSED
backend/tests/test_interviews.py::test_adaptive_interview_workflow PASSED
backend/tests/test_sources.py::test_source_management_and_discovery PASSED
======================= 18 passed in 26.08s =======================
```

---

## Phase 3 Intelligence Engine Components

1. **CompanyResearchAgent** ([`backend/app/services/research_agent.py`](file:///k:/code/SIGNAL%20STACK/backend/app/services/research_agent.py)): Multi-page domain crawling (`/`, `/about`, `/products`, `/pricing`), identifying verified facts with verifiable evidence URLs and quotes, strictly separating empirical observations from AI strategic deductions and unknown information.
2. **AdaptiveInterviewAgent** ([`backend/app/services/interview_agent.py`](file:///k:/code/SIGNAL%20STACK/backend/app/services/interview_agent.py)): 10-topic sequential strategic interview with full memory of prior answers, dynamic follow-ups, and synthesis of normalized priority weights.
3. **SourceDiscoveryAgent** ([`backend/app/services/source_discovery_agent.py`](file:///k:/code/SIGNAL%20STACK/backend/app/services/source_discovery_agent.py)): Discovers 20+ sources for MeetUniversity across `CUSTOMER` (Reddit r/Indians_StudyAbroad, Yocket, Trustpilot), `COMPETITOR` (LeapScholar, Leverage Edu, IDP), `MARKET` (The PIE News, THE, UKVI, IRCC, NAFSA), and `INTERNAL`. Enforces approval status as `DISCOVERED` (never auto-approved).
4. **CompetitorDiscoveryAgent** ([`backend/app/services/competitor_discovery_agent.py`](file:///k:/code/SIGNAL%20STACK/backend/app/services/competitor_discovery_agent.py)): Dynamically searches DuckDuckGo for 5–10 direct rivals, indirect substitutes, and emerging competitors with relevance explanations.
5. **WebCrawlingEngine** ([`backend/app/services/crawling_engine.py`](file:///k:/code/SIGNAL%20STACK/backend/app/services/crawling_engine.py)): Respects `robots.txt`, enforces min 1.5s per-domain rate limits, extracts clean text via Trafilatura, detects revisions (`version`, `has_changed`, `previous_hash`), and stores authentic publication dates without fabrication.
6. **SignalRankingEngine** ([`backend/app/services/signal_ranking_engine.py`](file:///k:/code/SIGNAL%20STACK/backend/app/services/signal_ranking_engine.py)): Transparent, multi-factor scoring formula maintaining separate scores for source reliability, evidence strength, strategic relevance, and composite ranking, complete with human-readable rationale.
7. **IntelligenceAnalysisAgent** ([`backend/app/services/intelligence_analysis_agent.py`](file:///k:/code/SIGNAL%20STACK/backend/app/services/intelligence_analysis_agent.py)): Extracts concrete `what_happened`, verbatim quote evidence, business impact, urgency, opportunity/threat classification, affected business area, and executive action recommendations.
8. **RAGEngine** ([`backend/app/services/rag_engine.py`](file:///k:/code/SIGNAL%20STACK/backend/app/services/rag_engine.py)): ChromaDB persistent vector database with chunking, semantic retrieval, and citation injection into Monday Morning Briefings.

---

## AI Provider Configuration

Signal Stack guarantees that **no paid API is ever required**:
1. **Ollama (Local Default)**:
   - Ensure Ollama is running (`http://localhost:11434`).
   - Pull the default model: `ollama pull llama3.2`.
   - Set `AI_PROVIDER="ollama"` in `.env`.
   - If the model is not found, the system explicitly alerts you with `AIModelNotFoundError` rather than silently fabricating mock results.
2. **Deterministic Fallback Engine (Offline / Testing)**:
   - Set `AI_PROVIDER="fallback"` in `.env`.
   - Uses zero-hallucination, deterministic NLP and structured templates for 100% offline development and instant CI/CD testing.

---

## API Endpoints Overview

| Category | Endpoint | Method | Description |
| :--- | :--- | :---: | :--- |
| **Company** | `/api/companies` | POST | Register target company |
| | `/api/companies` | GET | List companies with pagination |
| | `/api/companies/{id}` | GET | Get company details |
| | `/api/companies/{id}` | PUT | Update company |
| **Research** | `/api/companies/{id}/research` | POST | Execute domain crawl & AI profile synthesis |
| | `/api/companies/{id}/research` | GET | Retrieve company research profile |
| **Interview** | `/api/companies/{id}/interview/start` | POST | Start adaptive 10-question interview |
| | `/api/interviews/{id}` | GET | Get interview transcript & progress |
| | `/api/interviews/{id}/answer` | POST | Submit answer & adapt next question |
| | `/api/interviews/{id}/skip` | POST | Skip current interview question |
| | `/api/interviews/{id}/profile` | PUT | Update calibrated strategic weights |
| **Sources** | `/api/companies/{id}/sources` | GET | List sources in company's Signal Stack |
| | `/api/companies/{id}/sources` | POST | Add custom source |
| | `/api/sources/{id}` | PUT | Update source parameters |
| | `/api/sources/{id}` | DELETE | Remove source |
| | `/api/companies/{id}/sources/discover` | POST | Auto-discover 15-30 curated sources |
| **Monitoring** | `/api/companies/{id}/crawl` | POST | Execute real-time crawl across sources |
| | `/api/companies/{id}/crawl-history` | GET | View historical crawl jobs |
| **Intelligence** | `/api/companies/{id}/signals` | GET | Filter & list ranked intelligence signals |
| | `/api/signals/{id}` | GET | Get signal details with verifiable evidence |
| | `/api/companies/{id}/analyse` | POST | Analyze crawled documents into signals |
| **Briefs** | `/api/companies/{id}/briefs/generate` | POST | Synthesize Monday Morning Brief |
| | `/api/companies/{id}/briefs` | GET | List historical weekly briefs |
| | `/api/briefs/{id}` | GET | Retrieve full brief & action items |
| **Documents** | `/api/companies/{id}/documents/upload` | POST | Upload PDF/DOCX/CSV/XLSX for RAG |
| | `/api/companies/{id}/documents` | GET | List internal uploaded documents |
| **Schedules** | `/api/companies/{id}/schedules` | GET | List active cron schedules |
| | `/api/companies/{id}/schedules` | POST | Create automated monitoring schedule |
| | `/api/companies/{id}/source-audit` | POST | Run latency & health audit on sources |
| **System** | `/api/health` | GET | Service health ping |
| | `/api/ai/health` | GET | Active AI provider status check |
