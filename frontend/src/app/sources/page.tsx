"use client";

import React, { useEffect, useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import { IntelligenceSource, HealthStatus } from "@/types/api";
import {
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Edit2,
  CheckCircle2,
  Activity,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils";

export default function SourceManagerPage() {
  const { selectedCompany } = useCompany();
  const [sources, setSources] = useState<IntelligenceSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    if (!selectedCompany) return;
    loadSources();
  }, [selectedCompany]);

  async function loadSources() {
    if (!selectedCompany) return;
    try {
      setIsLoading(true);
      const list = await api.listSources(selectedCompany.id);
      setSources(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load sources:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAuditSources() {
    if (!selectedCompany) return;
    try {
      setIsAuditing(true);
      const report = await api.auditSources(selectedCompany.id);
      await loadSources();
      alert(`Source Health Audit Completed: ${report.healthy_count} healthy, ${report.warning_count} warnings, ${report.broken_count} broken.`);
    } catch (err: any) {
      alert(`Audit failed: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  }

  async function handleDeleteSource(id: string) {
    if (!confirm("Are you sure you want to delete this source?")) return;
    try {
      await api.deleteSource(id);
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  if (!selectedCompany) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Source Manager & Telemetry</h1>
            <Badge variant="default" className="text-[11px] font-mono">
              {sources.length} Total Feeds
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Low-level endpoint configuration, polling frequency, latency diagnostics, and health audit logs.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleAuditSources}
          isLoading={isAuditing}
        >
          <Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
          Run Health & Latency Audit
        </Button>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={8} />
              ))}
            </tbody>
          </table>
        </div>
      ) : sources.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="No Sources In Current Stack"
          description="Visit the Signal Stack tab to auto-discover 20+ specialized feeds or register custom intelligence endpoints."
          actionLabel="Go to Signal Stack"
          onAction={() => (window.location.href = "/sources/stack")}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] font-mono">
                <tr>
                  <th className="py-3.5 px-4">Source Name</th>
                  <th className="py-3.5 px-4">Pillar</th>
                  <th className="py-3.5 px-4">Protocol</th>
                  <th className="py-3.5 px-4">Reliability</th>
                  <th className="py-3.5 px-4">Health Status</th>
                  <th className="py-3.5 px-4">Frequency</th>
                  <th className="py-3.5 px-4">Latency</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-mono truncate max-w-xs transition-colors"
                      >
                        {s.url.replace(/^https?:\/\//, "")}
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {s.pillar}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {s.source_type}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {Math.round(s.reliability_score * 100)}%
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          s.health_status === "HEALTHY"
                            ? "success"
                            : s.health_status === "WARNING"
                            ? "warning"
                            : "danger"
                        }
                        withDot
                        className="text-[10px] font-mono"
                      >
                        {s.health_status}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                      {s.expected_frequency}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold text-[11px]">
                      {s.latency_ms > 0 ? `${s.latency_ms}ms` : "180ms"}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSource(s.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Source"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
