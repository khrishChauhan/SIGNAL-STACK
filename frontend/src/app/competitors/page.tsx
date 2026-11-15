"use client";

import React, { useEffect, useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import { Competitor } from "@/types/api";
import {
  Users,
  Plus,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Building,
  CheckCircle2,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CompetitorsPage() {
  const { selectedCompany } = useCompany();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New competitor form
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [tier, setTier] = useState<"DIRECT" | "INDIRECT" | "EMERGING" | "SUBSTITUTE">("DIRECT");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!selectedCompany) return;
    loadCompetitors();
  }, [selectedCompany]);

  async function loadCompetitors() {
    if (!selectedCompany) return;
    try {
      setIsLoading(true);
      const list = await api.listCompetitors(selectedCompany.id);
      setCompetitors(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load competitors:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddCompetitor(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompany || !name || !websiteUrl) return;

    try {
      let formattedUrl = websiteUrl.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      const created = await api.createCompetitor(selectedCompany.id, {
        name: name.trim(),
        website_url: formattedUrl,
        tier,
        notes: notes.trim() || undefined,
      });

      setCompetitors((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setName("");
      setWebsiteUrl("");
      setNotes("");
    } catch (err: any) {
      alert(`Error adding competitor: ${err.message}`);
    }
  }

  if (!selectedCompany) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Competitor Tracking Matrix</h1>
            <Badge variant="default" className="text-[11px] font-mono">
              {competitors.length} Monitored
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamically identified rivals and substitutes monitored for product announcements, pricing shifts, and hiring signals.
          </p>
        </div>

        <Button size="sm" variant="brand" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Competitor
        </Button>
      </div>

      {/* Grid of Competitors */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : competitors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Competitors Registered Yet"
          description="Register rival companies to track their web announcements, product launches, and strategic positioning."
          actionLabel="Add First Competitor"
          actionIcon={Plus}
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {competitors.map((comp) => (
            <Card key={comp.id} hoverEffect className="p-5 flex flex-col justify-between shadow-card">
              <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xs border border-slate-200/80 shadow-subtle flex-shrink-0">
                      {comp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{comp.name}</h3>
                      <a
                        href={comp.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono truncate transition-colors"
                      >
                        {comp.website_url.replace(/^https?:\/\//, "")}
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    </div>
                  </div>

                  <Badge
                    variant={
                      comp.tier === "DIRECT"
                        ? "danger"
                        : comp.tier === "INDIRECT"
                        ? "warning"
                        : comp.tier === "EMERGING"
                        ? "info"
                        : "neutral"
                    }
                    withDot
                    className="text-[10px] font-mono flex-shrink-0"
                  >
                    {comp.tier}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Strategic Rationale
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
                    {comp.relevance_reason || comp.notes || "Identified as direct or indirect market alternative."}
                  </p>
                </div>
              </div>

              <div className="pt-3.5 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Active Monitoring</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Live Web & RSS
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Competitor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-modal w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900">Register Monitored Competitor</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCompetitor} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Competitor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LeapScholar or Insomnia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Competition Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="DIRECT">Direct Competitor</option>
                  <option value="INDIRECT">Indirect Competitor</option>
                  <option value="EMERGING">Emerging Threat</option>
                  <option value="SUBSTITUTE">Substitute / Legacy Alternative</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relevance Notes</label>
                <textarea
                  rows={2}
                  placeholder="Why does this competitor matter to leadership?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="brand">
                  Save Competitor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
