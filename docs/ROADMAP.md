# Signal Stack — Implementation Roadmap & Risk Mitigation Matrix

**Product**: Signal Stack  
**Lead**: Senior AI Engineer & Software Architect  
**Status**: Strategic Plan Approved for Execution  

---

## 1. Development Phases & Milestones

```mermaid
gantt
    title Signal Stack Development Phases
    dateFormat  YYYY-MM-DD
    section Foundations
    Phase 1: Architecture & Specs        :done,    p1, 2026-11-14, 1d
    section Backend Core
    Phase 2: DB & AI Abstraction Layer   :active,  p2, 2026-11-15, 2d
    Phase 3: Crawler & Extraction Engine :         p3, 2026-11-17, 2d
    section Intelligence Pipeline
    Phase 4: Adaptive Interview Engine   :         p4, 2026-11-19, 2d
    Phase 5: Source Discovery & Stack    :         p5, 2026-11-21, 2d
    Phase 6: Internal Ingestion & RAG    :         p6, 2026-11-23, 2d
    Phase 7: Ranking & Brief Generator   :         p7, 2026-11-25, 2d
    section Frontend & Automation
    Phase 8: Next.js Executive UI        :         p8, 2026-11-27, 3d
    Phase 9: Background Scheduler        :         p9, 2026-11-30, 1d
    section Validation
    Phase 10: 3-Company E2E Verification :         p10, 2026-12-01, 2d
```

---

## 2. Phase-by-Phase Technical Breakdown

### Phase 1: Architecture, Schemas & Development Foundations (Status: COMPLETE)
- **Objectives**: Define complete system architecture, database ERD, RESTful API endpoints, engineering principles, and requirement-to-code traceability.
- **Key Deliverables**:
  - `docs/architecture.md`
  - `docs/database-schema.md`
  - `docs/api-design.md`
  - `docs/ROADMAP.md`
  - `docs/requirements-tracking.md`
- **Exit Gate**: User review and architectural sign-off.

---

### Phase 2: Backend Core Services & Multi-Provider AI Abstraction
- **Objectives**: Establish the FastAPI backend structure, SQLAlchemy ORM models, SQLite/Postgres dual-engine configuration, and the resilient AI Provider Abstraction.
- **Key Deliverables**:
  - `backend/app/main.py`: FastAPI application entrypoint with CORS, error handling middleware, and routers.
  - `backend/app/core/config.py`: Environment configuration via Pydantic Settings.
  - `backend/app/db/session.py` & `backend/app/db/base.py`: Async engine, sessionmaker, and declarative base.
  - `backend/app/models/`: SQLAlchemy 2.0 models for all 12 tables.
  - `backend/app/services/ai_provider/`:
    - `base.py`: Abstract `AIProvider` base class.
    - `ollama_provider.py`: Local LLM connector (`http://localhost:11434`, llama3.2/mistral).
    - `groq_provider.py`: Free cloud LLM connector (Llama-3.3-70b via Groq free tier).
    - `gemini_provider.py`: Google Gemini 1.5 Flash free tier connector.
    - `heuristic_provider.py`: Deterministic zero-key fallback engine (regex, NLP extraction, rule-based synthesis).
- **Verification Criteria**:
  - All DB tables create cleanly in SQLite.
  - Unit tests verify that switching providers dynamically works seamlessly.
  - The system operates without errors even when no external AI API key or Ollama daemon is active (heuristic engine fallback).

---

### Phase 3: Research, Web Crawling, Content Extraction & Deduplication Pipeline
- **Objectives**: Build the real-world crawling and extraction engine that respects `robots.txt`, avoids rate limits, strips web noise, and eliminates duplicate news stories.
- **Key Deliverables**:
  - `backend/app/services/crawler_service.py`: Async HTTPX client, user-agent headers, robots.txt parser (`urllib.robotparser`), retry with exponential backoff.
  - `backend/app/services/content_extraction_service.py`: Trafilatura article extraction, BeautifulSoup meta tag & JSON-LD parser, date parsing.
  - `backend/app/services/deduplication_service.py`: Exact hash (SHA-256) match and near-duplicate SimHash / Jaccard similarity detector.
  - `backend/app/services/research_service.py`: Domain investigator combining website crawl + DuckDuckGo search to generate the initial company profile.
