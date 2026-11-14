import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_source_management_and_discovery(client: AsyncClient):
    # 1. Create Company
    comp_res = await client.post("/api/companies", json={
        "name": "MeetUniversity",
        "website_url": "https://www.meetuniversity.com"
    })
    company_id = comp_res.json()["data"]["id"]

    # 2. Discover Sources
    discover_res = await client.post(f"/api/companies/{company_id}/sources/discover", json={"max_sources": 10})
    assert discover_res.status_code == 200
    sources = discover_res.json()["data"]
    assert len(sources) > 0
    first_source_id = sources[0]["id"]

    # 3. List Sources
    list_res = await client.get(f"/api/companies/{company_id}/sources")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == len(sources)

    # 4. Filter by Pillar
    market_res = await client.get(f"/api/companies/{company_id}/sources?pillar=MARKET")
    assert market_res.status_code == 200

    # 5. Add Custom Source
    custom_res = await client.post(f"/api/companies/{company_id}/sources", json={
        "name": "Custom Student Forum",
        "url": "https://example.com/rss",
        "source_type": "RSS",
        "pillar": "CUSTOMER",
        "expected_frequency": "DAILY",
        "reliability_score": 0.9,
        "approval_status": "APPROVED"
    })
    assert custom_res.status_code == 201
    custom_id = custom_res.json()["data"]["id"]

    # 6. Update Source
    update_res = await client.put(f"/api/sources/{custom_id}", json={
        "reliability_score": 0.95
    })
    assert update_res.status_code == 200
    assert update_res.json()["data"]["reliability_score"] == 0.95

    # 7. Delete Source
    delete_res = await client.delete(f"/api/sources/{custom_id}")
    assert delete_res.status_code == 200
    assert delete_res.json()["data"] is True

    # 8. Add Competitor
    comp_post = await client.post(f"/api/companies/{company_id}/competitors", json={
        "name": "Leverage Edu",
        "website_url": "https://leverageedu.com",
        "tier": "DIRECT"
    })
    assert comp_post.status_code == 201

    comps_list = await client.get(f"/api/companies/{company_id}/competitors")
    assert comps_list.status_code == 200
    assert len(comps_list.json()["data"]) >= 1
