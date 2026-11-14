"use client";

import React, { useEffect, useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import { IntelligenceSignal, PillarType } from "@/types/api";
import {
  Activity,
  Filter,
  Search,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  X,
  FileCheck,
  Calendar,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime, formatDateOnly } from "@/lib/utils";

export default function IntelligenceFeedPage() {
  const { selectedCompany } = useCompany();
  const [signals, setSignals] = useState<IntelligenceSignal[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filters
  const [selectedPillar, setSelectedPillar] = useState<string>("ALL");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [minScore, setMinScore] = useState<number>(0);

  // Detail Modal / Drawer
  const [activeSignal, setActiveSignal] = useState<IntelligenceSignal | null>(null);

  useEffect(() => {
    if (!selectedCompany) return;
    loadSignals();
  }, [selectedCompany, selectedPillar, selectedUrgency, minScore]);

  async function loadSignals() {
    if (!selectedCompany) return;
    try {
      setIsLoading(true);
      const res = await api.listSignals(selectedCompany.id, {
        pillar: selectedPillar,
        urgency: selectedUrgency,
        min_score: minScore > 0 ? minScore : undefined,
        limit: 50,
      });
      setSignals(res.items);
      setTotalCount(res.total);
    } catch (err) {
      console.error("Failed to load signals:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRunAnalysis() {
    if (!selectedCompany) return;
    try {
      setIsAnalyzing(true);
      const newSignals = await api.analyseSignals(selectedCompany.id);
      await loadSignals();
      alert(`Analysis completed! Synthesized ${newSignals.length} new signals from crawled documents.`);
    } catch (err: any) {
      alert(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (!selectedCompany) return null;

  const filteredSignals = signals.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.verified_fact.toLowerCase().includes(q) ||
      s.ai_interpretation.toLowerCase().includes(q) ||
      (s.what_happened || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Intelligence Signal Feed</h1>
            <Badge variant="default" className="text-[11px] font-mono">
              {totalCount} Total Signals
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological stream of verified market developments, customer signals, and competitor movements.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleRunAnalysis}
          isLoading={isAnalyzing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Analyze Crawled Documents
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-card flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pillar Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Pillar:</span>
            <select
              value={selectedPillar}
              onChange={(e) => setSelectedPillar(e.target.value)}
              className="h-8 px-2 rounded border border-slate-300 bg-slate-50/50 font-medium text-slate-800"
            >
              <option value="ALL">All Categories</option>
              <option value="CUSTOMER">Customer Voice</option>
              <option value="COMPETITOR">Competitor Moves</option>
              <option value="MARKET">Market & Policy</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Urgency:</span>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="h-8 px-2 rounded border border-slate-300 bg-slate-50/50 font-medium text-slate-800"
            >
              <option value="ALL">All Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Min Score Threshold */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Min Score:</span>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="h-8 px-2 rounded border border-slate-300 bg-slate-50/50 font-medium text-slate-800"
            >
              <option value={0}>All Scores (0+)</option>
              <option value={60}>60+ Points</option>
              <option value={75}>75+ Points (High Relevance)</option>
              <option value={85}>85+ Points (Executive Only)</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search verified facts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Signals Feed List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Ranking intelligence signals...</span>
        </div>
      ) : filteredSignals.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Activity className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No signals matching your filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your score filter or click &quot;Analyze Crawled Documents&quot; to process newly ingested data.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSignals.map((signal) => {
            const firstEvidence = signal.evidences && signal.evidences.length > 0 ? signal.evidences[0] : null;

            return (
              <Card
                key={signal.id}
                hoverEffect
                onClick={() => setActiveSignal(signal)}
                className="p-5 cursor-pointer border-slate-200/90 transition-all hover:border-blue-300 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Badges Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          signal.direction === "OPPORTUNITY"
                            ? "success"
                            : signal.direction === "THREAT"
                            ? "danger"
                            : "default"
                        }
                        className="text-[10px]"
                      >
                        {signal.direction}
                      </Badge>

                      <Badge
                        variant={
                          signal.urgency === "CRITICAL"
                            ? "danger"
                            : signal.urgency === "HIGH"
                            ? "warning"
                            : "neutral"
                        }
                        className="text-[10px]"
                      >
                        {signal.urgency} URGENCY
                      </Badge>

                      <Badge variant="outline" className="text-[10px] font-mono">
                        {signal.pillar}
                      </Badge>

                      {signal.verification_status === "VERIFIED_SOURCE" && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Grounding
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-400 ml-auto">
                        Composite Score: {Math.round(signal.ranking_score)}/100
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {signal.title}
                    </h3>

                    {/* Verbatim Fact Grounding */}
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200/60 text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">Verified Evidence: </span>
                      <span className="italic">&quot;{signal.verified_fact}&quot;</span>
                    </div>

                    {/* AI Strategic Deduction */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-800">Strategic Impact: </span>
                      {signal.ai_interpretation}
                    </p>

                    {/* Source Footer */}
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      {firstEvidence && (
                        <a
                          href={firstEvidence.source_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-blue-600 flex items-center gap-1 font-mono text-slate-500"
                        >
                          Source: {firstEvidence.source_name || firstEvidence.source_url.replace(/^https?:\/\//, "")}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      <span>•</span>
                      <span>Discovered {formatRelativeTime(signal.created_at)}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-2" />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Signal Evidence & Traceability Drawer / Modal */}
      {activeSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 sticky top-0 bg-white z-10">
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {activeSignal.pillar}
                  </Badge>
                  <Badge
                    variant={
                      activeSignal.direction === "OPPORTUNITY"
                        ? "success"
                        : activeSignal.direction === "THREAT"
                        ? "danger"
                        : "default"
                    }
                    className="text-[10px]"
                  >
                    {activeSignal.direction}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900">{activeSignal.title}</h3>
              </div>
              <button
                onClick={() => setActiveSignal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Ranking Breakdown */}
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2">
                <div className="flex items-center justify-between font-semibold text-blue-950">
                  <span>Transparent Signal Ranking Audit</span>
                  <span className="font-mono text-sm font-bold">{Math.round(activeSignal.ranking_score)}/100</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 bg-white rounded border border-blue-100/80">
                    <div className="text-slate-500 font-medium">Source Reliability</div>
                    <div className="text-slate-900 font-bold font-mono text-xs mt-0.5">
                      {Math.round(activeSignal.source_reliability_score)} pts
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded border border-blue-100/80">
                    <div className="text-slate-500 font-medium">Evidence Strength</div>
                    <div className="text-slate-900 font-bold font-mono text-xs mt-0.5">
                      {Math.round(activeSignal.evidence_strength_score)} pts
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded border border-blue-100/80">
                    <div className="text-slate-500 font-medium">Strategic Relevance</div>
                    <div className="text-slate-900 font-bold font-mono text-xs mt-0.5">
                      {Math.round(activeSignal.strategic_relevance_score)} pts
                    </div>
                  </div>
                </div>
                {activeSignal.ranking_explanation && (
                  <p className="text-[11px] text-slate-600 italic pt-1">{activeSignal.ranking_explanation}</p>
                )}
              </div>

              {/* Verified Fact & Evidence Snippet */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  Verifiable Evidence Grounding (No Hallucination)
                </span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed font-mono text-[11px]">
                  &quot;{activeSignal.verified_fact}&quot;
                </div>
              </div>

              {/* What Happened */}
              {activeSignal.what_happened && (
                <div className="space-y-1">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">Event Description</span>
                  <p className="text-slate-700 leading-relaxed">{activeSignal.what_happened}</p>
                </div>
              )}

              {/* AI Strategic Deduction */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  Executive Interpretation
                </span>
                <p className="text-slate-800 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200/60">
                  {activeSignal.ai_interpretation}
                </p>
              </div>

              {/* Recommended Action */}
              <div className="space-y-1">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  Recommended Decision / Action
                </span>
                <p className="text-emerald-900 bg-emerald-50/70 p-2.5 rounded border border-emerald-200 leading-relaxed font-medium">
                  {activeSignal.recommended_action}
                </p>
              </div>

              {/* Source Evidence Links */}
              {activeSignal.evidences && activeSignal.evidences.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                    Traceable Citations
                  </span>
                  {activeSignal.evidences.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200/60">
                      <span className="text-slate-800 font-medium truncate max-w-sm">{ev.source_name || ev.source_url}</span>
                      <a
                        href={ev.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                      >
                        Visit Original URL <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setActiveSignal(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
