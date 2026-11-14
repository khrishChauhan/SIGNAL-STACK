import pytest
import io
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_file_upload_validation_and_listing(client: AsyncClient):
    # 1. Register Company
    comp_res = await client.post("/api/companies", json={
        "name": "MeetUniversity",
        "website_url": "https://www.meetuniversity.com"
    })
    company_id = comp_res.json()["data"]["id"]

    # 2. Upload Valid TXT File
    valid_content = b"Q3 Strategic OKR: Expand university partnerships across UK and Ireland by 25%."
    files = {"file": ("strategy_okr.txt", io.BytesIO(valid_content), "text/plain")}
    upload_res = await client.post(f"/api/companies/{company_id}/documents/upload", files=files)
    assert upload_res.status_code == 201
    doc = upload_res.json()["data"]
    assert doc["filename"] == "strategy_okr.txt"
    assert doc["file_type"] == "TXT"
    assert doc["status"] == "INDEXED"

    # 3. List Documents
    list_res = await client.get(f"/api/companies/{company_id}/documents")
    assert list_res.status_code == 200
    docs = list_res.json()["data"]
    assert len(docs) >= 1

    # 4. Attempt Invalid Upload (.exe)
    invalid_files = {"file": ("malicious.exe", io.BytesIO(b"MZ..."), "application/octet-stream")}
    bad_res = await client.post(f"/api/companies/{company_id}/documents/upload", files=invalid_files)
    assert bad_res.status_code == 400
    error_data = bad_res.json()["error"]
    assert error_data["code"] == "FILE_UPLOAD_INVALID"
