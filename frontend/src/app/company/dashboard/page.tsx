"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, Briefcase, Bell, Building2,
  Plus, ArrowRight, Loader2, CheckCircle, Star, BarChart3,
  Search, Clock, Edit, Trash2, Eye
} from "lucide-react";

const NAV = [
  { label: "Dashboard",      href: "/company/dashboard",     icon: LayoutDashboard },
  { label: "Company Profile",href: "/company/profile",       icon: Building2 },
  { label: "Job Postings",   href: "/company/jobs",          icon: Briefcase },
  { label: "Candidates",     href: "/company/candidates",    icon: Users },
  { label: "Announcements",  href: "/company/announcements", icon: Bell },
];

export default function CompanyDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=company"); return; }
    api.get("/company/jobs").then((r) => setJobs(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeJobs  = jobs.filter((j) => j.is_published);
  const draftJobs   = jobs.filter((j) => !j.is_published);
  const totalApps   = jobs.reduce((s, j) => s + (j.application_count || 0), 0);
  const shortlisted = jobs.reduce((s, j) => s + (j.shortlisted_count || 0), 0);

  return (
    <DashboardLayout navItems={NAV} portalLabel="Company Portal" portalColor="#f59e0b">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>Hiring Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Find and hire top talent from VIT Pune</p>
          </div>
          <Link href="/company/jobs/new" className="btn-primary text-sm py-2.5 px-5" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
            <Plus size={15} /> Post New Drive
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Drives",    value: activeJobs.length,  icon: Briefcase,    color: "#f59e0b" },
            { label: "Total Applicants", value: totalApps,           icon: Users,        color: "#6366f1" },
            { label: "Shortlisted",      value: shortlisted,         icon: Star,         color: "#10b981" },
            { label: "Draft Postings",   value: draftJobs.length,   icon: Edit,         color: "#8b5cf6" },
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

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { label: "Post a Drive",        desc: "Create a job posting with eligibility criteria",      icon: Plus,    href: "/company/jobs/new",      color: "#f59e0b" },
            { label: "AI Candidate Ranking",desc: "Semantic AI ranks applicants by JD match score",     icon: Search,  href: "/company/candidates",    color: "#6366f1" },
            { label: "Send Announcement",   desc: "Email all eligible students about your drive",         icon: Bell,    href: "/company/announcements", color: "#10b981" },
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

        {/* Jobs List */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-bold">My Job Postings</h3>
            <Link href="/company/jobs" className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 size={24} className="text-amber-400 animate-spin" /></div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              <Briefcase size={28} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No drives yet.</p>
              <Link href="/company/jobs/new" className="text-amber-400 text-xs mt-2 inline-block hover:underline">Post your first drive →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center gap-4 p-3 rounded-xl glass-light hover:border-white/10 border border-transparent transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{job.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{job.role_type === "INTERN" ? "Internship" : "Full-Time"} · {job.location || "Remote"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{job.application_count || 0} applicants</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${job.is_published ? "status-placed" : "status-pending"}`}>
                      {job.is_published ? "Live" : "Draft"}
                    </span>
                    <Link href={`/company/candidates?job=${job.id}`} className="text-amber-400 hover:text-amber-300 transition-colors">
                      <Eye size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}