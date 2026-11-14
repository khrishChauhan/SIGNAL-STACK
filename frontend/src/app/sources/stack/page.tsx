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
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Signal Stack Curation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve, reject, and configure verified intelligence sources across your four monitoring pillars.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscoverSources}
            isLoading={isDiscovering}
            className="border-slate-300"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Auto-Discover Sources (20+)
          </Button>

          <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Custom Source
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
          {PILLARS.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPillar(p.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedPillar === p.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
            >
              {p.label}
              <span className="ml-1.5 text-[10px] text-slate-400 font-mono">
                ({p.id === "ALL" ? sources.length : sources.filter((s) => s.pillar === p.id).length})
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search sources or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Sources Table / Cards */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading Signal Stack repository...</span>
        </div>
      ) : filteredSources.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No sources found in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Auto-Discover Sources&quot; above to populate 20+ specialized feeds tailored to {selectedCompany.name}.
          </p>
          <Button size="sm" onClick={handleDiscoverSources} isLoading={isDiscovering}>
            Discover Sources
          </Button>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Source / Feed Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Reason for Monitoring</th>
                  <th className="py-3 px-4">Relevance</th>
                  <th className="py-3 px-4">Approval</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4">Last Crawled</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSources.map((source) => (
                  <tr key={source.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & URL */}
                    <td className="py-3 px-4 font-medium text-slate-900 max-w-xs">
                      <div className="font-semibold">{source.name}</div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-mono truncate"
                      >
                        {source.url.replace(/^https?:\/\//, "")}
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    </td>

                    {/* Pillar */}
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {source.pillar}
                      </Badge>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs text-xs italic">
                      {source.reason_for_inclusion || "Strategic intelligence monitoring."}
                    </td>

                    {/* Relevance */}
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {Math.round(source.relevance_score * 100)}%
                    </td>

                    {/* Approval Status */}
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          source.approval_status === "APPROVED" || source.approval_status === "CUSTOM"
                            ? "success"
                            : source.approval_status === "REJECTED"
                            ? "danger"
                            : "warning"
                        }
                        className="text-[10px] font-mono"
                      >
                        {source.approval_status}
                      </Badge>
                    </td>

                    {/* Health Status */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            source.health_status === "HEALTHY"
                              ? "bg-emerald-500"
                              : source.health_status === "WARNING"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        ></span>
                        <span className="text-[11px] text-slate-600 font-medium">{source.health_status}</span>
                      </div>
                    </td>

                    {/* Last Crawled */}
                    <td className="py-3 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      {formatRelativeTime(source.last_crawled_at)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {source.approval_status !== "APPROVED" && (
                          <button
                            onClick={() => handleStatusUpdate(source.id, "APPROVED")}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Approve Source"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {source.approval_status !== "REJECTED" && (
                          <button
                            onClick={() => handleStatusUpdate(source.id, "REJECTED")}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                            title="Reject / Pause"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(source.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900">Add Custom Source</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCustomSource} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Higher Ed Policy Feed"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target URL (RSS or Webpage) *</label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com/rss.xml"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category / Pillar</label>
                <select
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value as PillarType)}
                  className="w-full h-8 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="CUSTOMER">Customers (Forums / Reviews)</option>
                  <option value="COMPETITOR">Competitors (Rival Websites / Press)</option>
                  <option value="MARKET">Market & Policy (Gov / Associations)</option>
                  <option value="INTERNAL">Internal</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Inclusion</label>
                <textarea
                  rows={2}
                  placeholder="Strategic rationale for tracking this specific source..."
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Add to Stack
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
