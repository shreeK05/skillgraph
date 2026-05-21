"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, User, Camera, BookOpen, Briefcase, Star,
  Loader2, Search, Filter, ArrowRight, CheckCircle, Clock, X,
  MapPin, DollarSign, Building2, Calendar, ChevronDown, Zap
} from "lucide-react";

const NAV = [
  { label: "Dashboard",       href: "/student/dashboard",  icon: LayoutDashboard },
  { label: "My Profile",      href: "/student/profile",    icon: User },
  { label: "Interview Coach", href: "/student/interview",  icon: Camera },
  { label: "Learning Path",   href: "/student/learning",   icon: BookOpen },
  { label: "Job Drives",      href: "/student/jobs",       icon: Briefcase },
  { label: "Portfolio",       href: "/student/portfolio",  icon: Star },
];

const STATUS_COLORS: Record<string, string> = {
  NOT_APPLIED: "status-pending",
  APPLIED:     "status-applied",
  SHORTLISTED: "status-shortlisted",
  REJECTED:    "skill-badge-rose",
  PLACED:      "status-placed",
};

export default function StudentJobsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [drives,   setDrives]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [q,        setQ]        = useState("");
  const [roleType, setRoleType] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=student"); return; }
    api.get("/student/drives")
      .then((r) => setDrives(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async (driveId: string) => {
    setApplying(driveId);
    try {
      await api.post(`/student/drives/${driveId}/apply`);
      setDrives((prev) => prev.map((d) => d.id === driveId ? { ...d, user_status: "APPLIED" } : d));
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to apply");
    } finally { setApplying(null); }
  };

  const filtered = drives.filter((d) => {
    const matchQ = !q || d.title?.toLowerCase().includes(q.toLowerCase()) || d.company_name?.toLowerCase().includes(q.toLowerCase());
    const matchRT = !roleType || d.role_type === roleType;
    return matchQ && matchRT;
  });

  return (
    <DashboardLayout navItems={NAV} portalLabel="Student Portal" portalColor="#6366f1">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>Job Drives</h1>
          <p className="text-slate-400 text-sm mt-1">Active placement opportunities for your branch and year</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} className="form-input pl-10" placeholder="Search company or role…" />
          </div>
          <div className="relative">
            <select value={roleType} onChange={(e) => setRoleType(e.target.value)} className="form-input pr-8 appearance-none cursor-pointer min-w-36">
              <option value="">All Types</option>
              <option value="FTE">Full-Time</option>
              <option value="INTERN">Internship</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          {(q || roleType) && (
            <button onClick={() => { setQ(""); setRoleType(""); }} className="btn-ghost text-xs px-3 py-2 text-red-400">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 size={28} className="text-indigo-400 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-600">
            <Briefcase size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-base font-semibold text-slate-400">No drives available right now</p>
            <p className="text-sm mt-1">Companies will post drives here. Keep your profile updated!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((drive) => {
              const status = drive.user_status || "NOT_APPLIED";
              const matchPct = drive.match_score ? Math.round(drive.match_score * 100) : null;
              return (
                <div key={drive.id} className="glass-card rounded-2xl p-6 hover-lift transition-all">
                  <div className="flex items-start gap-4">
                    {/* Company logo placeholder */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-lg shrink-0">
                      {(drive.company_name || "?")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-white font-bold text-base">{drive.title}</h3>
                          <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
                            <Building2 size={12} />{drive.company_name || "Company"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {matchPct !== null && (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              <Zap size={11} /> {matchPct}% match
                            </span>
                          )}
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[status] || "status-pending"}`}>
                            {status.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap gap-4 mt-3 text-slate-400 text-xs">
                        {drive.location && (
                          <span className="flex items-center gap-1"><MapPin size={11} />{drive.location}</span>
                        )}
                        {drive.ctc && (
                          <span className="flex items-center gap-1"><DollarSign size={11} />₹{drive.ctc} LPA</span>
                        )}
                        {drive.role_type && (
                          <span className="flex items-center gap-1"><Briefcase size={11} />{drive.role_type === "INTERN" ? "Internship" : "Full-Time"}</span>
                        )}
                        {drive.joining_date && (
                          <span className="flex items-center gap-1"><Calendar size={11} />Joining: {drive.joining_date}</span>
                        )}
                      </div>

                      {/* Required skills */}
                      {drive.required_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {drive.required_skills.slice(0, 6).map((s: string) => (
                            <span key={s} className="skill-badge skill-badge-brand text-xs">{s}</span>
                          ))}
                          {drive.required_skills.length > 6 && (
                            <span className="text-xs text-slate-600">+{drive.required_skills.length - 6} more</span>
                          )}
                        </div>
                      )}

                      {/* Eligibility hint */}
                      {drive.min_cgpa && (
                        <p className="text-slate-600 text-xs mt-2">Min CGPA: {drive.min_cgpa} · Max backlogs: {drive.max_backlogs ?? 0}</p>
                      )}
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <span className="text-slate-600 text-xs flex items-center gap-1">
                      <Clock size={11} />{drive.deadline ? `Deadline: ${drive.deadline}` : "Open"}
                    </span>
                    {status === "NOT_APPLIED" ? (
                      <button
                        onClick={() => handleApply(drive.id)}
                        disabled={applying === drive.id}
                        className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
                      >
                        {applying === drive.id ? <><Loader2 size={12} className="animate-spin" /> Applying…</> : <>Apply Now <ArrowRight size={12} /></>}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <CheckCircle size={13} /> {status === "APPLIED" ? "Application Submitted" : status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}