"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, User, Camera, BookOpen, Briefcase, Star,
  Save, Plus, Trash2, Globe, Upload,
  CheckCircle, Loader2, AlertCircle, X, Award, Trophy,
  ExternalLink, ChevronDown, FileText, Link2, GitBranch,
} from "lucide-react";

// Icon substitutes for social platforms
const Github   = GitBranch;
const Linkedin = Link2;

const NAV = [
  { label: "Dashboard",       href: "/student/dashboard",  icon: LayoutDashboard },
  { label: "My Profile",      href: "/student/profile",    icon: User },
  { label: "Interview Coach", href: "/student/interview",  icon: Camera },
  { label: "Learning Path",   href: "/student/learning",   icon: BookOpen },
  { label: "Job Drives",      href: "/student/jobs",       icon: Briefcase },
  { label: "Portfolio",       href: "/student/portfolio",  icon: Star },
];

const VIT_BRANCHES = ["AIDS","CSE","CSE(AI)","CSE(AIML)","CSE(DS)","CSE(IOT_CYBER)","CSE(SE)","DESH","ENTC","INSTRU","IT","MECH"];

const SKILL_CATS = [
  { label: "Programming",  skills: ["Python","JavaScript","TypeScript","Java","C++","C","Go","Kotlin"] },
  { label: "Web",          skills: ["React.js","Next.js","Vue.js","HTML","CSS","TailwindCSS","Node.js"] },
  { label: "Backend",      skills: ["FastAPI","Django","Flask","Express.js","Spring Boot","Laravel"] },
  { label: "ML / AI",      skills: ["Machine Learning","Deep Learning","TensorFlow","PyTorch","NLP","LangChain","Scikit-Learn"] },
  { label: "Cloud",        skills: ["AWS","GCP","Azure","Docker","Kubernetes","CI/CD","Linux"] },
  { label: "Databases",    skills: ["PostgreSQL","MySQL","MongoDB","Redis","Neo4j","Firebase"] },
  { label: "Data",         skills: ["Data Structures","Algorithms","Pandas","NumPy","SQL","Power BI"] },
  { label: "Other",        skills: ["Git","REST APIs","GraphQL","System Design","Agile"] },
];
const ALL_SKILLS = SKILL_CATS.flatMap((c) => c.skills);

const SECTIONS = [
  { id: "identity",      label: "Identity" },
  { id: "academic",      label: "Academic" },
  { id: "skills",        label: "Skills" },
  { id: "links",         label: "Links" },
  { id: "certifications",label: "Certifications" },
  { id: "hackathons",    label: "Hackathons" },
  { id: "resume",        label: "Resume" },
];

