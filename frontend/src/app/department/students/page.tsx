"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, BookOpen, Bell, BarChart3,
  Search, Filter, X, ChevronDown, Loader2, Link2, GitBranch,
  ExternalLink, TrendingUp, ChevronRight,
} from "lucide-react";

const Github   = GitBranch;
const Linkedin = Link2;

const NAV = [
  { label: "Dashboard",        href: "/department/dashboard",     icon: LayoutDashboard },
  { label: "Students",         href: "/department/students",      icon: Users },
  { label: "Syllabus Manager", href: "/department/syllabus",      icon: BookOpen },
  { label: "Analytics",        href: "/department/analytics",     icon: BarChart3 },
  { label: "Announcements",    href: "/department/announcements", icon: Bell },
];

const VIT_BRANCHES = ["AIDS","CSE","CSE(AI)","CSE(AIML)","CSE(DS)","CSE(IOT_CYBER)","CSE(SE)","DESH","ENTC","INSTRU","IT","MECH"];
const PLACEMENT_STATUS_OPTS = ["ALL","NOT_PLACED","APPLIED","SHORTLISTED","PLACED"];

function StudentsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [total,    setTotal]    = useState(0);

  const [branch,  setBranch]  = useState(params.get("branch") || "");
  const [year,    setYear]    = useState("");
  const [status,  setStatus]  = useState("ALL");
  const [minCgpa, setMinCgpa] = useState("");
  const [skill,   setSkill]   = useState("");
  const [q,       setQ]       = useState("");
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=dept"); return; }
    fetchStudents();
  }, [branch, year, status, minCgpa, page]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (branch)  params.branch = branch;
      if (year)    params.year = year;
      if (status !== "ALL") params.placement_status = status;
      if (minCgpa) params.min_cgpa = parseFloat(minCgpa);
      if (skill)   params.skill = skill;
      if (q)       params.search = q;
      const r = await api.get("/dept/students", { params });
      setStudents(r.data.students || []);
      setTotal(r.data.total || 0);
    } catch { setStudents([]); }
    finally { setLoading(false); }
  };

  const clearFilters = () => {
    setBranch(""); setYear(""); setStatus("ALL");
    setMinCgpa(""); setSkill(""); setQ(""); setPage(1);
  };

  const hasFilters = branch || year || status !== "ALL" || minCgpa || skill || q;

  const STATUS_COLOR: Record<string,string> = {
    NOT_PLACED:  "status-pending",
    APPLIED:     "status-applied",
    SHORTLISTED: "status-shortlisted",
    PLACED:      "status-placed",
  };

  return (
    <DashboardLayout navItems={NAV} portalLabel="Department Portal" portalColor="#10b981">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>Student Management</h1>
            <p className="text-slate-400 text-sm mt-1">{total} students matched</p>
          </div>
          <button onClick={fetchStudents} className="btn-secondary text-sm py-2 px-4"><Search size={14} /> Search</button>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={14} className="text-emerald-400" />
            <span className="text-white font-semibold text-sm">Filters</span>
            {hasFilters && <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-300"><X size={12} /> Clear all</button>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Branch */}
            <div className="relative">
              <select value={branch} onChange={(e)=>{setBranch(e.target.value);setPage(1);}} className="form-input text-sm appearance-none pr-7 cursor-pointer">
                <option value="">All Branches</option>
                {VIT_BRANCHES.map((b)=><option key={b} value={b}>{b}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            {/* Year */}
            <div className="relative">
              <select value={year} onChange={(e)=>{setYear(e.target.value);setPage(1);}} className="form-input text-sm appearance-none pr-7 cursor-pointer">
                <option value="">All Years</option>
                {[1,2,3,4].map((y)=><option key={y} value={y}>Year {y}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            {/* Status */}
            <div className="relative">
              <select value={status} onChange={(e)=>{setStatus(e.target.value);setPage(1);}} className="form-input text-sm appearance-none pr-7 cursor-pointer">
                {PLACEMENT_STATUS_OPTS.map((s)=><option key={s} value={s}>{s.replace("_"," ")}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            {/* Min CGPA */}
            <input value={minCgpa} onChange={(e)=>setMinCgpa(e.target.value)} className="form-input text-sm" placeholder="Min CGPA" type="number" min="0" max="10" step="0.1" />
            {/* Skill */}
            <input value={skill} onChange={(e)=>setSkill(e.target.value)} className="form-input text-sm" placeholder="Has skill…" />
            {/* Name search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={q} onChange={(e)=>setQ(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&fetchStudents()} className="form-input text-sm pl-8" placeholder="Search name…" />
            </div>
          </div>
        </div>

        {/* Students Grid */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={28} className="text-emerald-400 animate-spin" /></div>
        ) : students.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-600">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No students match these filters</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {students.map((s) => {
                const readiness = s.readiness_score || 0;
                return (
                  <div key={s.user_id} className="glass-card rounded-2xl p-5 hover-lift transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold shrink-0">
                        {(s.full_name || "?")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-white font-bold text-sm truncate">{s.full_name || s.email}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLOR[s.placement_status] || "status-pending"}`}>
                            {(s.placement_status || "").replace("_"," ")}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{s.branch} · Year {s.year_of_study} · CGPA: {s.cgpa || "N/A"}</p>
                      </div>
                    </div>

                    {/* Readiness bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">AI Readiness</span>
                        <span className="text-emerald-400 font-bold">{readiness}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${readiness}%` }} />
                      </div>
                    </div>

                    {/* Skills */}
                    {s.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {s.skills.slice(0, 4).map((sk: string) => (
                          <span key={sk} className="skill-badge skill-badge-brand text-xs">{sk}</span>
                        ))}
                        {s.skills.length > 4 && <span className="text-xs text-slate-600">+{s.skills.length - 4}</span>}
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      {s.github_url && <a href={s.github_url} target="_blank" className="text-slate-600 hover:text-white transition-colors"><Github size={13} /></a>}
                      {s.linkedin_url && <a href={s.linkedin_url} target="_blank" className="text-slate-600 hover:text-white transition-colors"><Linkedin size={13} /></a>}
                      <span className="text-slate-600 text-xs ml-auto">{s.prn || ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1} className="btn-secondary text-xs py-2 px-4 disabled:opacity-40">← Prev</button>
                <span className="text-slate-400 text-xs">Page {page} · {total} total</span>
                <button onClick={() => setPage((p) => p+1)} disabled={page * 20 >= total} className="btn-secondary text-xs py-2 px-4 disabled:opacity-40">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function StudentsPage() {
  return <Suspense fallback={<div className="min-h-screen hero-bg flex items-center justify-center"><Loader2 size={24} className="text-emerald-400 animate-spin" /></div>}><StudentsContent /></Suspense>;
}
