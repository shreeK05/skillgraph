"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, Briefcase, Bell, Building2,
  Send, Loader2, AlertCircle, CheckCircle, ChevronDown,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",       href: "/company/dashboard",     icon: LayoutDashboard },
  { label: "Company Profile", href: "/company/profile",       icon: Building2 },
  { label: "Job Postings",    href: "/company/jobs",          icon: Briefcase },
  { label: "Candidates",      href: "/company/candidates",    icon: Users },
  { label: "Announcements",   href: "/company/announcements", icon: Bell },
];

const VIT_BRANCHES = ["AIDS","CSE","CSE(AI)","CSE(AIML)","CSE(DS)","CSE(IOT_CYBER)","CSE(SE)","DESH","ENTC","INSTRU","IT","MECH"];

export default function CompanyAnnouncementsPage() {
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
    if (!isAuthenticated()) { router.push("/login?role=company"); return; }
    api.get("/company/announcements").then((r) => setHistory(r.data || [])).catch(() => {});
  }, []);

  const toggleBranch = (b: string) => setBranches((p) => p.includes(b) ? p.filter((x)=>x!==b) : [...p, b]);
  const toggleYear   = (y: number) => setYears((p)   => p.includes(y) ? p.filter((x)=>x!==y) : [...p, y]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { setError("Title and message are required"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await api.post("/company/announcements", {
        title, body,
        audience_filter: sendAll ? { all: true } : {
          branches: branches.length > 0 ? branches : undefined,
          years:    years.length > 0    ? years    : undefined,
        },
      });
      setSuccess("Announcement sent to students!");
      setTitle(""); setBody(""); setBranches([]); setYears([]); setSendAll(true);
      api.get("/company/announcements").then((r) => setHistory(r.data || [])).catch(() => {});
      setTimeout(() => setSuccess(""), 5000);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to send announcement");
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout navItems={NAV} portalLabel="Company Portal" portalColor="#f59e0b">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>Announcements</h1>
          <p className="text-slate-400 text-sm mt-1">Send emails to students about your drives and opportunities</p>
        </div>

        {success && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"><CheckCircle size={16}/>{success}</div>}
        {error   && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertCircle size={16}/>{error}</div>}

        {/* Compose */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-bold flex items-center gap-2"><Bell size={16} className="text-amber-400" /> Compose Message</h2>
          <div>
            <label className="form-label">Subject / Title *</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="form-input" placeholder="We're hiring! Apply for [Role] at [Company]" />
          </div>
          <div>
            <label className="form-label">Message Body *</label>
            <textarea value={body} onChange={(e)=>setBody(e.target.value)} className="form-input resize-none" rows={6} placeholder="Dear students,&#10;&#10;We are excited to announce our campus recruitment drive…" />
            <p className="text-slate-600 text-xs mt-1.5">{body.length} characters</p>
          </div>

          {/* Audience */}
          <div>
            <label className="form-label">Target Audience</label>
            <div className="flex gap-3 mb-4">
              <button onClick={() => setSendAll(true)} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border ${sendAll ? "text-white border-amber-500" : "glass-light text-slate-400 border-white/5 hover:text-white"}`}
                style={sendAll ? { background: "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(217,119,6,0.2))" } : {}}>
                All Students
              </button>
              <button onClick={() => setSendAll(false)} className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border ${!sendAll ? "text-white border-amber-500" : "glass-light text-slate-400 border-white/5 hover:text-white"}`}
                style={!sendAll ? { background: "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(217,119,6,0.2))" } : {}}>
                Specific Filter
              </button>
            </div>

            {!sendAll && (
              <div className="space-y-4 glass-light rounded-xl p-4">
                <div>
                  <p className="form-label">Branches <span className="text-slate-600">(empty = all)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {VIT_BRANCHES.map((b) => (
                      <button key={b} onClick={() => toggleBranch(b)}
                        className={`skill-badge transition-all ${branches.includes(b) ? "skill-badge-brand" : "border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-300"}`}>
                        {branches.includes(b) && <CheckCircle size={10} />}{b}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="form-label">Years <span className="text-slate-600">(empty = all)</span></p>
                  <div className="flex gap-2">
                    {[1,2,3,4].map((y) => (
                      <button key={y} onClick={() => toggleYear(y)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${years.includes(y) ? "text-white border-amber-500" : "glass-light text-slate-400 hover:text-white"}`}
                        style={years.includes(y) ? { background: "rgba(245,158,11,0.25)", border: "1px solid rgba(245,158,11,0.5)" } : {}}>
                        Year {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Audience summary */}
          <div className="glass-light rounded-xl p-3 flex items-center gap-3 text-sm">
            <Users size={14} className="text-amber-400 shrink-0" />
            <span className="text-slate-400">
              {sendAll ? "Will be sent to all eligible students at VIT Pune" : `Targeting: ${branches.length ? branches.join(", ") : "all branches"}${years.length ? ` · Year ${years.join(", ")}` : ""}`}
            </span>
          </div>

          <button onClick={handleSend} disabled={loading || !title.trim() || !body.trim()}
            className="w-full btn-primary py-3.5 justify-center text-base disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#d97706,#f59e0b)" }}>
            {loading ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : <><Send size={18} /> Send Announcement</>}
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h2 className="text-white font-bold">Sent Announcements</h2>
            {history.slice(0, 10).map((ann) => (
              <div key={ann.id} className="glass-light rounded-xl p-4 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-white font-semibold text-sm">{ann.title}</p>
                  <span className="text-slate-600 text-xs shrink-0">{new Date(ann.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-400 text-xs line-clamp-2">{ann.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
