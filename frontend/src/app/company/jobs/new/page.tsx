"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, Briefcase, Bell, Building2,
  ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle,
  Plus, X, ChevronDown
} from "lucide-react";

const NAV = [
  { label: "Dashboard",      href: "/company/dashboard",     icon: LayoutDashboard },
  { label: "Company Profile",href: "/company/profile",       icon: Building2 },
  { label: "Job Postings",   href: "/company/jobs",          icon: Briefcase },
  { label: "Candidates",     href: "/company/candidates",    icon: Users },
  { label: "Announcements",  href: "/company/announcements", icon: Bell },
];

const VIT_BRANCHES = ["AIDS","CSE","CSE(AI)","CSE(AIML)","CSE(DS)","CSE(IOT_CYBER)","CSE(SE)","DESH","ENTC","INSTRU","IT","MECH"];
const COMMON_SKILLS = ["Python","JavaScript","TypeScript","Java","C++","React.js","Node.js","FastAPI","Django","Machine Learning","Deep Learning","SQL","AWS","Docker","System Design","Data Structures","Algorithms"];

export default function NewJobPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [location,     setLocation]     = useState("");
  const [roleType,     setRoleType]     = useState<"FTE"|"INTERN">("FTE");
  const [ctc,          setCtc]          = useState("");
  const [joiningDate,  setJoiningDate]  = useState("");
  const [minCgpa,      setMinCgpa]      = useState("");
  const [maxBacklogs,  setMaxBacklogs]  = useState("0");
  const [minYear,      setMinYear]      = useState<number>(3);
  const [reqBranches,  setReqBranches]  = useState<string[]>([]);
  const [reqSkills,    setReqSkills]    = useState<string[]>([]);
  const [customSkill,  setCustomSkill]  = useState("");
  const [publish,      setPublish]      = useState(false);
  const [deadline,     setDeadline]     = useState("");

  const toggleBranch = (b: string) => setReqBranches((prev) => prev.includes(b) ? prev.filter((x)=>x!==b) : [...prev, b]);
  const toggleSkill  = (s: string) => setReqSkills((prev)  => prev.includes(s) ? prev.filter((x)=>x!==s) : [...prev, s]);
  const addCustomSkill = () => {
    if (customSkill.trim() && !reqSkills.includes(customSkill.trim())) {
      setReqSkills((prev) => [...prev, customSkill.trim()]);
    }
    setCustomSkill("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Job title is required"); return; }
    setLoading(true); setError("");
    try {
      const payload = {
        title, description, location, role_type: roleType,
        ctc: ctc ? parseFloat(ctc) : undefined,
        joining_date: joiningDate || undefined,
        min_cgpa: minCgpa ? parseFloat(minCgpa) : undefined,
        max_backlogs: parseInt(maxBacklogs),
        min_year: minYear,
        allowed_branches: reqBranches.length > 0 ? reqBranches : undefined,
        required_skills: reqSkills,
        is_published: publish,
        deadline: deadline || undefined,
      };
      await api.post("/company/jobs", payload);
      setSuccess(publish ? "Drive posted successfully! Students can now apply." : "Drive saved as draft.");
      setTimeout(() => router.push("/company/jobs"), 2000);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to create job posting");
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout navItems={NAV} portalLabel="Company Portal" portalColor="#f59e0b">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/company/jobs" className="text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>Post a New Drive</h1>
            <p className="text-slate-400 text-sm mt-0.5">Fill in the details to reach VIT Pune students</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {["Job Details","Eligibility","Skills & Publish"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > i+1 ? "bg-emerald-500 text-white" : step === i+1 ? "bg-amber-500 text-white" : "bg-slate-800 text-slate-500"}`}>
                {step > i+1 ? <CheckCircle size={14} /> : i+1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === i+1 ? "text-white" : "text-slate-500"}`}>{s}</span>
              {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${step > i+1 ? "bg-emerald-500" : "bg-slate-800"}`} />}
            </div>
          ))}
        </div>

        {success && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"><CheckCircle size={16} />{success}</div>}
        {error   && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertCircle size={16} />{error}</div>}

        {/* ── STEP 1: Job Details ── */}
        {step === 1 && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-bold">Job Details</h2>
            <div>
              <label className="form-label">Job Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" placeholder="e.g. Software Engineer Intern" />
            </div>
            <div>
              <label className="form-label">Job Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-input resize-none" rows={5} placeholder="Describe the role, responsibilities, and what you're looking for…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["FTE", "INTERN"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setRoleType(t)}
                      className={`py-2.5 rounded-xl font-semibold text-sm transition-all ${roleType === t ? "bg-amber-500 text-white" : "glass-light text-slate-400 hover:text-white"}`}>
                      {t === "FTE" ? "Full-Time" : "Internship"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} className="form-input" placeholder="Bangalore / Remote" />
              </div>
              <div>
                <label className="form-label">CTC / Stipend (₹ LPA)</label>
                <input type="number" value={ctc} onChange={(e) => setCtc(e.target.value)} className="form-input" placeholder="e.g. 12 or 50000/month" />
              </div>
              <div>
                <label className="form-label">Application Deadline</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Joining Date</label>
                <input value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="form-input" placeholder="July 2025" />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => { if (!title.trim()) { setError("Title is required"); return; } setError(""); setStep(2); }} className="btn-primary py-2.5 px-6 text-sm" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                Next: Eligibility <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Eligibility ── */}
        {step === 2 && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-bold">Eligibility Criteria</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Minimum CGPA</label>
                <input type="number" min="0" max="10" step="0.1" value={minCgpa} onChange={(e) => setMinCgpa(e.target.value)} className="form-input" placeholder="e.g. 7.0" />
              </div>
              <div>
                <label className="form-label">Max Backlogs Allowed</label>
                <input type="number" min="0" max="20" value={maxBacklogs} onChange={(e) => setMaxBacklogs(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Minimum Year</label>
                <div className="grid grid-cols-4 gap-1">
                  {[1,2,3,4].map((y) => (
                    <button key={y} type="button" onClick={() => setMinYear(y)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${minYear === y ? "bg-amber-500 text-white" : "glass-light text-slate-400 hover:text-white"}`}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="form-label">Eligible Branches <span className="text-slate-600">(leave empty for all)</span></label>
              <div className="flex flex-wrap gap-2 mt-1">
                {VIT_BRANCHES.map((b) => (
                  <button key={b} onClick={() => toggleBranch(b)} type="button"
                    className={`skill-badge transition-all ${reqBranches.includes(b) ? "skill-badge-brand" : "border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-300"}`}>
                    {reqBranches.includes(b) && <CheckCircle size={10} />}{b}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-ghost text-sm"><ArrowLeft size={14} /> Back</button>
              <button onClick={() => { setError(""); setStep(3); }} className="btn-primary py-2.5 px-6 text-sm" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                Next: Skills <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Skills + Publish ── */}
        {step === 3 && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-bold">Required Skills & Publish</h2>

            {/* Selected skills */}
            {reqSkills.length > 0 && (
              <div>
                <label className="form-label">Selected Skills ({reqSkills.length})</label>
                <div className="flex flex-wrap gap-2">
                  {reqSkills.map((s) => (
                    <span key={s} className="skill-badge skill-badge-brand flex items-center gap-1.5">
                      {s}
                      <button onClick={() => toggleSkill(s)} className="hover:text-red-400"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Common skills */}
            <div>
              <label className="form-label">Common Skills</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SKILLS.map((s) => (
                  <button key={s} onClick={() => toggleSkill(s)}
                    className={`skill-badge transition-all ${reqSkills.includes(s) ? "skill-badge-brand" : "border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-300"}`}>
                    {reqSkills.includes(s) && <CheckCircle size={10} />}{s}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom skill */}
            <div>
              <label className="form-label">Add Custom Skill</label>
              <div className="flex gap-2">
                <input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomSkill()} className="form-input flex-1" placeholder="Type skill and press Enter" />
                <button onClick={addCustomSkill} className="btn-secondary text-sm px-3 py-2"><Plus size={14} /></button>
              </div>
            </div>

            {/* Publish toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl glass-light border border-white/5">
              <div>
                <p className="text-white font-semibold text-sm">Publish Immediately</p>
                <p className="text-slate-500 text-xs mt-0.5">Students can see and apply as soon as it's posted</p>
              </div>
              <button
                onClick={() => setPublish(!publish)}
                className={`w-12 h-6 rounded-full border-2 transition-all relative ${publish ? "border-amber-500 bg-amber-500/30" : "border-slate-600 bg-transparent"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${publish ? "left-6" : "left-0.5"}`} />
              </button>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="btn-ghost text-sm"><ArrowLeft size={14} /> Back</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary py-2.5 px-6 text-sm disabled:opacity-50" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                {loading ? <><Loader2 size={15} className="animate-spin" /> Posting…</> : <>{publish ? "Publish Drive" : "Save as Draft"} <CheckCircle size={15} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