- **Verification Criteria**:
  - Crawl `https://www.meetuniversity.com` homepage and subpages without getting blocked.
  - Successfully extract value proposition, meta tags, and robots.txt rules.
  - Duplicate URLs and scraped text articles are flagged and skipped.

---

### Phase 4: Adaptive 10-Question Founder Interview Engine
- **Objectives**: Create an adaptive, intelligent interview session where questions dynamically evolve based on the company's research profile and the founder's prior responses.
- **Key Deliverables**:
  - `backend/app/services/interview_service.py`:
    - Initial question generator grounded in company research profile.
    - Adaptive next-question generator taking transcript of questions 1..N and founder answers.
    - Synthesis engine generating the `Executive Priority Vector` (weights for signal ranking).
  - `backend/app/api/v1/endpoints/interviews.py`: Session management and sequential QA submission.
- **Verification Criteria**:
  - Questions are strictly adaptive and non-hardcoded.
  - Tested with different inputs (e.g., student visa focus vs university pricing focus), verifying that subsequent questions adapt appropriately.
  - Produces a valid priority weight vector across strategic dimensions upon completing question 10.

---

### Phase 5: Intelligent Source Discovery & Signal Stack Management
- **Objectives**: Automatically discover, evaluate, approve, and manage 15–30 intelligence sources across Customer, Competitor, and Market categories.
- **Key Deliverables**:
  - `backend/app/services/source_discovery_service.py`: Discovers competitor blogs, RSS feeds, industry news outlets, and community forums.
  - `backend/app/services/source_health_service.py`: Measures source HTTP status, response times, and yield.
  - `backend/app/api/v1/endpoints/sources.py`: CRUD, bulk approval/rejection, custom source insertion, and immediate crawl triggers.
- **Verification Criteria**:
  - Discover high-quality sources for MeetUniversity (e.g., THE, PIE News, Study International, competitor blogs).
  - Source approval state transitions (`DISCOVERED` -> `APPROVED` / `REJECTED`) persist in the database.

---

### Phase 6: Internal Document Ingestion & RAG Knowledge Engine
- **Objectives**: Enable founders to upload private internal strategy files (PDF, DOCX, CSV, XLSX) and query them via local vector search to align external signals with internal roadmaps.
- **Key Deliverables**:
  - `backend/app/services/document_ingestion_service.py`:
    - PyMuPDF for PDF text & table extraction.
    - python-docx for Word documents.
    - Pandas for CSV/XLSX spreadsheets.
    - Text chunking (500 tokens with 50-token overlap).
    - Vector store integration using ChromaDB or FAISS with local sentence embeddings.
  - `backend/app/api/v1/endpoints/documents.py`: File upload, vector indexing, deletion.
- **Verification Criteria**:
  - Upload sample strategy document; verify vector embeddings are indexed.
  - Semantic query retrieves the exact matching chunk with citation.

---

### Phase 7: Signal Classification, Ranking & Evidence-Backed Brief Synthesis
- **Objectives**: Classify raw crawled items into intelligence pillars, calculate multi-factor ranking scores, and synthesize the Monday Morning Intelligence Brief.
- **Key Deliverables**:
  - `backend/app/services/intelligence_analysis_service.py`: Strictly extracts verified quotes and generates strategic interpretations ("Why it matters").
  - `backend/app/services/signal_ranking_service.py`:
    $$\text{Score} = w_{\text{relevance}} \cdot R + w_{\text{urgency}} \cdot U + w_{\text{impact}} \cdot I + w_{\text{credibility}} \cdot C + w_{\text{founder\_pref}} \cdot F$$
  - `backend/app/services/brief_generation_service.py`: Synthesizes 7-section Monday Morning Brief cross-referenced with internal RAG docs.
