"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, LogOut, Bell, Menu, X, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: SidebarItem[];
  portalLabel: string;
  portalColor: string;
}

export default function DashboardLayout({ children, navItems, portalLabel, portalColor }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="min-h-screen flex" style={{ background: "#020617" }}>

      {/* Sidebar */}
      <aside
        className={`sidebar fixed lg:sticky top-0 left-0 h-screen z-40 w-64 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ minHeight: "100dvh" }}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <BrainCircuit size={18} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-base leading-none" style={{ fontFamily: "var(--font-space-grotesk)" }}>SkillGraph</span>
              <span
                className="block text-[10px] font-semibold tracking-widest uppercase mt-0.5"
                style={{ color: portalColor }}
              >
                {portalLabel}
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive ? "active" : ""}`}
                style={isActive ? { color: portalColor, borderColor: portalColor + "40", background: portalColor + "12" } : {}}
              >
                <Icon size={16} className={isActive ? "" : "opacity-60"} />
                {item.label}
                {isActive && <ChevronRight size={12} className="ml-auto opacity-40" />}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl glass-light">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg, ${portalColor}cc, ${portalColor}88)` }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.full_name || user?.email?.split("@")[0]}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-white/5 px-6 py-3.5 flex items-center justify-between" style={{ background: "rgba(2,6,23,0.9)", backdropFilter: "blur(20px)" }}>
          <button
            className="lg:hidden p-2 rounded-lg glass-light text-slate-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
            <span>SkillGraph</span>
            <ChevronRight size={13} />
            <span className="text-slate-300">{portalLabel}</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl glass-light text-slate-400 hover:text-white transition-colors">
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 border border-[#020617]" />
            </button>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${portalColor}cc, ${portalColor}88)` }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
