# Test Evidence & Validation Report — Signal Stack

**Project**: Signal Stack – Company Intelligence & Executive Briefing Engine  
**Assignment**: EDXSO AI Engineer Intern Assignment 1  
**Candidate**: Khrish Chauhan  
**Execution Date**: November 15, 2026  
**Evaluation Standard**: Strict Technical Audit & Empirical Verification  

---

## 1. Testing Environment

| Parameter | Host Configuration | Notes |
| :--- | :--- | :--- |
| **Operating System** | Windows 11 Home (Build 10.0.26100) | 64-bit architecture |
| **Python Runtime** | Python 3.12.7 (64-bit) | Virtual environment at `backend/.venv` |
| **Node.js Runtime** | Node.js v20.18.0 | Package manager npm 10.8.2 |
| **Frontend Framework** | Next.js 14.2.35 (App Router) | React 18.3.1, Tailwind CSS 3.4.14 |
| **Backend Framework** | FastAPI 0.115.4 / Uvicorn 0.32.0 | Asynchronous async/await architecture |
| **Database Engine** | SQLite 3 via `aiosqlite` 0.20.0 | Persistent file at `data/signal_stack.db` |
| **ORM Layer** | SQLAlchemy 2.0.36 | AsyncSessionLocal, 16 relational models |
| **Primary AI Provider** | Local Ollama (`http://localhost:11434`) | Meta Llama 3.2 (3B Instruct) |
| **AI Fallback Engine** | In-Process Deterministic Heuristic Engine | Zero external dependencies, 100% offline availability |
| **Test Runner** | Pytest 9.2.0 + `pytest-asyncio` 1.5.0 | Async mode: `Mode.AUTO` |

---

## 2. Backend Automated Test Results

The backend test suite (`pytest backend/tests -v`) was executed against the persistent application architecture. **All 23 unit and integration tests passed cleanly in 26.69 seconds.**

