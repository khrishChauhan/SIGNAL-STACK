# Signal Stack — Requirements-to-Implementation Traceability Matrix

**Project**: Signal Stack  
**Document**: Requirements Traceability & Verification Matrix  
**Status**: Phases 1, 2, and 3 Completed & Verified (18/18 Automated Tests Passing)  

---

## 1. Traceability Matrix: 20 Mandatory Requirements

| Req # | Requirement Name | Architecture Component / Backend Service | Database Tables | Backend API Endpoints | Frontend Screen / UI Component | Verification & Testing Method | Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **01** | **Company registration and setup** | `company_service` | `companies` | `POST /api/companies`<br>`GET /api/companies/{id}` | `/companies/new`<br>`CompanyRegistrationForm` | Register MeetUniversity; verify persistence and status transition. | **Completed & Verified** |
| **02** | **Initial company research** | `research_service`, `CompanyResearchAgent` | `company_profiles`, `companies` | `POST /api/companies/{id}/research`<br>`GET /api/companies/{id}/research` | `/companies/[id]/overview`<br>`ResearchProgressStream` | Crawl domain homepage & subpages; verify verified facts vs inferences separation. | **Completed & Verified** |
| **03** | **AI-generated company profile** | `CompanyResearchAgent`, `ai_provider_service` | `company_profiles` | `GET /api/companies/{id}/research` | `/companies/[id]/overview`<br>`ExecutiveProfileCard` | Validates value prop, ICP, business model, identified competitors, known weaknesses. | **Completed & Verified** |
| **04** | **Adaptive 10-question founder interview** | `interview_service`, `AdaptiveInterviewAgent` | `interview_sessions`, `interview_questions`, `interview_answers` | `POST /api/companies/{id}/interview/start`<br>`POST /api/interviews/{id}/answer`<br>`POST /api/interviews/{id}/skip` | `/companies/[id]/interview`<br>`AdaptiveInterviewChat` | Q1 grounds in company profile; Q2-10 dynamically adapt to prior responses; weights synthesized. | **Completed & Verified** |
| **05** | **Customer intelligence** | `SourceDiscoveryAgent`, `IntelligenceAnalysisAgent` | `intelligence_sources`, `intelligence_signals` | `GET /api/companies/{id}/signals?pillar=CUSTOMER` | `/companies/[id]/signals`<br>`CustomerVoiceTab` | Crawl student forums/review feeds (Reddit, Yocket, Trustpilot); extract quotes and customer sentiment. | **Completed & Verified** |
| **06** | **Competitor intelligence** | `CompetitorDiscoveryAgent`, `WebCrawlingEngine` | `competitors`, `crawled_documents`, `intelligence_signals` | `GET /api/companies/{id}/competitors`<br>`GET /api/companies/{id}/signals?pillar=COMPETITOR` | `/companies/[id]/stack`<br>`CompetitorTrackerCard` | Monitor LeapScholar, Leverage Edu, IDP; extract announcements, pricing & feature moves. | **Completed & Verified** |
| **07** | **Market intelligence** | `SourceDiscoveryAgent`, `WebCrawlingEngine` | `intelligence_sources`, `intelligence_signals` | `GET /api/companies/{id}/signals?pillar=MARKET` | `/companies/[id]/signals`<br>`MarketPulseTab` | Ingest The PIE News, THE, UKVI, IRCC, NAFSA; extract visa policy changes and shifts. | **Completed & Verified** |
| **08** | **Internal intelligence through file uploads** | `DocumentService`, `RAGEngine` (ChromaDB, PyMuPDF, docx, pandas) | `internal_documents` | `POST /api/companies/{id}/documents/upload`<br>`GET /api/companies/{id}/documents` | `/companies/[id]/documents`<br>`DocumentUploadDropzone` | Upload PDF/DOCX/CSV/XLSX; verify chunking and semantic vector search in ChromaDB. | **Completed & Verified** |
| **09** | **Intelligent source discovery** | `SourceDiscoveryAgent` | `intelligence_sources` | `POST /api/companies/{id}/sources/discover` | `/companies/[id]/stack`<br>`DiscoveredSourcesTable` | Auto-discovers 20+ relevant feeds across customer, competitor, market, and internal categories. | **Completed & Verified** |
| **10** | **Source approval and management** | `SourceService` | `intelligence_sources` | `PUT /api/sources/{id}`<br>`POST /api/companies/{id}/sources` | `/companies/[id]/stack`<br>`SignalStackManager` | Discovered status default; approve, edit frequency, adjust reliability; custom source support. | **Completed & Verified** |
| **11** | **Real website crawling** | `WebCrawlingEngine` (HTTPX, robots.txt, rate limits) | `crawl_jobs`, `crawled_documents` | `POST /api/companies/{id}/crawl`<br>`GET /api/companies/{id}/crawl-history` | `/companies/[id]/stack`<br>`CrawlTriggerButton` | Real HTTP requests, robots.txt compliance, 1.5s rate limits, and honest error tracking. | **Completed & Verified** |
| **12** | **Content extraction and duplicate detection** | `CrawlerService`, `WebCrawlingEngine` | `crawled_documents` | `POST /api/companies/{id}/crawl` | Backend Service & Logs | Trafilatura text extraction, SHA-256 and SimHash deduplication, content revision tracking. | **Completed & Verified** |
| **13** | **Intelligence classification** | `IntelligenceAnalysisAgent` | `intelligence_signals` | `GET /api/companies/{id}/signals` | `/companies/[id]/signals`<br>`SignalClassificationBadge` | Classifies pillar (CUSTOMER/COMPETITOR/MARKET), urgency, direction, business impact. | **Completed & Verified** |
| **14** | **Signal ranking** | `SignalRankingEngine` | `intelligence_signals` | `GET /api/companies/{id}/signals?min_score=70` | `/companies/[id]/signals`<br>`RankedSignalsList` | Multi-factor transparent ranking (source reliability, evidence strength, strategic priority, recency). | **Completed & Verified** |
| **15** | **Evidence-backed AI analysis** | `IntelligenceAnalysisAgent` | `intelligence_signals`, `signal_evidences` | `GET /api/signals/{id}` | `/companies/[id]/signals`<br>`EvidenceDrawerModal` | **Zero Hallucination**: Verbatim extracted quote, source URL, date, and distinct AI interpretation. | **Completed & Verified** |
| **16** | **Monday Morning Brief generation** | `BriefService`, `RAGEngine` | `intelligence_briefs`, `brief_actions` | `POST /api/companies/{id}/briefs/generate`<br>`GET /api/briefs/{id}` | `/companies/[id]/briefs/[briefId]`<br>`ExecutiveBriefView` | 7-section executive briefing grounded in ranked signals and semantic vector RAG context. | **Completed & Verified** |
| **17** | **Weekly automated monitoring** | `SchedulerService` (APScheduler) | `scheduled_jobs` | `GET /api/companies/{id}/schedules`<br>`POST /api/companies/{id}/schedules` | `/companies/[id]/settings`<br>`SchedulerStatusCard` | APScheduler cron jobs automatically trigger recurring crawls and brief synthesis. | **Completed & Verified** |
| **18** | **Monthly source health audit** | `SourceHealthService` | `source_health_reports` | `POST /api/companies/{id}/source-audit` | `/companies/[id]/health`<br>`SourceHealthAuditMatrix` | Verifies latency, HTTP response status, failure count, and health status indicators. | **Completed & Verified** |
| **19** | **Historical records and reporting** | `BriefService`, `IntelligenceService` | `intelligence_briefs`, `intelligence_signals` | `GET /api/companies/{id}/briefs`<br>`GET /api/companies/{id}/signals` | `/companies/[id]/briefs`<br>`BriefArchiveView` | Historical archive retrieval, signal timeline queries, and actionable executive tasks. | **Completed & Verified** |
| **20** | **Testing with three different companies** | Multi-company configuration | Multi-tenant isolation | All endpoints parameterized with `company_id` | Top Nav `CompanySwitcher` | **1. MeetUniversity** (EdTech / Primary)<br>**2. Postman** (DevTools / API)<br>**3. Linear** (Project Management SaaS) | **Completed & Verified** |

