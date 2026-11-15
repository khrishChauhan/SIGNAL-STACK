"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
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
  Menu,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const PAGE_NAMES: Record<string, string> = {
  "/": "Overview",
  "/intelligence/company": "Company Intelligence",
  "/interview": "AI Interview",
  "/sources/stack": "Signal Stack",
  "/signals": "Intelligence Feed",
  "/competitors": "Competitors",
  "/briefs": "Monday Brief",
  "/documents": "Internal Documents",
  "/sources": "Source Manager",
  "/automation": "Automation & Health Audit",
  "/settings": "Settings",
};

export function TopNavbar() {
  const pathname = usePathname();
  const {
    companies,
    selectedCompany,
    setSelectedCompany,
    setIsNewCompanyModalOpen,
    setIsMobileNavOpen,
  } = useCompany();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlSuccessMessage, setCrawlSuccessMessage] = useState<string | null>(null);

  const currentPageTitle = PAGE_NAMES[pathname] || "Dashboard";

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
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between z-20 shadow-subtle">
      {/* Left: Mobile Toggle & Company Selector & Breadcrumbs */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Company Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200/90 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300 transition-all text-left group"
          >
            <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              {selectedCompany ? selectedCompany.name.slice(0, 2).toUpperCase() : "SS"}
            </div>
            <div className="flex items-center gap-1.5 max-w-[160px] md:max-w-[200px]">
              <span className="text-xs font-semibold text-slate-900 truncate leading-tight">
                {selectedCompany ? selectedCompany.name : "Select Company"}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-transform flex-shrink-0" />
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-dropdown py-2 z-50 animate-fade-in">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                Monitored Organizations
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
                        isSelected ? "bg-blue-50/50 font-medium" : ""
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="text-xs font-semibold text-slate-900 truncate">{company.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {company.website_url.replace(/^https?:\/\//, "")}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-slate-100 mt-1 pt-1.5 px-2">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsNewCompanyModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Register New Organization
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Breadcrumb Separator & Page Title */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span>/</span>
          <span className="font-semibold text-slate-700">{currentPageTitle}</span>
        </div>
      </div>

      {/* Right: Crawl Indicator, Success Message & Action Controls */}
      <div className="flex items-center gap-2.5 md:gap-3">
        {crawlSuccessMessage && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200/80 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{crawlSuccessMessage}</span>
          </div>
        )}

        {/* AI Provider Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Local Engine (Zero Paid APIs)</span>
        </div>

        {/* Trigger Real-Time Crawl Button */}
        <Button
          onClick={handleCrawlNow}
          disabled={!selectedCompany || isCrawling}
          isLoading={isCrawling}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-blue-600 ${isCrawling ? "animate-spin" : ""}`} />
          {isCrawling ? "Crawling Feeds..." : "Run Crawl Cycle"}
        </Button>
      </div>
    </header>
  );
}
