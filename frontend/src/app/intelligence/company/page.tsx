"use client";

import React, { useEffect, useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import { CompanyProfile } from "@/types/api";
import {
  Building2,
  Globe,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Layers,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CompanyIntelligencePage() {
  const { selectedCompany } = useCompany();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResearching, setIsResearching] = useState(false);

  useEffect(() => {
    if (!selectedCompany) return;
    loadProfile();
  }, [selectedCompany]);

  async function loadProfile() {
    if (!selectedCompany) return;
    try {
      setIsLoading(true);
      const res = await api.getResearch(selectedCompany.id);
      setProfile(res);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefreshResearch() {
    if (!selectedCompany) return;
    try {
      setIsResearching(true);
      const updated = await api.triggerResearch(selectedCompany.id);
      setProfile(updated);
    } catch (err: any) {
      alert(`Research refresh failed: ${err.message}`);
    } finally {
      setIsResearching(false);
    }
  }

  if (!selectedCompany) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Company Intelligence Profile</h1>
            <Badge variant="success" withDot className="text-[10px] font-mono">
              Empirical Fact Grounded
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            AI-synthesized strategic profile strictly grounded in crawled public domains, separating facts from deductions.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshResearch}
          isLoading={isResearching}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isResearching ? "animate-spin text-blue-600" : ""}`} />
          Re-Analyze Public Domain
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-3 gap-6 pt-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-16 w-full" />
            </Card>
            <Card className="p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-16 w-full" />
            </Card>
          </div>
        </div>
      ) : !profile ? (
        <EmptyState
          icon={Building2}
          title="No Profile Generated Yet"
          description={`Run the autonomous research agent to crawl ${selectedCompany.website_url} and generate the structured profile.`}
          actionLabel="Run Research Agent"
          actionIcon={Sparkles}
          onAction={handleRefreshResearch}
        />
      ) : (
        <div className="space-y-6">
          {/* Executive Overview Card */}
          <Card className="p-6 shadow-card">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Executive Summary</span>
                <p className="text-sm text-slate-800 leading-relaxed font-normal">
                  {profile.executive_summary || "No executive summary available."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Value Proposition</span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {profile.value_proposition || "Direct customer access and tailored domain matching."}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Business Model</span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {profile.business_model || "Marketplace Commission / B2B SaaS"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Ideal Customer Profile</span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {profile.target_customer_profile || "Enterprise and retail candidates."}
                </p>
              </div>
            </div>
          </Card>

          {/* Strengths & Weaknesses 2-Column Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Core Strengths & Moats */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 mb-3.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Core Strengths & Defensible Moats</h3>
              </div>
              <ul className="space-y-2.5">
                {(profile.core_strengths || []).map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Known Vulnerabilities & Risks */}
            <Card className="p-6 shadow-card">
              <div className="flex items-center gap-2 pb-3.5 border-b border-slate-100 mb-3.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Known Weaknesses & Vulnerabilities</h3>
              </div>
              <ul className="space-y-2.5">
                {(profile.known_weaknesses || []).map((weak, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Verified Facts vs AI Inferences vs Unknown Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Verified Facts */}
            <Card className="p-5 shadow-card">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Verified Empirical Facts</h3>
              </div>
              <div className="space-y-3">
                {profile.raw_research_data?.verified_facts && profile.raw_research_data.verified_facts.length > 0 ? (
                  profile.raw_research_data.verified_facts.map((fact: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/60 text-xs space-y-1.5">
                      <div className="font-semibold text-slate-900">{fact.claim}</div>
                      <div className="text-slate-600 italic font-mono text-[11px]">&quot;{fact.quote}&quot;</div>
                      <a
                        href={fact.evidence_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-mono transition-colors font-semibold"
                      >
                        Evidence Citation <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No verified facts recorded.</p>
                )}
              </div>
            </Card>

            {/* 2. AI Inferences */}
            <Card className="p-5 shadow-card">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">AI Strategic Inferences</h3>
              </div>
              <div className="space-y-3">
                {profile.raw_research_data?.inferences && profile.raw_research_data.inferences.length > 0 ? (
                  profile.raw_research_data.inferences.map((inf: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs space-y-1">
                      <div className="font-bold text-blue-950">{inf.inference}</div>
                      <div className="text-slate-600 text-[11px] leading-relaxed">{inf.reasoning}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No strategic inferences recorded.</p>
                )}
              </div>
            </Card>

            {/* 3. Unknown Information */}
            <Card className="p-5 shadow-card">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900">Unknown Information</h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-normal">
                Data points not disclosed on website. Calibrated during the AI interview.
              </p>
              <div className="space-y-2">
                {profile.raw_research_data?.unknown_information && profile.raw_research_data.unknown_information.length > 0 ? (
                  profile.raw_research_data.unknown_information.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">None logged.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