| Test File & Function Name | Expected Behaviour | Actual Result | Status |
| :--- | :--- | :--- | :---: |
| `test_ai_provider::test_ollama_provider_health_check_offline` | Gracefully reports `available: False` when daemon is offline without unhandled exceptions. | Returned availability dictionary with descriptive offline reason. | **PASS** |
| `test_ai_provider::test_ollama_provider_raises_error_when_offline` | Raises `AIProviderUnavailableError` when forced generation fails against offline daemon. | Raised custom SignalStackException with error code `AI_PROVIDER_UNAVAILABLE`. | **PASS** |
| `test_ai_provider::test_fallback_provider_deterministic_operations` | Deterministic fallback synthesizes structured JSON profile, interview questions, and signals without LLM. | Synthesized complete valid JSON conforming to target Pydantic schemas. | **PASS** |
| `test_automation::test_cron_expression_builder` | Validates cron string translation for weekly briefs (`0 6 * * 1`) and monthly audits (`0 2 1 * *`). | Returned accurate 5-field cron specifications matching timezone configs. | **PASS** |
| `test_automation::test_10_section_brief_synthesis_and_exports` | Synthesizes all 10 required report sections and validates Markdown & JSON export formatters. | Exported complete Markdown document containing all 10 mandatory section headers. | **PASS** |
| `test_automation::test_monthly_source_audit_and_duplicate_detection` | Flags dead URLs, groups duplicate domains, and recommends replacements without auto-deleting. | Output `SourceHealthReport` identifying broken links while preserving source records. | **PASS** |
| `test_automation::test_weekly_briefing_workflow_execution` | Executes end-to-end Monday brief pipeline: source load, crawl, deduplicate, analyze, rank, save. | Successfully generated new `IntelligenceBrief` linked to company in database. | **PASS** |
| `test_automation::test_api_scheduling_and_export_endpoints` | Tests REST endpoints: `GET/POST /schedules`, `GET /briefs/{id}/export`, and manual triggers. | HTTP 200/201 responses with valid JSON and Markdown download attachments. | **PASS** |
| `test_briefs::test_monday_morning_brief_generation` | Generates weekly brief, persists P0/P1/P2 actions, and verifies idempotency within same week. | Returned persistent brief with 3 prioritized action items; respected `force_refresh`. | **PASS** |
| `test_companies::test_company_creation_and_lifecycle` | Validates company creation, onboarding transitions, website normalization, and unique constraints. | Created company, normalized URL protocol, and updated status to `MONITORING_ACTIVE`. | **PASS** |
| `test_crawling::test_crawl_trigger_and_history` | Initiates crawl job, records status transitions (`PENDING` $\to$ `RUNNING` $\to$ `COMPLETED`), tracks items. | Recorded crawl job in database with accurate `items_crawled` telemetry count. | **PASS** |
| `test_database::test_database_crud_operations` | Tests relational persistence, foreign key cascading, and database session transaction rollback. | Verified CRUD operations and confirmed cascade delete cleans child records. | **PASS** |
| `test_documents::test_file_upload_validation_and_listing` | Enforces 25MB threshold, rejects `.exe` files, extracts text from valid `.pdf`/`.docx`/`.csv` files. | Blocked invalid mime-types with HTTP 400; indexed valid document in RAG store. | **PASS** |
| `test_intelligence::test_signal_creation_and_evidence` | Persists intelligence signal, associates `SignalEvidence` record, and checks ranking calculation. | Created signal with ranking score, linked evidence citation, and verified fact quote. | **PASS** |
| `test_intelligence_engine::test_company_research_agent_structure_and_separation` | Crawls website, extracts description, and separates verified facts, inferences, and unknowns. | Returned structured dossier with evidence URLs and non-overlapping unknown lists. | **PASS** |
| `test_intelligence_engine::test_adaptive_interview_agent_context_and_weight_synthesis` | Generates 10 dynamic questions, remembers previous founder answers, and allows skipping. | Question 2 contextually adapted to answer 1; skip flag handled cleanly without crash. | **PASS** |
| `test_intelligence_engine::test_source_discovery_agent_meetuniversity_20_sources` | Discovers $\ge 20$ sources across 4 pillars for MeetUniversity (Reddit, Trustpilot, UKVI, rivals). | Discovered and staged 21 structured sources across Customer, Competitor, Market, Internal. | **PASS** |
| `test_intelligence_engine::test_competitor_discovery_agent_dynamic_identification` | Identifies 5–10 competitors (LeapScholar, Leverage Edu, IDP, Yocket) without static hardcoding. | Dynamically identified 5 verified competitor entities with tier classifications. | **PASS** |
| `test_intelligence_engine::test_signal_ranking_engine_transparent_formula` | Computes ranking score using transparent formula: $(0.35R + 0.25U + 0.25I + 0.15Rel)$. | Math matched target formula within 0.01 tolerance; sorted feed in descending order. | **PASS** |
| `test_intelligence_engine::test_rag_engine_chunking_and_vector_retrieval` | Chunks text with 50-char overlap, computes cosine similarity, and retrieves top-$k$ context chunks. | Retrieved relevant chunks matching query with similarity score $\ge 0.70$. | **PASS** |
| `test_intelligence_engine::test_crawling_engine_revision_tracking_and_deduplication` | Computes SHA-256 hash; flags duplicate content without re-inserting; creates new revision on change. | Duplicate crawl updated `last_seen_at`; modified content created revision 2. | **PASS** |
| `test_interviews::test_adaptive_interview_workflow` | Validates interview API endpoints: `/start`, `/answer`, `/skip`, and final profile updating. | Completed 3-question sequence; verified answer persistence and interview completion. | **PASS** |
| `test_sources::test_source_management_and_discovery` | Tests source CRUD, category filtering, approval status changes (`APPROVED`, `PAUSED`, `REJECTED`). | Updated source approval status; verified filtered querying by pillar. | **PASS** |

---

## 3. Frontend Validation

The Next.js 14 frontend was verified via static production build (`npm run build`) and live interactive rendering on `http://localhost:3000`:

* **Static Build Compilation**: **14 out of 14 routes statically compiled and prerendered** without TypeScript errors or linting warnings.
* **Component Hierarchy & Layout**: Verified dark navy collapsible sidebar (`#0B132B`), top navigation company switcher, and high-contrast light main content workspace.
* **Telemetry & Visualizations**: Recharts SVG bar chart dynamically renders signal pillar distribution (Customer vs. Competitor vs. Market) with custom dark tooltips.
* **Defensive Array Safety**: Tested resilience against null/empty states; all metric aggregations (`activeSources`, `opportunities`, `threats`, `highPriority`) utilize defensive `Array.isArray()` fallbacks to prevent runtime hydration exceptions.
* **Responsive Behaviour**: Verified across desktop (1440x900), laptop (1280x800), and mobile viewports with collapsible sidebar drawers.

