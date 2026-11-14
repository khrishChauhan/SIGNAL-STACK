import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_crawl_trigger_and_history(client: AsyncClient):
    # 1. Register Company & Add a Source
    comp_res = await client.post("/api/companies", json={
        "name": "MeetUniversity",
        "website_url": "https://www.meetuniversity.com"
    })
    company_id = comp_res.json()["data"]["id"]

    await client.post(f"/api/companies/{company_id}/sources", json={
        "name": "Sample Education Feed",
        "url": "https://thepienews.com/feed/",
        "source_type": "RSS",
        "pillar": "MARKET",
        "approval_status": "APPROVED"
    })

    # 2. Trigger Crawl
    crawl_res = await client.post(f"/api/companies/{company_id}/crawl", json={"force_all_approved": True})
    assert crawl_res.status_code == 200
    job_data = crawl_res.json()["data"]
    assert job_data["status"] == "COMPLETED"
    assert job_data["company_id"] == company_id

    # 3. Check Crawl History
    history_res = await client.get(f"/api/companies/{company_id}/crawl-history")
    assert history_res.status_code == 200
    history = history_res.json()["data"]
    assert len(history) >= 1
    assert history[0]["id"] == job_data["id"]
