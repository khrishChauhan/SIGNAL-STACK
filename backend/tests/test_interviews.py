import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_adaptive_interview_workflow(client: AsyncClient):
    # 1. Register Company
    comp_res = await client.post("/api/companies", json={
        "name": "MeetUniversity",
        "website_url": "https://www.meetuniversity.com"
    })
    company_id = comp_res.json()["data"]["id"]

    # 2. Start Interview
    start_res = await client.post(f"/api/companies/{company_id}/interview/start")
    assert start_res.status_code == 201
    session = start_res.json()["data"]
    session_id = session["id"]
    assert session["current_question_number"] == 1
    assert session["status"] == "IN_PROGRESS"
    assert len(session["questions"]) == 1
    assert session["questions"][0]["question_number"] == 1

    # 3. Answer Question 1
    ans_res = await client.post(f"/api/interviews/{session_id}/answer", json={
        "answer_text": "We differentiate through direct relationships with Tier-2 UK universities and localized physical centers."
    })
    assert ans_res.status_code == 200
    updated_session = ans_res.json()["data"]
    assert updated_session["current_question_number"] == 2
    assert len(updated_session["questions"]) == 2
    assert updated_session["questions"][1]["question_number"] == 2

    # 4. Skip Question 2
    skip_res = await client.post(f"/api/interviews/{session_id}/skip", json={
        "reason": "Not applicable to early-stage cohort."
    })
    assert skip_res.status_code == 200
    skipped_session = skip_res.json()["data"]
    assert skipped_session["current_question_number"] == 3

    # 5. Fast-forward through remaining questions to completion
    for q_idx in range(3, 11):
        submit_res = await client.post(f"/api/interviews/{session_id}/answer", json={
            "answer_text": f"Strategic response for question #{q_idx} addressing critical blindspots."
        })
        assert submit_res.status_code == 200

    # 6. Verify Session is now COMPLETED
    final_session_res = await client.get(f"/api/interviews/{session_id}")
    assert final_session_res.status_code == 200
    final_data = final_session_res.json()["data"]
    assert final_data["status"] == "COMPLETED"
    assert final_data["strategic_priorities"]["interview_completed"] is True

    # 7. Update Interview Profile
    profile_update_res = await client.put(f"/api/interviews/{session_id}/profile", json={
        "strategic_priorities": {"custom_priority_weight": 0.99}
    })
    assert profile_update_res.status_code == 200
    assert profile_update_res.json()["data"]["strategic_priorities"]["custom_priority_weight"] == 0.99
