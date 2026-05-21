"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, Briefcase, Bell, Building2,
  Plus, Eye, Edit, Trash2, Loader2, CheckCircle, Clock,
  MapPin, ArrowRight,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",       href: "/company/dashboard",     icon: LayoutDashboard },
  { label: "Company Profile", href: "/company/profile",       icon: Building2 },
  { label: "Job Postings",    href: "/company/jobs",          icon: Briefcase },
  { label: "Candidates",      href: "/company/candidates",    icon: Users },
  { label: "Announcements",   href: "/company/announcements", icon: Bell },
];

export default function CompanyJobsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting,setDeleting]= useState<string|null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=company"); return; }
    api.get("/company/jobs").then((r) => setJobs(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this job posting?")) return;
    setDeleting(id);
    try { await api.delete(`/company/jobs/${id}`); setJobs((j) => j.filter((x) => x.id !== id)); }
    catch { alert("Delete failed"); }
    finally { setDeleting(null); }
  };

  const handleTogglePublish = async (job: any) => {
    try {
      await api.put(`/company/jobs/${job.id}`, { ...job, is_published: !job.is_published });
      setJobs((j) => j.map((x) => x.id === job.id ? { ...x, is_published: !x.is_published } : x));
    } catch { alert("Update failed"); }
  };

  return (
    <DashboardLayout navItems={NAV} portalLabel="Company Portal" portalColor="#f59e0b">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>Job Postings</h1>
            <p className="text-slate-400 text-sm mt-1">{jobs.length} total · {jobs.filter((j) => j.is_published).length} live</p>
          </div>
          <Link href="/company/jobs/new" className="btn-primary text-sm py-2.5 px-5" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
            <Plus size={15} /> Post New Drive
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={28} className="text-amber-400 animate-spin" /></div>
        ) : jobs.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-600">
            <Briefcase size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-base font-semibold text-slate-400">No drives posted yet</p>
            <Link href="/company/jobs/new" className="text-amber-400 text-sm mt-2 inline-block hover:underline">Post your first drive →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="glass-card rounded-2xl p-5 hover-lift transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-white font-bold">{job.title}</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${job.is_published ? "status-placed" : "status-pending"}`}>
                        {job.is_published ? "Live" : "Draft"}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-1 rounded-full">
                        {job.role_type === "INTERN" ? "Internship" : "Full-Time"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-slate-400 text-xs">
                      {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
                      {job.ctc     && <span>₹{job.ctc} LPA</span>}
                      {job.deadline&& <span className="flex items-center gap-1"><Clock size={11} />Deadline: {job.deadline}</span>}
                      <span className="text-indigo-400 font-semibold">{job.application_count || 0} applicants</span>
                    </div>
                    {job.required_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.required_skills.slice(0, 5).map((s: string) => (
                          <span key={s} className="skill-badge skill-badge-brand text-xs">{s}</span>
                        ))}
                        {job.required_skills.length > 5 && <span className="text-xs text-slate-600">+{job.required_skills.length - 5}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link href={`/company/candidates?job=${job.id}`} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg glass-light text-slate-300 hover:text-white border border-white/5 hover:border-white/15 transition-all">
                      <Eye size={12} /> Candidates
                    </Link>
                    <button onClick={() => handleTogglePublish(job)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={job.is_published ? { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" } : { background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>
                      {job.is_published ? "Unpublish" : "Publish"}
                    </button>
                    <button onClick={() => handleDelete(job.id)} disabled={deleting === job.id}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50">
                      {deleting === job.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}