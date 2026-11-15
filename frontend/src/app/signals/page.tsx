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
  SlidersHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FeedItemSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime, formatDateOnly } from "@/lib/utils";

const PILLARS: Array<{ id: PillarType | "ALL"; label: string }> = [
  { id: "ALL", label: "All Pillars" },
  { id: "CUSTOMER", label: "Customers" },
  { id: "COMPETITOR", label: "Competitors" },
  { id: "MARKET", label: "Market & Policy" },
];

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
      const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
      setSignals(items);
      setTotalCount(res?.total ?? items.length);
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
      alert(`Analysis completed: synthesized ${newSignals.length} new signals from crawled documents.`);
    } catch (err: any) {
      alert(`Analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (!selectedCompany) return null;

  const safeSignals = Array.isArray(signals) ? signals : [];

  const filteredSignals = safeSignals.filter((s) => {
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Intelligence Signal Feed</h1>
            <Badge variant="default" className="text-[11px] font-mono">
              {totalCount} Verified
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological stream of verified market developments, customer feedback, and competitor movements.
          </p>
        </div>

        <Button
          size="sm"
          variant="brand"
          onClick={handleRunAnalysis}
          isLoading={isAnalyzing}
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          Analyze Crawled Feeds
        </Button>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-card flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Pills & Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {PILLARS.map((p) => {
            const isSelected = selectedPillar === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPillar(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-subtle"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {p.label}
              </button>
            );
          })}

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Urgency Filter */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-300/80 bg-slate-50 text-xs font-semibold text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Urgencies</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Min Score Threshold */}
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="h-8 px-2.5 rounded-lg border border-slate-300/80 bg-slate-50 text-xs font-semibold text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={0}>All Scores (0+)</option>
            <option value={60}>60+ Points</option>
            <option value={75}>75+ Points (High Relevance)</option>
            <option value={85}>85+ Points (Executive Only)</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search verified facts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-300/80 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Signals Feed List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <FeedItemSkeleton key={i} />
          ))}
        </div>
      ) : filteredSignals.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Signals Match Your Filters"
          description="Adjust your search keywords, lower the minimum score threshold, or run a crawl cycle to ingest new public items."
          actionLabel="Clear Filters"
          onAction={() => {
            setSelectedPillar("ALL");
            setSelectedUrgency("ALL");
            setSearchQuery("");
            setMinScore(0);
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredSignals.map((signal) => {
            const firstEvidence = signal.evidences && signal.evidences.length > 0 ? signal.evidences[0] : null;

            return (
              <Card
                key={signal.id}
                hoverEffect
                onClick={() => setActiveSignal(signal)}
                className="p-5 cursor-pointer border-slate-200/90 transition-all hover:border-blue-400/80 group shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1 min-w-0">
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
                        withDot
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
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-medium border border-emerald-200/80">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Fact
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-500 font-semibold ml-auto">
                        Score: {Math.round(signal.ranking_score)}/100
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {signal.title}
                    </h3>

                    {/* Verbatim Fact Grounding */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 text-xs text-slate-800 leading-relaxed font-mono">
                      <span className="font-semibold text-slate-900 font-sans">Evidence: </span>
                      <span className="italic">&quot;{signal.verified_fact}&quot;</span>
                    </div>

                    {/* AI Strategic Deduction */}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-800">Strategic Impact: </span>
                      {signal.ai_interpretation}
                    </p>

                    {/* Source Footer */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] text-slate-400">
                      {firstEvidence && (
                        <a
                          href={firstEvidence.source_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-blue-600 flex items-center gap-1 font-mono text-slate-600 transition-colors"
                        >
                          Source: {firstEvidence.source_name || firstEvidence.source_url.replace(/^https?:\/\//, "")}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/60 sticky top-0 bg-white z-10">
              <div className="space-y-1.5 pr-4">
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
                    withDot
                    className="text-[10px]"
                  >
                    {activeSignal.direction}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">{activeSignal.title}</h3>
              </div>
              <button
                onClick={() => setActiveSignal(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Ranking Breakdown */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between font-bold text-blue-950">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    Multi-Factor Signal Score Audit
                  </span>
                  <span className="font-mono text-sm font-bold text-blue-700">{Math.round(activeSignal.ranking_score)}/100</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 text-[11px] pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100/90 shadow-subtle">
                    <div className="text-slate-500 font-medium">Source Reliability</div>
                    <div className="text-slate-900 font-bold font-mono text-xs mt-0.5">
                      {Math.round(activeSignal.source_reliability_score)} pts
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100/90 shadow-subtle">
                    <div className="text-slate-500 font-medium">Evidence Strength</div>
                    <div className="text-slate-900 font-bold font-mono text-xs mt-0.5">
                      {Math.round(activeSignal.evidence_strength_score)} pts
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-blue-100/90 shadow-subtle">
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
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                  Verified Evidence Grounding (No Hallucination)
                </span>
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-mono text-[11px]">
                  &quot;{activeSignal.verified_fact}&quot;
                </div>
              </div>

              {/* What Happened */}
              {activeSignal.what_happened && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                    Development Summary
                  </span>
                  <p className="text-slate-800 leading-relaxed">{activeSignal.what_happened}</p>
                </div>
              )}

              {/* AI Strategic Deduction */}
              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                  Strategic Implication
                </span>
                <p className="text-slate-800 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                  {activeSignal.ai_interpretation}
                </p>
              </div>

              {/* Recommended Action */}
              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                  Recommended Action Item
                </span>
                <p className="text-emerald-900 bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/80 leading-relaxed font-medium">
                  {activeSignal.recommended_action}
                </p>
              </div>

              {/* Source Evidence Links */}
              {activeSignal.evidences && activeSignal.evidences.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                    Traceable Citations
                  </span>
                  {activeSignal.evidences.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/70">
                      <span className="text-slate-800 font-medium truncate max-w-sm">{ev.source_name || ev.source_url}</span>
                      <a
                        href={ev.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono text-[11px] font-semibold"
                      >
                        Visit Original Source <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex justify-end">
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
