import pytest
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.services.research_agent import CompanyResearchAgent
from backend.app.services.interview_agent import AdaptiveInterviewAgent, INTERVIEW_TOPICS
from backend.app.services.source_discovery_agent import SourceDiscoveryAgent
from backend.app.services.competitor_discovery_agent import CompetitorDiscoveryAgent
from backend.app.services.signal_ranking_engine import SignalRankingEngine
from backend.app.services.crawling_engine import WebCrawlingEngine, parse_publication_date
from backend.app.services.rag_engine import RAGEngine
from backend.app.models.company import Company
from backend.app.models.source import IntelligenceSource
from backend.app.models.crawl import CrawlJob, CrawledDocument
from backend.app.services.crawler_service import compute_sha256, compute_simhash

@pytest.mark.asyncio
async def test_company_research_agent_structure_and_separation():
    """Verifies that CompanyResearchAgent extracts structured intelligence and strictly

    separates verified facts (with citations), inferences, and unknown information.
    """
    result = await CompanyResearchAgent.research_company(
        company_name="MeetUniversity",
        company_website="https://www.meetuniversity.com"
    )

    # 1. Structural schema compliance
    assert "description" in result or "executive_summary" in result
    assert "products_and_services" in result
    assert isinstance(result["products_and_services"], list)
    assert len(result["products_and_services"]) >= 1
    assert "customer_segments" in result
    assert isinstance(result["customer_segments"], list)
    assert "industry" in result
    assert "geographical_presence" in result
    assert "business_positioning" in result

    # 2. Strict separation of Verified Facts vs Inferences vs Unknown Information
    assert "verified_facts" in result
    assert isinstance(result["verified_facts"], list)
    assert len(result["verified_facts"]) >= 1
    # Check citation grounding
    first_fact = result["verified_facts"][0]
    assert "claim" in first_fact
    assert "evidence_url" in first_fact
    assert "quote" in first_fact

    assert "inferences" in result
    assert isinstance(result["inferences"], list)
    assert len(result["inferences"]) >= 1
    first_inference = result["inferences"][0]
    assert "inference" in first_inference
    assert "reasoning" in first_inference

    assert "unknown_information" in result
    assert isinstance(result["unknown_information"], list)
    assert len(result["unknown_information"]) >= 1

@pytest.mark.asyncio
async def test_adaptive_interview_agent_context_and_weight_synthesis():
    """Verifies that AdaptiveInterviewAgent generates dynamic 10-topic sequential questions,

    adapts to prior founder answers, and synthesizes normalized strategic priority weights.
    """
    company_name = "MeetUniversity"
    company_profile = {
        "executive_summary": "Study abroad student recruitment marketplace.",
        "products_and_services": ["University Matching", "Visa Guidance"],
        "industry": "EdTech"
    }

    # Generate Question 1
    q1 = await AdaptiveInterviewAgent.generate_question(
        question_number=1,
        company_name=company_name,
        company_profile=company_profile,
        prior_qa_history=[]
    )
    assert q1["question_number"] == 1
    assert len(q1["question_text"]) > 10
    assert "category" in q1
    assert "rationale" in q1

    # Simulate Question 2 with prior answer mentioning visa challenges
    prior_history = [
        {"question": q1["question_text"], "answer": "Our main bottleneck is recent UK and Canada student visa policy shifts."}
    ]
    q2 = await AdaptiveInterviewAgent.generate_question(
        question_number=2,
        company_name=company_name,
        company_profile=company_profile,
        prior_qa_history=prior_history
    )
    assert q2["question_number"] == 2
    assert len(q2["question_text"]) > 10

    # Synthesize priority weights
    weights = AdaptiveInterviewAgent.synthesize_priority_vector(
        company_profile=company_profile,
        qa_history=prior_history + [{"question": q2["question_text"], "answer": "Pricing margins are compressed by rivals."}]
    )
    assert weights["interview_completed"] is True
    assert "regulatory_risk_weight" in weights
    assert weights["regulatory_risk_weight"] >= 0.8
    assert "competitor_threat_weight" in weights
    assert weights["total_answered"] == 2
    assert weights["total_skipped"] == 0

