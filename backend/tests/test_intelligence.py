import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.models.crawl import CrawledDocument

@pytest.mark.asyncio
async def test_signal_creation_and_evidence(client: AsyncClient, db_session: AsyncSession):
    # 1. Register Company
    comp_res = await client.post("/api/companies", json={
        "name": "MeetUniversity",
        "website_url": "https://www.meetuniversity.com"
    })
    company_id = comp_res.json()["data"]["id"]

    # 2. Directly insert sample crawled document into database for predictable testing
    doc = CrawledDocument(
        company_id=company_id,
        url="https://example.com/uk-visa-update",
        title="UK Home Office Maintains 2-Year Graduate Route",
        clean_text="On May 14, 2024, the Migration Advisory Committee recommended keeping the UK Graduate Route visa intact, ensuring 2-year post-study work permits.",
        content_hash="mock_hash_12345",
        simhash="mock_sim_12345"
    )
    db_session.add(doc)
    await db_session.commit()

    # 3. Trigger Intelligence Analysis
    analyse_res = await client.post(f"/api/companies/{company_id}/analyse")
    assert analyse_res.status_code == 200
    signals = analyse_res.json()["data"]
    assert len(signals) >= 1
    signal = signals[0]
    signal_id = signal["id"]

    assert "verified_fact" in signal
    assert "ai_interpretation" in signal
    assert "recommended_action" in signal
    assert signal["ranking_score"] > 0

    # 4. Fetch Signals List
    list_res = await client.get(f"/api/companies/{company_id}/signals")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

    # 5. Fetch Signal Details & Traceable Evidence
    detail_res = await client.get(f"/api/signals/{signal_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()["data"]
    assert detail["id"] == signal_id
    assert len(detail["evidences"]) >= 1
    evidence = detail["evidences"][0]
    assert evidence["source_url"] == "https://example.com/uk-visa-update"
    assert len(evidence["exact_quote"]) > 0