- **Verification Criteria**:
  - Every claim in the brief cites a valid `signal_id` and raw source URL.
  - Facts and interpretations are clearly demarcated.

---

### Phase 8: Next.js Executive Frontend Dashboard
- **Objectives**: Build a responsive, dark-mode, executive dashboard matching high-end financial/intelligence terminals.
- **Key Deliverables**:
  - Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui.
  - Company Onboarding & Real-time Crawl Visualizer.
  - Interactive 10-Question Interview Chat Console with progress bar.
  - Signal Stack Source Manager with health badges and approval toggles.
  - Live Intelligence Feed with slide-over Evidence Inspector.
  - Monday Morning Intelligence Brief Viewer with Markdown & PDF export.
  - Recharts Visualizations: Competitor signal trends, sentiment trajectory, pillar distribution.
- **Verification Criteria**:
  - Zero placeholder buttons; all actions trigger real backend APIs.
  - Responsive across desktop, tablet, and mobile displays.

---

### Phase 9: Automated Background Monitoring & Source Health Audits
- **Objectives**: Schedule background cron jobs for weekly briefing generation and monthly source health audits using APScheduler.
- **Key Deliverables**:
  - `backend/app/services/scheduler_service.py`: Configures cron triggers (Mondays 06:00 AM for briefs, 1st of month for source audits).
  - Manual trigger overrides for immediate testing.
- **Verification Criteria**:
  - Jobs trigger accurately and log audit records to `source_health_audits` and `executive_briefs`.

---

### Phase 10: Multi-Company End-to-End Testing & Polish
- **Objectives**: Execute full end-to-end workflows for three distinct companies to prove multi-tenant isolation, dynamic configuration, and lack of hardcoding.
- **Test Companies**:
  1. **MeetUniversity (`https://www.meetuniversity.com`)** [PRIMARY DEMO - EdTech]
  2. **Postman (`https://www.postman.com`)** [Developer Tools / API Platform]
  3. **Linear (`https://linear.app`)** [B2B Project Management SaaS]
- **Deliverables**: Verification logs, exported PDF/Markdown briefs for all 3 companies, final documentation.

---

## 3. Technical Risks & Free-Tier Limitations Matrix

| Risk / Constraint | Severity | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **No Paid LLM API Keys** | High | LLM inferences could fail if users lack OpenAI/Anthropic accounts. | 1. Local Ollama default (`llama3.2`).<br>2. Free tier Groq (30 RPM) and Gemini 1.5 Flash (15 RPM).<br>3. Built-in Heuristic NLP Fallback Engine so the app is 100% operational offline. |
| **Target Sites Blocking Crawlers** | High | 403 Forbidden or CAPTCHA on competitor pages. | 1. Strict `robots.txt` compliance.<br>2. Rotating standard browser User-Agents.<br>3. Rely on public RSS/Atom feeds, Google News feeds, and DuckDuckGo search summaries where direct scraping is restricted.<br>4. Graceful error handling in `crawler_service`. |
| **Near-Duplicate News Storms** | Medium | Same press release appearing across 10 syndication sites clutters briefing. | Implement 64-bit SimHash and token Jaccard similarity (>0.85). Group duplicate items into a single cluster citing multiple sources. |
| **Slow Crawling or Timeouts** | Medium | User waiting on onboarding or source crawl. | 1. Asynchronous concurrent requests via `httpx.AsyncClient` with connection pooling.<br>2. Per-request 10s timeout.<br>3. Server-Sent Events (SSE) streaming progress to frontend. |
| **High Memory Usage on Local LLM** | Medium | Low-spec developer machines running Ollama 7B/13B models might stall. | Default to lightweight models: `llama3.2:3b` or `qwen2.5:3b`. Provide clear UI memory guidance and instant switch to Groq free API or Fallback engine. |
| **RAG Embeddings Performance** | Low | Embedding large PDF uploads locally may introduce latency. | Chunk size capped at 500 tokens; max document size 25MB; local lightweight embedding model (`all-MiniLM-L6-v2` via fast ONNX or simple TF-IDF / BM25 fallback in ChromaDB). |