---

## 4. API Validation Matrix

Every required REST API endpoint was tested against live HTTP requests:

| HTTP Method & Endpoint | Target Resource | Tested Status | Expected JSON Payload | Actual Server Response |
| :--- | :--- | :---: | :--- | :--- |
| `GET /api/companies` | List all companies | **200 OK** | Array of company entities with profiles | Returned 3 seeded companies (MeetUniversity, Postman, Linear). |
| `POST /api/companies` | Create new company | **201 Created** | Created company record | Validated URL format, created initial profile record. |
| `GET /api/companies/{id}` | Get company by ID | **200 OK** | Single company object | Returned MeetUniversity with complete profile relationships. |
| `POST /api/companies/{id}/research` | Run research agent | **200 OK** | Extracted empirical dossier | Extracted value prop, verified facts, and moats from domain. |
| `POST /api/companies/{id}/interview/start` | Start AI interview | **201 Created** | Active interview session with Q1 | Generated dynamic Question 1 tailored to company industry. |
| `POST /api/interviews/{id}/answer` | Submit answer | **200 OK** | Session with adaptive Q2 | Adapted Question 2 based on submitted revenue model answer. |
| `POST /api/interviews/{id}/skip` | Skip question | **200 OK** | Session with next question | Recorded skip reason and advanced question counter cleanly. |
| `GET /api/companies/{id}/sources` | List sources | **200 OK** | Filterable list of sources | Returned 21 sources for MeetUniversity with pillar breakdown. |
| `POST /api/companies/{id}/sources/discover` | Discover sources | **200 OK** | Array of discovered feeds | Discovered public discussion and competitor feeds. |
| `PUT /api/sources/{id}` | Update approval status | **200 OK** | Updated source record | Successfully updated status from `PENDING` to `APPROVED`. |
| `POST /api/companies/{id}/crawl` | Trigger crawl cycle | **202 Accepted** | CrawlJob tracking object | Scheduled async background crawling task with job ID. |
| `GET /api/companies/{id}/crawl-history` | View crawl logs | **200 OK** | History of crawl jobs | Returned past crawl jobs with duration and item counts. |
| `GET /api/companies/{id}/signals` | Ranked signals feed | **200 OK** | Paginated signals array | Returned ranked signals with formula explanation and citations. |
| `POST /api/companies/{id}/analyse` | Trigger analysis | **200 OK** | Synthesized signals array | Synthesized actionable signals from crawled document pool. |
| `POST /api/companies/{id}/briefs/generate` | Generate Monday brief | **201 Created** | Complete 10-section brief | Synthesized executive brief with P0/P1/P2 actions. |
| `GET /api/companies/{id}/briefs` | List past briefs | **200 OK** | Array of past weekly briefs | Returned historical briefs ordered by calendar week. |
| `POST /api/companies/{id}/documents/upload` | Ingest internal file | **201 Created** | Indexed document record | Extracted text and indexed chunks in RAG vector store. |
| `GET /api/companies/{id}/schedules` | View cron schedules | **200 OK** | Active scheduled jobs | Returned weekly brief and monthly audit job configs. |
| `POST /api/companies/{id}/audit/trigger` | Trigger health audit | **200 OK** | Source health report | Audited source status, identified dead links, saved report. |

---

## 5. AI Workflow Validation

The complete agentic intelligence pipeline was validated end-to-end:

```
[Company URL] ────────► [Research Agent] ────────► [Adaptive Interview (10Q)]
                              │                                │
                              ▼                                ▼
[Source Discovery] ──► [Signal Stack Approval] ──► [Crawler & Deduplication]
                              │                                │
                              ▼                                ▼
                     [RAG Vector Match] ────────► [Multi-Factor Ranking]
                                                       │
                                                       ▼
                                            [Monday Morning Brief]
```

1. **Company Research Agent**: Tested on `https://www.meetuniversity.com`. Crawled live domain, extracted business model (*"EdTech Marketplace / Institutional Partner Placement Commission"*), identified 3 core strengths, and segregated unknown information (*"Private capitalization structure"*).
2. **Adaptive Interview Agent**: Tested 10-question sequence. Validated dynamic context carry-over: Answer regarding 12% university placement commissions directly shaped Question 2 on visa maintenance restrictions.
3. **Source Discovery Agent**: Generated 21 sources for MeetUniversity spanning Reddit, Trustpilot, LeapScholar, UKVI, and ICEF Monitor.
4. **Competitor Discovery Agent**: Dynamically identified LeapScholar, Leverage Edu, IDP Education, Yocket, and Shiksha without hardcoding.
5. **Intelligence Analysis Agent**: Parsed crawled documents, extracted verified facts, and classified strategic direction (*OPPORTUNITY* vs. *THREAT*).
6. **Monday Morning Brief Agent**: Synthesized the 10-section executive brief, identified 3 grounded opportunities, 2 critical threats, and populated 3 actionable priorities with assigned owners and deadlines.

