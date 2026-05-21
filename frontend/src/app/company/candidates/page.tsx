"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, Briefcase, Bell, Building2,
  Search, Loader2, Star, CheckCircle, X, Link2, GitBranch,
  BarChart3, ChevronDown, Zap, SlidersHorizontal,
} from "lucide-react";

const Github   = GitBranch;
const Linkedin = Link2;

const NAV = [
  { label: "Dashboard",       href: "/company/dashboard",     icon: LayoutDashboard },
  { label: "Company Profile", href: "/company/profile",       icon: Building2 },
  { label: "Job Postings",    href: "/company/jobs",          icon: Briefcase },
  { label: "Candidates",      href: "/company/candidates",    icon: Users },
  { label: "Announcements",   href: "/company/announcements", icon: Bell },
];

export default function CandidatesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [jobs,       setJobs]       = useState<any[]>([]);
  const [selectedJob,setSelectedJob]= useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [shortlisted,setShortlisted]= useState<Set<string>>(new Set());
  const [query,      setQuery]      = useState("");
  const [minScore,   setMinScore]   = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=company"); return; }
    api.get("/company/jobs").then((r) => setJobs(r.data || [])).catch(() => {});
  }, []);

  const loadCandidates = async (jobId: string) => {
    if (!jobId) return;
    setLoading(true);
    try {
      const r = await api.get(`/company/jobs/${jobId}/rank-candidates`);
      setCandidates(r.data || []);
    } catch { setCandidates([]); }
    finally { setLoading(false); }
  };

  const handleShortlist = async (studentId: string) => {
    try {
      await api.post(`/company/jobs/${selectedJob}/shortlist`, { student_id: studentId });
      setShortlisted((prev) => { const n = new Set(prev); n.add(studentId); return n; });
    } catch {}
  };

  const handleReject = async (studentId: string) => {
    try {
      await api.post(`/company/jobs/${selectedJob}/reject`, { student_id: studentId });
      setCandidates((prev) => prev.filter((c) => c.student_id !== studentId));
    } catch {}
  };

  const filtered = candidates.filter((c) => {
    const score = c.match_score || 0;
    const name  = (c.full_name || "").toLowerCase();
    return score >= minScore / 100 && (!query || name.includes(query.toLowerCase()));
  });

  return (
    <DashboardLayout navItems={NAV} portalLabel="Company Portal" portalColor="#f59e0b">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>AI Candidate Ranking</h1>
          <p className="text-slate-400 text-sm mt-1">Sentence-BERT semantic matching ranks applicants by JD fit</p>
        </div>

        {/* Job selector + filters */}
        <div className="glass-card rounded-2xl p-5 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="form-label">Select Drive / Job</label>
            <div className="relative">
              <select value={selectedJob} onChange={(e) => { setSelectedJob(e.target.value); loadCandidates(e.target.value); }} className="form-input appearance-none pr-8 cursor-pointer">
                <option value="">Choose a job posting…</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
          <div className="flex-1 min-w-40">
            <label className="form-label">Search Candidate</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="form-input pl-9" placeholder="Name…" />
            </div>
          </div>
          <div className="min-w-36">
            <label className="form-label">Min AI Score: {minScore}%</label>
            <input type="range" min="0" max="90" step="5" value={minScore} onChange={(e) => setMinScore(+e.target.value)} className="w-full accent-amber-500 cursor-pointer" />
          </div>
        </div>

        {/* Results */}
        {!selectedJob && (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-600">
            <SlidersHorizontal size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a job posting above to see AI-ranked candidates</p>
          </div>
        )}

        {selectedJob && loading && (
          <div className="flex justify-center py-12"><Loader2 size={28} className="text-amber-400 animate-spin" /></div>
        )}

        {selectedJob && !loading && filtered.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-600">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No candidates found. Adjust filters or wait for applications.</p>
          </div>
        )}

        {selectedJob && !loading && filtered.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-sm">{filtered.length} candidates ranked by AI</span>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-semibold">
                <Zap size={12} /> Sentence-BERT matching
              </div>
            </div>
            {filtered.map((c, idx) => {
              const score = Math.round((c.match_score || 0) * 100);
              const isShortlisted = shortlisted.has(c.student_id);
              return (
                <div key={c.student_id} className="glass-card rounded-2xl p-5 hover-lift transition-all">
                  <div className="flex items-start gap-4">
                    {/* Rank badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                      idx === 0 ? "bg-amber-500/30 text-amber-400 border border-amber-500/50" :
                      idx === 1 ? "bg-slate-400/20 text-slate-300 border border-slate-500/30" :
                      idx === 2 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                      "bg-slate-800 text-slate-500"
                    }`}>
                      #{idx + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                      {(c.full_name || "?")[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-white font-bold">{c.full_name || "Student"}</h3>
                          <p className="text-slate-400 text-xs mt-0.5">{c.branch} · Year {c.year_of_study} · CGPA: {c.cgpa || "N/A"}</p>
                        </div>
                        {/* AI score */}
                        <div className={`shrink-0 text-center px-3 py-1.5 rounded-xl font-black text-sm ${
                          score >= 80 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                          score >= 60 ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                          "bg-slate-700 text-slate-400"
                        }`}>
                          {score}%<br /><span className="text-[10px] font-normal">AI match</span>
                        </div>
                      </div>

                      {/* Skills */}
                      {c.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.skills.slice(0, 8).map((s: string) => (
                            <span key={s} className="skill-badge skill-badge-brand text-xs">{s}</span>
                          ))}
                          {c.skills.length > 8 && <span className="text-xs text-slate-600">+{c.skills.length - 8}</span>}
                        </div>
                      )}

                      {/* Links + actions */}
                      <div className="flex items-center gap-3 mt-3">
                        {c.github_url && <a href={c.github_url} target="_blank" className="text-slate-500 hover:text-white transition-colors"><Github size={14} /></a>}
                        {c.linkedin_url && <a href={c.linkedin_url} target="_blank" className="text-slate-500 hover:text-white transition-colors"><Linkedin size={14} /></a>}
                        <div className="ml-auto flex gap-2">
                          {isShortlisted ? (
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                              <CheckCircle size={13} /> Shortlisted
                            </span>
                          ) : (
                            <>
                              <button onClick={() => handleShortlist(c.student_id)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all" style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}>
                                <Star size={13} /> Shortlist
                              </button>
                              <button onClick={() => handleReject(c.student_id)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
                                <X size={13} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
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