export default function StudentProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const photoRef  = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile]   = useState<any>({});
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [success, setSuccess]   = useState("");
  const [error,   setError]     = useState("");
  const [skills,  setSkills]    = useState<string[]>([]);
  const [search,  setSearch]    = useState("");
  const [certs,   setCerts]     = useState<any[]>([]);
  const [hacks,   setHacks]     = useState<any[]>([]);
  const [section, setSection]   = useState("identity");

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=student"); return; }
    api.get("/student/profile")
      .then((r) => {
        setProfile(r.data.profile || {});
        setSkills((r.data.extracted_skills || []).map((s: any) => s.canonical || s.name || s));
      }).catch(() => {}).finally(() => setLoading(false));
    api.get("/student/certifications").then((r) => setCerts(r.data || [])).catch(() => {});
    api.get("/student/hackathons").then((r) => setHacks(r.data || [])).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.put("/student/profile", {
        full_name:    profile.full_name,
        bio:          profile.bio,
        prn:          profile.prn,
        branch:       profile.branch,
        year_of_study:profile.year_of_study,
        section:      profile.section,
        cgpa:         profile.cgpa ? parseFloat(profile.cgpa) : undefined,
        github_url:   profile.github_url,
        linkedin_url: profile.linkedin_url,
        portfolio_url:profile.portfolio_url,
      });
      setSuccess("Profile saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  const toggleSkill = (s: string) =>
    setSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  if (loading) return (
    <DashboardLayout navItems={NAV} portalLabel="Student Portal" portalColor="#6366f1">
      <div className="flex items-center justify-center h-64"><Loader2 size={28} className="text-indigo-400 animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={NAV} portalLabel="Student Portal" portalColor="#6366f1">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>My Profile</h1>
            <p className="text-slate-400 text-sm mt-1">Complete your profile to boost placement readiness</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-5 text-sm disabled:opacity-50">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save</>}
          </button>
        </div>

        {success && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"><CheckCircle size={16} />{success}</div>}
        {error   && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertCircle size={16} />{error}</div>}

        {/* Section tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${section === s.id ? "bg-indigo-600 text-white" : "glass-light text-slate-400 hover:text-white"}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* ── IDENTITY ── */}
        {section === "identity" && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-bold">Identity</h2>
            {/* Photo */}
            <div className="flex items-center gap-5">
              <div
                onClick={() => photoRef.current?.click()}
                className="w-20 h-20 rounded-2xl flex items-center justify-center cursor-pointer relative group border-2 border-dashed border-indigo-500/30 hover:border-indigo-500/60 transition-colors overflow-hidden"
                style={profile.photo_url ? { backgroundImage: `url(${profile.photo_url})`, backgroundSize: "cover" } : { background: "rgba(99,102,241,0.1)" }}
              >
                {!profile.photo_url && <Camera size={22} className="text-indigo-400" />}
                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center"><Upload size={16} className="text-white" /></div>
              </div>
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const fd = new FormData(); fd.append("photo", file);
                try {
                  const r = await api.post("/student/profile/photo", fd, { headers: { "Content-Type": "multipart/form-data" } });
                  setProfile((p: any) => ({ ...p, photo_url: r.data.photo_url }));
                } catch { setError("Photo upload failed"); }
              }} />
              <div>
                <button onClick={() => photoRef.current?.click()} className="btn-secondary text-xs py-1.5 px-3"><Upload size={12} /> Upload Photo</button>
                <p className="text-slate-500 text-xs mt-1.5">JPG/PNG, max 5 MB</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name</label>
                <input value={profile.full_name || ""} onChange={(e) => setProfile((p: any) => ({ ...p, full_name: e.target.value }))} className="form-input" placeholder="Shreeyash Kamble" />
              </div>
              <div>
                <label className="form-label">PRN Number</label>
                <input value={profile.prn || ""} onChange={(e) => setProfile((p: any) => ({ ...p, prn: e.target.value }))} className="form-input" placeholder="e.g. 1234567890" />
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Bio / About Me</label>
                <textarea value={profile.bio || ""} onChange={(e) => setProfile((p: any) => ({ ...p, bio: e.target.value }))} className="form-input resize-none" rows={3} placeholder="Passionate developer interested in ML and full-stack…" />
              </div>
            </div>
          </div>
        )}

        {/* ── ACADEMIC ── */}
        {section === "academic" && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-bold">Academic Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Branch</label>
                <div className="relative">
                  <select value={profile.branch || ""} onChange={(e) => setProfile((p: any) => ({ ...p, branch: e.target.value }))} className="form-input appearance-none pr-8 cursor-pointer">
                    <option value="">Select branch</option>
                    {VIT_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="form-label">Year of Study</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1,2,3,4].map((y) => (
                    <button key={y} type="button" onClick={() => setProfile((p: any) => ({ ...p, year_of_study: y }))}
                      className={`py-2.5 rounded-xl font-bold text-sm transition-all ${profile.year_of_study === y ? "bg-indigo-600 text-white" : "glass-light text-slate-400 hover:text-white"}`}>
                      {y}{y===1?"st":y===2?"nd":y===3?"rd":"th"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Section</label>
                <input value={profile.section || ""} onChange={(e) => setProfile((p: any) => ({ ...p, section: e.target.value }))} className="form-input" placeholder="A / B / C" />
              </div>
              <div>
                <label className="form-label">CGPA</label>
                <input type="number" min="0" max="10" step="0.01" value={profile.cgpa || ""} onChange={(e) => setProfile((p: any) => ({ ...p, cgpa: e.target.value }))} className="form-input" placeholder="8.50" />
              </div>
            </div>
          </div>
        )}

        {/* ── SKILLS ── */}
        {section === "skills" && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">Skills</h2>
              <span className="text-slate-500 text-xs">{skills.length} selected</span>
            </div>
            {skills.length > 0 && (
              <div>
                <p className="form-label">Your Skills</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className="skill-badge skill-badge-brand flex items-center gap-1.5">
                      {s}
                      <button onClick={() => toggleSkill(s)} className="hover:text-red-400 transition-colors"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="form-label">Search & Add Skills</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" placeholder="Python, React, ML…" />
            </div>
            {SKILL_CATS.map((cat) => {
              const filtered = cat.skills.filter((s) => !search || s.toLowerCase().includes(search.toLowerCase()));
              if (!filtered.length) return null;
              return (
                <div key={cat.label}>
                  <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">{cat.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {filtered.map((s) => (
                      <button key={s} onClick={() => toggleSkill(s)}
                        className={`skill-badge transition-all ${skills.includes(s) ? "skill-badge-brand" : "border-slate-700 text-slate-400 hover:border-indigo-500/40 hover:text-indigo-300"}`}>
                        {skills.includes(s) && <CheckCircle size={10} />}{s}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LINKS ── */}
        {section === "links" && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-bold">Social & Portfolio Links</h2>
            <div className="space-y-4">
              {[
                { label: "GitHub",    icon: Github,   field: "github_url",    ph: "https://github.com/username" },
                { label: "LinkedIn",  icon: Linkedin, field: "linkedin_url",  ph: "https://linkedin.com/in/username" },
                { label: "Portfolio", icon: Globe,    field: "portfolio_url", ph: "https://yourportfolio.com" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.field}>
                    <label className="form-label">{item.label} Profile</label>
                    <div className="relative">
                      <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input value={profile[item.field] || ""} onChange={(e) => setProfile((p: any) => ({ ...p, [item.field]: e.target.value }))} className="form-input pl-10" placeholder={item.ph} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CERTIFICATIONS ── */}
        {section === "certifications" && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">Certifications</h2>
              <button onClick={() => setCerts((c) => [...c, { name: "", issuer: "", issue_date: "", credential_url: "" }])} className="btn-secondary text-xs py-1.5 px-3"><Plus size={13} /> Add</button>
            </div>
            {certs.length === 0 && (
              <div className="text-center py-8 text-slate-600"><Award size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Add Google, AWS or Coursera certs!</p></div>
            )}
            {certs.map((cert, i) => (
              <div key={i} className="glass-light rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="form-label">Name</label><input value={cert.name} onChange={(e) => setCerts((c) => c.map((x,j)=>j===i?{...x,name:e.target.value}:x))} className="form-input text-sm" placeholder="AWS Solutions Architect" /></div>
                  <div><label className="form-label">Issuer</label><input value={cert.issuer} onChange={(e) => setCerts((c) => c.map((x,j)=>j===i?{...x,issuer:e.target.value}:x))} className="form-input text-sm" placeholder="Amazon / Google" /></div>
                  <div><label className="form-label">Date (YYYY-MM)</label><input value={cert.issue_date} onChange={(e) => setCerts((c) => c.map((x,j)=>j===i?{...x,issue_date:e.target.value}:x))} className="form-input text-sm" placeholder="2024-03" /></div>
                  <div><label className="form-label">Credential URL</label><input value={cert.credential_url} onChange={(e) => setCerts((c) => c.map((x,j)=>j===i?{...x,credential_url:e.target.value}:x))} className="form-input text-sm" placeholder="https://" /></div>
                </div>
                <div className="flex justify-between">
                  <button onClick={async () => {
                    try {
                      if (cert.id) await api.put(`/student/certifications/${cert.id}`, cert);
                      else { const r = await api.post("/student/certifications", cert); setCerts((c) => c.map((x,j)=>j===i?{...x,...r.data}:x)); }
                      setSuccess("Saved!"); setTimeout(()=>setSuccess(""),2000);
                    } catch { setError("Save failed"); }
                  }} className="btn-primary text-xs py-1.5 px-3"><Save size={12} /> Save</button>
                  <button onClick={async () => {
                    if (cert.id) try { await api.delete(`/student/certifications/${cert.id}`); } catch {}
                    setCerts((c) => c.filter((_,j)=>j!==i));
                  }} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"><Trash2 size={12} /> Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── HACKATHONS ── */}
        {section === "hackathons" && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">Hackathons & Competitions</h2>
              <button onClick={() => setHacks((h) => [...h, { event_name: "", position: "", year: new Date().getFullYear(), description: "", proof_url: "" }])} className="btn-secondary text-xs py-1.5 px-3"><Plus size={13} /> Add</button>
            </div>
            {hacks.length === 0 && (
              <div className="text-center py-8 text-slate-600"><Trophy size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Add your hackathon achievements!</p></div>
            )}
            {hacks.map((hack, i) => (
              <div key={i} className="glass-light rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="form-label">Event Name</label><input value={hack.event_name} onChange={(e)=>setHacks((h)=>h.map((x,j)=>j===i?{...x,event_name:e.target.value}:x))} className="form-input text-sm" placeholder="HackVIT 2024" /></div>
                  <div><label className="form-label">Position</label><input value={hack.position} onChange={(e)=>setHacks((h)=>h.map((x,j)=>j===i?{...x,position:e.target.value}:x))} className="form-input text-sm" placeholder="1st Place / Finalist" /></div>
                  <div><label className="form-label">Year</label><input type="number" value={hack.year} onChange={(e)=>setHacks((h)=>h.map((x,j)=>j===i?{...x,year:+e.target.value}:x))} className="form-input text-sm" /></div>
                  <div><label className="form-label">Proof URL</label><input value={hack.proof_url} onChange={(e)=>setHacks((h)=>h.map((x,j)=>j===i?{...x,proof_url:e.target.value}:x))} className="form-input text-sm" placeholder="https://devpost.com/…" /></div>
                  <div className="col-span-2"><label className="form-label">Description</label><textarea value={hack.description} onChange={(e)=>setHacks((h)=>h.map((x,j)=>j===i?{...x,description:e.target.value}:x))} className="form-input resize-none text-sm" rows={2} placeholder="What did you build?" /></div>
                </div>
                <div className="flex justify-between">
                  <button onClick={async () => {
                    try {
                      if (hack.id) await api.put(`/student/hackathons/${hack.id}`, hack);
                      else { const r = await api.post("/student/hackathons", hack); setHacks((h) => h.map((x,j)=>j===i?{...x,...r.data}:x)); }
                      setSuccess("Saved!"); setTimeout(()=>setSuccess(""),2000);
                    } catch { setError("Save failed"); }
                  }} className="btn-primary text-xs py-1.5 px-3"><Save size={12} /> Save</button>
                  <button onClick={async () => {
                    if (hack.id) try { await api.delete(`/student/hackathons/${hack.id}`); } catch {}
                    setHacks((h) => h.filter((_,j)=>j!==i));
                  }} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"><Trash2 size={12} /> Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── RESUME ── */}
        {section === "resume" && (
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-white font-bold">Resume Upload</h2>
            <div onClick={() => resumeRef.current?.click()} className="border-2 border-dashed border-indigo-500/30 rounded-2xl p-12 text-center cursor-pointer hover:border-indigo-500/60 transition-colors">
              <Upload size={32} className="mx-auto text-indigo-400 mb-3" />
              <p className="text-white font-semibold">Click to upload your resume</p>
              <p className="text-slate-500 text-sm mt-1">PDF only · Max 10 MB</p>
              <p className="text-indigo-400 text-xs mt-3">AI will extract skills automatically</p>
            </div>
            <input ref={resumeRef} type="file" accept=".pdf" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const fd = new FormData(); fd.append("file", file);
              setSaving(true);
              try {
                const r = await api.post("/student/resume", fd, { headers: { "Content-Type": "multipart/form-data" } });
                setSuccess(`Uploaded! ${r.data.skills_added_to_profile?.length || 0} skills extracted.`);
                setTimeout(() => setSuccess(""), 5000);
              } catch (e: any) { setError(e.response?.data?.detail || "Upload failed"); }
              finally { setSaving(false); }
            }} />
            {profile.resume_url && (
              <div className="flex items-center gap-3 p-3 rounded-xl glass-light">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center"><FileText size={14} className="text-red-400" /></div>
                <span className="text-slate-300 text-sm flex-1">Resume uploaded</span>
                <a href={`/api/v1/student/resume/file/${profile.resume_url}`} target="_blank" className="text-indigo-400 hover:text-indigo-300 transition-colors"><ExternalLink size={14} /></a>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary py-3 px-8 disabled:opacity-50">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save All Changes</>}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
