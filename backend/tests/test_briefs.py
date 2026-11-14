import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_monday_morning_brief_generation(client: AsyncClient):
    # 1. Register Company
    comp_res = await client.post("/api/companies", json={
        "name": "MeetUniversity",
        "website_url": "https://www.meetuniversity.com"
    })
    company_id = comp_res.json()["data"]["id"]

    # 2. Generate Brief
    gen_res = await client.post(f"/api/companies/{company_id}/briefs/generate", json={
        "week_identifier": "2026-W46",
        "force_refresh": True
    })
    assert gen_res.status_code == 201
    brief = gen_res.json()["data"]
    brief_id = brief["id"]

    assert brief["brief_week"] == "2026-W46"
    assert "executive_tldr" in brief
    assert len(brief["executive_tldr"]) >= 1
    assert "strategic_alert" in brief
    assert "actions" in brief
    assert len(brief["actions"]) >= 1

    # 3. List Briefs
    list_res = await client.get(f"/api/companies/{company_id}/briefs")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

    # 4. Get Brief Detail
    detail_res = await client.get(f"/api/briefs/{brief_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["data"]["id"] == brief_id
