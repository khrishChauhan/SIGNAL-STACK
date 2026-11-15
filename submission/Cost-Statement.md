# Infrastructure & Cost Statement — Signal Stack

**Project**: Signal Stack – Company Intelligence & Executive Briefing Engine  
**Assignment**: EDXSO AI Engineer Intern Assignment 1  
**Candidate**: Khrish Chauhan  
**Evaluation Standard**: Strict \$0 Paid API Budget Compliance  
**Verification Date**: November 15, 2026  

---

## 1. Executive Summary & Zero-Cost Budget Verification

Signal Stack was deliberately engineered to operate under a **strict \$0.00 operational budget** across both development and local/demonstration runtime. The architecture relies exclusively on **Free and Open-Source Software (FOSS)**, locally executed Large Language Models (LLMs), zero-dependency deterministic NLP algorithms, and local in-memory/file-based storage.

No paid APIs, closed proprietary endpoints (e.g. OpenAI, Anthropic, Google Cloud Vertex, Serper, SerpAPI), or commercial crawling proxies were utilized in the codebase.

```
Total Development Cost:     $0.00
Total Local Runtime Cost:   $0.00 / month
Total Cloud Production Cost: $0.00 / month (using verified free-tier infrastructure)
Mandatory Paid Services:    NONE
Credit Card / Billing:      NOT REQUIRED
```

---

## 2. Itemized Infrastructure Cost Breakdown

The following table provides an exhaustive breakdown across all ten evaluated functional components:

| # | System Component | Selected Technology | Purpose in Signal Stack | License / Pricing Model | Free Tier Limits | Payment Details Required? | Hosting Type | Actual Cost |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| **1** | **Core Backend Framework** | **FastAPI** + **Uvicorn** + **Pydantic v2** | High-performance asynchronous REST API, data validation, and request orchestration. | Open Source (MIT) | Unlimited local execution | No | Local / Self-Hosted | **\$0.00** |
| **2** | **Frontend Application** | **Next.js 14** (App Router) + **Tailwind CSS** + **shadcn/ui** | Enterprise SaaS dashboard, charts (Recharts), Framer Motion transitions, responsive layouts. | Open Source (MIT) | Unlimited local execution (Vercel Free Tier: 100GB bandwidth) | No | Local / Self-Hosted | **\$0.00** |
| **3** | **Relational Database** | **SQLite** (via `aiosqlite` & **SQLAlchemy 2.0**) | Structured persistence of 16 relational models, cascade deletes, foreign keys, and indexes. | Public Domain / MIT | Unlimited local storage (Single-file database) | No | Local File | **\$0.00** |
| **4** | **Primary AI Inference** | **Ollama** (**Meta Llama 3.2 3B**) | Dynamic 10-question adaptive interview, strategic inferences, and executive brief synthesis. | Open Source (Apache 2.0 / Llama 3 Community) | Unlimited local CPU/GPU inference | No | Local Host (`localhost:11434`) | **\$0.00** |
| **5** | **AI Fallback & Offline Engine** | **Deterministic Heuristic & NLP Engine** | Rule-based semantic extraction, regex pattern mining, and guaranteed non-hallucinatory synthesis. | Proprietary In-House FOSS | Unlimited execution; zero external network calls | No | In-Process Python Engine | **\$0.00** |
| **6** | **Search & Discovery Engine** | **DuckDuckGo Search (`ddgs`)** | Autonomous competitor discovery, forum identification, and source URL discovery. | Open Source (MIT) | Free public web search rate-limited responsibly | No | Client-Side Python Library | **\$0.00** |
| **7** | **Web Scraping & Ingestion** | **HTTPX** + **BeautifulSoup4** + **feedparser** | Resilient async crawling of RSS/Atom feeds, HTML DOM parsing, content sanitization, and SHA-256 hashing. | Open Source (BSD / MIT) | Unlimited execution governed by courtesy rate limits | No | In-Process Python Engine | **\$0.00** |
| **8** | **Document & Vector RAG** | **PyMuPDF (`fitz`)**, **python-docx**, **openpyxl**, Cosine Vector RAG | Multi-format parsing of PDF, Word, Excel, CSV files with in-memory semantic chunking and retrieval. | Open Source (AGPL / MIT) | Unlimited local parsing up to 25MB file thresholds | No | In-Memory Local Vector Store | **\$0.00** |
| **9** | **Job Automation & Scheduling** | **APScheduler** (`AsyncIOScheduler`) | Autonomous execution of Weekly Monday 06:00 AM briefing sweeps and Monthly Source Health audits. | Open Source (MIT) | Unlimited local cron schedules | No | In-Process Background Task | **\$0.00** |
| **10** | **Testing & Quality Assurance** | **Pytest** + **pytest-asyncio** + Edge Headless | Automated verification of 23 test suites and headless browser screenshot capture. | Open Source (MIT) | Unlimited test executions | No | Local CLI | **\$0.00** |

---

## 3. Detailed Component Analysis

