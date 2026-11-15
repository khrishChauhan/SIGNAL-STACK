# Signal Stack — EDXSO AI Engineer Intern Assignment 1 Submission

**Candidate**: Khrish Chauhan  
**Project**: **Signal Stack – Company Intelligence & Executive Briefing Engine**  
**Repository**: [https://github.com/khrishChauhan/SIGNAL-STACK.git](https://github.com/khrishChauhan/SIGNAL-STACK.git)  
**Submission Date**: November 15, 2026  

---

## Executive Summary

Signal Stack is an autonomous, evidence-backed company intelligence and executive briefing engine engineered to continuously monitor, verify, and synthesize external signals across four critical business pillars:
1. **Customers** (public forums, review portals, social sentiment)
2. **Competitors** (pricing adjustments, career pages, newsrooms, product changelogs)
3. **Market & Policy** (regulatory gazettes, destination visas, industry journals)
4. **Internal Business Context** (uploaded strategy documents, roadmaps, customer surveys)

The system completely satisfies the assignment's **\$0 paid API restriction** by combining a dual-engine architecture: local **Meta Llama 3.2** inference via **Ollama** paired with a zero-dependency **Deterministic Heuristic & NLP Fallback Engine**, multi-format vector RAG retrieval, and scheduled autonomous Monday Morning Brief generation via APScheduler.

---

## Directory Navigation & Deliverables

All required submission deliverables are organized inside this `submission/` package:

| Deliverable | File Path | Description |
| :--- | :--- | :--- |
| **Technical Documentation** | [`Technical-Documentation.md`](Technical-Documentation.md) | Comprehensive 5-page system architecture, data models, algorithm specifications, and security design. |
| **Cost & Infrastructure Statement** | [`Cost-Statement.md`](Cost-Statement.md) | Itemized \$0 budget verification across all 10 infrastructure components, confirming zero paid API dependencies. |
| **Test Evidence & Validation Report** | [`Test-Evidence-and-Validation.md`](Test-Evidence-and-Validation.md) | Empirical test results across 23 unit/integration test suites, API matrix, crawling audits, and requirement traceability. |
| **Primary Brief (MeetUniversity)** | [`MeetUniversity-Intelligence-Brief.md`](MeetUniversity-Intelligence-Brief.md) | Complete 10-section executive brief grounded in live public sources (UKVI, LeapScholar, ICEF, Reddit). |
| **Secondary Brief (Postman)** | [`Company-Two-Intelligence-Brief.md`](Company-Two-Intelligence-Brief.md) | Reusability test brief for Developer Tools / API Platform domain (Bruno, Hacker News, G2). |
| **Tertiary Brief (Linear)** | [`Company-Three-Intelligence-Brief.md`](Company-Three-Intelligence-Brief.md) | Reusability test brief for Enterprise SaaS / Issue Tracking domain (Atlassian Jira, TechCrunch). |
| **Application Screenshots** | [`screenshots/`](screenshots/) | 11 genuine full-resolution screenshots captured directly from the live application environment. |

---

## Screenshots Directory Index

Genuine screenshots captured from the running application:

1. [`01_dashboard_overview.png`](screenshots/01_dashboard_overview.png) — Key telemetry metrics, pillar distribution charts, and executive preview.
2. [`02_company_intelligence.png`](screenshots/02_company_intelligence.png) — Empirical profile separating verified facts, inferences, and unknown information.
3. [`03_ai_interview.png`](screenshots/03_ai_interview.png) — Adaptive 10-question strategic calibration session.
4. [`04_signal_stack.png`](screenshots/04_signal_stack.png) — Active source stack management with category filtering and approval controls.
5. [`05_intelligence_feed.png`](screenshots/05_intelligence_feed.png) — Ranked intelligence signals with transparent multi-factor scoring.
6. [`06_competitors.png`](screenshots/06_competitors.png) — Competitive landscape tracking direct, indirect, and emerging rivals.
7. [`07_monday_brief.png`](screenshots/07_monday_brief.png) — 10-section executive intelligence brief with actionable P0/P1/P2 priorities.
8. [`08_internal_documents.png`](screenshots/08_internal_documents.png) — Drag-and-drop ingestion of PDF, DOCX, CSV, and XLSX into RAG vector space.
9. [`09_source_manager.png`](screenshots/09_source_manager.png) — Source latency, health monitoring, and audit status.
10. [`10_automation_settings.png`](screenshots/10_automation_settings.png) — APScheduler cron trigger controls and timezone configuration.
11. [`11_api_docs_swagger.png`](screenshots/11_api_docs_swagger.png) — Interactive FastAPI OpenAPI documentation (`/docs`).

---

## Quickstart: Running the System Locally

### Prerequisites
- **Python**: 3.11+ (Python 3.12.7 verified)
- **Node.js**: v18+ (Node.js v20.18.0 verified)
- **Git**

### 1. Backend Setup & Startup
```powershell
# Navigate to repository root
cd "SIGNAL STACK"

# Create and activate virtual environment
python -m venv backend/.venv
.\backend\.venv\Scripts\activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Seed demonstration database (MeetUniversity, Postman, Linear)
python backend/app/db/seed.py

# Launch FastAPI backend (Port 8000)
python backend/run.py
```
*API is accessible at `http://localhost:8000`, interactive docs at `http://localhost:8000/docs`.*

### 2. Frontend Setup & Startup
```powershell
# In a new terminal window:
cd "SIGNAL STACK/frontend"

# Install dependencies
npm install

# Launch Next.js dev server (Port 3000)
npm run dev
```
*Frontend dashboard is accessible at `http://localhost:3000`.*

### 3. Running Backend Tests
```powershell
.\backend\.venv\Scripts\pytest.exe -v backend/tests
```
*Result: 23 passed in ~26s.*

---

## Verification Statement
All records, source feeds, intelligence rankings, briefs, and test runs included in this submission package were executed against genuine application code and persistent database state in accordance with the EDXSO evaluation guidelines.
