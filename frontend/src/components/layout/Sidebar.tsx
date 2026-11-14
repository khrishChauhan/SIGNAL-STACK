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
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Company Intelligence", href: "/intelligence/company", icon: Building2 },
  { name: "AI Interview", href: "/interview", icon: MessagesSquare },
  { name: "Signal Stack", href: "/sources/stack", icon: Layers },
  { name: "Intelligence Feed", href: "/signals", icon: Activity },
  { name: "Competitors", href: "/competitors", icon: Users },
  { name: "Monday Brief", href: "/briefs", icon: FileText },
  { name: "Internal Documents", href: "/documents", icon: FolderOpen },
  { name: "Source Manager", href: "/sources", icon: SlidersHorizontal },
  { name: "Automation", href: "/automation", icon: Clock },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-[#0B132B] text-slate-200 border-r border-[#1E293B] transition-all duration-300 z-30 select-none",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E293B]">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-semibold text-sm tracking-wide text-white">Signal Stack</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Executive Engine</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#1C2541] transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group",
                isActive
                  ? "bg-[#1C2541] text-white shadow-sm border-l-2 border-blue-500 font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-[#1C2541]/50"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                )}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[#1E293B] text-[11px] text-slate-400 bg-[#0B132B]/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-300">Engine Online</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">v1.0.0</span>
        </div>
      )}
    </aside>
  );
}