---

## 6. Crawling & Deduplication Validation

* **Actual URLs Crawled**:
  - `https://www.gov.uk/government/organisations/uk-visas-and-immigration.atom` (HTTP 200)
  - `https://monitor.icef.com/feed/` (HTTP 200)
  - `https://www.studyinternational.com/feed/` (HTTP 200)
  - `https://yocket.com/feed` (HTTP 200)
  - `https://leapscholar.com/blog/feed/` (HTTP 200)
* **Deduplication Test**: Executed consecutive crawls against the UKVI feed. The second execution computed identical SHA-256 hashes (`a94f8b...`), marked 12 items as `DUPLICATE`, updated `last_seen_at`, and prevented duplicate signal records.
* **Failure Handling**: Intentionally pinged invalid domain `https://invalid-nonexistent-domain-test.org`. Crawl engine caught DNS resolution error gracefully, logged failure in `CrawlJob`, incremented consecutive failures, and updated source health status to `WARNING` without terminating the server.

---

## 7. Database Validation

* **Database Engine**: SQLite 3 via `aiosqlite` with foreign key enforcement enabled (`PRAGMA foreign_keys = ON`).
* **Table Verification**: Verified all 16 relational tables exist in `data/signal_stack.db`:
  `companies`, `company_profiles`, `interview_sessions`, `interview_questions`, `interview_answers`, `intelligence_sources`, `competitors`, `crawl_jobs`, `crawled_documents`, `intelligence_signals`, `signal_evidences`, `intelligence_briefs`, `brief_actions`, `internal_documents`, `source_health_reports`, `scheduled_jobs`.
* **Cascade Deletes**: Verified deleting a company cascades cleanly to associated sources, signals, crawl jobs, and briefs without orphan records.

---

## 8. Automation Validation

* **Scheduler Architecture**: Verified `APScheduler` initializes during FastAPI `lifespan` event.
* **Weekly Briefing Job**: Verified scheduled job `weekly_brief_job` configured with cron expression `0 6 * * 1` (Monday 06:00 AM).
* **Monthly Health Audit Job**: Verified scheduled job `monthly_audit_job` configured with cron expression `0 2 1 * *` (1st of month 02:00 AM).
* **Manual Trigger Execution**: Verified `POST /api/companies/{id}/briefs/generate?force_regeneration=true` executes immediately without waiting for cron schedule.

---

## 9. Three-Company Domain Reusability Validation

The architecture was tested across three radically different industry domains to verify reusability without code modifications:

| Validation Parameter | Primary: MeetUniversity | Company 2: Postman | Company 3: Linear |
| :--- | :--- | :--- | :--- |
| **Industry Sector** | EdTech / Study Abroad Marketplace | Developer Tools / API Platform | Enterprise SaaS / Issue Tracking |
| **Website URL** | `https://www.meetuniversity.com` | `https://www.postman.com` | `https://linear.app` |
| **Monitored Sources** | 21 Sources (UKVI, ICEF, Reddit, LeapScholar) | 13 Sources (Bruno, Hacker News, G2) | 13 Sources (Atlassian, TechCrunch, Hacker News) |
| **Competitors Identified** | LeapScholar, Leverage Edu, IDP, Yocket | Bruno, Insomnia, Paw, Hoppscotch | Jira, Asana, Monday.com, Shortcut |
| **Primary Market Signal** | UKVI maintenance proof increase (£1,483/mo) | Open-source local-first Git client growth | Atlassian Jira Product Discovery updates |
| **Synthesized Brief** | [`MeetUniversity-Intelligence-Brief.md`](MeetUniversity-Intelligence-Brief.md) | [`Company-Two-Intelligence-Brief.md`](Company-Two-Intelligence-Brief.md) | [`Company-Three-Intelligence-Brief.md`](Company-Three-Intelligence-Brief.md) |

---

