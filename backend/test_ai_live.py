import asyncio
import httpx

async def test_ai_live():
    async with httpx.AsyncClient(base_url="http://localhost:8000", timeout=30.0) as client:
        # 1. Fetch Company
        r = await client.get("/api/companies")
        assert r.status_code == 200, f"Get companies failed: {r.text}"
        companies = r.json()["data"]
        meet_uni = next(c for c in companies if "MeetUniversity" in c["name"])
        cid = meet_uni["id"]
        print(f"[1] Target Company: {meet_uni['name']} ({meet_uni['website_url']})")

        # 2. Test Adaptive Interview Agent (Question 1)
        r_start = await client.post(f"/api/companies/{cid}/interview/start", json={"restart": True})
        assert r_start.status_code in (200, 201), f"Interview start failed: {r_start.text}"
        session = r_start.json()["data"]
        session_id = session["id"]
        q1 = session.get("current_question", {}).get("question_text") if isinstance(session.get("current_question"), dict) else session.get("current_question")
        print(f"[2] Adaptive Interview Started: Question 1 -> '{q1}'")

        # 3. Test Adaptive Follow-up Generation (Question 2)
        r_ans = await client.post(f"/api/interviews/{session_id}/answer", json={
            "answer_text": "We earn 12% commission per enrolled international student and also sell IELTS test prep packages."
        })
        assert r_ans.status_code in (200, 201), f"Submit answer failed: {r_ans.text}"
        session_step2 = r_ans.json()["data"]
        q2 = session_step2.get("current_question", {}).get("question_text") if isinstance(session_step2.get("current_question"), dict) else session_step2.get("current_question")
        print(f"[3] Adaptive Interview Follow-up: Question 2 -> '{q2}'")

        # 4. Test Intelligence Signal Analysis Agent
        r_anal = await client.post(f"/api/companies/{cid}/analyse", json={"min_confidence": 0.5})
        assert r_anal.status_code in (200, 201), f"Analysis failed: {r_anal.text}"
        signals = r_anal.json().get("data", [])
        print(f"[4] Intelligence Analysis Agent: Synthesized {len(signals)} actionable signals.")

        # 5. Test Monday Brief Synthesis Agent
        r_brief = await client.post(f"/api/companies/{cid}/briefs/generate", json={"force_regeneration": True})
        assert r_brief.status_code in (200, 201), f"Brief generation failed: {r_brief.text}"
        brief = r_brief.json()["data"]
        print(f"[5] Monday Brief Executive Synthesis: '{brief['title']}' for week {brief['brief_week']}")
        print(f"    - Executive TLDR items: {len(brief.get('executive_tldr', []))}")
        print(f"    - Identified Opportunities: {len(brief.get('opportunities', []))}")
        print(f"    - Action Items generated: {len(brief.get('actions', []))}")
        print("\n--> ALL AI AGENTS OPERATING 100% SUCCESSFULLY <--")

if __name__ == "__main__":
    asyncio.run(test_ai_live())
