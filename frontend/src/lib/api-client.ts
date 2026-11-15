import {
  Company,
  CompanyProfile,
  InterviewSession,
  IntelligenceSource,
  IntelligenceSignal,
  IntelligenceBrief,
  BriefAction,
  InternalDocument,
  CrawlJob,
  ScheduledJob,
  SourceHealthReport,
  Competitor,
  ApiResponse,
  PaginatedResponse,
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }
  const json: ApiResponse<T> = await res.json();
  return json.data;
}

export const api = {
  // --- COMPANIES ---
  async listCompanies(): Promise<Company[]> {
    const res = await fetch(`${BASE_URL}/api/companies`);
    return handleResponse<Company[]>(res);
  },

  async getCompany(companyId: string): Promise<Company> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}`);
    return handleResponse<Company>(res);
  },

  async createCompany(data: { name: string; website_url: string; industry?: string; geography?: string }): Promise<Company> {
    const res = await fetch(`${BASE_URL}/api/companies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Company>(res);
  },

  async updateCompany(companyId: string, data: Partial<Company>): Promise<Company> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Company>(res);
  },

  async triggerResearch(companyId: string): Promise<CompanyProfile> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/research`, {
      method: "POST",
    });
    return handleResponse<CompanyProfile>(res);
  },

  async getResearch(companyId: string): Promise<CompanyProfile> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/research`);
    return handleResponse<CompanyProfile>(res);
  },

  // --- INTERVIEW ---
  async startInterview(companyId: string, restart = false): Promise<InterviewSession> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/interview/start?restart=${restart}`, {
      method: "POST",
    });
    return handleResponse<InterviewSession>(res);
  },

  async getInterview(sessionId: string): Promise<InterviewSession> {
    const res = await fetch(`${BASE_URL}/api/interviews/${sessionId}`);
    return handleResponse<InterviewSession>(res);
  },

  async submitAnswer(sessionId: string, answerText: string): Promise<InterviewSession> {
    const res = await fetch(`${BASE_URL}/api/interviews/${sessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer_text: answerText }),
    });
    return handleResponse<InterviewSession>(res);
  },

  async skipQuestion(sessionId: string, reason = "Skipped by founder"): Promise<InterviewSession> {
    const res = await fetch(`${BASE_URL}/api/interviews/${sessionId}/skip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return handleResponse<InterviewSession>(res);
  },

  // --- SOURCES ---
  async listSources(companyId: string, pillar?: string, approvalStatus?: string): Promise<IntelligenceSource[]> {
    const params = new URLSearchParams();
    if (pillar && pillar !== "ALL") params.append("pillar", pillar);
    if (approvalStatus && approvalStatus !== "ALL") params.append("approval_status", approvalStatus);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/sources${qs}`);
    return handleResponse<IntelligenceSource[]>(res);
  },

  async createSource(companyId: string, data: Partial<IntelligenceSource>): Promise<IntelligenceSource> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/sources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<IntelligenceSource>(res);
  },

  async updateSource(sourceId: string, data: Partial<IntelligenceSource>): Promise<IntelligenceSource> {
    const res = await fetch(`${BASE_URL}/api/sources/${sourceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<IntelligenceSource>(res);
  },

  async deleteSource(sourceId: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/api/sources/${sourceId}`, {
      method: "DELETE",
    });
    return handleResponse<boolean>(res);
  },

  async discoverSources(companyId: string, maxSources = 25): Promise<IntelligenceSource[]> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/sources/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ max_sources: maxSources }),
    });
    return handleResponse<IntelligenceSource[]>(res);
  },

  // --- CRAWLING & MONITORING ---
  async triggerCrawl(companyId: string, sourceIds?: string[]): Promise<CrawlJob> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_ids: sourceIds, force_all_approved: true }),
    });
    return handleResponse<CrawlJob>(res);
  },

  async getCrawlHistory(companyId: string): Promise<CrawlJob[]> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/crawl-history`);
    return handleResponse<CrawlJob[]>(res);
  },

  // --- INTELLIGENCE SIGNALS ---
  async listSignals(
    companyId: string,
    filters?: { pillar?: string; urgency?: string; min_score?: number; page?: number; limit?: number }
  ): Promise<PaginatedResponse<IntelligenceSignal>> {
    const params = new URLSearchParams();
    if (filters?.pillar && filters.pillar !== "ALL") params.append("pillar", filters.pillar);
    if (filters?.urgency && filters.urgency !== "ALL") params.append("urgency", filters.urgency);
    if (filters?.min_score) params.append("min_score", filters.min_score.toString());
    params.append("page", (filters?.page || 1).toString());
    params.append("limit", (filters?.limit || 20).toString());
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/signals?${params.toString()}`);
    if (!res.ok) {
      let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        errorDetail = errJson.detail || errJson.message || errorDetail;
      } catch {}
      throw new Error(errorDetail);
    }
    const json = await res.json();
    const items = Array.isArray(json.data) ? json.data : (Array.isArray(json.items) ? json.items : []);
    const pagination = json.pagination || {};
    return {
      items,
      total: pagination.total ?? items.length,
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
      total_pages: pagination.total_pages ?? 1,
    };
  },

  async getSignal(signalId: string): Promise<IntelligenceSignal> {
    const res = await fetch(`${BASE_URL}/api/signals/${signalId}`);
    return handleResponse<IntelligenceSignal>(res);
  },

  async analyseSignals(companyId: string): Promise<IntelligenceSignal[]> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/analyse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ min_confidence: 0.65 }),
    });
    return handleResponse<IntelligenceSignal[]>(res);
  },

  // --- MONDAY BRIEFS ---
  async generateBrief(companyId: string, weekIdentifier?: string, forceRefresh = false): Promise<IntelligenceBrief> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/briefs/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ week_identifier: weekIdentifier, force_refresh: forceRefresh }),
    });
    return handleResponse<IntelligenceBrief>(res);
  },

  async listBriefs(companyId: string): Promise<IntelligenceBrief[]> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/briefs`);
    return handleResponse<IntelligenceBrief[]>(res);
  },

  async getBrief(briefId: string): Promise<IntelligenceBrief> {
    const res = await fetch(`${BASE_URL}/api/briefs/${briefId}`);
    return handleResponse<IntelligenceBrief>(res);
  },

  async toggleBriefAction(actionId: string): Promise<BriefAction> {
    const res = await fetch(`${BASE_URL}/api/briefs/actions/${actionId}`, {
      method: "PATCH",
    });
    return handleResponse<BriefAction>(res);
  },

  getBriefExportHtmlUrl(briefId: string): string {
    return `${BASE_URL}/api/briefs/${briefId}/export/html`;
  },

  getBriefExportMarkdownUrl(briefId: string): string {
    return `${BASE_URL}/api/briefs/${briefId}/export/markdown`;
  },

  // --- INTERNAL DOCUMENTS ---
  async uploadDocument(companyId: string, file: File): Promise<InternalDocument> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/documents/upload`, {
      method: "POST",
      body: formData,
    });
    return handleResponse<InternalDocument>(res);
  },

  async listDocuments(companyId: string): Promise<InternalDocument[]> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/documents`);
    return handleResponse<InternalDocument[]>(res);
  },

  // --- COMPETITORS ---
  async listCompetitors(companyId: string): Promise<Competitor[]> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/competitors`);
    return handleResponse<Competitor[]>(res);
  },

  async createCompetitor(companyId: string, data: { name: string; website_url: string; tier?: string; notes?: string }): Promise<Competitor> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/competitors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Competitor>(res);
  },

  // --- SCHEDULING & AUDIT ---
  async listSchedules(companyId: string): Promise<ScheduledJob[]> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/schedules`);
    return handleResponse<ScheduledJob[]>(res);
  },

  async createSchedule(companyId: string, data: Partial<ScheduledJob>): Promise<ScheduledJob> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<ScheduledJob>(res);
  },

  async updateSchedule(companyId: string, scheduleId: string, data: Partial<ScheduledJob>): Promise<ScheduledJob> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/schedules/${scheduleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<ScheduledJob>(res);
  },

  async triggerWeeklyWorkflow(companyId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/schedules/trigger-weekly`, {
      method: "POST",
    });
    return handleResponse<any>(res);
  },

  async triggerAuditWorkflow(companyId: string): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/schedules/trigger-audit`, {
      method: "POST",
    });
    return handleResponse<any>(res);
  },

  async auditSources(companyId: string): Promise<SourceHealthReport> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/source-audit`, {
      method: "POST",
    });
    return handleResponse<SourceHealthReport>(res);
  },

  async listSourceAudits(companyId: string): Promise<SourceHealthReport[]> {
    const res = await fetch(`${BASE_URL}/api/companies/${companyId}/source-audits`);
    return handleResponse<SourceHealthReport[]>(res);
  },
};
