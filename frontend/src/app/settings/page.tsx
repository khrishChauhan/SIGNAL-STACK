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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organization & Engine Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage entity details, active AI provider configuration, and vector storage parameters.
        </p>
      </div>

      {/* 1. Target Organization Parameters */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Company Configuration</h3>
          </div>
          <Badge variant="default" className="text-[10px] font-mono">
            {selectedCompany.id.slice(0, 8)}...
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
                className="w-full h-8 px-2.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                required
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[11px] bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sector / Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operational Geography</label>
              <input
                type="text"
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                className="w-full h-8 px-2.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-emerald-600 font-medium flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Company parameters saved.
              </span>
            ) : (
              <span></span>
            )}

            <Button type="submit" size="sm" isLoading={isSaving} className="bg-slate-900 hover:bg-slate-800">
              <Save className="w-3.5 h-3.5 mr-1" />
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* 2. AI Engine & Infrastructure Telemetry */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Cpu className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">AI Engine & Local Model Pipeline</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">AI Provider Mode</div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="font-mono text-[10px]">
                OLLAMA (LOCAL)
              </Badge>
              <span className="text-slate-700 font-mono text-[11px]">Model: llama3.2</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Deterministic fallback engine active if local LLM is offline. No paid API keys are ever required.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Vector Store (RAG)</div>
            <div className="flex items-center gap-2">
              <Badge variant="info" className="font-mono text-[10px]">
                CHROMADB PERSISTENT
              </Badge>
              <span className="text-slate-700 font-mono text-[11px]">Path: ./data/chromadb</span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Internal strategy PDFs, Word docs, and spreadsheets are chunked and retrieved with semantic distance scoring.
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Database Architecture */}
      <Card className="p-6 space-y-3 text-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-semibold text-slate-900">Database & Deployment Tier</h3>
        </div>
        <p className="text-slate-600 leading-relaxed">
          Active Database: <span className="font-mono font-bold text-slate-900">SQLite Async (aiosqlite)</span> for instant zero-dependency local development. Fully portable to PostgreSQL in production environments via SQLAlchemy 2.0 dual-dialect ORM.
        </p>
      </Card>
    </div>
  );
}
