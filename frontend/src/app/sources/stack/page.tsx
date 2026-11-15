"use client";

import React, { useEffect, useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import { IntelligenceSource, PillarType } from "@/types/api";
import {
  Layers,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils";

const PILLARS: Array<{ id: PillarType | "ALL"; label: string }> = [
  { id: "ALL", label: "All Categories" },
  { id: "CUSTOMER", label: "Customers" },
  { id: "COMPETITOR", label: "Competitors" },
  { id: "MARKET", label: "Market & Policy" },
  { id: "INTERNAL", label: "Internal" },
];

export default function SignalStackPage() {
  const { selectedCompany } = useCompany();
  const [sources, setSources] = useState<IntelligenceSource[]>([]);
  const [selectedPillar, setSelectedPillar] = useState<PillarType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New source form
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPillar, setNewPillar] = useState<PillarType>("COMPETITOR");
  const [newReason, setNewReason] = useState("");

  useEffect(() => {
    if (!selectedCompany) return;
    loadSources();
  }, [selectedCompany]);

  async function loadSources() {
    if (!selectedCompany) return;
    try {
      setIsLoading(true);
      const list = await api.listSources(selectedCompany.id);
      setSources(list);
    } catch (err) {
      console.error("Failed to load sources:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(sourceId: string, status: "APPROVED" | "REJECTED" | "PAUSED") {
    try {
      const updated = await api.updateSource(sourceId, { approval_status: status });
      setSources((prev) => prev.map((s) => (s.id === sourceId ? updated : s)));
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  }

  async function handleDelete(sourceId: string) {
    if (!confirm("Are you sure you want to remove this source from your Signal Stack?")) return;
    try {
      await api.deleteSource(sourceId);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  async function handleDiscoverSources() {
    if (!selectedCompany) return;
    try {
      setIsDiscovering(true);
      const list = await api.discoverSources(selectedCompany.id, 25);
      setSources(list);
    } catch (err: any) {
      alert(`Source discovery error: ${err.message}`);
    } finally {
      setIsDiscovering(false);
    }
  }

  async function handleAddCustomSource(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompany || !newName || !newUrl) return;

    try {
      const created = await api.createSource(selectedCompany.id, {
        name: newName.trim(),
        url: newUrl.trim(),
        pillar: newPillar,
        reason_for_inclusion: newReason.trim() || "Custom executive monitoring feed",
        relevance_score: 0.95,
        expected_frequency: "DAILY",
        reliability_score: 0.9,
        approval_status: "APPROVED",
        source_type: "CUSTOM",
      });
      setSources((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setNewName("");
      setNewUrl("");
      setNewReason("");
    } catch (err: any) {
      alert(`Failed to add source: ${err.message}`);
    }
  }

  if (!selectedCompany) return null;

  const filteredSources = sources.filter((s) => {
    const matchesPillar = selectedPillar === "ALL" || s.pillar === selectedPillar;
    const matchesSearch =
      searchQuery === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.reason_for_inclusion || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPillar && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Signal Stack Curation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Approve, configure, and monitor verified intelligence sources across customer, competitor, market, and internal pillars.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscoverSources}
            isLoading={isDiscovering}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
            Auto-Discover Sources (20+)
          </Button>

          <Button size="sm" variant="brand" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Custom Source
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
          {PILLARS.map((p) => {
            const count = p.id === "ALL" ? sources.length : sources.filter((s) => s.pillar === p.id).length;
            const isSelected = selectedPillar === p.id;

            return (
              <button
                key={p.id}
                onClick={() => setSelectedPillar(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-white text-slate-900 shadow-subtle"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                }`}
              >
                {p.label}
                <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search sources or rationale..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-300/80 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-subtle"
          />
        </div>
      </div>

      {/* Sources Table / Cards */}
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
      ) : filteredSources.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Sources In This Category"
          description="Click Auto-Discover Sources to generate 20+ specialized feeds, forums, competitor sites, and regulatory channels."
          actionLabel="Auto-Discover Sources"
          actionIcon={Sparkles}
          onAction={handleDiscoverSources}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] font-mono">
                <tr>
                  <th className="py-3.5 px-4">Source / Feed Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Strategic Purpose</th>
                  <th className="py-3.5 px-4">Relevance</th>
                  <th className="py-3.5 px-4">Approval</th>
                  <th className="py-3.5 px-4">Health</th>
                  <th className="py-3.5 px-4">Last Crawled</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSources.map((source) => (
                  <tr key={source.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & URL */}
                    <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">
                      <div className="font-semibold text-slate-900">{source.name}</div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-mono truncate transition-colors"
                      >
                        {source.url.replace(/^https?:\/\//, "")}
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    </td>

                    {/* Pillar */}
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {source.pillar}
                      </Badge>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs text-xs italic">
                      {source.reason_for_inclusion || "Strategic intelligence monitoring."}
                    </td>

                    {/* Relevance */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {Math.round(source.relevance_score * 100)}%
                    </td>

                    {/* Approval Status */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          source.approval_status === "APPROVED" || source.approval_status === "CUSTOM"
                            ? "success"
                            : source.approval_status === "REJECTED"
                            ? "danger"
                            : "warning"
                        }
                        withDot
                        className="text-[10px] font-mono"
                      >
                        {source.approval_status}
                      </Badge>
                    </td>

                    {/* Health Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            source.health_status === "HEALTHY"
                              ? "bg-emerald-500"
                              : source.health_status === "WARNING"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                        <span className="text-[11px] text-slate-600 font-medium font-mono">{source.health_status}</span>
                      </div>
                    </td>

                    {/* Last Crawled */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap font-mono">
                      {formatRelativeTime(source.last_crawled_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {source.approval_status !== "APPROVED" && (
                          <button
                            onClick={() => handleStatusUpdate(source.id, "APPROVED")}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Approve Source"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {source.approval_status !== "REJECTED" && (
                          <button
                            onClick={() => handleStatusUpdate(source.id, "REJECTED")}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Reject / Pause"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(source.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Source"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Custom Source Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-modal w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">Add Custom Source</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCustomSource} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Ed Policy Feed"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source URL / RSS Endpoint *</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/rss.xml"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monitoring Pillar</label>
                <select
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value as PillarType)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="CUSTOMER">Customers (Reviews / Forums)</option>
                  <option value="COMPETITOR">Competitors (Blogs / Announcements)</option>
                  <option value="MARKET">Market & Policy (Gazettes / Regulatory)</option>
                  <option value="INTERNAL">Internal Operations</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Strategic Rationale</label>
                <textarea
                  rows={2}
                  placeholder="Why is this source critical for executive decision-making?"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="brand">
                  Save Source
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
