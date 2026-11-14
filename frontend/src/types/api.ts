export type PillarType = "CUSTOMER" | "COMPETITOR" | "MARKET" | "INTERNAL";

export type SourceType =
  | "FORUM"
  | "REVIEW_SITE"
  | "SOCIAL"
  | "COMPETITOR_SITE"
  | "NEWS"
  | "REGULATORY"
  | "INDUSTRY_BODY"
  | "INTERNAL_DOC"
  | "RSS"
  | "CUSTOM";

export type ApprovalStatus = "PROPOSED" | "APPROVED" | "REJECTED" | "CUSTOM" | "PAUSED";
export type HealthStatus = "HEALTHY" | "WARNING" | "BROKEN" | "AUDITING";

export interface Company {
  id: string;
  name: string;
  website_url: string;
  industry?: string | null;
  geography?: string | null;
  onboarding_status: string;
  created_at: string;
  updated_at: string;
  profile?: CompanyProfile | null;
}

export interface CompanyProfile {
  id: string;
  company_id: string;
  executive_summary?: string | null;
  value_proposition?: string | null;
  target_customer_profile?: string | null;
  business_model?: string | null;
  core_strengths?: string[] | null;
  known_weaknesses?: string[] | null;
  raw_research_data?: any;
  created_at: string;
  updated_at: string;
}

export interface InterviewQuestion {
  id: string;
  session_id: string;
  question_number: number;
  question_text: string;
  category: string;
  rationale?: string | null;
  answer_text?: string | null;
  is_answered: boolean;
  is_skipped: boolean;
  created_at: string;
}

export interface InterviewAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  is_skipped: boolean;
  skip_reason?: string | null;
  created_at: string;
}

export interface InterviewSession {
  id: string;
  company_id: string;
  status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  current_question_number: number;
  total_questions: number;
  completion_percentage: number;
  strategic_priorities?: Record<string, number> | null;
  current_question?: InterviewQuestion | null;
  created_at: string;
  updated_at: string;
  questions: InterviewQuestion[];
  answers?: InterviewAnswer[];
}

export interface IntelligenceSource {
  id: string;
  company_id: string;
  name: string;
  url: string;
  source_type: SourceType;
  pillar: PillarType;
  category?: string;
  reason_for_inclusion?: string | null;
  relevance_score: number;
  expected_frequency: string;
  reliability_score: number;
  approval_status: ApprovalStatus;
  health_status: HealthStatus;
  last_crawled_at?: string | null;
  last_success_at?: string | null;
  consecutive_failures: number;
  latency_ms: number;
  created_at: string;
}

export interface Competitor {
  id: string;
  company_id: string;
  name: string;
  website_url: string;
  tier: "DIRECT" | "INDIRECT" | "EMERGING" | "SUBSTITUTE";
  notes?: string | null;
  relevance_reason?: string | null;
  created_at: string;
}

export interface SignalEvidence {
  id: string;
  signal_id: string;
  crawled_document_id?: string | null;
  source_url: string;
  source_name: string;
  exact_quote: string;
  published_at?: string | null;
  created_at: string;
}

export interface IntelligenceSignal {
  id: string;
  company_id: string;
  title: string;
  pillar: PillarType;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  direction: "OPPORTUNITY" | "THREAT" | "NEUTRAL";
  what_happened?: string | null;
  publication_date?: string | null;
  verification_status: "VERIFIED_SOURCE" | "UNVERIFIED" | "SYNTHESIZED";
  business_impact?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  affected_business_area?: string | null;
  verified_fact: string;
  ai_interpretation: string;
  recommended_action: string;
  confidence_score: number;
  ranking_score: number;
  source_reliability_score: number;
  evidence_strength_score: number;
  strategic_relevance_score: number;
  ranking_explanation?: string | null;
  is_archived: boolean;
  created_at: string;
  evidences: SignalEvidence[];
}

export interface BriefAction {
  id: string;
  brief_id: string;
  priority: "P0" | "P1" | "P2" | string;
  action_text: string;
  owner?: string | null;
  owner_role?: string | null;
  deadline?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | string;
  is_completed?: boolean;
  created_at: string;
}

export interface IntelligenceBrief {
  id: string;
  company_id: string;
  brief_week: string;
  title: string;
  executive_tldr: string[];
  strategic_alert?: {
    headline: string;
    verified_fact: string;
    ai_interpretation: string;
    recommended_action: string;
  } | null;
  competitor_movements?: Array<{ competitor: string; observation: string; strategic_impact: string }> | null;
  market_shifts?: Array<{ shift: string; evidence: string; implication: string }> | null;
  customer_voice?: Array<{ sentiment: string; source: string; evidence?: string }> | null;
  internal_alignment?: Array<{ internal_doc: string; strategic_relevance: string }> | null;
  opportunities?: Array<{ title: string; evidence: string; impact: string; timeframe: string }> | null;
  risks_and_threats?: Array<{ risk: string; severity: string; evidence: string; mitigation: string }> | null;
  what_to_watch?: string[] | null;
  source_appendix?: Array<{
    original_source: string;
    direct_url: string;
    publication_date: string;
    discovery_date: string;
    verification_status: string;
    evidence_snippet: string;
  }> | null;
  status?: string;
  generated_at: string;
  actions: BriefAction[];
}

export interface InternalDocument {
  id: string;
  company_id: string;
  filename: string;
  file_type: string;
  file_path: string;
  file_size_bytes: number;
  chunk_count: number;
  status: "INDEXED" | "FAILED" | "PROCESSING";
  summary?: string | null;
  uploaded_at: string;
}

export interface CrawlJob {
  id: string;
  company_id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  started_at: string;
  completed_at?: string | null;
  items_crawled: number;
  items_extracted: number;
  errors?: Record<string, string> | null;
  created_at: string;
}

export interface ScheduledJob {
  id: string;
  company_id: string;
  job_name?: string;
  job_type?: string;
  cron_expression: string;
  timezone?: string;
  briefing_day?: string;
  briefing_time?: string;
  monitoring_frequency?: string;
  is_active: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  last_status?: string | null;
  last_duration_ms?: number | null;
  last_error?: string | null;
  execution_logs?: any[];
  created_at?: string;
}

export interface SourceHealthReport {
  id: string;
  company_id: string;
  audit_date?: string;
  audited_at?: string;
  total_sources?: number;
  total_sources_checked?: number;
  healthy_count: number;
  warning_count: number;
  broken_count: number;
  dead_urls_count?: number;
  duplicate_sources_count?: number;
  inactive_sources_count?: number;
  average_latency_ms: number;
  findings?: any[];
  recommendations?: any[];
  created_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
