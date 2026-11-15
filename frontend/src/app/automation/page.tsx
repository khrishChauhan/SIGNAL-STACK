"use client";

import React, { useEffect, useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import { ScheduledJob, CrawlJob, SourceHealthReport } from "@/types/api";
import {
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Layers,
  Settings,
  ShieldCheck,
  Activity,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime, formatDateTime } from "@/lib/utils";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
];

const DAYS = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
  { value: "SUN", label: "Sunday" },
];

export default function AutomationPage() {
  const { selectedCompany } = useCompany();
  const [schedules, setSchedules] = useState<ScheduledJob[]>([]);
  const [crawlHistory, setCrawlHistory] = useState<CrawlJob[]>([]);
  const [latestAudit, setLatestAudit] = useState<SourceHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Workflow Trigger states
  const [isCrawling, setIsCrawling] = useState(false);
  const [isBriefRunning, setIsBriefRunning] = useState(false);
  const [isAuditRunning, setIsAuditRunning] = useState(false);

  // Schedule Config Form state
  const [briefingDay, setBriefingDay] = useState("MON");
  const [briefingTime, setBriefingTime] = useState("06:00");
  const [timezone, setTimezone] = useState("UTC");
  const [frequency, setFrequency] = useState("DAILY");
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  useEffect(() => {
    if (!selectedCompany) return;
    loadAutomationData();
  }, [selectedCompany]);

  async function loadAutomationData() {
    if (!selectedCompany) return;
    try {
      setIsLoading(true);
      const [schedList, history, audits] = await Promise.all([
        api.listSchedules(selectedCompany.id),
        api.getCrawlHistory(selectedCompany.id),
        api.listSourceAudits(selectedCompany.id),
      ]);
      setSchedules(schedList);
      setCrawlHistory(history);
      if (audits && audits.length > 0) {
        setLatestAudit(audits[0]);
      }

      // Populate config fields from weekly job if present
      const weeklyJob = schedList.find(
        (s) => (s.job_name || s.job_type) === "WEEKLY_BRIEF"
      );
      if (weeklyJob) {
        if (weeklyJob.briefing_day) setBriefingDay(weeklyJob.briefing_day);
        if (weeklyJob.briefing_time) setBriefingTime(weeklyJob.briefing_time);
        if (weeklyJob.timezone) setTimezone(weeklyJob.timezone);
        if (weeklyJob.monitoring_frequency) setFrequency(weeklyJob.monitoring_frequency);
      }
    } catch (err) {
      console.error("Failed to load automation telemetry:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveSchedule() {
    if (!selectedCompany) return;
    try {
      setIsSavingSchedule(true);
      const weeklyJob = schedules.find(
        (s) => (s.job_name || s.job_type) === "WEEKLY_BRIEF"
      );
      if (weeklyJob) {
        await api.updateSchedule(selectedCompany.id, weeklyJob.id, {
          briefing_day: briefingDay,
          briefing_time: briefingTime,
          timezone: timezone,
          monitoring_frequency: frequency,
        });
      } else {
        await api.createSchedule(selectedCompany.id, {
          job_name: "WEEKLY_BRIEF",
          briefing_day: briefingDay,
          briefing_time: briefingTime,
          timezone: timezone,
          monitoring_frequency: frequency,
          cron_expression: "0 6 * * 1",
          is_active: true,
        });
      }
      await loadAutomationData();
      alert("Weekly Briefing schedule saved successfully.");
    } catch (err: any) {
      alert(`Save schedule failed: ${err.message}`);
    } finally {
      setIsSavingSchedule(false);
    }
  }

  async function handleTriggerWeeklyWorkflow() {
    if (!selectedCompany) return;
    try {
      setIsBriefRunning(true);
      const res = await api.triggerWeeklyWorkflow(selectedCompany.id);
      await loadAutomationData();
      alert(`Weekly Briefing generated successfully (${res.brief_week || "Current Week"}).`);
    } catch (err: any) {
      alert(`Workflow execution error: ${err.message}`);
    } finally {
      setIsBriefRunning(false);
    }
  }

  async function handleTriggerAudit() {
    if (!selectedCompany) return;
    try {
      setIsAuditRunning(true);
      const report = await api.auditSources(selectedCompany.id);
      setLatestAudit(report);
      await loadAutomationData();
      alert(`Audit completed: ${report.healthy_count} healthy, ${report.dead_urls_count || 0} dead URLs.`);
    } catch (err: any) {
      alert(`Audit failed: ${err.message}`);
    } finally {
      setIsAuditRunning(false);
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
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Autonomous Scheduling & Executive Workflows
            </h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-mono font-semibold">
              APScheduler AsyncIO
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manages recurring Monday Briefings, daily source crawls, and monthly Signal Stack health audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTriggerAudit}
            disabled={isAuditRunning}
          >
            <ShieldCheck className={`w-3.5 h-3.5 mr-1.5 ${isAuditRunning ? "animate-spin text-blue-600" : "text-emerald-600"}`} />
            {isAuditRunning ? "Auditing..." : "Run Monthly Audit"}
          </Button>

          <Button
            size="sm"
            variant="brand"
            onClick={handleTriggerWeeklyWorkflow}
            disabled={isBriefRunning}
          >
            <Play className={`w-3.5 h-3.5 mr-1.5 ${isBriefRunning ? "animate-spin" : ""}`} />
            {isBriefRunning ? "Running Weekly Brief..." : "Run Weekly Brief Now"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-5 w-48" />
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* SCHEDULE CONFIGURATION CARD */}
          <Card className="p-6 shadow-card">
            <CardHeader className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-sm font-bold">Weekly Briefing Schedule Settings</CardTitle>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">APScheduler Cron Trigger</span>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Briefing Day</label>
                <select
                  value={briefingDay}
                  onChange={(e) => setBriefingDay(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {DAYS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Briefing Time</label>
                <input
                  type="time"
                  value={briefingTime}
                  onChange={(e) => setBriefingTime(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Crawl Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="HOURLY">Hourly</option>
                  <option value="DAILY">Daily (Recommended)</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <Button size="sm" variant="brand" onClick={handleSaveSchedule} disabled={isSavingSchedule}>
                {isSavingSchedule ? "Saving..." : "Save Schedule"}
              </Button>
            </div>
          </Card>

          {/* MONTHLY SOURCE HEALTH AUDIT SECTION */}
          <Card className="p-6 shadow-card">
            <CardHeader className="border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-sm font-bold">Monthly Signal Stack Audit & Telemetry</CardTitle>
                </div>
                {latestAudit?.audit_date && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    Last Audited: {formatDateTime(latestAudit.audit_date)}
                  </span>
                )}
              </div>
            </CardHeader>

            {latestAudit ? (
              <div className="space-y-4">
                {/* Stat Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/70 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold font-mono">Total Feeds</span>
                    <p className="text-xl font-bold text-slate-900 font-mono">{latestAudit.total_sources ?? 0}</p>
                  </div>
                  <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-100 text-center">
                    <span className="text-[10px] text-emerald-700 uppercase font-semibold font-mono">Healthy</span>
                    <p className="text-xl font-bold text-emerald-700 font-mono">{latestAudit.healthy_count ?? 0}</p>
                  </div>
                  <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-100 text-center">
                    <span className="text-[10px] text-amber-700 uppercase font-semibold font-mono">Warnings</span>
                    <p className="text-xl font-bold text-amber-700 font-mono">{latestAudit.warning_count ?? 0}</p>
                  </div>
                  <div className="bg-rose-50/70 p-3 rounded-lg border border-rose-100 text-center">
                    <span className="text-[10px] text-rose-700 uppercase font-semibold font-mono">Dead URLs</span>
                    <p className="text-xl font-bold text-rose-700 font-mono">{latestAudit.dead_urls_count ?? 0}</p>
                  </div>
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/70 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono">Duplicates</span>
                    <p className="text-xl font-bold text-slate-700 font-mono">{latestAudit.duplicate_sources_count ?? 0}</p>
                  </div>
                  <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/70 text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono">Avg Latency</span>
                    <p className="text-xl font-bold text-slate-700 font-mono">{latestAudit.average_latency_ms ?? 180}ms</p>
                  </div>
                </div>

                {/* Audit Recommendations */}
                {latestAudit.recommendations && latestAudit.recommendations.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                      Audit Findings & Replacement Suggestions
                    </h4>
                    {latestAudit.recommendations.map((rec: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border text-xs ${
                          rec.severity === "HIGH"
                            ? "bg-rose-50/80 border-rose-200 text-rose-950"
                            : rec.severity === "MEDIUM"
                            ? "bg-amber-50/80 border-amber-200 text-amber-950"
                            : "bg-slate-50 border-slate-200 text-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm">{rec.summary}</span>
                          <Badge
                            variant={rec.severity === "HIGH" ? "danger" : "warning"}
                            className="text-[10px] font-mono"
                          >
                            {rec.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mb-2 leading-relaxed">{rec.action_required}</p>

                        {/* Replacement Recommendations */}
                        {rec.suggested_replacements && rec.suggested_replacements.length > 0 && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200/80">
                            <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                              Recommended Replacement Sources:
                            </span>
                            <div className="space-y-1.5">
                              {rec.suggested_replacements.map((r: any, rIdx: number) => (
                                <div key={rIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between shadow-subtle">
                                  <div>
                                    <strong className="text-slate-900">{r.name}</strong>
                                    <span className="text-slate-400 ml-2 font-mono text-[11px]">({r.source_type})</span>
                                    <div className="text-slate-500 truncate max-w-md font-mono text-[11px]">{r.url}</div>
                                  </div>
                                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-mono">
                                    {Math.round((r.relevance || 0.8) * 100)}% match
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[11px] text-slate-400 italic pt-1">
                  * Zero-Auto-Deletion Guarantee: Flagged dead or duplicate sources are never automatically purged without explicit user consent.
                </div>
              </div>
            ) : (
              <EmptyState
                icon={ShieldCheck}
                title="No Health Audit Performed Yet"
                description="Run an automated audit to verify URL reachability, discover dead endpoints, and receive replacement recommendations."
                actionLabel="Run Monthly Audit"
                onAction={handleTriggerAudit}
              />
            )}
          </Card>

          {/* JOBS TELEMETRY & EXECUTION HISTORY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Schedulers */}
            <Card className="p-5 shadow-card">
              <CardHeader className="border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-sm font-bold">Active Scheduled Tasks</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {schedules.length} Tasks
                  </Badge>
                </div>
              </CardHeader>
              <div className="space-y-2.5">
                {schedules.map((job) => (
                  <div
                    key={job.id}
                    className="p-3 bg-slate-50/80 border border-slate-200/70 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{job.job_name || job.job_type}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Cron: {job.cron_expression} ({job.timezone || "UTC"})
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={job.last_status === "SUCCESS" ? "success" : "neutral"}
                        withDot
                        className="text-[10px] font-mono"
                      >
                        {job.last_status || "ACTIVE"}
                      </Badge>
                      {job.last_duration_ms && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{job.last_duration_ms}ms</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Crawl History */}
            <Card className="p-5 shadow-card">
              <CardHeader className="border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-sm font-bold">Recent Crawl Cycles</CardTitle>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleManualCrawl} disabled={isCrawling} className="text-xs h-7">
                    <Play className="w-3 h-3 mr-1" />
                    Trigger
                  </Button>
                </div>
              </CardHeader>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {crawlHistory.length > 0 ? (
                  crawlHistory.slice(0, 10).map((crawl) => (
                    <div
                      key={crawl.id}
                      className="p-2.5 bg-slate-50/80 border border-slate-200/70 rounded-lg text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">
                          {crawl.items_crawled} crawled / {crawl.items_extracted} extracted
                        </span>
                        <div className="text-[11px] text-slate-400 font-mono">{formatRelativeTime(crawl.started_at)}</div>
                      </div>
                      <Badge
                        variant={crawl.status === "COMPLETED" ? "success" : "warning"}
                        className="text-[10px] font-mono"
                      >
                        {crawl.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No crawls recorded yet. Trigger a manual crawl to ingest fresh documents.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
