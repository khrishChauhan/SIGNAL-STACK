"use client";

import React, { useEffect, useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import { ScheduledJob, CrawlJob } from "@/types/api";
import {
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Calendar,
  Layers,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime, formatDateTime } from "@/lib/utils";

export default function AutomationPage() {
  const { selectedCompany } = useCompany();
  const [schedules, setSchedules] = useState<ScheduledJob[]>([]);
  const [crawlHistory, setCrawlHistory] = useState<CrawlJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCrawling, setIsCrawling] = useState(false);

  useEffect(() => {
    if (!selectedCompany) return;
    loadAutomationData();
  }, [selectedCompany]);

  async function loadAutomationData() {
    if (!selectedCompany) return;
    try {
      setIsLoading(true);
      const [schedList, history] = await Promise.all([
        api.listSchedules(selectedCompany.id),
        api.getCrawlHistory(selectedCompany.id),
      ]);
      setSchedules(schedList);
      setCrawlHistory(history);
    } catch (err) {
      console.error("Failed to load automation telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleManualCrawl() {
    if (!selectedCompany) return;
    try {
      setIsCrawling(true);
      await api.triggerCrawl(selectedCompany.id);
      await loadAutomationData();
      alert("Crawl cycle triggered and completed successfully.");
    } catch (err: any) {
      alert(`Crawl failed: ${err.message}`);
    } finally {
      setIsCrawling(false);
    }
  }

  if (!selectedCompany) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Autonomous Scheduling & Crawl Telemetry</h1>
            <Badge variant="info" className="text-[11px] font-mono">
              APScheduler AsyncIO
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated weekly crawl cycles, Monday briefing generation jobs, and monthly health audits.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleManualCrawl}
          isLoading={isCrawling}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Play className="w-3.5 h-3.5 mr-1" />
          Trigger Manual Crawl
        </Button>
      </div>

      {/* Default Scheduled Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Weekly Monday Morning Briefing */}
        <Card className="p-5 border-l-4 border-l-blue-600 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">Monday Morning Briefing</span>
            <Badge variant="success" className="text-[10px] font-mono">
              ACTIVE
            </Badge>
          </div>
          <p className="text-xs text-slate-600">
            Synthesizes 7-section executive intelligence dossier and checks internal strategy alignment.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Cron: 0 6 * * 1</span>
            <span>Mondays 06:00 AM</span>
          </div>
        </Card>

        {/* Daily Crawl & Deduplication */}
        <Card className="p-5 border-l-4 border-l-emerald-600 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">Daily Intelligence Crawl</span>
            <Badge variant="success" className="text-[10px] font-mono">
              ACTIVE
            </Badge>
          </div>
          <p className="text-xs text-slate-600">
            Crawls all approved customer forums, competitor RSS feeds, and regulatory changes with rate limits.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Cron: 0 4 * * *</span>
            <span>Daily 04:00 AM</span>
          </div>
        </Card>

        {/* Monthly Health Audit */}
        <Card className="p-5 border-l-4 border-l-amber-600 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-900">Monthly Source Audit</span>
            <Badge variant="success" className="text-[10px] font-mono">
              ACTIVE
            </Badge>
          </div>
          <p className="text-xs text-slate-600">
            Pings all registered endpoints, records response latencies, detects broken links, and suggests replacements.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Cron: 0 0 1 * *</span>
            <span>1st of Month</span>
          </div>
        </Card>
      </div>

      {/* Crawl Execution History Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Historical Crawl Cycles & Execution Telemetry</span>
          <span className="font-mono text-slate-400">{crawlHistory.length} Cycles Logged</span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading execution log...</span>
          </div>
        ) : crawlHistory.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            No crawl cycles executed yet. Click &quot;Trigger Manual Crawl&quot; above to run the first cycle.
          </Card>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Cycle ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Items Crawled</th>
                  <th className="py-3 px-4">Extracted Docs</th>
                  <th className="py-3 px-4">Started At</th>
                  <th className="py-3 px-4">Completed At</th>
                  <th className="py-3 px-4">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {crawlHistory.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {job.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={job.status === "COMPLETED" ? "success" : job.status === "RUNNING" ? "info" : "danger"}
                        className="text-[10px] font-mono"
                      >
                        {job.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {job.items_crawled}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-700">
                      {job.items_extracted}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatRelativeTime(job.started_at)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {job.completed_at ? formatRelativeTime(job.completed_at) : "In progress"}
                    </td>
                    <td className="py-3 px-4 text-[11px] font-mono text-slate-400">
                      {job.errors && Object.keys(job.errors).length > 0
                        ? `${Object.keys(job.errors).length} non-fatal skips`
                        : "0 errors"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
