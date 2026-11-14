"use client";

import React, { useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import { X, Building2, Globe, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NewCompanyModal() {
  const { isNewCompanyModalOpen, setIsNewCompanyModalOpen, refreshCompanies, setSelectedCompany } = useCompany();

  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("EdTech / Higher Education Marketplace");
  const [geography, setGeography] = useState("India / Global");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  if (!isNewCompanyModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !websiteUrl) return;

    try {
      setIsLoading(true);
      setCurrentStep("Registering company entity in database...");

      let formattedUrl = websiteUrl.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      // 1. Create Company
      const newComp = await api.createCompany({
        name: name.trim(),
        website_url: formattedUrl,
        industry: industry.trim(),
        geography: geography.trim(),
      });

      // 2. Trigger Initial Company Research
      setCurrentStep("Crawling domain homepage and discovering core competitors...");
      await api.triggerResearch(newComp.id);

      setCurrentStep("Discovering customized Signal Stack sources...");
      await api.discoverSources(newComp.id, 25);

      await refreshCompanies();
      setSelectedCompany(newComp);
      setIsNewCompanyModalOpen(false);
      setName("");
      setWebsiteUrl("");
    } catch (err: any) {
      alert(`Setup failed: ${err.message}`);
    } finally {
      setIsLoading(false);
      setCurrentStep(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Add Target Company</h3>
              <p className="text-xs text-slate-500">Configure new intelligence profile & source stack</p>
            </div>
          </div>
          {!isLoading && (
            <button
              onClick={() => setIsNewCompanyModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              disabled={isLoading}
              placeholder="e.g. MeetUniversity or Postman"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL *</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                disabled={isLoading}
                placeholder="https://www.meetuniversity.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Industry / Sector</label>
              <input
                type="text"
                disabled={isLoading}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Geography</label>
              <input
                type="text"
                disabled={isLoading}
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                className="w-full h-9 px-3 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Real-time Progress Bar when Loading */}
          {isLoading && currentStep && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2.5 text-xs text-blue-900 animate-pulse">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 animate-spin" />
              <span>{currentStep}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            {!isLoading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewCompanyModalOpen(false)}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" size="sm" isLoading={isLoading} className="bg-blue-600 hover:bg-blue-700">
              Initialize Intelligence Stack
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
