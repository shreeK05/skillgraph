"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, BookOpen, Bell, BarChart3,
  TrendingUp, CheckCircle, ArrowRight, Loader2, Award
} from "lucide-react";

const NAV = [
  { label: "Dashboard",        href: "/department/dashboard",     icon: LayoutDashboard },
  { label: "Students",         href: "/department/students",      icon: Users },
  { label: "Syllabus Manager", href: "/department/syllabus",      icon: BookOpen },
  { label: "Analytics",        href: "/department/analytics",     icon: BarChart3 },
  { label: "Announcements",    href: "/department/announcements", icon: Bell },
];

const VIT_BRANCHES = ["AIDS","CSE","CSE(AI)","CSE(AIML)","CSE(DS)","CSE(IOT_CYBER)","CSE(SE)","DESH","ENTC","INSTRU","IT","MECH"];

export default function DepartmentDashboard() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [stats,   setStats]   = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=dept"); return; }
    api.get("/dept/analytics/overview")
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout navItems={NAV} portalLabel="Department Portal" portalColor="#10b981">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>Department Overview</h1>
          <p className="text-slate-400 text-sm mt-1">VIT Pune · All Branches · {new Date().getFullYear()} Placement Season</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Students",  value: stats.total || "—",                                icon: Users,    color: "#10b981" },
            { label: "Placed",          value: stats.placed || "0",                               icon: CheckCircle, color: "#6366f1" },
            { label: "Avg Readiness",   value: `${(stats.avg_readiness || 0).toFixed(0)}%`,       icon: TrendingUp, color: "#f59e0b" },
            { label: "Avg CGPA",        value: (stats.avg_cgpa || 0).toFixed(2),                 icon: Award,    color: "#8b5cf6" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card" style={{ "--tw-gradient-from": stat.color } as any}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">{stat.label}</p>
                    <p className="text-white font-black text-3xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.color + "20" }}>
                    <Icon size={18} style={{ color: stat.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { label: "Manage Students",   desc: "Filter by branch, year, CGPA, skills",          icon: Users,    href: "/department/students",      color: "#10b981" },
            { label: "Update Syllabus",   desc: "Edit curriculum for each branch and year",       icon: BookOpen, href: "/department/syllabus",      color: "#6366f1" },
            { label: "Send Announcement", desc: "Email all or filtered students with updates",    icon: Bell,     href: "/department/announcements", color: "#f59e0b" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} href={a.href} className="glass-card rounded-2xl p-6 hover-lift flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ background: a.color + "20" }}>
                  <Icon size={22} style={{ color: a.color }} />
                </div>
                <div>
                  <h3 className="text-white font-bold">{a.label}</h3>
                  <p className="text-slate-400 text-sm mt-1">{a.desc}</p>
                </div>
                <ArrowRight size={16} className="ml-auto text-slate-600 group-hover:text-slate-300 mt-1" />
              </Link>
            );
          })}
        </div>

        {/* Branch Overview Grid */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold">Branch Overview</h3>
            <Link href="/department/students" className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1">Filter students <ArrowRight size={12} /></Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="text-emerald-400 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {VIT_BRANCHES.map((branch) => {
                const branchStats = stats.by_branch?.[branch] || {};
                const count = branchStats.count || 0;
                const placedCount = branchStats.placed || 0;
                const pct = count > 0 ? Math.round((placedCount / count) * 100) : 0;
                return (
                  <Link key={branch} href={`/department/students?branch=${branch}`}
                    className="glass-light rounded-xl p-3 hover:border-emerald-500/30 transition-all border border-transparent hover-lift"
                  >
                    <div className="text-white font-bold text-sm">{branch}</div>
                    <div className="text-slate-500 text-xs mt-1">{count} students</div>
                    <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-slate-600 text-xs mt-1">{placedCount} placed ({pct}%)</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
