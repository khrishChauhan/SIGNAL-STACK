# Signal Stack — API Architecture & Endpoint Specification

**Protocol**: REST over HTTPS / JSON  
**Framework**: FastAPI (Python 3.12+)  
**Interactive Docs**: `/docs` (Swagger UI) & `/redoc` (ReDoc)  
**Standard Prefix**: `/api/v1`  
**Streaming**: Server-Sent Events (SSE) for long-running workflows  

---

## 1. Response Envelope & Error Handling Standards

All JSON responses follow a standardized envelope structure to ensure client predictability.

### 1.1. Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "meta": {
    "timestamp": "2026-11-14T11:45:00Z",
    "version": "1.0.0"
  }
}
```

### 1.2. Paginated Success Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  },
  "meta": { "timestamp": "2026-11-14T11:45:00Z" }
}
```

### 1.3. Error Response
```json
{
  "success": false,
  "error": {
    "code": "SOURCE_CRAWL_FAILED",
    "message": "Target source refused connection or returned HTTP 403 Forbidden",
    "details": {
      "source_url": "https://example.com/feed",
      "status_code": 403
    }
  },
  "meta": { "timestamp": "2026-11-14T11:45:00Z" }
}
```

---

## 2. API Endpoints by Domain Service

### 2.1. Company Management (`/api/v1/companies`)

#### `POST /api/v1/companies`
Registers a new company and initiates the automated intelligence pipeline.
- **Request Body**:
```json
{
  "name": "MeetUniversity",
  "website_url": "https://www.meetuniversity.com",
  "industry": "EdTech / Higher Education",
  "geography": "India & Global",
  "auto_start_research": true
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "id": "c1a84f32-8e11-4f76-bc30-67a6d8011234",
    "name": "MeetUniversity",
    "website_url": "https://www.meetuniversity.com",
    "onboarding_status": "RESEARCHING",
    "created_at": "2026-11-14T11:45:00Z"
  }
}
```

#### `GET /api/v1/companies`
Lists all registered companies.
- **Query Params**: `page` (int), `limit` (int)
- **Response** (`200 OK`): Array of company objects with vital stats (source count, brief count, signal count).

#### `GET /api/v1/companies/{company_id}`
Returns full company details including current onboarding status.

