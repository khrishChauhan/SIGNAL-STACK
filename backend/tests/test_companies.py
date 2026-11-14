import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_company_creation_and_lifecycle(client: AsyncClient):
    # 1. Create Company
    payload = {
        "name": "MeetUniversity",
        "website_url": "https://www.meetuniversity.com",
        "industry": "EdTech",
        "geography": "India"
    }
    response = await client.post("/api/companies", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    company = data["data"]
    company_id = company["id"]
    assert company["name"] == "MeetUniversity"
    assert company["onboarding_status"] == "REGISTERED"

    # 2. Get Company
    get_res = await client.get(f"/api/companies/{company_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == company_id

    # 3. List Companies
    list_res = await client.get("/api/companies")
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1

    # 4. Update Company
    update_res = await client.put(f"/api/companies/{company_id}", json={"industry": "Higher EdTech"})
    assert update_res.status_code == 200
    assert update_res.json()["data"]["industry"] == "Higher EdTech"

    # 5. Trigger Research
    research_res = await client.post(f"/api/companies/{company_id}/research")
    assert research_res.status_code == 200
    assert research_res.json()["success"] is True

    # 6. Fetch Profile
    profile_res = await client.get(f"/api/companies/{company_id}/research")
    assert profile_res.status_code == 200
    profile_data = profile_res.json()["data"]
    assert profile_data["company_id"] == company_id
    assert len(profile_data["executive_summary"]) > 10
