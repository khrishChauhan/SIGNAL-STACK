"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import {
  IntelligenceSignal,
  IntelligenceSource,
  CrawlJob,
  IntelligenceBrief,
} from "@/types/api";
import {
  Layers,
  Activity,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  FileText,
  ShieldCheck,
  ExternalLink,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Compass,
  Radio,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Custom dark styled tooltip for Recharts
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-dropdown border border-slate-800 space-y-1">
        <p className="font-semibold text-slate-200">{label}</p>
        <p className="text-blue-400 font-mono">
          {payload[0].value} {payload[0].value === 1 ? "Signal" : "Signals"}
        </p>
      </div>
    );
  }
  return null;
}

export default function DashboardOverviewPage() {
  const { selectedCompany, isLoading: isCompanyLoading } = useCompany();

  const [sources, setSources] = useState<IntelligenceSource[]>([]);
  const [signals, setSignals] = useState<IntelligenceSignal[]>([]);
  const [crawlJobs, setCrawlJobs] = useState<CrawlJob[]>([]);
  const [latestBrief, setLatestBrief] = useState<IntelligenceBrief | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!selectedCompany) return;

    async function loadDashboardData() {
      try {
        setIsLoadingData(true);
        const [sourceList, signalRes, jobs, briefs] = await Promise.all([
          api.listSources(selectedCompany!.id),
          api.listSignals(selectedCompany!.id, { limit: 10 }),
          api.getCrawlHistory(selectedCompany!.id),
          api.listBriefs(selectedCompany!.id),
        ]);

        setSources(sourceList);
        setSignals(signalRes.items);
        setCrawlJobs(jobs);
        setLatestBrief(briefs.length > 0 ? briefs[0] : null);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadDashboardData();
  }, [selectedCompany]);

  if (isCompanyLoading || !selectedCompany) {
    return (
      <div className="space-y-6">
        <div className="h-28 bg-white rounded-xl border border-slate-200 p-6 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Calculated Metrics
  const activeSources = sources.filter((s) => s.approval_status === "APPROVED" || s.approval_status === "CUSTOM");
  const opportunities = signals.filter((s) => s.direction === "OPPORTUNITY").length;
  const threats = signals.filter((s) => s.direction === "THREAT").length;
  const highPriority = signals.filter((s) => s.urgency === "HIGH" || s.urgency === "CRITICAL").length;
  const latestCrawl = crawlJobs.length > 0 ? crawlJobs[0] : null;

  // Chart Data: Pillar distribution
  const pillarCounts = {
    CUSTOMER: signals.filter((s) => s.pillar === "CUSTOMER").length,
    COMPETITOR: signals.filter((s) => s.pillar === "COMPETITOR").length,
    MARKET: signals.filter((s) => s.pillar === "MARKET").length,
  };
  const pillarChartData = [
    { name: "Customers", count: pillarCounts.CUSTOMER, fill: "#2563EB" },
    { name: "Competitors", count: pillarCounts.COMPETITOR, fill: "#EA580C" },
    { name: "Market & Policy", count: pillarCounts.MARKET, fill: "#059669" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Executive Organization Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{selectedCompany.name}</h1>
            <Badge variant="success" withDot className="font-mono text-[10px]">
              {selectedCompany.onboarding_status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
            <a
              href={selectedCompany.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 flex items-center gap-1 font-mono text-slate-700 transition-colors"
            >
              {selectedCompany.website_url.replace(/^https?:\/\//, "")}
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <span className="text-slate-300">•</span>
            <span className="font-medium text-slate-600">{selectedCompany.industry || "Enterprise Technology"}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{selectedCompany.geography || "Global Focus"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/interview">
            <Button variant="outline" size="sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
              Strategic Calibration
            </Button>
          </Link>
          <Link href="/briefs">
            <Button size="sm" variant="brand">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              Monday Brief
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Key Telemetry Metrics Grid */}
      {isLoadingData ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Monitored Sources */}
          <Card className="p-4" hoverEffect>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Sources</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{sources.length}</div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-1">
              {activeSources.length} Approved Feeds
            </div>
          </Card>

          {/* Total Signals */}
          <Card className="p-4" hoverEffect>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Signals</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{signals.length}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">Ranked & Verified</div>
          </Card>

          {/* High Priority Urgency */}
          <Card className="p-4" hoverEffect>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">High Urgency</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600 font-mono tracking-tight">{highPriority}</div>
            <div className="text-[11px] text-rose-700 font-medium mt-1">Immediate Watch</div>
          </Card>

          {/* Opportunities */}
          <Card className="p-4" hoverEffect>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Opportunities</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-mono tracking-tight">{opportunities}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">Growth Vectors</div>
          </Card>

          {/* Threats */}
          <Card className="p-4" hoverEffect>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Threats</span>
              <ShieldCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 font-mono tracking-tight">{threats}</div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">Defensive Watch</div>
          </Card>

          {/* Crawl Status */}
          <Card className="p-4" hoverEffect>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Crawler</span>
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-base font-bold text-slate-900 truncate">
              {latestCrawl ? latestCrawl.status : "READY"}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1 truncate">
              {latestCrawl ? `${latestCrawl.items_crawled} items checked` : "Ready to monitor"}
            </div>
          </Card>
        </div>
      )}

      {/* 3. Middle Section: Upcoming Brief Card + Telemetry Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monday Brief Executive Preview & Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Brief Hero Card */}
          <Card className="p-6 border-l-4 border-l-blue-600 shadow-card">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {latestBrief ? latestBrief.title : `Monday Morning Executive Brief — ${selectedCompany.name}`}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {latestBrief ? `Generated: ${formatRelativeTime(latestBrief.generated_at)}` : "Autonomous weekly briefing"}
                  </span>
                </div>
              </div>
              <Badge variant="info" className="font-mono text-[10px]">
                {latestBrief ? latestBrief.brief_week : "UPCOMING"}
              </Badge>
            </div>

            <div className="py-4 space-y-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Executive Synthesis
              </div>
              {latestBrief?.executive_tldr && latestBrief.executive_tldr.length > 0 ? (
                <ul className="space-y-2.5">
                  {latestBrief.executive_tldr.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic py-2">
                  Autonomous synthesis will compile this Monday at 06:00 AM, or you can trigger an on-demand brief immediately.
                </p>
              )}
            </div>

            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                100% Traceable Evidence & RAG Cross-Referenced
              </span>
              <Link href="/briefs">
                <Button size="sm" variant="outline" className="text-xs">
                  Read Full Brief
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recent Signals Feed */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Recent Ranked Intelligence Signals</h3>
              </div>
              <Link href="/signals" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold transition-colors">
                View All Signals
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {signals.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No Intelligence Signals Yet"
                description="Trigger a crawl cycle from the top navigation bar or run autonomous source discovery to populate verified intelligence feeds."
                actionLabel="Explore Signal Stack"
                onAction={() => {}}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {signals.slice(0, 5).map((sig) => (
                  <div key={sig.id} className="py-3.5 flex items-start justify-between gap-4 group">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            sig.direction === "OPPORTUNITY"
                              ? "success"
                              : sig.direction === "THREAT"
                              ? "danger"
                              : "neutral"
                          }
                          withDot
                          className="text-[10px]"
                        >
                          {sig.direction}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {sig.pillar}
                        </Badge>
                        <span className="text-[11px] text-slate-500 font-mono font-semibold">
                          Score: {Math.round(sig.ranking_score)}/100
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {sig.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1 italic bg-slate-50/60 px-2 py-1 rounded border border-slate-100">
                        &quot;{sig.verified_fact}&quot;
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap pt-0.5">
                      {formatRelativeTime(sig.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Pillar Distribution & Source Health */}
        <div className="space-y-6">
          {/* Signal Pillar Distribution Chart */}
          <Card className="p-5 shadow-card">
            <CardHeader className="p-0 pb-3 mb-2">
              <CardTitle className="text-sm font-bold">Signal Pillar Distribution</CardTitle>
              <CardDescription className="text-xs">Signals categorized by source origin</CardDescription>
            </CardHeader>
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pillarChartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} axisLine={{ stroke: "#e2e8f0" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Source Stack Telemetry Card */}
          <Card className="p-5 shadow-card space-y-3">
            <CardHeader className="p-0 pb-2 mb-1">
              <CardTitle className="text-sm font-bold">Source Stack Telemetry</CardTitle>
              <CardDescription className="text-xs">Continuous monitoring and latency status</CardDescription>
            </CardHeader>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/70">
                <span className="text-slate-600 font-medium">Discovered Feeds</span>
                <span className="font-bold text-slate-900 font-mono">{sources.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <span className="text-emerald-900 font-medium">Active & Approved</span>
                <span className="font-bold text-emerald-900 font-mono">{activeSources.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/70">
                <span className="text-slate-600 font-medium">Response Latency</span>
                <span className="font-bold text-slate-900 font-mono">180ms</span>
              </div>
              <Link href="/sources" className="block pt-1">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Manage Source Stack
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
