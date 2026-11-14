# Signal Stack — REST API Specification & Endpoint Documentation

**Base URL**: `http://localhost:8000`  
**API Version**: `v1` (`/api/v1`)  
**Interactive Docs**: `/docs` (Swagger UI) & `/redoc` (ReDoc)  
**Authentication**: Bearer Token / API Key (Server-Side Session)

---

## 1. Company Endpoints

### 1.1. Create Company
- **URL**: `POST /api/v1/companies`
- **Description**: Registers a new target company for intelligence monitoring.
- **Request Body**:
```json
{
  "name": "MeetUniversity",
  "website_url": "https://www.meetuniversity.com",
  "industry": "EdTech / Higher Education Marketplace",
  "geography": "India, UK, Canada, Australia, USA",
  "notes": "Higher education discovery and recruitment platform."
}
```
- **Response**: `201 Created`
```json
{
  "id": "e4b6c310-8b17-48f5-9bcf-123456789abc",
  "name": "MeetUniversity",
  "website_url": "https://www.meetuniversity.com",
  "industry": "EdTech / Higher Education Marketplace",
  "geography": "India, UK, Canada, Australia, USA",
  "onboarding_status": "REGISTERED",
  "created_at": "2026-11-14T08:00:00Z"
}
```

### 1.2. List Companies
- **URL**: `GET /api/v1/companies`
- **Query Params**: `page=1`, `limit=20`, `search=MeetUniversity`
- **Response**: `200 OK` (Paginated list of registered companies).

### 1.3. Get Company Details
- **URL**: `GET /api/v1/companies/{id}`
- **Response**: `200 OK` (Full company entity including profile status, source counts, and active jobs).

### 1.4. Update Company
- **URL**: `PUT /api/v1/companies/{id}`
- **Request Body**: Partial update fields (`industry`, `geography`, `website_url`, `notes`).
- **Response**: `200 OK` (Updated company object).

---

## 2. Research Endpoints

### 2.1. Trigger Company Research
- **URL**: `POST /api/v1/companies/{id}/research`
- **Description**: Autonomously crawls the company domain, extracts verified facts, identifies competitors, and synthesizes structured company profile.
- **Response**: `200 OK`
```json
{
  "company_id": "e4b6c310-8b17-48f5-9bcf-123456789abc",
  "executive_summary": "MeetUniversity is a student recruitment and university discovery platform...",
  "value_proposition": "Simplifying university admissions for international students...",
  "target_customer_profile": "International study abroad applicants and institutional admissions departments.",
  "business_model": "Marketplace / Commission per enrolled student + institutional subscription",
  "verified_facts": [
    {
      "fact": "Over 500+ university partnerships across UK, USA, Australia and Canada.",
      "evidence_url": "https://www.meetuniversity.com/about"
    }
  ],
  "inferences": [
    "Expanding direct B2C personalized guidance to counter aggregators."
  ],
  "unknown_information": [
    "Exact take-rate per enrolled university student."
  ]
}
```

### 2.2. Get Research Profile
- **URL**: `GET /api/v1/companies/{id}/research`
- **Response**: `200 OK` (Existing company profile record).

---

## 3. Adaptive 10-Question Interview Endpoints

### 3.1. Start Interview Session
- **URL**: `POST /api/v1/companies/{id}/interview/start`
- **Description**: Initializes an adaptive 10-question interview calibrated to the company's research profile.
- **Response**: `200 OK`
```json
{
  "session_id": "sess-894123",
  "company_id": "e4b6c310-8b17-48f5-9bcf-123456789abc",
  "question_number": 1,
  "total_questions": 10,
  "question_text": "Regarding revenue streams, how does MeetUniversity structure its monetization across institutional partners and end customers, and where do you expect the fastest margin expansion?",
  "topic": "REVENUE_STREAMS",
  "status": "IN_PROGRESS"
}
```

### 3.2. Get Interview Session
- **URL**: `GET /api/v1/interviews/{id}`
- **Response**: `200 OK` (Transcript of all questions, answers, and skip status).

### 3.3. Submit Answer
- **URL**: `POST /api/v1/interviews/{id}/answer`
- **Request Body**:
```json
{
  "answer_text": "Our primary revenue comes from institutional recruitment commissions (15-20% of first-year tuition). We are launching high-margin premium counselling services directly to students."
}
```
- **Response**: `200 OK` (Next dynamic question adapted to previous answers, or completion summary with synthesized priority weights).

### 3.4. Skip Confidential Question
- **URL**: `POST /api/v1/interviews/{id}/skip`
- **Description**: Records question as skipped without penalizing interview progress.
- **Response**: `200 OK` (Next question).

---

## 4. Signal Stack Source Endpoints

### 4.1. List Sources
- **URL**: `GET /api/v1/companies/{id}/sources`
- **Query Params**: `pillar=CUSTOMER|COMPETITOR|MARKET|INTERNAL`, `status=APPROVED|DISCOVERED|PAUSED`
- **Response**: `200 OK` (List of sources with latency and health telemetry).

### 4.2. Auto-Discover Sources
- **URL**: `POST /api/v1/companies/{id}/sources/discover`
- **Description**: Discovers 15–30 high-signal public feeds, forums, competitor blogs, and regulatory sites.
- **Response**: `200 OK` (List of newly discovered sources with initial `DISCOVERED` status).

