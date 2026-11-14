from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.app.models.company import Company, CompanyProfile
from backend.app.models.source import IntelligenceSource, Competitor
from backend.app.models.signal import IntelligenceSignal, SignalEvidence
from backend.app.models.brief import IntelligenceBrief, BriefAction
from backend.app.services.source_discovery_agent import SourceDiscoveryAgent
from backend.app.core.logging import logger

DEMO_COMPANIES = [
  {
    "name": "MeetUniversity",
    "website_url": "https://www.meetuniversity.com",
    "industry": "EdTech / Higher Education Marketplace",
    "geography": "India / Global",
    "onboarding_status": "MONITORING_ACTIVE",
    "executive_summary": "MeetUniversity is a leading higher-education discovery and student counseling platform connecting prospective Indian and international applicants to over 1,500 global partner universities in the UK, USA, Canada, and Australia.",
    "value_proposition": "Delivers direct personalized university course matching, standardized test counseling, and transparent visa assistance.",
    "business_model": "EdTech Marketplace / Institutional Partner Placement Commission",
    "target_customer_profile": "Undergraduate and postgraduate international student aspirants seeking overseas university admissions.",
    "core_strengths": [
      "Direct recruitment partnerships with overseas universities",
      "Proprietary AI applicant course-matching algorithm",
      "Localized ground counseling centers in Tier-1 and Tier-2 Indian hubs"
    ],
    "known_weaknesses": [
      "Intense rivalry from venture-backed edtech aggregators",
      "High sensitivity to shifting student visa policies in the UK, Canada, and Australia"
    ],
    "competitors": [
      {"name": "LeapScholar", "website_url": "https://leapscholar.com", "tier": "DIRECT", "notes": "Full-stack study abroad platform offering loans, test prep, and counseling."},
      {"name": "Leverage Edu", "website_url": "https://leverageedu.com", "tier": "DIRECT", "notes": "AI counseling platform with Fly Finance accommodation and banking."},
      {"name": "IDP Education", "website_url": "https://www.idp.com", "tier": "DIRECT", "notes": "Global giant and co-owner of IELTS with extensive international offices."},
      {"name": "CollegeDekho", "website_url": "https://www.collegedekho.com", "tier": "INDIRECT", "notes": "Domestic and study abroad university search engine in India."},
      {"name": "Yocket", "website_url": "https://yocket.com", "tier": "DIRECT", "notes": "Community-first study abroad platform with peer applicant profiles."}
    ],
    "sample_signals": [
      {
        "title": "UK Home Office Visa Maintenance Requirements Increased",
        "pillar": "MARKET",
        "urgency": "CRITICAL",
        "direction": "THREAT",
        "what_happened": "UKVI revised monthly maintenance requirements for international students starting in autumn.",
        "verified_fact": "International students must show proof of £1,483 per month for study in London, rising to reflect domestic cost-of-living increases.",
        "ai_interpretation": "Directly compresses applicant pool affordability from Tier-2 Indian cities; requires accelerated financial counseling.",
        "recommended_action": "Introduce dedicated education loan partnerships and revised cost calculators on student portal.",
        "ranking_score": 94.0,
        "source_reliability_score": 98.0,
        "evidence_strength_score": 95.0,
        "strategic_relevance_score": 92.0,
        "ranking_explanation": "Critical policy movement with verifiable government citation directly affecting student pipeline conversion.",
        "source_url": "https://www.gov.uk/government/organisations/uk-visas-and-immigration.atom",
        "source_name": "UKVI Official Gazette"
      },
      {
        "title": "LeapScholar Launches Zero-Fee IELTS Diagnostic Prep App",
        "pillar": "COMPETITOR",
        "urgency": "HIGH",
        "direction": "THREAT",
        "what_happened": "Rival LeapScholar rolled out free mobile IELTS mock diagnostic tests to capture top-of-funnel student leads.",
        "verified_fact": "LeapScholar announced unlimited AI-evaluated IELTS speaking tests with instant band score predictions.",
        "ai_interpretation": "Aggressive lead acquisition move targeting early-stage students 12 months before university application deadlines.",
        "recommended_action": "Launch integrated GRE/IELTS diagnostic tools within MeetUniversity student portal to defend lead capture.",
        "ranking_score": 88.0,
        "source_reliability_score": 90.0,
        "evidence_strength_score": 88.0,
        "strategic_relevance_score": 86.0,
        "ranking_explanation": "Direct competitor feature rollout aimed at student acquisition bottleneck identified in founder interview.",
        "source_url": "https://leapscholar.com/blog/feed/",
        "source_name": "LeapScholar Product Blog"
      },
      {
        "title": "Student Community Reports Delays in Canadian Study Permit Processing",
        "pillar": "CUSTOMER",
        "urgency": "HIGH",
        "direction": "OPPORTUNITY",
        "what_happened": "Prospective applicants on student forums cite 8-week processing backlogs under newly introduced provincial caps.",
        "verified_fact": "Multiple applicants reporting IRCC provincial attestation letter delays impacting September semester intake.",
        "ai_interpretation": "Students experiencing severe anxiety and seeking alternative destinations (e.g. Ireland, Germany, Dubai).",
        "recommended_action": "Publish alternative destination battlecards and conduct live counseling webinars on multi-country backup admissions.",
        "ranking_score": 85.0,
        "source_reliability_score": 84.0,
        "evidence_strength_score": 82.0,
        "strategic_relevance_score": 90.0,
        "ranking_explanation": "Acute customer pain point creating high-intent opportunity for alternative destination placement.",
        "source_url": "https://www.reddit.com/r/Indians_StudyAbroad/.rss",
        "source_name": "Reddit r/Indians_StudyAbroad"
      }
    ]
  },
  {
    "name": "Postman",
    "website_url": "https://www.postman.com",
    "industry": "Developer Tools / API Platform",
    "geography": "United States / Global",
    "onboarding_status": "MONITORING_ACTIVE",
    "executive_summary": "Postman is an enterprise API platform used by over 30 million developers to build, test, collaborate on, and govern REST, GraphQL, and gRPC APIs.",
    "value_proposition": "Simplifies each step of the API lifecycle and streamlines collaboration so teams can create better APIs faster.",
    "business_model": "Product-Led Growth (PLG) Freemium / Enterprise Tier SaaS",
    "target_customer_profile": "Software developers, QA automation engineers, API architects, and enterprise engineering leads.",
    "core_strengths": [
      "Ubiquitous developer mindshare and workspace network effects",
      "Comprehensive multi-protocol API lifecycle testing suite",
      "Enterprise governance and security compliance features"
    ],
    "known_weaknesses": [
      "Community pushback regarding cloud sync mandates and local scratchpad deprecation",
      "Emerging open-source Git-native alternatives gaining traction"
    ],
    "competitors": [
      {"name": "Insomnia", "website_url": "https://insomnia.rest", "tier": "DIRECT", "notes": "Kong-owned open-source desktop API client."},
      {"name": "Bruno", "website_url": "https://usebruno.com", "tier": "EMERGING", "notes": "Fast-growing offline-first Git-native API client gaining developer momentum."},
      {"name": "Hoppscotch", "website_url": "https://hoppscotch.io", "tier": "DIRECT", "notes": "Open-source lightweight web-first API development ecosystem."}
    ],
    "sample_signals": [
      {
        "title": "Bruno API Client Crosses 30,000 GitHub Stars on Git-Native Promise",
        "pillar": "COMPETITOR",
        "urgency": "HIGH",
        "direction": "THREAT",
        "what_happened": "Open-source rival Bruno highlighted privacy and zero-cloud-lock-in as primary developer adoption drivers.",
        "verified_fact": "Bruno stores collections directly in user repositories as plain text Bru files without requiring cloud accounts.",
        "ai_interpretation": "Appeals directly to privacy-sensitive enterprise teams restricted from uploading internal API collections to SaaS clouds.",
        "recommended_action": "Accelerate marketing and hybrid on-prem storage options for security-conscious enterprise tiers.",
        "ranking_score": 89.0,
        "source_reliability_score": 92.0,
        "evidence_strength_score": 90.0,
        "strategic_relevance_score": 86.0,
        "ranking_explanation": "Emerging challenger exploiting Postman's cloud sync vulnerability.",
        "source_url": "https://github.com/usebruno/bruno/releases.atom",
        "source_name": "Bruno Releases"
      }
    ]
  },
  {
    "name": "Linear",
    "website_url": "https://linear.app",
    "industry": "Project Management & Issue Tracking SaaS",
    "geography": "Global",
    "onboarding_status": "MONITORING_ACTIVE",
    "executive_summary": "Linear is a purpose-built project management system designed for modern product and software engineering teams, emphasizing speed, keyboard shortcuts, and craftsmanship.",
    "value_proposition": "Offers blazing-fast performance, keyboard-first workflows, and synchronization, replacing bloated legacy ticketing systems.",
    "business_model": "Tiered B2B SaaS per-seat subscription",
    "target_customer_profile": "High-growth tech startups, software engineering leads, product designers, and agile development teams.",
    "core_strengths": [
      "Exceptional UI speed and local-first optimistic synchronization",
      "Cult developer brand appeal and design standard",
      "Seamless GitHub, GitLab, and Figma integrations"
    ],
    "known_weaknesses": [
      "Less customizable than legacy enterprise tools like Jira for non-technical departments",
      "Limited native Gantt and traditional portfolio budgeting tooling"
    ],
    "competitors": [
      {"name": "Jira", "website_url": "https://www.atlassian.com/software/jira", "tier": "SUBSTITUTE", "notes": "Atlassian's incumbent enterprise project tracking giant."},
      {"name": "Height.app", "website_url": "https://height.app", "tier": "DIRECT", "notes": "AI-automated project tracking tool."},
      {"name": "Plane.so", "website_url": "https://plane.so", "tier": "EMERGING", "notes": "Open-source self-hostable project management alternative."}
    ],
    "sample_signals": [
      {
        "title": "Atlassian Launches Jira Product Discovery Updates to Retain Product Teams",
        "pillar": "COMPETITOR",
        "urgency": "MEDIUM",
        "direction": "THREAT",
        "what_happened": "Atlassian released deep integrations between Jira Product Discovery and Confluence to prevent defections to modern agile tools.",
        "verified_fact": "Atlassian announced custom prioritization matrices and automated roadmap syncing within the Jira Cloud suite.",
        "ai_interpretation": "Targeted retention play designed to lock in enterprise PMs before they evaluate Linear.",
        "recommended_action": "Highlight Linear Initiatives and Project Updates speed advantages in enterprise migration campaigns.",
        "ranking_score": 82.0,
        "source_reliability_score": 90.0,
        "evidence_strength_score": 85.0,
        "strategic_relevance_score": 75.0,
        "ranking_explanation": "Incumbent counter-move in enterprise agile workflow space.",
        "source_url": "https://techcrunch.com/category/enterprise/feed/",
        "source_name": "TechCrunch Enterprise"
      }
    ]
  }
]