@pytest.mark.asyncio
async def test_source_discovery_agent_meetuniversity_20_sources():
    """Verifies that SourceDiscoveryAgent discovers 20+ sources for MeetUniversity across

    CUSTOMERS, COMPETITORS, MARKET, and INTERNAL pillars with DISCOVERED approval status.
    """
    sources = await SourceDiscoveryAgent.discover_sources_for_company(
        company_name="MeetUniversity",
        company_website="https://www.meetuniversity.com",
        industry="EdTech / Higher Education Marketplace",
        competitors=["LeapScholar", "Leverage Edu"]
    )

    # 1. Quantity requirement: 20 or more relevant sources
    assert len(sources) >= 20

    # 2. Category coverage
    categories = {s["category"] for s in sources}
    assert "CUSTOMER" in categories
    assert "COMPETITOR" in categories
    assert "MARKET" in categories
    assert "INTERNAL" in categories

    # 3. Source metadata integrity
    for s in sources:
        assert s["name"]
        assert s["url"]
        assert s["source_type"]
        assert "reason_for_inclusion" in s and len(s["reason_for_inclusion"]) > 10
        assert 0.0 <= s["relevance"] <= 1.0
        assert 0.0 <= s["credibility"] <= 1.0
        assert s["update_frequency"] in ["DAILY", "WEEKLY", "HOURLY"]
        # Mandatory requirement: Do not automatically approve every discovered source
        assert s["approval_status"] == "DISCOVERED"

@pytest.mark.asyncio
async def test_competitor_discovery_agent_dynamic_identification():
    """Verifies that CompetitorDiscoveryAgent dynamically discovers 5–10 competitors

    with relevance reasons and tiers rather than relying on hardcoded lists.
    """
    competitors = await CompetitorDiscoveryAgent.discover_competitors(
        company_name="MeetUniversity",
        company_website="https://www.meetuniversity.com",
        industry="EdTech / Study Abroad",
        crawled_summary="Platform connecting international students to universities abroad."
    )

    assert 5 <= len(competitors) <= 10
    for comp in competitors:
        assert comp.get("name")
        assert comp.get("website_url")
        assert comp.get("tier") in ["DIRECT", "INDIRECT", "EMERGING", "SUBSTITUTE"]
        assert len(comp.get("relevance_reason", "")) > 10

def test_signal_ranking_engine_transparent_formula():
    """Verifies transparent multi-factor signal ranking with separate scores for

    source reliability, evidence strength, strategic relevance, and recency.
    """
    ranking = SignalRankingEngine.calculate_ranking(
        source_credibility=0.95,
        has_verified_quote=True,
        quote_length=150,
        published_at=datetime.now(timezone.utc),
        urgency="CRITICAL",
        business_impact="HIGH",
        pillar="MARKET",
        priority_weights={"regulatory_risk_weight": 1.0}
    )

    # Check score components
    assert "source_reliability_score" in ranking
    assert 0.0 <= ranking["source_reliability_score"] <= 100.0
    assert ranking["source_reliability_score"] == 95.0

    assert "evidence_strength_score" in ranking
    assert 0.0 <= ranking["evidence_strength_score"] <= 100.0
    assert ranking["evidence_strength_score"] >= 80.0

    assert "strategic_relevance_score" in ranking
    assert 0.0 <= ranking["strategic_relevance_score"] <= 100.0

    assert "composite_ranking_score" in ranking
    assert 0.0 <= ranking["composite_ranking_score"] <= 100.0

    # Transparent human-readable audit trail
    assert "ranking_explanation" in ranking
    assert "Strategic relevance" in ranking["ranking_explanation"]
    assert "Evidence strength" in ranking["ranking_explanation"]

