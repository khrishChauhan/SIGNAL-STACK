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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-slate-500">Loading company intelligence telemetry...</span>
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
    { name: "Customers", count: pillarCounts.CUSTOMER, color: "#2563EB" },
    { name: "Competitors", count: pillarCounts.COMPETITOR, color: "#EA580C" },
    { name: "Market & Policy", count: pillarCounts.MARKET, color: "#059669" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Executive Company Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{selectedCompany.name}</h1>
            <Badge variant="default" className="font-mono text-[11px]">
              {selectedCompany.onboarding_status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <a
              href={selectedCompany.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 flex items-center gap-1 font-mono text-slate-600"
            >
              {selectedCompany.website_url}
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <span>{selectedCompany.industry || "Enterprise Technology"}</span>
            <span>•</span>
            <span>{selectedCompany.geography || "Global"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/interview">
            <Button variant="outline" size="sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 mr-1" />
              Strategic Calibration
            </Button>
          </Link>
          <Link href="/briefs">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <FileText className="w-3.5 h-3.5 mr-1" />
              View Monday Brief
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Key Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Monitored Sources */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sources</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{sources.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            {activeSources.length} Approved & Active
          </div>
        </Card>

        {/* Total Signals */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Signals</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{signals.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Ranked & Verified</div>
        </Card>

        {/* High Priority Urgency */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High Priority</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{highPriority}</div>
          <div className="text-[11px] text-rose-600/80 font-medium mt-1">Immediate Attention</div>
        </Card>

        {/* Opportunities */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Opportunities</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{opportunities}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Growth Vectors</div>
        </Card>

        {/* Threats */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Threats</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{threats}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Defensive Watch</div>
        </Card>

        {/* Crawl Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Crawler Telemetry</span>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 truncate">
            {latestCrawl ? latestCrawl.status : "READY"}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1 truncate">
            {latestCrawl ? `${latestCrawl.items_crawled} items checked` : "No crawls yet"}
          </div>
        </Card>
      </div>

      {/* 3. Middle Section: Upcoming Brief Card + Telemetry Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monday Brief Executive Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {latestBrief ? latestBrief.title : `Monday Morning Executive Brief — ${selectedCompany.name}`}
                </h3>
              </div>
              <Badge variant="info" className="font-mono text-[10px]">
                {latestBrief ? latestBrief.brief_week : "UPCOMING"}
              </Badge>
            </div>

            <div className="py-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Executive TL;DR</h4>
              {latestBrief?.executive_tldr && latestBrief.executive_tldr.length > 0 ? (
                <ul className="space-y-2">
                  {latestBrief.executive_tldr.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Autonomous synthesis will compile this Monday at 06:00 AM, or you can trigger an on-demand brief immediately.
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {latestBrief ? `Generated: ${formatRelativeTime(latestBrief.generated_at)}` : "Grounded in crawled evidence & RAG"}
              </span>
              <Link href="/briefs">
                <Button size="sm" variant="outline" className="text-xs">
                  Open Complete Briefing
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recent Signals List */}
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">Recent Ranked Intelligence Signals</h3>
              </div>
              <Link href="/signals" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
                View All Signals
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {signals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No signals discovered yet. Run a crawl cycle from the top navbar to populate intelligence feeds.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {signals.slice(0, 5).map((sig) => (
                  <div key={sig.id} className="py-3 flex items-start justify-between gap-3 group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            sig.direction === "OPPORTUNITY"
                              ? "success"
                              : sig.direction === "THREAT"
                              ? "danger"
                              : "default"
                          }
                          className="text-[10px]"
                        >
                          {sig.direction}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {sig.pillar}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Score: {Math.round(sig.ranking_score)}/100
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {sig.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-1 italic">
                        &quot;{sig.verified_fact}&quot;
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatRelativeTime(sig.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Pillar Distribution & Source Health */}
        <div className="space-y-4">
          <Card className="p-5">
            <CardHeader className="p-0 pb-3 mb-3">
              <CardTitle className="text-sm font-semibold">Intelligence Signal Distribution</CardTitle>
              <CardDescription className="text-xs">Signals categorized by source pillar</CardDescription>
            </CardHeader>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pillarChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <CardHeader className="p-0 pb-3 mb-3">
              <CardTitle className="text-sm font-semibold">Source Stack Health</CardTitle>
              <CardDescription className="text-xs">Uptime & latency audit status</CardDescription>
            </CardHeader>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-200/60">
                <span className="text-slate-600">Discovered Sources</span>
                <span className="font-semibold text-slate-900">{sources.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-emerald-50/60 border border-emerald-100">
                <span className="text-emerald-800">Approved Feeds</span>
                <span className="font-semibold text-emerald-800">{activeSources.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-200/60">
                <span className="text-slate-600">Avg Response Latency</span>
                <span className="font-semibold text-slate-900 font-mono">180ms</span>
              </div>
              <Link href="/sources" className="block pt-2">
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
