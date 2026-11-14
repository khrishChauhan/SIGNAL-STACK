# Signal Stack — Environment Configuration Guide

This guide details all environment variables supported by the Signal Stack backend and frontend.

---

## 1. Quickstart Configuration

For immediate zero-setup execution, Signal Stack uses a pre-configured `.env` file located at the repository root.

```env
# Application Core
APP_NAME=Signal Stack
ENVIRONMENT=development
DEBUG=True
API_V1_PREFIX=/api/v1
SECRET_KEY=signal-stack-super-secret-key-change-in-production-min-32-chars

# Database Configuration (SQLite default / zero external dependencies)
DATABASE_URL=sqlite+aiosqlite:///./data/signal_stack.db

# Free & Open Source AI Provider Settings
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
AI_TIMEOUT_SECONDS=45

# Web Crawling & Content Extraction
CRAWLER_USER_AGENT=SignalStackBot/1.0 (+https://signalstack.ai/bot; bot@signalstack.ai)
CRAWLER_TIMEOUT_SECONDS=20
CRAWLER_MAX_CONCURRENT=5
CRAWLER_MAX_PAGES_PER_SOURCE=15

# Document Storage & Internal RAG Vector Store
UPLOAD_DIR=./data/uploads
MAX_UPLOAD_SIZE_MB=25
ALLOWED_UPLOAD_EXTENSIONS=[".pdf",".docx",".xlsx",".csv"]
CHROMA_PERSIST_DIR=./data/chromadb

# Scheduled Background Automation
ENABLE_SCHEDULER=True
WEEKLY_BRIEF_CRON="0 6 * * 1"
MONTHLY_AUDIT_CRON="0 0 1 * *"

# CORS Security
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

---

## 2. Variable Reference Table

| Variable | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | String | `sqlite+aiosqlite:///./data/signal_stack.db` | SQLAlchemy 2.0 Async connection string. Supports SQLite and PostgreSQL (`postgresql+asyncpg://user:pass@host:5432/db`). |
| `AI_PROVIDER` | Enum | `ollama` | Selected primary AI provider: `ollama`, `gemini`, `groq`, or `fallback`. If the primary fails, the engine cascades automatically to heuristic fallback. |
| `OLLAMA_BASE_URL` | URL | `http://localhost:11434` | HTTP address of local Ollama daemon. |
| `OLLAMA_MODEL` | String | `llama3.2` | Ollama model name (e.g. `llama3.2`, `mistral`, `qwen2.5`). |
| `GEMINI_API_KEY` | String | *Optional* | Google Gemini Free-tier API key if using Gemini provider. |
| `GROQ_API_KEY` | String | *Optional* | Groq Cloud Free-tier API key for high-speed Llama-3.1 inference. |
| `AI_TIMEOUT_SECONDS` | Integer | `45` | Maximum execution time in seconds for LLM inference calls before falling back. |
| `CRAWLER_USER_AGENT` | String | `SignalStackBot/1.0...` | Transparent bot identification header sent with all HTTP web requests. |
| `CRAWLER_TIMEOUT_SECONDS`| Integer | `20` | HTTP request timeout for crawling public feeds and web pages. |
| `CRAWLER_MAX_CONCURRENT` | Integer | `5` | Maximum concurrent HTTP connections during crawler jobs. |
| `UPLOAD_DIR` | Path | `./data/uploads` | Local directory for storing encrypted/uploaded company documents. |
| `MAX_UPLOAD_SIZE_MB` | Integer | `25` | Maximum permissible file upload size in megabytes. |
| `ALLOWED_UPLOAD_EXTENSIONS`| JSON List| `[".pdf",".docx",".xlsx",".csv"]` | Strict whitelist of allowed document file extensions. |
| `CHROMA_PERSIST_DIR` | Path | `./data/chromadb` | Local persistent directory for ChromaDB vector embeddings. |
| `ENABLE_SCHEDULER` | Boolean | `True` | Starts the APScheduler `AsyncIOScheduler` background engine on server startup. |
| `WEEKLY_BRIEF_CRON` | String | `0 6 * * 1` | Standard 5-field cron expression for weekly executive brief run (Mondays at 06:00 UTC). |
| `MONTHLY_AUDIT_CRON` | String | `0 0 1 * *` | Cron expression for monthly source health audit (1st of month at 00:00 UTC). |
| `CORS_ORIGINS` | JSON List | `["http://localhost:3000"]` | Allowed CORS origins for the FastAPI server. |

---

## 3. Frontend Environment Variables

Create `frontend/.env.local` to override frontend configuration:

```env
# URL of the Signal Stack FastAPI Backend
NEXT_PUBLIC_API_URL=http://localhost:8000
```