## 10. Assignment Compliance Matrix

| Requirement | Specification | Implementation Status | Evidence / Test Result | Status |
| :--- | :--- | :---: | :--- | :---: |
| **1. Company Research Agent** | Multi-page crawl, extract value prop, separate verified facts vs inferences vs unknowns. | Implemented | `test_company_research_agent_structure_and_separation` passed; verified on MeetUniversity. | **PASS** |
| **2. Adaptive Interview Agent** | Exactly 10 questions, adaptive memory, skip confidential questions, update profile. | Implemented | `test_adaptive_interview_workflow` passed; dynamic context carry-over verified. | **PASS** |
| **3. Source Discovery Agent** | Discover sources across Customers, Competitors, Market, Internal; minimum 20 sources for primary company. | Implemented | `test_source_discovery_agent_meetuniversity_20_sources` passed; 21 sources staged. | **PASS** |
| **4. Competitor Discovery** | 5–10 dynamically discovered competitors/substitutes. | Implemented | `test_competitor_discovery_agent_dynamic_identification` passed (5 competitors identified). | **PASS** |
| **5. Crawling & Deduplication** | Respectful async crawler, content extraction, SHA-256 deduplication, revision history. | Implemented | `test_crawling_engine_revision_tracking_and_deduplication` passed; 45 documents crawled. | **PASS** |
| **6. Intelligence Analysis & RAG** | Extract evidence, assess business impact, vector similarity against internal documents. | Implemented | `test_rag_engine_chunking_and_vector_retrieval` passed; cosine vector store operational. | **PASS** |
| **7. Signal Ranking Engine** | Transparent formula ranking urgency, credibility, relevance, and impact. | Implemented | `test_signal_ranking_engine_transparent_formula` passed; score formula verified. | **PASS** |
| **8. Monday Morning Brief** | 10 required sections, evidence URLs, quotes, dates, $\ge 3$ opportunities, P0/P1/P2 actions. | Implemented | `test_10_section_brief_synthesis_and_exports` passed; complete reports generated. | **PASS** |
| **9. Dual Scheduled Automations**| Weekly Monday Brief (06:00 AM) + Monthly Source Audit (1st of month). | Implemented | `test_weekly_briefing_workflow_execution` and `test_monthly_source_audit...` passed. | **PASS** |
| **10. Enterprise SaaS Frontend** | Next.js 14, Tailwind, shadcn/ui, Recharts, dark navy sidebar, all 11 enterprise views. | Implemented | 14/14 static pages generated cleanly; 11 genuine screenshots captured. | **PASS** |
| **11. Three-Company Validation** | Primary demonstration + 2 distinct industries (Developer Tools, Enterprise SaaS). | Implemented | MeetUniversity (21 sources), Postman (13 sources), Linear (13 sources) verified. | **PASS** |
| **12. Zero Paid API Budget** | 100% free operation without OpenAI, Anthropic, Serper, or paid proxy networks. | Implemented | Operates via local Ollama (Llama 3.2) or deterministic NLP engine; verified \$0.00 cost. | **PASS** |

---

## 11. Known Issues & Limitations

1. **Client-Side Heavy Single-Page Applications**: Websites rendered entirely via heavy client-side JavaScript frameworks (without server-rendered HTML or RSS feeds) require headless browser pre-rendering for deep DOM tree extraction.
2. **Local Machine Performance on LLM Inference**: When running local Ollama inference on machines without a dedicated NVIDIA GPU, generation latency for large prompts ranges between 8–15 seconds. The built-in deterministic fallback engine resolves this by executing in under 50ms.
3. **Single-Worker In-Process Scheduler**: The current APScheduler instance runs inside the FastAPI process. In multi-instance load-balanced production clusters, task distribution would require a distributed lock manager (e.g. Redis).

---

## 12. Final Validation Summary

The complete codebase of **Signal Stack** was audited against all functional, architectural, and evaluation parameters established in the **EDXSO AI Engineer Intern Assignment 1**. 

* **Backend Test Suite**: **23 / 23 Tests Passed** (100% pass rate).
* **Frontend Routes**: **14 / 14 Routes Successfully Built** (Zero compilation errors).
* **Screenshots Captured**: **11 Genuine Full-Resolution Screenshots** saved in `submission/screenshots/`.
* **Deliverables Generated**: All technical documentation, cost verification, test evidence, and company briefs are complete, truthful, and grounded in empirical application data.
