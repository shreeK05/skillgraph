"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, User, Camera, BookOpen, Briefcase, Star,
  Target, Award, Zap, CheckCircle, ArrowRight, Loader2,
  Upload, TrendingUp, Code2,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",       href: "/student/dashboard",  icon: LayoutDashboard },
  { label: "My Profile",      href: "/student/profile",    icon: User },
  { label: "Interview Coach", href: "/student/interview",  icon: Camera },
  { label: "Learning Path",   href: "/student/learning",   icon: BookOpen },
  { label: "Job Drives",      href: "/student/jobs",       icon: Briefcase },
  { label: "Portfolio",       href: "/student/portfolio",  icon: Star },
];

export default function StudentDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=student"); return; }
    api.get("/student/profile")
      .then((r) => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayName  = profile?.profile?.full_name || user?.full_name || user?.email?.split("@")[0] || "Student";
  const readiness    = profile?.profile?.readiness_score || 0;
  const branch       = profile?.profile?.branch || user?.branch || "Not set";
  const year         = profile?.profile?.year_of_study || user?.year_of_study || "?";
  const cgpa         = profile?.profile?.cgpa || 0;
  const skills       = profile?.extracted_skills || [];

  const quickActions = [
    { label: "Upload Resume",    desc: "AI extracts your skills",    icon: Upload,    href: "/student/profile",   color: "#6366f1" },
    { label: "Mock Interview",   desc: "Practice with AI coach",     icon: Camera,    href: "/student/interview", color: "#8b5cf6" },
    { label: "Browse Drives",    desc: "Active placement drives",    icon: Briefcase, href: "/student/jobs",      color: "#10b981" },
    { label: "Learning Path",    desc: "AI-suggested skills",        icon: BookOpen,  href: "/student/learning",  color: "#f59e0b" },
  ];

  const completionItems = [
    { label: "Basic Info (Name, Branch, Year)", done: !!(profile?.profile?.full_name && profile?.profile?.branch),  href: "/student/profile" },
    { label: "Profile Photo",                    done: !!(profile?.profile?.photo_url),                              href: "/student/profile" },
    { label: "Resume Uploaded",                  done: !!(profile?.profile?.resume_url),                             href: "/student/profile" },
    { label: "Skills Added",                     done: skills.length > 0,                                           href: "/student/profile" },
    { label: "GitHub Linked",                    done: !!(profile?.profile?.github_url),                             href: "/student/profile" },
    { label: "LinkedIn Linked",                  done: !!(profile?.profile?.linkedin_url),                           href: "/student/profile" },
    { label: "Certification Added",              done: false,                                                        href: "/student/profile" },
    { label: "Mock Interview Done",              done: false,                                                        href: "/student/interview" },
  ];
  const completedCount = completionItems.filter((i) => i.done).length;
  const completionPct  = Math.round((completedCount / completionItems.length) * 100);

  return (
    <DashboardLayout navItems={NAV} portalLabel="Student Portal" portalColor="#6366f1">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="text-indigo-400 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Welcome back, {displayName.split(" ")[0]}! 👋
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {branch} · Year {year} · Readiness:&nbsp;
                <span className="text-indigo-400 font-semibold">{readiness}%</span>
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              readiness >= 80 ? "status-placed" : readiness >= 50 ? "status-applied" : "status-pending"
            }`}>
              {readiness >= 80 ? "🟢 High Readiness" : readiness >= 50 ? "🟡 Medium Readiness" : "🔴 Build Profile"}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "AI Readiness",   value: `${readiness}%`,                      icon: Target,    color: "#6366f1", sub: "Profile score" },
              { label: "CGPA",           value: cgpa ? cgpa.toFixed(2) : "Not set",    icon: Award,     color: "#10b981", sub: "Academic" },
              { label: "Skills",         value: skills.length || "0",                  icon: Code2,     color: "#8b5cf6", sub: "Extracted by AI" },
              { label: "Applications",   value: "0",                                   icon: Briefcase, color: "#f59e0b", sub: "Active drives" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="stat-card" style={{ "--tw-gradient-from": stat.color } as any}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1.5">{stat.label}</p>
                      <p className="text-white font-black text-2xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>{stat.value}</p>
                      <p className="text-slate-500 text-xs mt-1">{stat.sub}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: stat.color + "20" }}>
                      <Icon size={18} style={{ color: stat.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Readiness ring + quick actions */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Ring */}
            <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
              <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-4">Readiness Score</p>
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 144 144" className="w-full h-full -rotate-90">
                  <circle cx="72" cy="72" r="58" fill="none" stroke="rgba(99,102,241,0.12)" strokeWidth="10" />
                  <circle
                    cx="72" cy="72" r="58" fill="none" stroke="url(#rdg)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 58 * (readiness / 100)} ${2 * Math.PI * 58 * (1 - readiness / 100)}`}
                  />
                  <defs>
                    <linearGradient id="rdg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white font-black text-3xl">{readiness}%</span>
                  <span className="text-slate-500 text-xs">Ready</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                {readiness < 30  ? "Complete your profile to boost your score"
                 : readiness < 60 ? "Add certifications and projects"
                 : readiness < 80 ? "Practice mock interviews to level up"
                 : "You're placement-ready! 🎉"}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6">
              <h3 className="text-white font-bold text-base mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.label} href={action.href}
                      className="flex items-start gap-3 p-4 rounded-xl glass-light border border-white/5 hover-lift group transition-all hover:border-opacity-40"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                        style={{ background: action.color + "20" }}>
                        <Icon size={16} style={{ color: action.color }} />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{action.label}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{action.desc}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Insights + Profile Completion */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* AI Insights */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Zap size={15} className="text-indigo-400" />
                </div>
                <h3 className="text-white font-bold">AI Insights</h3>
                <span className="ml-auto text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full font-semibold">Live</span>
              </div>
              <div className="space-y-3">
                {[
                  "Upload your resume to unlock AI-powered skill extraction and JD matching.",
                  "Practice at least 3 mock interviews to improve your readiness score.",
                  "Students with GitHub profiles get 40% more company shortlists.",
                ].map((msg, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-indigo-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{msg}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Completion */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp size={15} className="text-emerald-400" />
                </div>
                <h3 className="text-white font-bold">Profile Completion</h3>
                <span className="ml-auto text-emerald-400 font-bold text-sm">{completionPct}%</span>
              </div>
              {/* Bar */}
              <div className="h-1.5 bg-slate-800 rounded-full mb-4 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
              </div>
              <div className="space-y-2">
                {completionItems.map((item) => (
                  <Link key={item.label} href={item.href}
                    className="flex items-center gap-3 py-1.5 group hover:opacity-80 transition-opacity"
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                      item.done ? "bg-emerald-500/20 border-emerald-500/40" : "border-slate-700"
                    }`}>
                      {item.done && <CheckCircle size={12} className="text-emerald-400" />}
                    </div>
                    <span className={`text-sm ${item.done ? "text-slate-500 line-through" : "text-slate-300"}`}>{item.label}</span>
                    {!item.done && <ArrowRight size={12} className="ml-auto text-slate-600 group-hover:text-indigo-400 transition-colors" />}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Active Drives */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold">Active Placement Drives</h3>
              <Link href="/student/jobs" className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="text-center py-12 text-slate-600">
              <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No active drives yet. Check back soon!</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}