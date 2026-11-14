# Signal Stack — Known Technical Limitations & Mitigation Strategies

This document provides transparent technical disclosure regarding current operational constraints, edge case behaviors, and engineering mitigation strategies in Signal Stack.

---

## 1. Web Crawling & Public Content Ingestion

### 1.1. Client-Side JavaScript SPAs & Anti-Bot Protection
- **Constraint**: Websites that render 100% of their DOM client-side using JavaScript frameworks (without SSR/SSG) or gate content behind Cloudflare Turnstile/Bot Management cannot be rendered by lightweight HTTP GET clients (`httpx`).
- **Mitigation**: 
  - The crawler prioritizes high-fidelity syndicated feeds (RSS 2.0, Atom XML, JSON Feed), which bypass client-side DOM rendering completely.
  - When scraping HTML, the parser looks for Open Graph meta tags (`og:description`, `og:title`, `article:published_time`), JSON-LD schema objects, and standard HTML5 `<article>`/`<main>` tags.
  - In a future release, a headless browser sidecar (Playwright/Puppeteer) can be attached for JS-heavy rendering.

### 1.2. Robots.txt Exclusions
- **Constraint**: Certain public corporate domains explicitly forbid web crawlers in `robots.txt` (`Disallow: /`).
- **Mitigation**: Signal Stack strictly complies with web standards. If a target URL is excluded by `robots.txt`, the crawler logs a transparent status `BLOCKED_BY_ROBOTS_TXT`, does not violate site terms, and flags the source in the Monthly Health Audit for human replacement.

### 1.3. Malformed Public RSS Feeds
- **Constraint**: Public RSS feeds frequently experience XML syntax errors, unescaped characters, or temporary HTML maintenance pages.
- **Mitigation**: The `feedparser` and `xml.etree` extraction routines catch all parse errors, record an error trace in `CrawlJob`, and continue crawling remaining sources without aborting the batch.

---

## 2. Artificial Intelligence & NLP Processing

### 2.1. Local LLM Hardware Acceleration & Latency
- **Constraint**: Running 7B or 8B parameter models locally via Ollama (`llama3.2:3b`, `mistral:7b`) on CPU-only machines can take 5–15 seconds per prompt.
- **Mitigation**:
  - Pluggable provider architecture with a configurable timeout (`AI_TIMEOUT_SECONDS=45`).
  - Seamless automatic failover to the built-in deterministic heuristic fallback engine. The heuristic engine processes question generation, entity extraction, and brief synthesis in < 15 milliseconds.
  - Optional support for ultra-fast cloud free-tier inference (Groq Llama-3.1-70b: ~300 tokens/sec, or Google Gemini Flash).

### 2.2. Vector Embeddings Dimension Compatibility
- **Constraint**: ChromaDB embeddings rely on `all-MiniLM-L6-v2` (384 dimensions). Mixing embeddings across different provider models could cause distance distortions.
- **Mitigation**: All local chunks and RAG queries are vectorized using the standardized embedded model through sentence-transformers/ChromaDB defaults.

---

## 3. Database & Concurrency

### 3.1. SQLite File Locking Under High Concurrency
- **Constraint**: SQLite in default mode serializes write transactions, which can result in `database is locked` if numerous simultaneous write jobs execute concurrently.
- **Mitigation**:
  - The database is configured with WAL (Write-Ahead Logging) mode and `aiosqlite` async connection handling.
  - For high-volume production deployments, changing `DATABASE_URL` to PostgreSQL (`postgresql+asyncpg://`) enables full multi-master concurrent writing without code changes.

---

## 4. Source Discovery Scope

### 4.1. Paywalled & Walled Garden Content
- **Constraint**: Private Facebook groups, private Slack/Discord communities, gated LinkedIn company insights, and paywalled financial press (Bloomberg, Wall Street Journal) cannot be scraped without authentication credentials.
- **Mitigation**:
  - The discovery engine focuses on permitted public platforms: public Reddit subreddits, YouTube transcripts, Hacker News, government regulatory gazettes, and public press releases.
  - Founders can ingest proprietary or gated intelligence via the **Internal Documents** interface (.pdf, .docx, .xlsx, .csv), which vectorizes and cross-references private records against public signals in the weekly brief.
