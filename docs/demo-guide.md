# Signal Stack — 5–10 Minute Live Demonstration Script

This walkthrough script is tailored for technical evaluators, product managers, and reviewers to experience the full end-to-end functionality of Signal Stack within 5 to 10 minutes.

---

## 0. Pre-Flight Preparation (30 Seconds)

Ensure both backend and frontend servers are running:
1. **Backend**: `uvicorn backend.app.main:app --port 8000` (`http://localhost:8000/docs`)
2. **Frontend**: `npm run dev` (`http://localhost:3000`)
3. Data is pre-seeded with `python -m backend.app.db.seed`.

---

## 1. Minute 0:00 – 1:30 | Product Introduction & Company Setup

### What to Show:
1. Open `http://localhost:3000/overview`.
2. Highlight the clean, high-density executive interface:
   - Sidebar navigation across all 11 intelligence modules.
   - Company Selector in the top bar: toggle between **MeetUniversity**, **Postman**, and **Linear**.
   - Metric cards: Monitored Sources (21 active for MeetUniversity), Discovered Signals, High-Priority Threats, Upcoming Monday Brief.
3. Navigate to **Company Intelligence** (`/companies`):
   - Review MeetUniversity's structured profile:
     - Verified facts vs Inferences vs Unknown information.
     - Direct evidence URLs pointing to `https://www.meetuniversity.com`.
     - Target ICP (International Students, University Admissions Teams).
     - Geographic focus (India, UK, Canada, Australia, USA).

---

## 2. Minute 1:30 – 3:00 | The Adaptive 10-Question Founder Interview

### What to Show:
1. Navigate to **AI Interview** (`/interview`).
2. Point out the dynamic nature of the session:
   - Exactly 10 questions calibrated to MeetUniversity's edtech business model.
   - Questions probe unit economics, university commission structures, visa policy risks, and competitive threats.
   - Shows real-time question progress: Question $N$ of 10.
3. Demonstrate interactive capabilities:
   - Submit an answer to a question (e.g. on visa policy changes).
   - Demonstrate the **Skip** button for confidential founder matters without breaking interview flow.
   - Upon completion, show how the AI synthesized founder priorities into quantitative signal ranking weights.

---

## 3. Minute 3:00 – 4:30 | Intelligent Signal Stack & Competitor Discovery

### What to Show:
1. Navigate to **Signal Stack** (`/sources`).
2. Show the approved sources:
   - 21 vetted, high-signal sources categorized into **Customer Forums**, **Competitors**, **Market Feeds**, and **Regulatory Portals**.
   - Review competitors: **LeapScholar**, **Leverage Edu**, **IDP Education**, **CollegeDekho**, **Yocket**.
3. Demonstrate source management:
   - Click **Discover Sources** to demonstrate autonomous source recommendations based on company profile.
   - Toggle source status between `APPROVED`, `PENDING_REVIEW`, and `PAUSED`.
   - Show health indicators (Latency, Success Rate, Last Crawled).

---

## 4. Minute 4:30 – 6:00 | Real Web Crawling, Deduplication & Signal Ranking

### What to Show:
1. Navigate to **Intelligence Feed** (`/signals`).
2. Click **Run Crawl Cycle** (or trigger `POST /api/v1/companies/{id}/crawl`):
   - Watch the multi-page crawler ingest live feeds from international student communities and immigration newsrooms.
   - Observe deduplication in action: exact hash match (SHA-256) and semantic fuzzy similarity (SimHash) prevent redundant signals.
3. Inspect a ranked signal card:
   - View transparent multi-factor score (0–100) decomposed into:
     - Founder Priority Alignment (40%)
     - Evidence Strength & Credibility (25%)
     - Strategic Impact Severity (20%)
     - Recency Decay Factor (15%)
   - Click to inspect the raw excerpt and direct source citation link.

---

## 5. Minute 6:00 – 8:00 | Monday Morning Executive Intelligence Brief

### What to Show:
1. Navigate to **Monday Brief** (`/briefs`).
2. Present the generated 10-section briefing report:
   - **Section 1: Executive Summary** — 5 prioritized strategic takeaways.
   - **Section 2: Customer Signals** — Student sentiment on visa processing delays.
   - **Section 3: Competitor Intelligence** — Product launches and aggressive pricing moves by competitors.
   - **Section 4: Market Intelligence** — Regulatory shifts in Canadian and UK study visa quotas.
   - **Section 5: Internal Intelligence Alignment** — Cross-referenced against uploaded documents.
   - **Section 6: Actionable Opportunities** — At least 3 tangible initiatives supported by evidence.
   - **Section 7: Risks & Threats** — High-severity operational alerts.
   - **Section 8: Recommended Actions** — Assignable executive action items with owners and deadlines.
   - **Section 9: What We Should Watch** — Emerging early-warning indicators for next week.
   - **Section 10: Traceable Source Appendix** — Full table of URLs, discovery timestamps, and evidence quotes.
3. Demonstrate executive distribution:
   - Click **Print / Export PDF** to show the clean `@media print` executive layout.
   - Click **Download Markdown** to inspect the clean portable text export.

---

## 6. Minute 8:00 – 9:15 | Internal Document Ingestion & RAG Cross-Referencing

### What to Show:
1. Navigate to **Internal Documents** (`/documents`).
2. Show uploaded internal files (PDF, Word, Excel, CSV):
   - Strict validation: Whitelist enforced, 25MB ceiling.
   - Local ChromaDB vector embedding and semantic chunking.
3. Run a query: demonstrate how internal university partner commission spreadsheets are cross-referenced with public visa policy shifts in the weekly brief synthesis.

---

## 7. Minute 9:15 – 10:00 | Reusability, Automation & Source Health Audit

### What to Show:
1. Navigate to **Automation** (`/automation`):
   - Scheduled Jobs: Weekly Brief (Mondays 06:00 UTC) and Monthly Source Audit (1st of month).
   - Execution History: View past execution runs with duration and status logs.
2. In the top bar Company Selector, switch to **Postman** or **Linear**:
   - Observe how the entire platform re-calibrates: different industry profile, developer/API competitors, distinct interview questions, and developer-focused feeds.
3. Show **Source Manager Health Audit**:
   - Highlight dead URL detection and replacement recommendations without destructive auto-deletion.