### 4.3. Create Custom Source
- **URL**: `POST /api/v1/companies/{id}/sources`
- **Request Body**:
```json
{
  "name": "PIE News International EdTech",
  "url": "https://thepienews.com/feed/",
  "pillar": "MARKET",
  "source_type": "RSS_FEED",
  "reliability_score": 0.95
}
```

### 4.4. Update Source
- **URL**: `PUT /api/v1/sources/{id}`
- **Request Body**: Status (`APPROVED`), crawling frequency, or reliability adjustments.

### 4.5. Delete Source
- **URL**: `DELETE /api/v1/sources/{id}`
- **Response**: `204 No Content`.

---

## 5. Web Crawling & Monitoring Endpoints

### 5.1. Trigger Web Crawl Cycle
- **URL**: `POST /api/v1/companies/{id}/crawl`
- **Description**: Concurrently crawls all approved sources, extracts text via Trafilatura, applies SHA-256 and SimHash deduplication, and records version changes.
- **Response**: `202 Accepted`
```json
{
  "job_id": "crawl-job-901",
  "status": "COMPLETED",
  "items_crawled": 45,
  "unique_documents_extracted": 1,
  "duration_seconds": 31.64
}
```

### 5.2. Crawl History
- **URL**: `GET /api/v1/companies/{id}/crawl-history`
- **Response**: `200 OK` (Log of past crawl runs with timestamps, durations, and HTTP status codes).

---

## 6. Intelligence Signals Endpoints

### 6.1. List Ranked Signals
- **URL**: `GET /api/v1/companies/{id}/signals`
- **Query Params**: `pillar`, `direction`, `min_score=70`, `limit=50`
- **Response**: `200 OK` (Ranked signals with multi-factor scoring breakdown).

### 6.2. Get Signal Detail with Verifiable Evidence
- **URL**: `GET /api/v1/signals/{id}`
- **Response**: `200 OK`
```json
{
  "id": "sig-71283",
  "headline": "UK Clarifies Graduate Route Visa Duration Rules",
  "pillar": "MARKET",
  "composite_score": 87.5,
  "score_breakdown": {
    "priority_alignment": 0.9,
    "evidence_strength": 0.95,
    "severity": 0.8,
    "recency_decay": 0.85
  },
  "verified_fact": "UK Home Office reaffirmed the 2-year post-study work entitlement for Master graduates.",
  "ai_interpretation": "Alleviates immediate student anxiety; provides MeetUniversity an advantage in promoting UK partner universities.",
  "evidence": [
    {
      "source_name": "UKVI Gazette",
      "source_url": "https://gov.uk/government/news/graduate-route-update",
      "exact_quote": "The Graduate route will remain under current terms for the upcoming academic cycle.",
      "discovered_at": "2026-11-14T08:30:00Z"
    }
  ]
}
```

---

## 7. Monday Morning Intelligence Brief Endpoints

### 7.1. Generate Monday Morning Brief
- **URL**: `POST /api/v1/companies/{id}/briefs/generate`
- **Description**: Synthesizes the full 10-section executive brief from ranked signals and internal RAG embeddings.
- **Response**: `200 OK` (Complete brief object with 10 sections, $\ge 3$ opportunities, action items, and source appendix).

### 7.2. List Historical Briefs
- **URL**: `GET /api/v1/companies/{id}/briefs`
- **Response**: `200 OK` (Archive of weekly briefs).

### 7.3. Get Brief by ID
- **URL**: `GET /api/v1/briefs/{id}`
- **Response**: `200 OK`.

### 7.4. Export Brief as Printable HTML
- **URL**: `GET /api/v1/briefs/{id}/export/html`
- **Response**: `text/html` (Includes executive typography and `@media print` CSS rules).

### 7.5. Export Brief as Markdown
- **URL**: `GET /api/v1/briefs/{id}/export/markdown`
- **Response**: `text/markdown` (Portable GitHub-flavored Markdown text).

---

## 8. Internal Documents & RAG Endpoints

### 8.1. Upload Internal Document
- **URL**: `POST /api/v1/companies/{id}/documents/upload`
- **Content-Type**: `multipart/form-data`
- **Form Fields**: `file` (Supported: `.pdf`, `.docx`, `.xlsx`, `.csv`; max 25MB).
- **Response**: `201 Created` (Parsed chunks, token count, and vector store embedding confirmation).

### 8.2. List Internal Documents
- **URL**: `GET /api/v1/companies/{id}/documents`
- **Response**: `200 OK`.

---

## 9. Automation & Source Health Audit Endpoints

### 9.1. Run Monthly Source Health Audit
- **URL**: `POST /api/v1/companies/{id}/source-audit`
- **Description**: Verifies HTTP status, flags dead URLs and dormant sources, and generates replacement recommendations.
- **Response**: `200 OK`.

### 9.2. List Source Audits
- **URL**: `GET /api/v1/companies/{id}/source-audits`
- **Response**: `200 OK`.

### 9.3. Trigger Background Job
- **URL**: `POST /api/v1/automation/jobs/trigger`
- **Request Body**: `{"job_name": "weekly_brief" | "monthly_audit"}`
- **Response**: `200 OK`.
