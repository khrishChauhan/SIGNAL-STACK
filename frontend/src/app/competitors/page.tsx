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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
      setCompetitors(list);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Competitor Tracking Matrix</h1>
            <Badge variant="default" className="text-[11px] font-mono">
              {competitors.length} Monitored Rivals
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamically identified competitors and market substitutes monitored for feature releases, pricing, and PR.
          </p>
        </div>

        <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Competitor
        </Button>
      </div>

      {/* Grid of Competitors */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading competitor intelligence registry...</span>
        </div>
      ) : competitors.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No competitors registered</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Add Competitor&quot; or run the research agent to dynamically detect rival players in this sector.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {competitors.map((comp) => (
            <Card key={comp.id} hoverEffect className="p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs border border-slate-200">
                      {comp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{comp.name}</h3>
                      <a
                        href={comp.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-mono"
                      >
                        {comp.website_url.replace(/^https?:\/\//, "")}
                        <ExternalLink className="w-2.5 h-2.5" />
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
                    className="text-[10px] font-mono"
                  >
                    {comp.tier}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Relevance Rationale
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded border border-slate-200/50">
                    {comp.relevance_reason || comp.notes || "Identified as direct or indirect market alternative."}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono">Active Monitoring</span>
                <span className="text-emerald-600 font-medium">Tracking Web & RSS</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Competitor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-semibold text-slate-900">Add Competitor</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs">
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddCompetitor} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Competitor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LeapScholar or Insomnia"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="w-full h-8 px-2.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Competition Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="w-full h-8 px-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
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
                  className="w-full p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
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
