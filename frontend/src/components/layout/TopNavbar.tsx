"use client";

import React, { useState } from "react";
import { useCompany } from "@/context/CompanyContext";
import { api } from "@/lib/api-client";
import {
  Building2,
  ChevronDown,
  Plus,
  RefreshCw,
  Search,
  Bell,
  CheckCircle2,
  ExternalLink,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function TopNavbar() {
  const { companies, selectedCompany, setSelectedCompany, setIsNewCompanyModalOpen, refreshCompanies } = useCompany();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlSuccessMessage, setCrawlSuccessMessage] = useState<string | null>(null);

  const handleCrawlNow = async () => {
    if (!selectedCompany) return;
    try {
      setIsCrawling(true);
      setCrawlSuccessMessage(null);
      const job = await api.triggerCrawl(selectedCompany.id);
      setCrawlSuccessMessage(`Crawl complete: ${job.items_crawled} checked, ${job.items_extracted} new documents.`);
      setTimeout(() => setCrawlSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(`Crawl failed: ${err.message}`);
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-20 shadow-subtle">
      {/* Left: Company Selector */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 transition-all text-left group"
          >
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              {selectedCompany ? selectedCompany.name.slice(0, 2).toUpperCase() : "CO"}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-900 leading-tight">
                  {selectedCompany ? selectedCompany.name : "Select Company"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform" />
              </div>
              <span className="text-[11px] text-slate-500 font-mono truncate max-w-[140px]">
                {selectedCompany ? selectedCompany.website_url.replace(/^https?:\/\//, "") : "no company active"}
              </span>
            </div>
          </button>

          {/* Company Switcher Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg border border-slate-200 shadow-elevated py-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Active Organizations
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {companies.map((company) => {
                  const isSelected = selectedCompany?.id === company.id;
                  return (
                    <button
                      key={company.id}
                      onClick={() => {
                        setSelectedCompany(company);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isSelected ? "bg-slate-50/80 font-medium" : ""
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="text-sm text-slate-800 truncate">{company.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono truncate">
                          {company.website_url}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 mt-1 pt-1 px-2">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsNewCompanyModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50/50 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Company
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedCompany && (
          <Badge variant="neutral" className="hidden sm:inline-flex items-center gap-1">
            <Globe className="w-3 h-3 text-slate-500" />
            {selectedCompany.industry || "Enterprise"}
          </Badge>
        )}
      </div>

      {/* Center: Crawl Success Alert Banner if active */}
      {crawlSuccessMessage && (
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs rounded-full animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{crawlSuccessMessage}</span>
        </div>
      )}

      {/* Right: Global Actions & User Profile */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCrawlNow}
          isLoading={isCrawling}
          className="text-slate-700 hover:text-slate-900 border-slate-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isCrawling ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Crawl Stack</span>
        </Button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
            SC
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold text-slate-800 leading-tight">Chief Intelligence Officer</span>
            <span className="text-[10px] text-slate-500">Executive Briefing Mode</span>
          </div>
        </div>
      </div>
    </header>
  );
}
