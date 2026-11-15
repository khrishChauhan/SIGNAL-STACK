"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  MessagesSquare,
  Layers,
  Activity,
  Users,
  FileText,
  FolderOpen,
  SlidersHorizontal,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Radio,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompany } from "@/context/CompanyContext";

interface NavGroup {
  label: string;
  items: Array<{
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Executive Strategy",
    items: [
      { name: "Overview", href: "/", icon: LayoutDashboard },
      { name: "Company Intelligence", href: "/intelligence/company", icon: Building2 },
      { name: "AI Interview", href: "/interview", icon: MessagesSquare, badge: "10Q" },
    ],
  },
  {
    label: "Intelligence Engine",
    items: [
      { name: "Signal Stack", href: "/sources/stack", icon: Layers },
      { name: "Intelligence Feed", href: "/signals", icon: Activity },
      { name: "Competitors", href: "/competitors", icon: Users },
      { name: "Monday Brief", href: "/briefs", icon: FileText, badge: "Weekly" },
    ],
  },
  {
    label: "Operations & Audit",
    items: [
      { name: "Internal Documents", href: "/documents", icon: FolderOpen },
      { name: "Source Manager", href: "/sources", icon: SlidersHorizontal },
      { name: "Automation", href: "/automation", icon: Clock },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isMobileNavOpen, setIsMobileNavOpen } = useCompany();

  const handleLinkClick = () => {
    if (isMobileNavOpen) {
      setIsMobileNavOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={cn(
          "flex flex-col bg-[#0B132B] text-slate-200 border-r border-[#1E293B] transition-all duration-200 z-50 select-none",
          // Desktop behavior
          "hidden lg:flex",
          isCollapsed ? "w-16" : "w-64",
          // Mobile drawer behavior
          isMobileNavOpen && "fixed inset-y-0 left-0 flex w-72 shadow-2xl"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E293B]">
          <Link
            href="/"
            onClick={handleLinkClick}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 group-hover:bg-blue-500 transition-colors">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            {(!isCollapsed || isMobileNavOpen) && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm tracking-tight text-white leading-tight">
                  Signal Stack
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-semibold">
                  Executive Engine
                </span>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle / Mobile close button */}
          <div className="flex items-center gap-1">
            {isMobileNavOpen ? (
              <button
                onClick={() => setIsMobileNavOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-[#141F3D] transition-colors lg:hidden"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-[#141F3D] transition-colors"
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 py-4 px-2 space-y-6 overflow-y-auto overflow-x-hidden">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              {(!isCollapsed || isMobileNavOpen) && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative",
                      isActive
                        ? "bg-[#1C2A52] text-white shadow-sm font-semibold"
                        : "text-slate-400 hover:text-slate-100 hover:bg-[#141F3D]"
                    )}
                    title={isCollapsed && !isMobileNavOpen ? item.name : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r" />
                    )}
                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-blue-400"
                          : "text-slate-400 group-hover:text-slate-200"
                      )}
                    />
                    {(!isCollapsed || isMobileNavOpen) && (
                      <div className="flex items-center justify-between flex-1 truncate">
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold tracking-tight",
                              isActive
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-slate-800 text-slate-400 group-hover:text-slate-300"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer: Autonomous Engine Telemetry Status */}
        {(!isCollapsed || isMobileNavOpen) && (
          <div className="p-3 border-t border-[#1E293B]">
            <div className="p-2.5 rounded-lg bg-[#141F3D]/80 border border-[#1E293B] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-300 font-medium">Scheduler Active</span>
              </div>
              <span className="text-slate-400 font-mono text-[10px]">v1.0</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
