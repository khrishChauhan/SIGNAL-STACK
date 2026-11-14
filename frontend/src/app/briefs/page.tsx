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
  Share2,
  Calendar,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Users,
  Building,
  CheckSquare,
  Square,
  Clock,
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
        // initialize action states
        const initialStates: Record<string, boolean> = {};
        list[0].actions?.forEach((a) => {
          initialStates[a.id] = a.is_completed;
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

  function toggleAction(actionId: string) {
    setActionStates((prev) => ({
      ...prev,
      [actionId]: !prev[actionId],
    }));
  }

  function handleExportMarkdown() {
    if (!selectedBrief) return;
    const content = `# ${selectedBrief.title}
Week: ${selectedBrief.brief_week}
Generated: ${selectedBrief.generated_at}

## Executive TL;DR
${selectedBrief.executive_tldr?.map((t) => `- ${t}`).join("\n")}

## Strategic Alert
Headline: ${selectedBrief.strategic_alert?.headline}
Verified Evidence: "${selectedBrief.strategic_alert?.verified_fact}"
AI Interpretation: ${selectedBrief.strategic_alert?.ai_interpretation}
Immediate Action: ${selectedBrief.strategic_alert?.recommended_action}

## Prioritized Executive Actions
${selectedBrief.actions?.map((a) => `[${actionStates[a.id] ? "x" : " "}] [${a.priority}] ${a.action_text} (Owner: ${a.owner_role || "Executive"}, Deadline: ${a.deadline || "This Week"})`).join("\n")}
`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Monday_Brief_${selectedBrief.brief_week}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!selectedCompany) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Monday Morning Intelligence Brief</h1>
            <Badge variant="info" className="text-[11px] font-mono">
              Executive Briefing Room
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Autonomous 7-section executive dossier grounded in ranked external signals and internal strategy files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedBrief && (
            <Button variant="outline" size="sm" onClick={handleExportMarkdown} className="border-slate-300">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export Markdown
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => handleGenerateBrief(true)}
            isLoading={isGenerating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Synthesize New Brief
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Compiling executive dossier from knowledge store...</span>
        </div>
      ) : !selectedBrief ? (
        <Card className="p-12 text-center space-y-3">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No Monday Brief generated yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Synthesize New Brief&quot; above to cross-reference all crawled signals and internal files for {selectedCompany.name}.
          </p>
          <Button size="sm" onClick={() => handleGenerateBrief(false)} isLoading={isGenerating}>
            Generate Brief Now
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Week Archive Switcher */}
          {briefs.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="font-semibold text-slate-500">Historical Dossiers:</span>
              {briefs.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedBrief(b);
                    const st: Record<string, boolean> = {};
                    b.actions?.forEach((a) => (st[a.id] = a.is_completed));
                    setActionStates(st);
                  }}
                  className={`px-3 py-1 rounded font-mono text-xs transition-colors ${
                    selectedBrief.id === b.id
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {b.brief_week}
                </button>
              ))}
            </div>
          )}

          {/* Dossier Document Container */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-elevated overflow-hidden">
            {/* Dossier Header */}
            <div className="p-6 md:p-8 border-b border-slate-200 bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>CONFIDENTIAL • EXECUTIVE BRIEFING</span>
                <span>WEEK: {selectedBrief.brief_week}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">{selectedBrief.title}</h1>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
                <span>Target: {selectedCompany.name}</span>
                <span>•</span>
                <span>Generated: {formatDateTime(selectedBrief.generated_at)}</span>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* 1. Executive Summary / TL;DR */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    1. Executive Summary & TL;DR
                  </h2>
                </div>
                <div className="bg-slate-50/70 p-4 rounded-lg border border-slate-200/60 space-y-2.5">
                  {selectedBrief.executive_tldr?.map((bullet, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 leading-relaxed font-medium">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. Critical Strategic Alert */}
              {selectedBrief.strategic_alert && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      2. Critical Strategic Alert
                    </h2>
                  </div>
                  <div className="p-4 rounded-lg bg-rose-50/50 border border-rose-200 space-y-3 text-xs">
                    <div className="text-sm font-bold text-rose-950">
                      {selectedBrief.strategic_alert.headline}
                    </div>

                    <div className="p-3 bg-white rounded border border-rose-100 font-mono text-[11px] text-slate-800">
                      <span className="font-semibold text-rose-900 not-italic">Verifiable Evidence Quote: </span>
                      &quot;{selectedBrief.strategic_alert.verified_fact}&quot;
                    </div>

                    <div className="text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900">Strategic Implication: </span>
                      {selectedBrief.strategic_alert.ai_interpretation}
                    </div>

                    <div className="p-2.5 rounded bg-white border border-rose-200 text-rose-900 font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0 animate-ping"></span>
                      <span>Immediate Decision: {selectedBrief.strategic_alert.recommended_action}</span>
                    </div>
                  </div>
                </section>
              )}

              {/* 3. Competitor Movements */}
              {selectedBrief.competitor_movements && selectedBrief.competitor_movements.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Users className="w-4 h-4 text-amber-600" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      3. Competitor Movements & Rival Tracking
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBrief.competitor_movements.map((move, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{move.competitor}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            Rival Move
                          </Badge>
                        </div>
                        <p className="text-slate-600 italic">&quot;{move.observation}&quot;</p>
                        <p className="text-slate-800 font-medium">
                          <span className="text-slate-500">Impact: </span>
                          {move.strategic_impact}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 4. Market & Policy Shifts */}
              {selectedBrief.market_shifts && selectedBrief.market_shifts.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      4. Market & Regulatory Shifts
                    </h2>
                  </div>
                  <div className="space-y-2.5">
                    {selectedBrief.market_shifts.map((shift, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-emerald-50/30 border border-emerald-100 text-xs space-y-1">
                        <div className="font-bold text-emerald-950">{shift.shift}</div>
                        <div className="text-slate-600 text-[11px] italic font-mono">{shift.evidence}</div>
                        <div className="text-slate-800 font-medium pt-0.5">{shift.implication}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 5. Customer Voice */}
              {selectedBrief.customer_voice && selectedBrief.customer_voice.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      5. Customer Voice & Student Pain Points
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {selectedBrief.customer_voice.map((cv, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 space-y-1">
                        <div className="text-slate-800 font-medium">&quot;{cv.sentiment}&quot;</div>
                        <div className="text-[10px] text-slate-400 font-mono">Source Feed: {cv.source}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 6. Internal Alignment (RAG Grounding) */}
              {selectedBrief.internal_alignment && selectedBrief.internal_alignment.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      6. Internal Alignment (RAG Grounding)
                    </h2>
                  </div>
                  <div className="space-y-2 text-xs">
                    {selectedBrief.internal_alignment.map((align, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-indigo-50/40 border border-indigo-100 flex items-start gap-2.5">
                        <span className="font-mono text-indigo-700 font-bold whitespace-nowrap">
                          [{align.internal_doc}]:
                        </span>
                        <span className="text-slate-700 leading-relaxed font-medium">
                          {align.strategic_relevance}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 7. Prioritized Executive Decisions (P0 / P1 / P2) */}
              <section className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      7. Prioritized Executive Actions
                    </h2>
                  </div>
                  <span className="text-[11px] text-slate-400">Mark completed items in-place</span>
                </div>

                <div className="space-y-2 text-xs">
                  {selectedBrief.actions?.map((act) => {
                    const isDone = actionStates[act.id] ?? act.is_completed;
                    return (
                      <div
                        key={act.id}
                        onClick={() => toggleAction(act.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
                          isDone
                            ? "bg-slate-50 border-slate-200 text-slate-400 line-through"
                            : "bg-white border-slate-200/90 hover:border-slate-300 shadow-sm text-slate-900"
                        }`}
                      >
                        <button className="mt-0.5 text-blue-600 flex-shrink-0">
                          {isDone ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </button>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                act.priority === "P0"
                                  ? "danger"
                                  : act.priority === "P1"
                                  ? "warning"
                                  : "neutral"
                              }
                              className="text-[10px] font-mono font-bold"
                            >
                              {act.priority}
                            </Badge>
                            <span className="font-semibold">{act.action_text}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                            <span>Owner: {act.owner_role || "Executive Leadership"}</span>
                            <span>•</span>
                            <span>Deadline: {act.deadline || "This Wednesday"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