#### `GET /api/v1/companies/{company_id}/profile`
Returns the AI-synthesized company profile.
- **Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "company_id": "c1a84f32-8e11-4f76-bc30-67a6d8011234",
    "executive_summary": "MeetUniversity is an international education marketplace and student recruitment portal...",
    "value_proposition": "Direct digital matching between aspiring study-abroad candidates and global university admissions...",
    "target_customer_profile": "Undergraduate and postgraduate students in India seeking higher education in UK, US, Canada, Australia...",
    "business_model": "University Commission / B2B EdTech Marketplace",
    "core_strengths": ["University network partnerships", "Lead generation platform", "Direct counselor access"],
    "known_weaknesses": ["Intense rivalry from venture-backed aggregators (LeapScholar, Leverage Edu)", "Visa regulatory shifts"],
    "identified_competitors": ["LeapScholar", "Leverage Edu", "IDP Education", "Yocket"]
  }
}
```

---

### 2.2. Research Service (`/api/v1/research`)

#### `POST /api/v1/research/{company_id}/start`
Triggers an on-demand deep crawl of the company domain and DuckDuckGo press search.
- **Response** (`202 Accepted`): Returns job status and SSE stream endpoint.

#### `GET /api/v1/research/{company_id}/stream`
**Server-Sent Events (SSE)** endpoint streaming live crawling milestones:
- Event: `robots_checked` -> `sitemap_parsed` -> `pages_crawled` -> `search_analyzed` -> `profile_synthesized` -> `done`.

---

### 2.3. Adaptive 10-Question Founder Interview (`/api/v1/interviews`)

#### `POST /api/v1/interviews/sessions`
Starts a new 10-question strategic calibration session for a company.
- **Request Body**:
```json
{
  "company_id": "c1a84f32-8e11-4f76-bc30-67a6d8011234"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "session_id": "sess-99b8-44a1",
    "current_question_number": 1,
    "total_questions": 10,
    "status": "IN_PROGRESS",
    "first_question": {
      "question_number": 1,
      "category": "Strategic Moat",
      "question_text": "We noticed MeetUniversity acts as a bridge between Indian applicants and international universities. In light of heavily-funded competitors like LeapScholar offering end-to-end financing and test prep, what is MeetUniversity's primary defensible moat?",
      "rationale": "Clarifies competitive positioning against top 2 direct rivals identified during domain research."
    }
  }
}
```

#### `POST /api/v1/interviews/sessions/{session_id}/answer`
Submits the founder's response for the current question and returns the next adaptive question (or completed summary).
- **Request Body**:
```json
{
  "question_number": 1,
  "founder_answer": "Our primary moat is direct institution partnerships with Tier-2 and Tier-3 UK universities who don't want to pay exorbitant agency fees, combined with our hyper-local offline counseling centers in Tier-2 Indian cities."
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "session_id": "sess-99b8-44a1",
    "completed_question_number": 1,
    "next_question_number": 2,
    "is_completed": false,
    "next_question": {
      "question_number": 2,
      "category": "Regulatory & Geopolitical Vulnerability",
      "question_text": "Given your high reliance on UK university partnerships, how severely are the recent UK student visa restrictions (dependent visa curbs and MAC review) impacting your student conversion pipeline this quarter?",
      "rationale": "Follows up on founder's answer regarding UK focus and probes macroeconomic vulnerability."
    }
  }
}
```

#### `GET /api/v1/interviews/sessions/{session_id}/summary`
Fetches the full 10-question transcript and the resulting Strategic Priority Vector used to weight intelligence signals.

---

### 2.4. Intelligence Sources Stack (`/api/v1/sources`)

#### `POST /api/v1/sources/discover`
Discovers 15–30 high-value intelligence sources across Customer, Competitor, and Market categories based on the company's profile, competitors, and founder interview priorities.
- **Request Body**: `{ "company_id": "c1a84f32-8e11-4f76-bc30-67a6d8011234" }`
- **Response** (`200 OK`): List of discovered sources with confidence scores and rationale.

#### `GET /api/v1/companies/{company_id}/sources`
Lists all sources in the company's Signal Stack.
- **Query Params**: `pillar` (`CUSTOMER`, `COMPETITOR`, `MARKET`), `approval_status`, `health_status`.

#### `PATCH /api/v1/sources/{source_id}/approval`
Approves, rejects, or pauses a source.
- **Request Body**: `{ "approval_status": "APPROVED" }`

#### `POST /api/v1/companies/{company_id}/sources/custom`
Adds a user-defined custom RSS feed or website URL to the stack.

#### `POST /api/v1/sources/{source_id}/crawl-now`
Forces an immediate crawl of a specific source.

#### `POST /api/v1/companies/{company_id}/crawl-all`
Triggers an immediate crawl across all approved sources for the company.

---

### 2.5. Intelligence Signals (`/api/v1/signals`)

#### `GET /api/v1/companies/{company_id}/signals`
Returns filtered and ranked intelligence signals.
- **Query Params**:
  - `pillar`: `CUSTOMER` | `COMPETITOR` | `MARKET`
  - `urgency`: `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
  - `min_score`: float (e.g. `70.0`)
  - `page`, `limit`
- **Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": "sig-0192a-44",
      "title": "UK Home Office Extends Graduate Route Visa Review",
      "verified_fact": "On May 14, 2024, the Migration Advisory Committee (MAC) recommended retaining the Graduate Route visa in its current form without major restrictions.",
      "ai_interpretation": "Substantially alleviates student anxiety regarding post-study work rights in the UK. Direct positive tailwind for MeetUniversity's UK student recruitment volume.",
      "recommended_action": "Launch an urgent marketing campaign targeting Tier-2 Indian students highlighting that UK 2-year post-study work permits remain secure.",
      "pillar": "MARKET",
      "urgency": "HIGH",
      "direction": "OPPORTUNITY",
      "confidence_score": 0.94,
      "ranking_score": 88.5,
      "source_name": "Times Higher Education RSS",
      "source_url": "https://www.timeshighereducation.com/news/...",
      "published_at": "2026-11-10T08:30:00Z"
    }
  ]
}
```

#### `GET /api/v1/signals/{signal_id}`
Returns complete atomic evidence: raw extracted text snippet, canonical URL, publication date, crawler metadata, and AI interpretation.

---

### 2.6. Internal Documents & RAG (`/api/v1/documents`)

#### `POST /api/v1/companies/{company_id}/documents/upload`
Uploads internal strategy documents (PDF, DOCX, CSV, XLSX, TXT) to ground Monday Morning Briefs.
- **Form Data**: `file` (multipart/form-data), `document_type` (`STRATEGY`, `ROADMAP`, `CUSTOMER_INTERVIEW`, `FINANCIAL`)
- **Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "document_id": "doc-8812-33",
    "filename": "MeetUniversity_2026_Q3_Strategic_OKRs.pdf",
    "file_size_bytes": 1420950,
    "chunk_count": 28,
    "status": "INDEXED"
  }
}
```