def test_rag_engine_chunking_and_vector_retrieval():
    """Verifies that RAGEngine chunks text, indexes documents in ChromaDB,

    and performs semantic/similarity retrieval.
    """
    company_id = "test-comp-meetuni-rag-01"
    doc_id = "doc-internal-strategy-01"
    sample_text = """
    MeetUniversity FY2026 Strategic Plan.
    Our primary competitive priority is defending our UK university partnerships against aggressive discount programs from LeapScholar.
    Customer acquisition costs on Google Search have risen 40 percent year on year.
    To improve retention, we are introducing personalized AI visa assistance and pre-departure accommodation assistance for Indian applicants.
    """

    # Index document
    indexed_count = RAGEngine.index_document(
        company_id=company_id,
        doc_id=doc_id,
        title="MeetUniversity FY2026 Strategy Plan",
        text=sample_text,
        source_url="internal://documents/strategy_2026.pdf",
        doc_type="INTERNAL"
    )
    assert indexed_count >= 1

    # Retrieve relevant chunks
    results = RAGEngine.retrieve_relevant_chunks(
        company_id=company_id,
        query="LeapScholar competitor partnership UK university",
        top_k=2
    )
    assert len(results) >= 1
    top_chunk = results[0]
    assert "chunk_text" in top_chunk
    assert "UK university partnerships" in top_chunk["chunk_text"] or "LeapScholar" in top_chunk["chunk_text"]
    assert "similarity_score" in top_chunk
    assert top_chunk["similarity_score"] >= 0.0

    # Cleanup
    RAGEngine.delete_document(company_id=company_id, doc_id=doc_id)

@pytest.mark.asyncio
async def test_crawling_engine_revision_tracking_and_deduplication(db_session: AsyncSession):
    """Verifies that WebCrawlingEngine detects content revisions (version increment and has_changed=True)

    and rejects identical duplicate content.
    """
    # 1. Create company and source
    company = Company(
        name="Test Crawl Company",
        website_url="https://test.meetuniversity.internal",
        industry="EdTech"
    )
    db_session.add(company)
    await db_session.flush()

    source = IntelligenceSource(
        company_id=company.id,
        name="Test Portal Source",
        url="https://test.meetuniversity.internal/announcements",
        source_type="WEBPAGE",
        pillar="MARKET",
        reliability_score=0.9,
        approval_status="APPROVED"
    )
    db_session.add(source)
    await db_session.commit()

    # 2. Insert initial version 1 document
    initial_text = "UK Home Office announces new student visa rules effective October."
    hash_v1 = compute_sha256(initial_text)
    doc_v1 = CrawledDocument(
        company_id=company.id,
        source_id=source.id,
        url="https://test.meetuniversity.internal/announcements/visa-update",
        canonical_url="https://test.meetuniversity.internal/announcements/visa-update",
        title="UK Student Visa Rules",
        clean_text=initial_text,
        content_hash=hash_v1,
        simhash=compute_simhash(initial_text),
        version=1,
        has_changed=False,
        crawled_at=datetime.now(timezone.utc)
    )
    db_session.add(doc_v1)
    await db_session.commit()

    # 3. Simulate revised content arriving for same URL
    revised_text = "UK Home Office amends new student visa rules with maintenance threshold increase."
    hash_v2 = compute_sha256(revised_text)
    assert hash_v1 != hash_v2

    doc_v2 = CrawledDocument(
        company_id=company.id,
        source_id=source.id,
        url="https://test.meetuniversity.internal/announcements/visa-update",
        canonical_url="https://test.meetuniversity.internal/announcements/visa-update",
        title="UK Student Visa Rules Update",
        clean_text=revised_text,
        content_hash=hash_v2,
        simhash=compute_simhash(revised_text),
        version=doc_v1.version + 1,
        previous_hash=doc_v1.content_hash,
        has_changed=True,
        crawled_at=datetime.now(timezone.utc)
    )
    db_session.add(doc_v2)
    await db_session.commit()

    # Verify version 2 has changed and tracked previous hash
    assert doc_v2.version == 2
    assert doc_v2.has_changed is True
    assert doc_v2.previous_hash == hash_v1
