"use client";

import React, { useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import {
  Settings,
  Building2,
  Cpu,
  Database,
  ShieldCheck,
  Save,
  CheckCircle2,
  Globe,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { selectedCompany, refreshCompanies } = useCompany();

  const [name, setName] = useState(selectedCompany?.name || "");
  const [websiteUrl, setWebsiteUrl] = useState(selectedCompany?.website_url || "");
  const [industry, setIndustry] = useState(selectedCompany?.industry || "");
  const [geography, setGeography] = useState(selectedCompany?.geography || "");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    try {
      setIsSaving(true);
      setSavedSuccess(false);
      await api.updateCompany(selectedCompany.id, {
        name,
        website_url: websiteUrl,
        industry,
        geography,
      });
      await refreshCompanies();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedCompany) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organization & Engine Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage entity parameters, local AI inference configuration, and vector storage settings.
        </p>
      </div>

      {/* 1. Target Organization Parameters */}
      <Card className="p-6 space-y-4 shadow-card">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Company Configuration</h3>
          </div>
          <Badge variant="default" className="text-[10px] font-mono">
            ID: {selectedCompany.id.slice(0, 8)}...
          </Badge>
        </div>

        <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-subtle"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                required
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px] bg-white shadow-subtle"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sector / Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-subtle"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Geography</label>
              <input
                type="text"
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white shadow-subtle"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Company configuration saved.
              </span>
            ) : (
              <span />
            )}

            <Button type="submit" size="sm" variant="brand" isLoading={isSaving}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. AI Engine & Infrastructure Telemetry */}
      <Card className="p-6 space-y-4 shadow-card">
        <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
          <Cpu className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">AI Provider & Local Inference Telemetry</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider font-mono">AI Provider Mode</div>
            <div className="flex items-center gap-2">
              <Badge variant="success" withDot className="font-mono text-[10px]">
                OLLAMA (LOCAL)
              </Badge>
              <span className="text-slate-700 font-mono text-[11px] font-semibold">Model: llama3.2</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
              Zero-cost local LLM inference. Automatic heuristic fallback active if local Ollama daemon is offline.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider font-mono">Vector Store (RAG)</div>
            <div className="flex items-center gap-2">
              <Badge variant="info" withDot className="font-mono text-[10px]">
                CHROMADB PERSISTENT
              </Badge>
              <span className="text-slate-700 font-mono text-[11px] font-semibold">Path: ./data/chromadb</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pt-1">
              Internal strategy PDFs, Word docs, and spreadsheets are chunked and indexed with semantic cosine distance scoring.
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Database Architecture */}
      <Card className="p-6 space-y-3 text-xs shadow-card">
        <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100">
          <Database className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Database & Persistence Tier</h3>
        </div>
        <p className="text-slate-600 leading-relaxed">
          Active Engine: <span className="font-mono font-bold text-slate-900">SQLite 3 Async (aiosqlite)</span> for immediate zero-dependency evaluation. Seamlessly portable to PostgreSQL in clustered environments via SQLAlchemy 2.0 dual-dialect ORM.
        </p>
      </Card>
    </div>
  );
}