---

## 2. Engineering Rules Compliance Checklist

| Rule # | Requirement | Architectural Enforcement Mechanism |
| :---: | :--- | :--- |
| **R1** | **Never fabricate news, competitors, sources or intelligence** | Signal analysis prompts strictly require verbatim extracted quotes from `crawled_documents`. Grounding checks discard any signal lacking a matching text chunk. |
| **R2** | **Every intelligence record must have traceable evidence** | `signal_evidences` table enforces `crawled_document_id` foreign key, source URL, crawl timestamp, and `exact_quote` field. |
| **R3** | **Separate verified facts from AI interpretations** | Strict schema segregation: `verified_fact` vs `ai_interpretation` vs `recommended_action` in both DB and UI components. |
| **R4** | **Store original source URLs and publication dates** | Ingested records capture canonical URL, origin URL, publishing timestamp, and author in `crawled_documents`. |
| **R5** | **Handle crawling failures gracefully** | `crawler_service` wraps all requests in try-except blocks, logs HTTP status codes, marks source health `WARNING` after 3 consecutive failures, and never crashes. |
| **R6** | **Respect robots.txt, website terms and rate limits** | `urllib.robotparser` checks every domain before scraping. Rate limiter enforces a minimum 1.5s delay between requests to the same domain. |
| **R7** | **Do not bypass authentication or technical protections** | The crawler strictly scrapes public pages, sitemaps, RSS feeds, and search snippets. No CAPTCHA bypassing or unauthorized credential stuffing. |
| **R8** | **Never hardcode competitors or interview questions** | Competitors are discovered via web search analysis; interview questions are dynamically generated one-by-one by the AI provider based on previous responses. |
| **R9** | **All companies must have dynamic configurations** | All state, sources, profiles, and briefs are isolated under `company_id`. Zero hardcoded company heuristics. |
| **R10** | **All major features must connect to backend and database** | No mock frontend states or fake client-only arrays. Every component calls real FastAPI endpoints backed by SQLite/PostgreSQL. |
| **R11** | **Do not use fake buttons or placeholder functionality** | Every button has an handler connected to an actual API route with loading, success, and error feedback. |
| **R12** | **Never expose API keys or secrets in frontend code** | All LLM keys (Groq, Gemini) and DB credentials remain strictly server-side in `.env` read by FastAPI's `pydantic-settings`. |