async def seed_initial_demo_data(session: AsyncSession) -> None:
    """Seeds the 3 required companies (MeetUniversity, Postman, Linear) if empty."""
    count_stmt = select(func.count(Company.id))
    count = (await session.execute(count_stmt)).scalar() or 0
    if count > 0:
        return

    logger.info("Database is empty. Seeding initial demonstration companies (MeetUniversity, Postman, Linear)...")

    for demo in DEMO_COMPANIES:
        comp = Company(
            name=demo["name"],
            website_url=demo["website_url"],
            industry=demo["industry"],
            geography=demo["geography"],
            onboarding_status=demo["onboarding_status"]
        )
        session.add(comp)
        await session.flush()

        # Company Profile
        profile = CompanyProfile(
            company_id=comp.id,
            executive_summary=demo["executive_summary"],
            value_proposition=demo["value_proposition"],
            target_customer_profile=demo["target_customer_profile"],
            business_model=demo["business_model"],
            core_strengths=demo["core_strengths"],
            known_weaknesses=demo["known_weaknesses"],
            raw_research_data={
                "verified_facts": [
                    {"claim": f"{demo['name']} operates official platform at {demo['website_url']}", "evidence_url": demo["website_url"], "quote": demo["value_proposition"]}
                ],
                "inferences": [
                    {"inference": f"Monetization model structured around {demo['business_model']}", "reasoning": "Standard pattern for this domain segment."}
                ],
                "unknown_information": [
                    "Private capitalization structure",
                    "Internal regional EBITDA margins"
                ]
            }
        )
        session.add(profile)

        # Competitors
        for comp_data in demo["competitors"]:
            c = Competitor(
                company_id=comp.id,
                name=comp_data["name"],
                website_url=comp_data["website_url"],
                tier=comp_data["tier"],
                notes=comp_data["notes"],
                relevance_reason=comp_data["notes"]
            )
            session.add(c)

        # Sources via SourceDiscoveryAgent
        discovered = await SourceDiscoveryAgent.discover_sources_for_company(
            company_name=demo["name"],
            company_website=demo["website_url"],
            industry=demo["industry"],
            competitors=[c["name"] for c in demo["competitors"]]
        )
        for s in discovered:
            # Set the first 5 sources to APPROVED, rest DISCOVERED
            src_status = "APPROVED" if discovered.index(s) < 5 else "DISCOVERED"
            source = IntelligenceSource(
                company_id=comp.id,
                name=s["name"],
                url=s["url"],
                source_type=s["source_type"],
                pillar=s["category"],
                reason_for_inclusion=s.get("reason_for_inclusion", ""),
                relevance_score=s.get("relevance", 0.9),
                expected_frequency=s.get("update_frequency", "DAILY"),
                reliability_score=s.get("credibility", 0.85),
                approval_status=src_status,
                health_status="HEALTHY",
                latency_ms=180
            )
            session.add(source)

        # Sample Signals
        for sig_data in demo.get("sample_signals", []):
            sig = IntelligenceSignal(
                company_id=comp.id,
                title=sig_data["title"],
                pillar=sig_data["pillar"],
                urgency=sig_data["urgency"],
                direction=sig_data["direction"],
                what_happened=sig_data["what_happened"],
                verification_status="VERIFIED_SOURCE",
                business_impact=sig_data["urgency"],
                affected_business_area="Executive Strategy",
                verified_fact=sig_data["verified_fact"],
                ai_interpretation=sig_data["ai_interpretation"],
                recommended_action=sig_data["recommended_action"],
                confidence_score=0.92,
                ranking_score=sig_data["ranking_score"],
                source_reliability_score=sig_data["source_reliability_score"],
                evidence_strength_score=sig_data["evidence_strength_score"],
                strategic_relevance_score=sig_data["strategic_relevance_score"],
                ranking_explanation=sig_data["ranking_explanation"],
                is_archived=False
            )
            session.add(sig)
            await session.flush()

            evidence = SignalEvidence(
                signal_id=sig.id,
                source_url=sig_data["source_url"],
                source_name=sig_data["source_name"],
                exact_quote=sig_data["verified_fact"],
                published_at=datetime.now(timezone.utc)
            )
            session.add(evidence)

        # Create Initial Monday Brief for MeetUniversity
        if demo["name"] == "MeetUniversity":
            now = datetime.now(timezone.utc)
            iso_year, iso_week, _ = now.isocalendar()
            brief = IntelligenceBrief(
                company_id=comp.id,
                brief_week=f"{iso_year}-W{iso_week:02d}",
                title=f"Monday Morning Intelligence Brief — {demo['name']}",
                executive_tldr=[
                    "UK Home Office increased student maintenance thresholds to £1,483/mo in London, tightening applicant affordability.",
                    "LeapScholar rolled out free mobile IELTS diagnostic mock tools to capture early-stage student leads.",
                    "Canadian student visa backlogs continue on forum feeds, opening immediate opportunity for alternative study destinations.",
                    "Internal strategy review indicates university partnership commissions remain steady at 12-15% across Tier-2 UK partners."
                ],
                strategic_alert={
                    "headline": "UK Student Maintenance Cost Threshold Raised",
                    "verified_fact": "International students must show proof of £1,483 per month for study in London, rising to reflect domestic cost-of-living increases.",
                    "ai_interpretation": "Directly impacts middle-income Indian family affordability; conversion drop expected unless student loan financing is facilitated.",
                    "recommended_action": "Integrate education loan partners on admissions portal and update financial proof calculator."
                },
                competitor_movements=[
                    {"competitor": "LeapScholar", "observation": "Unlimited AI-evaluated IELTS speaking tests launched.", "strategic_impact": "Direct top-of-funnel lead capture threat."},
                    {"competitor": "Leverage Edu", "observation": "Expanded Fly Finance forex and international banking services.", "strategic_impact": "Strengthens student ancillary service revenue lock-in."}
                ],
                market_shifts=[
                    {"shift": "UKVI Financial Maintenance Regulation", "evidence": "Official UKVI gazette update", "implication": "Higher upfront capital proof required for study visa grant."},
                    {"shift": "Canadian Provincial Attestation Caps", "evidence": "IRCC immigration guidelines", "implication": "Encourages diversification toward European and Australian institutions."}
                ],
                customer_voice=[
                    {"sentiment": "Anxiety over visa turnaround time for autumn intake", "source": "Reddit r/Indians_StudyAbroad"},
                    {"sentiment": "Confusion regarding tuition fee currency conversions", "source": "Trustpilot MeetUniversity Feed"}
                ],
                internal_alignment=[
                    {"internal_doc": "FY2026 Strategy Plan", "strategic_relevance": "Validates leadership decision to expand non-UK university partner contracts."}
                ],
                generated_at=now
            )
            session.add(brief)
            await session.flush()

            actions = [
                BriefAction(brief_id=brief.id, priority="P0", action_text="Finalize emergency student financing partner integration for UK autumn cohort.", owner_role="VP Strategic Partnerships", deadline="Wednesday 17:00", is_completed=False),
                BriefAction(brief_id=brief.id, priority="P1", action_text="Deploy updated visa maintenance cost calculator on MeetUniversity course finder.", owner_role="Head of Product", deadline="Friday 12:00", is_completed=False),
                BriefAction(brief_id=brief.id, priority="P2", action_text="Audit Reddit and Yocket community feeds for Canadian study permit alternative inquiries.", owner_role="Customer Growth Lead", deadline="Next 7 Days", is_completed=True)
            ]
            session.add_all(actions)

    await session.commit()
    logger.info("Demo data seeding completed for MeetUniversity, Postman, and Linear.")
