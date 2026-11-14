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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Autonomous Scheduling & Executive Workflows
            </h1>
            <Badge variant="outline" className="bg-brand-50 text-brand-700 border-brand-200 text-2xs font-mono">
              APScheduler AsyncIO
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manages the autonomous Weekly Monday Briefing, Daily Source Crawl cycles, and Monthly Signal Stack Audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTriggerAudit}
            disabled={isAuditRunning}
            className="flex items-center gap-1.5"
          >
            <ShieldCheck className={`h-4 w-4 ${isAuditRunning ? "animate-spin text-brand-600" : "text-emerald-600"}`} />
            {isAuditRunning ? "Auditing..." : "Run Monthly Audit"}
          </Button>

          <Button
            size="sm"
            onClick={handleTriggerWeeklyWorkflow}
            disabled={isBriefRunning}
            className="bg-brand-600 hover:bg-brand-700 flex items-center gap-1.5"
          >
            <Play className={`h-4 w-4 ${isBriefRunning ? "animate-spin" : ""}`} />
            {isBriefRunning ? "Running Weekly Brief..." : "Run Weekly Brief Now"}
          </Button>
        </div>
      </div>

      {/* SCHEDULE CONFIGURATION CARD */}
      <Card className="p-5">
        <CardHeader className="border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-brand-600" />
              <CardTitle className="text-sm font-semibold">Weekly Briefing Schedule Settings</CardTitle>
            </div>
            <span className="text-2xs text-slate-400 font-mono">APScheduler Cron Trigger</span>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Briefing Day</label>
            <select
              value={briefingDay}
              onChange={(e) => setBriefingDay(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-brand-600"
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
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-brand-600"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-brand-600"
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
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-brand-600"
            >
              <option value="HOURLY">Hourly</option>
              <option value="DAILY">Daily (Recommended)</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
          <Button size="sm" onClick={handleSaveSchedule} disabled={isSavingSchedule}>
            {isSavingSchedule ? "Saving..." : "Save Schedule Changes"}
          </Button>
        </div>
      </Card>

      {/* MONTHLY SOURCE HEALTH AUDIT SECTION */}
      <Card className="p-5">
        <CardHeader className="border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-sm font-semibold">Monthly Signal Stack Audit & Health</CardTitle>
            </div>
            {latestAudit?.audit_date && (
              <span className="text-2xs text-slate-400">
                Last Audited: {formatDateTime(latestAudit.audit_date)}
              </span>
            )}
          </div>
        </CardHeader>

        {latestAudit ? (
          <div className="space-y-4">
            {/* Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <span className="text-2xs text-slate-400 uppercase font-semibold">Total Checked</span>
                <p className="text-lg font-bold text-slate-800">{latestAudit.total_sources ?? 0}</p>
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-center">
                <span className="text-2xs text-emerald-600 uppercase font-semibold">Healthy</span>
                <p className="text-lg font-bold text-emerald-700">{latestAudit.healthy_count ?? 0}</p>
              </div>
              <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 text-center">
                <span className="text-2xs text-amber-600 uppercase font-semibold">Warnings</span>
                <p className="text-lg font-bold text-amber-700">{latestAudit.warning_count ?? 0}</p>
              </div>
              <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-100 text-center">
                <span className="text-2xs text-rose-600 uppercase font-semibold">Dead URLs</span>
                <p className="text-lg font-bold text-rose-700">{latestAudit.dead_urls_count ?? 0}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <span className="text-2xs text-slate-500 uppercase font-semibold">Duplicates</span>
                <p className="text-lg font-bold text-slate-700">{latestAudit.duplicate_sources_count ?? 0}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                <span className="text-2xs text-slate-500 uppercase font-semibold">Avg Latency</span>
                <p className="text-lg font-bold text-slate-700">{latestAudit.average_latency_ms ?? 180}ms</p>
              </div>
            </div>

            {/* Audit Recommendations */}
            {latestAudit.recommendations && latestAudit.recommendations.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Audit Findings & Recommendations
                </h4>
                {latestAudit.recommendations.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border text-xs ${
                      rec.severity === "HIGH"
                        ? "bg-rose-50/70 border-rose-200 text-rose-900"
                        : rec.severity === "MEDIUM"
                        ? "bg-amber-50/70 border-amber-200 text-amber-900"
                        : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{rec.summary}</span>
                      <span className="text-2xs font-bold uppercase px-2 py-0.5 rounded bg-white/60">
                        {rec.severity}
                      </span>
                    </div>
                    <p className="text-2xs text-slate-600 mb-2">{rec.action_required}</p>

                    {/* Replacement Recommendations */}
                    {rec.suggested_replacements && rec.suggested_replacements.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60">
                        <span className="text-2xs font-bold text-slate-700 block mb-1">
                          Suggested Replacement Sources:
                        </span>
                        <div className="space-y-1">
                          {rec.suggested_replacements.map((r: any, rIdx: number) => (
                            <div key={rIdx} className="bg-white p-2 rounded border border-slate-200 text-2xs flex items-center justify-between">
                              <div>
                                <strong className="text-slate-900">{r.name}</strong>
                                <span className="text-slate-400 ml-2">({r.source_type})</span>
                                <div className="text-slate-500 truncate max-w-md">{r.url}</div>
                              </div>
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
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

            <div className="text-2xs text-slate-400 italic">
              * Strict Protocol: Dead or duplicate sources are never automatically deleted without explicit founder confirmation.
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            No source health audit has been conducted yet. Click &ldquo;Run Monthly Audit&rdquo; to test reachability, detect dead URLs, and find replacement candidates.
          </div>
        )}
      </Card>

      {/* JOBS TELEMETRY & EXECUTION HISTORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Schedulers */}
        <Card className="p-5">
          <CardHeader className="border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-600" />
                <CardTitle className="text-sm font-semibold">Active Scheduled Jobs</CardTitle>
              </div>
              <Badge variant="outline" className="text-2xs font-mono">
                {schedules.length} Jobs
              </Badge>
            </div>
          </CardHeader>
          <div className="space-y-2.5">
            {schedules.map((job) => (
              <div
                key={job.id}
                className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{job.job_name || job.job_type}</div>
                  <div className="text-2xs text-slate-500 font-mono mt-0.5">
                    Cron: {job.cron_expression} ({job.timezone || "UTC"})
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className={`text-2xs font-semibold ${
                      job.last_status === "SUCCESS"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : job.last_status === "FAILED"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {job.last_status || "INITIALIZED"}
                  </Badge>
                  {job.last_duration_ms && (
                    <div className="text-2xs text-slate-400 mt-0.5">{job.last_duration_ms}ms</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Crawl History */}
        <Card className="p-5">
          <CardHeader className="border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-600" />
                <CardTitle className="text-sm font-semibold">Recent Crawl Cycles</CardTitle>
              </div>
              <Button size="sm" variant="ghost" onClick={handleManualCrawl} disabled={isCrawling} className="text-xs h-7">
                <Play className="h-3 w-3 mr-1" />
                Trigger
              </Button>
            </div>
          </CardHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {crawlHistory.length > 0 ? (
              crawlHistory.slice(0, 10).map((crawl) => (
                <div
                  key={crawl.id}
                  className="p-2.5 bg-slate-50 border border-slate-100 rounded text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-slate-800">
                      {crawl.items_crawled} crawled / {crawl.items_extracted} extracted
                    </span>
                    <div className="text-2xs text-slate-400">{formatRelativeTime(crawl.started_at)}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-2xs ${
                      crawl.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
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
    </div>
  );
}