#### `GET /api/v1/companies/{company_id}/documents`
Lists all uploaded documents with chunk counts and indexing status.

#### `DELETE /api/v1/documents/{document_id}`
Deletes a document and purges all associated vector embeddings from ChromaDB/FAISS.

---

### 2.7. Monday Morning Intelligence Briefs (`/api/v1/briefs`)

#### `POST /api/v1/companies/{company_id}/briefs/generate`
Generates a comprehensive Monday Morning Intelligence Brief using ranked signals and RAG context from internal documents.
- **Request Body**: `{ "week_identifier": "2026-W46", "force_refresh": false }`
- **Response** (`201 Created`):
```json
{
  "success": true,
  "data": {
    "brief_id": "brief-w46-9912",
    "brief_week": "2026-W46",
    "title": "Monday Morning Intelligence Brief — MeetUniversity",
    "generated_at": "2026-11-14T11:45:00Z",
    "executive_tldr": [
      "UK Graduate Route Visa confirmed safe by MAC review, opening a 60-day marketing window for Autumn intake.",
      "LeapScholar launched a zero-interest student financing partnership with HDFC Credila, creating direct pricing pressure on recruitment counseling.",
      "Student inquiries for German and Irish public universities rose 42% on forum channels due to lower tuition barriers."
    ],
    "strategic_alert": {
      "level": "CRITICAL_COMPETITOR_MOVE",
      "headline": "LeapScholar Launches Subsidized Loan Desk",
      "verified_fact": "LeapScholar announced a direct lending partnership offering subsidized interest rates (8.5%) for STEM programs abroad.",
      "ai_interpretation": "Threatens MeetUniversity's counselor conversion rates where financial assistance is the primary decision blocker.",
      "recommended_action": "Partner immediately with an alternative NBFC aggregator (e.g. Avanse or InCred) to match financing assistance."
    },
    "competitor_movements": [ ... ],
    "market_shifts": [ ... ],
    "customer_voice": [ ... ],
    "internal_alignment": [
      {
        "internal_doc": "MeetUniversity_2026_Q3_Strategic_OKRs.pdf",
        "alignment_note": "Your Q3 OKR #2 targets a 25% increase in STEM enrollments. LeapScholar's loan program directly threatens this cohort unless financial aid matching is expedited."
      }
    ],
    "action_items": [
      { "priority": "P0", "action": "Finalize NBFC co-lending partnership discussion", "owner": "Founder / BizDev", "timeline": "By Wednesday" },
      { "priority": "P1", "action": "Launch 'UK Visa Confirmed' email blast to 15,000 uncommitted leads", "owner": "Growth Team", "timeline": "By Tuesday 10 AM" }
    ],
    "cited_signal_ids": ["sig-0192a-44", "sig-0192a-89"]
  }
}
```

#### `GET /api/v1/companies/{company_id}/briefs`
Lists past briefs with executive summaries and generation dates.

#### `GET /api/v1/briefs/{brief_id}`
Returns complete brief payload.

#### `GET /api/v1/briefs/{brief_id}/export/markdown`
Returns brief formatted in GitHub Flavored Markdown for export.

#### `GET /api/v1/briefs/{brief_id}/export/pdf`
Generates and downloads a branded PDF executive report.

---

### 2.8. Source Health Audits (`/api/v1/health`)

#### `POST /api/v1/companies/{company_id}/health/audit-now`
Triggers an immediate health audit across all sources in the stack.
- Evaluates: HTTP response code, DNS resolution, latency, duplicate ratio, and signal yield.
- Returns audit report with healthy/warning/broken classifications and replacement recommendations.

#### `GET /api/v1/companies/{company_id}/health/audits`
Fetches past monthly audit reports.

---

### 2.9. Scheduler Service (`/api/v1/scheduler`)

#### `GET /api/v1/scheduler/jobs`
Returns list of active APScheduler jobs (Weekly Brief on Monday 06:00, Monthly Health Audit on 1st of month, Daily Crawls).

#### `POST /api/v1/scheduler/jobs/{job_id}/trigger`
Forces an immediate execution of a scheduled cron job.

---

### 2.10. AI Settings & Provider Management (`/api/v1/settings`)

#### `GET /api/v1/settings/ai-provider`
Returns current active AI provider (`ollama`, `groq`, `gemini`, `heuristic`) and connection status.

#### `POST /api/v1/settings/ai-provider`
Configures active provider or updates free API keys.
- **Request Body**:
```json
{
  "provider": "ollama",
  "model_name": "llama3.2",
  "base_url": "http://localhost:11434"
}
```
- Performs a live ping and returns validation response (`success: true/false`).
