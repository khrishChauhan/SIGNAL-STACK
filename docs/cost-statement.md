# Signal Stack — Cost & Free-Tier Architecture Statement

**Project**: Signal Stack — Company Intelligence & Executive Briefing Engine  
**Licensing & Cost Model**: 100% Free & Open Source Architecture  
**Per-Run Operational Cost**: **$0.00**

---

## 1. Executive Summary

A core design requirement of the Signal Stack platform is that it must operate **without requiring paid proprietary API keys** (such as OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, or paid SERP proxies). 

Every component in the architecture has been selected and implemented to function on free, open-source, or local-first tooling.

---

## 2. Component-by-Component Cost Breakdown

| Component | Selected Technology | Cost | Fallback / Zero-Setup Strategy |
| :--- | :--- | :--- | :--- |
| **LLM Inference** | Ollama (`llama3.2`, `mistral`) | **$0.00** | Runs locally on CPU/GPU. If Ollama is not installed or offline, the system automatically uses a deterministic heuristic NLP fallback that generates questions, extracts claims, and synthesizes briefs with zero dependencies. |
| **Cloud AI (Optional)** | Google Gemini / Groq | **$0.00** | Free tier API support included via pluggable adapter. |
| **Relational Database** | SQLite 3 (`aiosqlite`) / PostgreSQL | **$0.00** | Default local mode uses zero-dependency file-based SQLite database stored in `./data/signal_stack.db`. |
| **Vector Database & RAG** | ChromaDB (`chromadb`) | **$0.00** | Embedded local vector store running in-process; no Pinecone, Weaviate, or managed cloud vector instance required. |
| **Web Crawling & Extraction**| `httpx` + `feedparser` + `BeautifulSoup4` | **$0.00** | Autonomous crawler reads native RSS/Atom feeds, public sitemaps, and permitted HTML without paid scraping APIs (ScrapingBee, BrightData, SerpApi). |
| **Deduplication Engine** | SHA-256 + SimHash | **$0.00** | 100% CPU-based hashing and hamming distance bitwise operations. |
| **Document Parsing** | PyMuPDF (`fitz`), `python-docx`, `pandas` | **$0.00** | In-process native binary parsing for PDF, Word documents, Excel workbooks, and CSV tables. |
| **Automation & Scheduling** | APScheduler (`AsyncIOScheduler`) | **$0.00** | In-process asynchronous task scheduler; no paid enterprise orchestrators (Temporal Cloud, Airflow clusters) required. |
| **Frontend Framework** | Next.js 14 + Tailwind CSS + shadcn/ui | **$0.00** | Free, open-source MIT-licensed frontend stack. |

---

## 3. Total Cost of Evaluation & Continuous Operation

- **Evaluation Cost for Reviewers**: **$0.00**
- **Continuous 24/7 Monitoring Cost**: **$0.00** (Local machine or free-tier container)
- **Token Fees**: **$0.00**

Reviewers and engineers can clone the repository, install dependencies, run the test suites, seed the database, and run full crawls and executive brief generation without providing credit cards or API keys.
