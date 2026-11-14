"use client";

import React, { useEffect, useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import { IntelligenceBrief, BriefAction } from "@/types/api";
import {
  FileText,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Download,
  Printer,
  Calendar,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Users,
  Building,
  CheckSquare,
  Square,
  Clock,
  ExternalLink,
  Eye,
  Target,
  FileCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatDateOnly } from "@/lib/utils";

export default function MondayBriefPage() {
  const { selectedCompany } = useCompany();
  const [briefs, setBriefs] = useState<IntelligenceBrief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<IntelligenceBrief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [actionStates, setActionStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!selectedCompany) return;
    loadBriefs();
  }, [selectedCompany]);

  async function loadBriefs() {
    if (!selectedCompany) return;
    try {
      setIsLoading(true);
      const list = await api.listBriefs(selectedCompany.id);
      setBriefs(list);
      if (list.length > 0) {
        setSelectedBrief(list[0]);
        const initialStates: Record<string, boolean> = {};
        list[0].actions?.forEach((a) => {
          initialStates[a.id] = a.status === "COMPLETED" || a.is_completed === true;
        });
        setActionStates(initialStates);
      } else {
        setSelectedBrief(null);
      }
    } catch (err) {
      console.error("Failed to load briefs:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateBrief(force = false) {
    if (!selectedCompany) return;
    try {
      setIsGenerating(true);
      const newBrief = await api.generateBrief(selectedCompany.id, undefined, force);
      await loadBriefs();
      setSelectedBrief(newBrief);
    } catch (err: any) {
      alert(`Brief generation error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleToggleAction(actionId: string) {
    try {
      const updated = await api.toggleBriefAction(actionId);
      setActionStates((prev) => ({
        ...prev,
        [actionId]: updated.status === "COMPLETED",
      }));
    } catch (err) {
      // optimistic toggle fallback
      setActionStates((prev) => ({
        ...prev,
        [actionId]: !prev[actionId],
      }));
    }
  }

  function handleOpenPrintLayout() {
    if (!selectedBrief) return;
    const url = api.getBriefExportHtmlUrl(selectedBrief.id);
    window.open(url, "_blank");
  }

  function handleDownloadMarkdown() {
    if (!selectedBrief) return;
    const url = api.getBriefExportMarkdownUrl(selectedBrief.id);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `brief-${selectedBrief.brief_week}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-brand-600" />
            Monday Morning Intelligence Brief
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Synthesized weekly strategic intelligence for {selectedCompany?.name || "your company"}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedBrief && (
            <>
              <Button variant="outline" size="sm" onClick={handleDownloadMarkdown} className="flex items-center gap-1.5">
                <Download className="h-4 w-4" />
                Markdown
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenPrintLayout} className="flex items-center gap-1.5">
                <Printer className="h-4 w-4" />
                Printable HTML
              </Button>
            </>
          )}

          <Button
            size="sm"
            onClick={() => handleGenerateBrief(true)}
            disabled={isGenerating || !selectedCompany}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Synthesizing Brief..." : "Regenerate Brief"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-3" />
          <p className="text-sm text-slate-500">Loading intelligence briefings...</p>
        </div>
      ) : !selectedBrief ? (
        <Card className="text-center py-16">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Briefing Generated Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            Signal Stack compiles weekly executive briefs every Monday morning from ranked crawl signals and internal strategy files.
          </p>
          <Button onClick={() => handleGenerateBrief(false)} disabled={isGenerating}>
            <Sparkles className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Monday Brief Now"}
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Brief Selection Selector Bar */}
          {briefs.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Archive:</span>
              {briefs.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrief(b)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedBrief.id === b.id
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {b.brief_week}
                </button>
              ))}
            </div>
          )}

          {/* Brief Header Banner */}
          <Card className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-sm border-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-brand-500/20 text-brand-300 border-brand-500/40 text-xs">
                    {selectedBrief.brief_week}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    Compiled {formatDateTime(selectedBrief.generated_at)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">{selectedBrief.title}</h2>
                <p className="text-xs text-slate-300 mt-1">
                  10-Section Evidence-Backed Executive Intelligence Brief for {selectedCompany?.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPrintLayout}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
                >
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  Print / Save PDF
                </Button>
              </div>
            </div>
          </Card>

          {/* SECTION 1: EXECUTIVE SUMMARY (5 Most Important Developments) */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <CardTitle className="text-base font-semibold">Executive Summary — Top 5 Developments</CardTitle>
              </div>
            </CardHeader>
            <div className="p-6">
              <div className="space-y-3">
                {selectedBrief.executive_tldr?.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* STRATEGIC ALERT CALLOUT (If present) */}
          {selectedBrief.strategic_alert && selectedBrief.strategic_alert.headline && (
            <Card className="border-l-4 border-l-rose-500 bg-rose-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Critical Strategic Alert</span>
                </div>
                <CardTitle className="text-lg text-rose-950 mt-1">
                  {selectedBrief.strategic_alert.headline}
                </CardTitle>
              </CardHeader>
              <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-2xs">
                  <span className="font-semibold text-rose-800 uppercase block mb-1">Verified Fact</span>
                  <p className="text-slate-700 leading-relaxed">
                    &ldquo;{selectedBrief.strategic_alert.verified_fact}&rdquo;
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-2xs">
                  <span className="font-semibold text-rose-800 uppercase block mb-1">AI Strategic Deduction</span>
                  <p className="text-slate-700 leading-relaxed">
                    {selectedBrief.strategic_alert.ai_interpretation}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-2xs">
                  <span className="font-semibold text-rose-800 uppercase block mb-1">Immediate Tactical Action</span>
                  <p className="text-slate-700 leading-relaxed font-medium text-rose-900">
                    {selectedBrief.strategic_alert.recommended_action}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* GRID: CUSTOMER & COMPETITOR INTELLIGENCE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SECTION 2: CUSTOMER SIGNALS */}
            <Card className="p-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <Users className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-sm text-slate-900">Customer Signals</h3>
              </div>
              <div className="space-y-3">
                {selectedBrief.customer_voice && selectedBrief.customer_voice.length > 0 ? (
                  selectedBrief.customer_voice.map((cv, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                      <div className="font-semibold text-brand-600 uppercase tracking-wide text-2xs mb-1">
                        {cv.source}
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed">{cv.sentiment}</p>
                      {cv.evidence && (
                        <p className="text-slate-500 mt-1 italic">Evidence: {cv.evidence}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3">
                    No meaningful customer friction or negative review signals identified this week.
                  </p>
                )}
              </div>
            </Card>

            {/* SECTION 3: COMPETITOR INTELLIGENCE */}
            <Card className="p-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <Building className="h-4 w-4 text-amber-600" />
                <h3 className="font-semibold text-sm text-slate-900">Competitor Intelligence</h3>
              </div>
              <div className="space-y-3">
                {selectedBrief.competitor_movements && selectedBrief.competitor_movements.length > 0 ? (
                  selectedBrief.competitor_movements.map((comp, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                      <div className="font-bold text-slate-900 mb-1">{comp.competitor}</div>
                      <p className="text-slate-700">{comp.observation}</p>
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-slate-600 font-medium">
                        Strategic Impact: <span className="text-slate-900 font-normal">{comp.strategic_impact}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3">
                    No significant new competitor movements detected this week.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* GRID: MARKET & INTERNAL INTELLIGENCE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SECTION 4: MARKET INTELLIGENCE */}
            <Card className="p-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">
                  4
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-slate-900">Market Intelligence</h3>
              </div>
              <div className="space-y-3">
                {selectedBrief.market_shifts && selectedBrief.market_shifts.length > 0 ? (
                  selectedBrief.market_shifts.map((m, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                      <div className="font-bold text-slate-900 mb-1">{m.shift}</div>
                      <p className="text-slate-500 text-2xs mb-1">Evidence: {m.evidence}</p>
                      <p className="text-slate-700">
                        <strong className="text-slate-900">Implication:</strong> {m.implication}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3">
                    No major regulatory or macroeconomic policy shifts detected this week.
                  </p>
                )}
              </div>
            </Card>

            {/* SECTION 5: INTERNAL BUSINESS INTELLIGENCE */}
            <Card className="p-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <div className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">
                  5
                </div>
                <FileCheck className="h-4 w-4 text-violet-600" />
                <h3 className="font-semibold text-sm text-slate-900">Internal Business Intelligence (RAG)</h3>
              </div>
              <div className="space-y-3">
                {selectedBrief.internal_alignment && selectedBrief.internal_alignment.length > 0 ? (
                  selectedBrief.internal_alignment.map((int, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                      <div className="font-bold text-violet-900 mb-1 flex items-center gap-1.5">
                        <FileText className="h-3 w-3 text-violet-600" />
                        {int.internal_doc}
                      </div>
                      <p className="text-slate-700 leading-relaxed">{int.strategic_relevance}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3">
                    No uploaded internal documents cross-referenced for this brief.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* SECTION 6: ACTIONABLE OPPORTUNITIES (At least 3) */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">
                    6
                  </div>
                  <Target className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base font-semibold">Actionable Strategic Opportunities</CardTitle>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {selectedBrief.opportunities?.length || 0} Evidence-Backed
                </span>
              </div>
            </CardHeader>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedBrief.opportunities?.map((opp, idx) => (
                  <div key={idx} className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-2xs font-bold uppercase text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                          Opportunity #{idx + 1}
                        </span>
                        <span className="text-2xs text-slate-500 font-medium">{opp.timeframe}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-2">{opp.title}</h4>
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        <strong className="text-slate-800">Evidence:</strong> {opp.evidence}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-emerald-100/80 text-xs text-emerald-950">
                      <strong>Impact:</strong> {opp.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* SECTION 7: RISKS & THREATS */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">
                  7
                </div>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-base font-semibold">Risks & Threats</CardTitle>
              </div>
            </CardHeader>
            <div className="p-6">
              <div className="space-y-3">
                {selectedBrief.risks_and_threats?.map((r, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded uppercase ${
                          r.severity === "HIGH"
                            ? "bg-rose-100 text-rose-700"
                            : r.severity === "MEDIUM"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-200 text-slate-700"
                        }`}>
                          {r.severity} Risk
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">{r.risk}</h4>
                      </div>
                      <p className="text-xs text-slate-600"><strong>Evidence:</strong> {r.evidence}</p>
                    </div>
                    <div className="sm:text-right text-xs text-slate-700 bg-white sm:bg-transparent p-2 sm:p-0 rounded border sm:border-0 border-slate-100">
                      <span className="font-semibold block text-slate-900">Mitigation:</span>
                      {r.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* SECTION 8: RECOMMENDED ACTIONS FOR THIS WEEK */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">
                    8
                  </div>
                  <CheckSquare className="h-5 w-5 text-brand-600" />
                  <CardTitle className="text-base font-semibold">Recommended Actions for This Week</CardTitle>
                </div>
                <span className="text-xs text-slate-500">Interactive priority action plan</span>
              </div>
            </CardHeader>
            <div className="p-6">
              <div className="space-y-3">
                {selectedBrief.actions?.map((action) => {
                  const isDone = actionStates[action.id] ?? false;
                  return (
                    <div
                      key={action.id}
                      onClick={() => handleToggleAction(action.id)}
                      className={`flex items-start sm:items-center justify-between gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                        isDone
                          ? "bg-slate-50/70 border-slate-200 opacity-70 line-through"
                          : "bg-white border-slate-200 hover:border-brand-300 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <button type="button" className="text-brand-600 mt-0.5 sm:mt-0">
                          {isDone ? (
                            <CheckSquare className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <Square className="h-5 w-5 text-slate-400" />
                          )}
                        </button>
                        <div>
                          <p className={`text-sm font-semibold ${isDone ? "text-slate-400" : "text-slate-900"}`}>
                            {action.action_text}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-2xs text-slate-500">
                            <span>Owner: <strong>{action.owner || action.owner_role || "Executive"}</strong></span>
                            <span>Deadline: <strong>{action.deadline || "This Week"}</strong></span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-2xs font-bold uppercase shrink-0 ${
                          action.priority === "P0"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : action.priority === "P1"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {action.priority}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* SECTION 9: WHAT WE SHOULD WATCH */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">
                  9
                </div>
                <Eye className="h-5 w-5 text-slate-700" />
                <CardTitle className="text-base font-semibold">What We Should Watch (Tripwires)</CardTitle>
              </div>
            </CardHeader>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedBrief.what_to_watch?.map((w, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg flex items-start gap-2.5">
                    <span className="text-brand-600 font-bold text-sm">👁️</span>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* SECTION 10: SOURCE APPENDIX & CITATIONS */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 font-bold text-xs flex items-center justify-center">
                    10
                  </div>
                  <FileText className="h-5 w-5 text-slate-600" />
                  <CardTitle className="text-base font-semibold">Source Appendix & Traceable Citations</CardTitle>
                </div>
                <span className="text-xs text-slate-400">
                  {selectedBrief.source_appendix?.length || 0} Verified Citations
                </span>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Direct URL</th>
                    <th className="py-3 px-4">Published</th>
                    <th className="py-3 px-4">Discovered</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Evidence Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedBrief.source_appendix && selectedBrief.source_appendix.length > 0 ? (
                    selectedBrief.source_appendix.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {s.original_source}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <a
                            href={s.direct_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:underline flex items-center gap-1"
                          >
                            {s.direct_url.replace(/^https?:\/\//, "").slice(0, 30)}...
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{s.publication_date}</td>
                        <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">{s.discovery_date}</td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-2xs font-semibold">
                            {s.verification_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={s.evidence_snippet}>
                          &ldquo;{s.evidence_snippet}&rdquo;
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                        No direct external source citations recorded for this briefing period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