### 1. Project Development Technology Costs: \$0.00
All development libraries and frameworks were sourced from standard package managers (PyPI and npm) under permissive open-source licenses (MIT, Apache 2.0, BSD). No commercial IDE licenses, paid debugging extensions, or commercial build tools were used.

### 2. Frontend Hosting Costs: \$0.00
* **Local Development**: Runs via Node.js on `localhost:3000` with zero external hosting overhead.
* **Production Deployment Option**: Next.js App Router applications deploy out-of-the-box on the **Vercel Hobby Plan** at **\$0.00/month** (includes unlimited static page generation, 100GB bandwidth, and automatic HTTPS). No credit card required.

### 3. Backend Hosting Costs: \$0.00
* **Local Development**: Runs via Uvicorn asynchronous server on `localhost:8000`.
* **Production Deployment Option**: Containerized Docker image (`python:3.12-slim`) can be deployed to **Render Free Tier**, **Koyeb Free Tier**, or a self-hosted VPS without incurring fees.

### 4. Database Costs: \$0.00
* **Local Architecture**: Uses SQLite via `aiosqlite`, storing all relational records in `data/signal_stack.db`. Single-file database architecture eliminates managed database server hosting charges entirely.
* **Production Migration Path**: Zero-cost migration to **Neon Serverless PostgreSQL** (Free Tier: 0.5GB compute, 10GB storage) or **Supabase Free Tier** (500MB database, 50,000 monthly active users) without credit card requirements.

### 5. AI Model and Inference Costs: \$0.00
* **Primary LLM**: Meta's **Llama 3.2** (3B parameter compact instruct model) executed locally via **Ollama**. Does not query paid endpoints like OpenAI `gpt-4o` (\$5.00/\$15.00 per 1M tokens) or Anthropic `claude-3-5-sonnet` (\$3.00/\$15.00 per 1M tokens).
* **Deterministic Fallback Engine**: If Ollama is offline or uninstalled, the system routes tasks through `backend/app/services/ai/fallback_provider.py`. This engine uses regex extraction, structural heuristic parsing, semantic cosine similarity, and template synthesis, generating zero API billing.

### 6. Web Search and Crawling Costs: \$0.00
* **Competitor & Source Discovery**: Utilizes `duckduckgo_search` (`ddgs`) which interfaces with public search interfaces without requiring paid search API subscriptions (unlike Serper at \$50/month or Google Custom Search at \$5/1000 queries).
* **Content Ingestion**: Direct HTTP crawling using `httpx` with exponential backoff and polite delay intervals (`CRAWLER_MIN_DELAY_SECONDS = 1.0`). No paid residential proxy networks (e.g. BrightData, Smartproxy) are needed for the permitted public newsrooms and RSS feeds.

### 7. Document Processing Costs: \$0.00
* Multi-format parsing of `.pdf`, `.docx`, `.xlsx`, and `.csv` files uses native Python libraries (`PyMuPDF`, `python-docx`, `openpyxl`). Does not call paid OCR or document analysis cloud services (such as AWS Textract at \$1.50/1000 pages or Google Document AI).

### 8. Scheduling Costs: \$0.00
* Task scheduling is embedded directly within the FastAPI process lifecycle using `APScheduler`. Does not require paid third-party cron microservices (e.g. Cronhub, AWS EventBridge, Zeplo).

---

## 4. Distinction Between FOSS, Free Cloud Tiers, and Commercial Services

To ensure complete transparency for technical evaluation, the system's software components are classified below:

| Classification | Technologies Used | Operational Status | Risk of Incurring Charges |
| :--- | :--- | :--- | :--- |
| **Free & Open-Source (FOSS)** | FastAPI, Next.js, SQLite, SQLAlchemy, Pydantic, Tailwind CSS, Pytest, Ollama, PyMuPDF, APScheduler | **Core System (Active)** | **0% — Cannot incur charges under any circumstances.** |
| **Free Public Web APIs** | DuckDuckGo (`ddgs`), Public RSS/Atom Feeds (UKVI, LeapScholar, ICEF, Reddit RSS) | **Active Discovery** | **0% — No authentication keys or billing tokens configured.** |
| **Optional Cloud Free Tiers** | Vercel Hobby, Render Web Service, Neon PostgreSQL | **Optional for Deployment** | **0% — Hard free limits prevent automated overage billing.** |
| **Commercial / Paid APIs** | OpenAI GPT-4, Anthropic Claude, Serper, ProxyMesh | **NOT IMPLEMENTED / OMITTED** | **N/A — Not present in repository.** |

---

## 5. Formal Compliance Statement

> **Final Declaration**:  
> I hereby confirm that **Signal Stack – Company Intelligence & Executive Briefing Engine** has been designed, implemented, and verified with **zero financial expenditure**. The repository contains **no hardcoded API keys**, **no credit-card-backed subscriptions**, and **no third-party paid endpoints**.  
> The project completely and verifiably satisfies the **EDXSO AI Engineer Intern Assignment requirement for a 100% free, zero-paid-API implementation**.
