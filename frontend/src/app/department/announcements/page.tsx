"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, BookOpen, Bell, BarChart3,
  Send, Loader2, AlertCircle, CheckCircle, X, ChevronDown
} from "lucide-react";

const NAV = [
  { label: "Dashboard",        href: "/department/dashboard",     icon: LayoutDashboard },
  { label: "Students",         href: "/department/students",      icon: Users },
  { label: "Syllabus Manager", href: "/department/syllabus",      icon: BookOpen },
  { label: "Analytics",        href: "/department/analytics",     icon: BarChart3 },
  { label: "Announcements",    href: "/department/announcements", icon: Bell },
];

const VIT_BRANCHES = ["AIDS","CSE","CSE(AI)","CSE(AIML)","CSE(DS)","CSE(IOT_CYBER)","CSE(SE)","DESH","ENTC","INSTRU","IT","MECH"];

export default function AnnouncementsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [title,    setTitle]    = useState("");
  const [body,     setBody]     = useState("");
  const [sendAll,  setSendAll]  = useState(true);
  const [branches, setBranches] = useState<string[]>([]);
  const [years,    setYears]    = useState<number[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState("");
  const [error,    setError]    = useState("");
  const [history,  setHistory]  = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=dept"); return; }
    api.get("/dept/announcements").then((r) => setHistory(r.data || [])).catch(() => {});
  }, []);

  const toggleBranch = (b: string) => setBranches((p) => p.includes(b) ? p.filter((x)=>x!==b) : [...p, b]);
  const toggleYear   = (y: number) => setYears((p) => p.includes(y) ? p.filter((x)=>x!==y) : [...p, y]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { setError("Title and message are required"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await api.post("/dept/announcements", {
        title, body,
        audience_filter: sendAll ? { all: true } : {
          branches: branches.length > 0 ? branches : undefined,
          years:    years.length > 0    ? years    : undefined,
        },
      });
      setSuccess(`Announcement sent to ${sendAll ? "all students" : `${branches.length || "all"} branches`}!`);
      setTitle(""); setBody(""); setBranches([]); setYears([]); setSendAll(true);
      api.get("/dept/announcements").then((r) => setHistory(r.data || [])).catch(() => {});
      setTimeout(() => setSuccess(""), 5000);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to send announcement");
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout navItems={NAV} portalLabel="Department Portal" portalColor="#10b981">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>Announcements</h1>
          <p className="text-slate-400 text-sm mt-1">Broadcast important updates via email to students</p>
        </div>

        {success && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"><CheckCircle size={16}/>{success}</div>}
        {error   && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertCircle size={16}/>{error}</div>}

        {/* Compose */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-bold flex items-center gap-2"><Bell size={16} className="text-emerald-400" /> Compose Announcement</h2>

          <div>
            <label className="form-label">Subject / Title *</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="form-input" placeholder="e.g. Placement Drive Update — TCS 2025" />
          </div>

          <div>
            <label className="form-label">Message Body *</label>
            <textarea value={body} onChange={(e)=>setBody(e.target.value)} className="form-input resize-none" rows={6} placeholder="Dear students,&#10;&#10;We are pleased to announce…" />
            <p className="text-slate-600 text-xs mt-1.5">{body.length} characters</p>
          </div>

          {/* Audience */}
          <div>
            <label className="form-label">Audience</label>
            <div className="flex gap-3 mb-4">
              <button onClick={()=>setSendAll(true)}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border ${sendAll ? "bg-emerald-600 text-white border-emerald-500" : "glass-light text-slate-400 border-white/5 hover:text-white"}`}>
                All Students
              </button>
              <button onClick={()=>setSendAll(false)}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border ${!sendAll ? "bg-emerald-600 text-white border-emerald-500" : "glass-light text-slate-400 border-white/5 hover:text-white"}`}>
                Specific Filter
              </button>
            </div>

            {!sendAll && (
              <div className="space-y-4 glass-light rounded-xl p-4">
                <div>
                  <p className="form-label">Branches <span className="text-slate-600">(empty = all)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {VIT_BRANCHES.map((b)=>(
                      <button key={b} onClick={()=>toggleBranch(b)}
                        className={`skill-badge transition-all ${branches.includes(b) ? "skill-badge-brand" : "border-slate-700 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300"}`}>
                        {branches.includes(b) && <CheckCircle size={10} />}{b}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="form-label">Years <span className="text-slate-600">(empty = all)</span></p>
                  <div className="flex gap-2">
                    {[1,2,3,4].map((y)=>(
                      <button key={y} onClick={()=>toggleYear(y)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${years.includes(y) ? "bg-emerald-600 text-white" : "glass-light text-slate-400 hover:text-white"}`}>
                        Year {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Estimated reach */}
          <div className="glass-light rounded-xl p-3 flex items-center gap-3 text-sm">
            <Users size={14} className="text-emerald-400 shrink-0" />
            <span className="text-slate-400">
              {sendAll ? "Will be sent to all registered students" : `Filtered to ${branches.length ? branches.join(", ") : "all branches"}${years.length ? ` · Year ${years.join(", ")}` : ""}`}
            </span>
          </div>

          <button onClick={handleSend} disabled={loading || !title.trim() || !body.trim()}
            className="w-full btn-primary py-3.5 justify-center text-base disabled:opacity-50" style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : <><Send size={18} /> Send Announcement</>}
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold">Previous Announcements</h2>
            {history.slice(0, 10).map((ann) => (
              <div key={ann.id} className="glass-light rounded-xl p-4 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-white font-semibold text-sm">{ann.title}</p>
                  <span className="text-slate-600 text-xs shrink-0">{new Date(ann.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-400 text-xs line-clamp-2">{ann.body}</p>
                <p className="text-slate-600 text-xs">Sent to: {ann.audience_filter?.all ? "All students" : (ann.audience_filter?.branches || []).join(", ") || "All"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
