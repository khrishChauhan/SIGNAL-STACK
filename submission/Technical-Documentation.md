# Technical Documentation: Signal Stack
### Company Intelligence & Executive Briefing Engine

**Author**: Khrish Chauhan  
**Project**: Signal Stack – Autonomous Executive Briefing Engine  
**Assignment**: EDXSO AI Engineer Intern Assignment 1  
**Repository**: [https://github.com/khrishChauhan/SIGNAL-STACK.git](https://github.com/khrishChauhan/SIGNAL-STACK.git)  
**Date**: November 15, 2026 | **Version**: 1.0.0 Production  

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Company Research & Adaptive Interview Agent](#4-company-research--adaptive-interview-agent)
5. [Source Discovery & The Four Pillars of Signal Stack](#5-source-discovery--the-four-pillars-of-signal-stack)
6. [Web Crawling, Ingestion & Deduplication](#6-web-crawling-ingestion--deduplication)
7. [Intelligence Analysis & Multi-Factor Signal Ranking](#7-intelligence-analysis--multi-factor-signal-ranking)
8. [Monday Morning Executive Brief Synthesis](#8-monday-morning-executive-brief-synthesis)
9. [Automation & Background Scheduling Engine](#9-automation--background-scheduling-engine)
10. [Reliability, Security & Responsible Scraping](#10-reliability-security--responsible-scraping)
11. [Setup, Execution & Demonstration Reproduction](#11-setup-execution--demonstration-reproduction)
12. [Known Limitations & Future Roadmap](#12-known-limitations--future-roadmap)

---

## 1. Project Overview

### 1.1 What Signal Stack Does
Signal Stack is an autonomous executive intelligence engine designed for startup founders, Chief Strategy Officers, and executive leadership. It continuously scans the public web across competitors, customers, and regulatory shifts, cross-references these signals against internal company strategy, and synthesizes a high-signal **Monday Morning Executive Brief** accompanied by prioritized action items (P0, P1, P2).

### 1.2 Problem It Solves
Modern executives suffer from acute signal-to-noise fragmentation:
* Important competitor pricing changes and customer frustrations are buried in forums (Reddit, Trustpilot, G2, Hacker News).
* Macro regulatory gazettes and visa shifts (e.g. UKVI, IRCC) alter business models overnight without warning.
* Generic LLM wrappers hallucinate facts and lack empirical evidence citations.
Signal Stack replaces manual scanning with a verifiable RAG and web research pipeline where **every reported signal contains a direct URL, quote, and verifiable status**.

### 1.3 Target Users
* **Founders & CEOs**: Receiving rapid weekly strategic awareness without browsing dozens of websites.
* **Corporate Strategy Leads**: Benchmarking competitor moves and market risks against internal OKRs.
* **Product & Market Research Teams**: Spotting customer complaints to capture market share.

### 1.4 Core Capabilities
1. **Autonomous Company Discovery**: Crawls company domains to extract value propositions, moats, and business models.
2. **Adaptive 10-Question Calibration**: Dynamic AI interview that calibrates to founder answers and allows confidential skips.
3. **Four-Pillar Source Stack**: Organizes monitored feeds into Customers, Competitors, Market & Policy, and Internal Documents.
4. **Resilient Web Crawler**: Respectful async HTTP/RSS crawler with SHA-256 deduplication and revision tracking.
5. **Multi-Factor Signal Ranking**: Transparent scoring ($0-100$) evaluating urgency, credibility, relevance, and business impact.
6. **Executive Brief Synthesis**: Structured 10-section briefing with one-click export and printable layout.
7. **Zero Paid API Cost**: Complete operation via local Llama 3.2 (Ollama) or a deterministic NLP engine with zero billing.

---

## 2. System Architecture

Signal Stack follows a clean separation of concerns, decoupling asynchronous ingestion from synchronous RESTful presentation:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 14 APP ROUTER DASHBOARD                       │
│  (Tailwind CSS, shadcn/ui, Recharts, Framer Motion, TypeScript Client)    │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │ HTTP / JSON REST APIs
┌─────────────────────────────────▼────────────────────────────────────────┐
│                        FASTAPI ASYNCHRONOUS BACKEND                      │
│   ├── REST Routers (/companies, /interviews, /sources, /signals, /briefs)│
│   ├── Pydantic v2 Envelopes (Data validation & JSON Serialization)       │
│   └── Background Task Workers (Crawler, Signal Analyzer, Brief Engine)   │
└──────────┬──────────────────────┬───────────────────────┬────────────────┘
           │                      │                       │
┌──────────▼──────────┐ ┌─────────▼─────────────┐ ┌───────▼────────────────┐
│   INTELLIGENCE      │ │      AI ENGINE        │ │  DATABASE & PERSISTENCE│
│      SERVICES       │ │ ├── Ollama (Llama 3.2)│ │ ├── SQLite + aiosqlite │
│ ├── Crawler Engine  │ │ └── Deterministic NLP │ │ ├── SQLAlchemy 2.0 ORM │
│ ├── DuckDuckGo Tool │ │     Fallback Engine   │ │ └── 16 Relational Models│
│ └── Vector RAG Store│ │                       │ │     (Cascades & Indices)│
└─────────────────────┘ └───────────────────────┘ └────────────────────────┘
```

* **Frontend Architecture**: Built using Next.js 14 App Router, React 18, and Tailwind CSS. State management leverages optimistic React hooks with a global `CompanyContext`. Dark navy sidebar (`#0B132B`) frames a high-contrast enterprise workspace.
* **Backend Architecture**: Asynchronous Python 3.12 architecture running on FastAPI and Uvicorn. Implements uniform response envelopes (`{ success, data, message, error, timestamp }`), dependency injection for database sessions, and centralized exception handling.
* **Database Architecture**: Managed via SQLAlchemy 2.0 with async SQLite (`aiosqlite`) for zero-configuration local execution, supporting foreign-key cascading and indexed lookups.
* **AI Architecture**: Dual-engine interface (`AIServiceInterface`). Routes requests to local **Meta Llama 3.2** via Ollama (`http://localhost:11434`) when available, falling back gracefully to a **Deterministic Heuristic & NLP Engine** to guarantee 100% uptime with zero hallucination.
* **RAG Architecture**: In-memory vector store indexing uploaded strategy documents (`.pdf`, `.docx`, `.xlsx`, `.csv`) and crawled records. Chunks documents into 350-character windows with 50-character overlaps and computes cosine similarities against incoming market signals.

---

## 3. Technology Stack

| Layer | Technology | Selection Justification | Role in System |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | **Next.js 14 (App Router)** | Server-side rendering, static page optimization, fast client navigation. | Single Page Application shell and routing. |
| **Frontend Styling** | **Tailwind CSS + shadcn/ui** | Rapid, design-token-based enterprise styling without bulky component libraries. | Design tokens, typography, dark navy sidebar, cards. |
| **Data Visualization** | **Recharts** | Lightweight declarative SVG charts without external canvas bloat. | Signal pillar distribution bar charts and telemetry graphs. |
| **Backend API** | **FastAPI 0.115** | Native `asyncio` concurrency, automatic OpenAPI docs generation, high throughput. | REST API endpoints, request routing, middleware. |
| **Data Validation** | **Pydantic v2** | Rust-backed speed for request validation and serialization. | Request bodies, response models, configuration settings. |
| **ORM / Storage** | **SQLAlchemy 2.0 + aiosqlite** | Mature async relational mapping with full migrations capability. | 16 database models, session management, SQLite persistence. |
| **Local AI Engine** | **Ollama (Llama 3.2 3B)** | Compact, instruction-tuned model running fully local with zero API charges. | Question generation, signal interpretation, briefing synthesis. |
| **Deterministic NLP** | **Regex & Pattern Extractors** | Zero external dependencies, guaranteed reproducibility, zero hallucination. | Fallback offline analysis, headline parsing, metric calculation. |
| **Web Ingestion** | **HTTPX + BeautifulSoup4** | High-performance async HTTP client with robust DOM tree sanitization. | Multi-page company discovery and RSS feed parsing. |
| **Document Parsing** | **PyMuPDF (`fitz`), python-docx** | Native in-memory text and table extraction without cloud services. | Parsing PDF internal OKRs, Word briefs, and CSV sheets. |
| **Automation** | **APScheduler 3.10** | Embedded async cron job engine running inside the FastAPI process. | Weekly Monday 06:00 AM sweeps and monthly audits. |

---

## 4. Company Research & Adaptive Interview Agent

### 4.1 Multi-Page Company Research Agent
Upon entering a company name and URL (e.g. `https://www.meetuniversity.com`), the `CompanyResearchAgent`:
1. Fetches the homepage and discovers high-value sub-routes (`/about`, `/solutions`, `/pricing`, `/services`).
2. Extracts plain text and cleans navigation noise.
3. Prompts the intelligence engine to extract: value proposition, target customer segment, business model, core moats, and known vulnerabilities.
4. Categorizes findings strictly into:
   * **Verified Empirical Facts**: Directly quoted claims paired with evidence URLs.
   * **AI Strategic Inferences**: Market positioning deductions.
   * **Unknown Information**: Unstated metrics (e.g. churn rate, capitalization).

### 4.2 Adaptive 10-Question Calibration Agent
Rather than presenting a static list of questions, the `AdaptiveInterviewAgent` executes an iterative interview across 10 strategic dimensions:
1. Revenue Streams & Monetization
2. Customer Segments
3. Core Customer Pain Points
4. Defensible Moats
5. Competitors & Substitutes
6. Market Trends & Regulatory Risks
7. Primary Growth Objectives
8. Sensitive Risks & Threats
9. Internal Resource Constraints
10. Key Founder Strategic Bets

**Memory & Follow-Up Mechanics**:
Every answer submitted is persisted to the database. The agent appends all previous Q&A pairs to the context before generating the next question. If a founder mentions *"We monetize via 12% university placement commissions"*, Question 2 automatically adapts: *"Given your 12% placement commission model, how do shifts in destination visa caps affect your commission collections?"*

Founders may **skip** confidential questions; the agent flags the question as skipped, records the reason, and pivots to the next dimension without breaking calibration.

---

## 5. Source Discovery & The Four Pillars of Signal Stack

Signal Stack categorizes all monitored feeds into four discrete operational pillars:

```
                              SIGNAL STACK FOUR PILLARS
┌───────────────────────────┬───────────────────────────┬───────────────────────────┬───────────────────────────┐
│        CUSTOMERS          │        COMPETITORS        │      MARKET & POLICY      │    INTERNAL BUSINESS      │
├───────────────────────────┼───────────────────────────┼───────────────────────────┼───────────────────────────┤
│ • Reddit r/Indians_Study..│ • LeapScholar Product Blog│ • UKVI Gazette Atom Feed  │ • Uploaded FY26 OKRs (PDF)│
│ • Trustpilot Reviews Feed │ • Leverage Edu Newsroom   │ • ICEF Monitor Mobility   │ • Customer Survey (CSV)   │
│ • Yocket Student Forum    │ • Competitor Careers Page │ • IRCC Canadian Permit Hub│ • Board Decks (DOCX)      │
└───────────────────────────┴───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

### 5.1 Source Discovery Pipeline
The `SourceDiscoveryAgent` queries DuckDuckGo (`ddgs`) with dynamic Boolean queries combining the company domain, competitor names, and target keywords (`site:reddit.com`, `reviews`, `news feed`). It scores discovered sources on:
* **Relevance Score ($0.0 - 1.0$)**: Semantic match with company domain.
* **Reliability Score ($0.0 - 1.0$)**: Domain authority (official government gazettes = 0.99, Reddit = 0.80).

### 5.2 Approval Lifecycle & Human-in-the-Loop Governance
Discovered sources are initially staged as `PENDING_REVIEW`. Founders can approve (`APPROVED`), pause (`PAUSED`), or reject (`REJECTED`) sources via the **Signal Stack Manager** (`/sources/stack`). Automated crawlers only monitor sources marked `APPROVED` or `CUSTOM`.

---

## 6. Web Crawling, Ingestion & Deduplication

### 6.1 Crawling Methodology
The `CrawlingEngine` handles both standard HTML web pages and structured XML/RSS/Atom feeds asynchronously:
* Employs custom identification (`SignalStackBot/1.0`).
* Enforces polite request intervals (`CRAWLER_MIN_DELAY_SECONDS = 1.0`).
* Implements a 15-second timeout with automated retries.

### 6.2 SHA-256 Deduplication & Content Versioning
To prevent re-processing identical content:
1. Extracted text is normalized (stripped of whitespace and timestamps).
2. A SHA-256 content hash is computed:
   $$\text{ContentHash} = \text{SHA256}(\text{normalized\_text})$$
3. If an existing `CrawledDocument` shares the same URL and hash, the crawl job marks it as `DUPLICATE` and updates `last_seen_at` without re-triggering signal extraction.
4. If content differs, a new document revision is created, preserving historical change logs.

### 6.3 Source Health Monitoring
Every request tracks HTTP status, response latency, and network failures. If a source records 5 consecutive failures, its `health_status` transitions from `HEALTHY` to `WARNING`. At 10 failures, it transitions to `BROKEN`.

---

## 7. Intelligence Analysis & Multi-Factor Signal Ranking

### 7.1 Evidence Extraction & Impact Assessment
When raw crawled documents arrive, the `IntelligenceAnalysisAgent`:
1. Identifies significant events (pricing changes, visa updates, competitor launches).
2. Extracts verbatim evidence quotes and pairs them with origin URLs.
3. Classifies direction: **OPPORTUNITY** (growth vector) vs. **THREAT** (defensive watch) vs. **NEUTRAL**.
4. Categorizes business urgency: **CRITICAL**, **HIGH**, **MEDIUM**, **LOW**.

### 7.2 Transparent Multi-Factor Signal Ranking Formula
Unlike opaque black-box models, Signal Stack computes a deterministic, audit-traceable ranking score ($0 - 100$):

$$\text{RankingScore} = (\text{Relevance} \times 0.35) + (\text{Urgency} \times 0.25) + (\text{Impact} \times 0.25) + (\text{Reliability} \times 0.15)$$

Where:
* $\text{Relevance}$ ($0 - 100$): Semantic cosine similarity between signal content and company profile.
* $\text{Urgency}$ ($0 - 100$): $\text{CRITICAL} = 100$, $\text{HIGH} = 80$, $\text{MEDIUM} = 50$, $\text{LOW} = 20$.
* $\text{Impact}$ ($0 - 100$): Assessed strategic consequence on revenue, operations, or retention.
* $\text{Reliability}$ ($0 - 100$): Historical accuracy and domain authority of the source feed.

Signals scoring $\ge 70$ are elevated to executive attention; signals scoring $\ge 85$ trigger immediate briefing alerts.

---

## 8. Monday Morning Executive Brief Synthesis

The `MondayBriefService` executes every Monday at 06:00 AM (or on manual trigger), compiling a structured 10-section briefing:

1. **Executive Summary**: Exactly 5 bullet points synthesizing the week's most critical developments.
2. **Customer Signals**: Customer sentiment shifts, pain points, and public complaints.
3. **Competitor Intelligence**: New competitor features, pricing adjustments, and hiring signals.
4. **Market Intelligence**: Regulatory gazettes, visa policy changes, and macroeconomic reports.
5. **Internal Business Intelligence**: Strategic validation against uploaded company OKRs.
6. **Actionable Opportunities**: At least 3 concrete growth vectors grounded strictly in verified evidence.
7. **Risks & Threats**: Ranked threats paired with actionable risk mitigation strategies.
8. **Recommended Actions for This Week**: Action items with assigned owners, deadlines, and priorities (**P0**, **P1**, **P2**).
9. **What We Should Watch**: Emerging indicators to track over the upcoming 14–30 days.
10. **Source Appendix**: Comprehensive evidence table linking origin sources, direct URLs, dates, and verification status.

**Strict Non-Hallucination Guardrail**:
If no meaningful competitor movements or regulatory changes occurred during the crawl cycle, the report explicitly states: *"No significant new movements detected this week."* The engine is forbidden from fabricating news to populate empty sections.

---

## 9. Automation & Background Scheduling Engine

Signal Stack leverages `APScheduler` (`AsyncIOScheduler`) embedded directly in the FastAPI lifecycle:

```python
# Weekly Monday Briefing Cron Trigger (06:00 AM local time)
scheduler.add_job(
    weekly_briefing_workflow,
    trigger=CronTrigger(day_of_week="mon", hour=6, minute=0, timezone="UTC"),
    id="weekly_brief_job"
)

# Monthly Source Stack Health Audit (1st of each month at 02:00 AM)
scheduler.add_job(
    monthly_source_audit_workflow,
    trigger=CronTrigger(day=1, hour=2, minute=0, timezone="UTC"),
    id="monthly_audit_job"
)
```

* **Independent Execution**: Scheduled jobs execute asynchronously in background worker threads without blocking user-facing API requests.
* **Manual Overrides**: Executives can trigger immediate briefing compilation or source health audits on-demand via the dashboard.
* **Governance Rule**: The system **never automatically deletes** a failing source during monthly audits without explicit human-in-the-loop confirmation.

---

## 10. Reliability, Security & Responsible Scraping

* **Data Validation**: Strict Pydantic v2 schemas reject malformed payloads before database interaction.
* **File Upload Protections**: Internal document ingestion enforces a 25MB maximum size restriction and strictly whitelists extensions (`.pdf`, `.docx`, `.csv`, `.xlsx`, `.txt`).
* **Environment Isolation**: Database URLs, AI endpoints, and rate limits are managed via `.env` with secure fallback defaults.
* **Polite Crawling Compliance**: The crawler respects `robots.txt` directives, implements domain-level request throttling, and transmits verifiable contact info in its User-Agent header.

---

## 11. Setup, Execution & Demonstration Reproduction

### Prerequisites
* Python 3.11+ (Tested on Python 3.12.7)
* Node.js v18+ (Tested on Node.js v20.18.0)
* Git

### Step 1: Clone & Configure
```bash
git clone https://github.com/khrishChauhan/SIGNAL-STACK.git
cd SIGNAL-STACK
```

### Step 2: Backend Setup & Seed
```powershell
python -m venv backend/.venv
.\backend\.venv\Scripts\activate
pip install -r backend/requirements.txt
python backend/app/db/seed.py
python backend/run.py
```
*Backend runs on `http://localhost:8000`. Interactive OpenAPI documentation at `http://localhost:8000/docs`.*

### Step 3: Frontend Dashboard Setup
```powershell
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

### Step 4: Reproducing the Evaluation Workflow
1. Navigate to `http://localhost:3000`.
2. Select **MeetUniversity** from the top company selector.
3. Review the **Overview Dashboard** metrics, pillar distribution charts, and latest crawl telemetry.
4. Visit **AI Interview** (`/interview`) to observe adaptive question generation and answer submission.
5. Visit **Signal Stack** (`/sources/stack`) to inspect approved customer, competitor, and market sources.
6. Visit **Monday Brief** (`/briefs`) to review the 10-section executive brief, toggle P0/P1/P2 action items, and test printable export.
7. Switch companies to **Postman** or **Linear** to verify domain reusability across Developer Tools and Enterprise SaaS.

---

## 12. Known Limitations & Future Roadmap

* **JavaScript-Heavy Single-Page Sites**: The crawler utilizes `httpx` and `BeautifulSoup4` for lightweight, low-overhead scraping. Highly obfuscated single-page applications rendered exclusively via client-side JavaScript require integration with a headless browser runner (e.g. Playwright) for deep DOM extraction.
* **Vector Store Persistence**: The current RAG implementation utilizes an optimized in-memory vector store with cosine distance computation. While ideal for zero-setup execution, production enterprise scale with tens of thousands of internal documents would benefit from persistent vector backends like pgvector or Qdrant.
* **Multi-Language Cross-Lingual Translation**: Intelligence feeds currently prioritize English-language public sources. Ingesting East Asian or Latin American regional journals will require upstream translation pipelines.
