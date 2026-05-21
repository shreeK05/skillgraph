"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, BookOpen, Bell, BarChart3, ChevronDown,
  Save, Loader2, CheckCircle, AlertCircle, Plus, Trash2, Edit3,
  GraduationCap, FileText,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",     href: "/department/dashboard",    icon: LayoutDashboard },
  { label: "Students",      href: "/department/students",     icon: Users },
  { label: "Syllabus",      href: "/department/syllabus",     icon: BookOpen },
  { label: "Announcements", href: "/department/announcements",icon: Bell },
  { label: "Analytics",     href: "/department/analytics",    icon: BarChart3 },
];

const VIT_BRANCHES = ["AIDS","CSE","CSE(AI)","CSE(AIML)","CSE(DS)","CSE(IOT_CYBER)","CSE(SE)","DESH","ENTC","INSTRU","IT","MECH"];
const YEARS        = [1, 2, 3, 4];

// Official VIT Pune syllabus fallback (used if API is offline)
const SYLLABUS_FALLBACK: Record<string, Record<number, any[]>> = {
  "CSE": {
    2: [
      { code: "CS2301", name: "Data Structures", credits: 4 },
      { code: "CS2302", name: "Discrete Mathematics", credits: 4 },
      { code: "CS2303", name: "Digital Electronics and Microprocessor", credits: 4 },
      { code: "CS2304", name: "Object Oriented Programming", credits: 4 },
      { code: "CS2305", name: "Database Management Systems", credits: 4 },
      { code: "CS2306", name: "Operating Systems", credits: 4 },
      { code: "HS2001", name: "Reasoning and Aptitude Development", credits: 2 },
      { code: "HS2002", name: "From Campus to Corporate", credits: 2 },
    ],
    3: [
      { code: "CS3301", name: "Design and Analysis of Algorithms", credits: 4 },
      { code: "CS3302", name: "Computer Networks", credits: 4 },
      { code: "CS3303", name: "Software Engineering and Project Management", credits: 4 },
      { code: "CS3304", name: "Theory of Computation", credits: 4 },
      { code: "CS3305", name: "Machine Learning", credits: 4 },
      { code: "CS3306", name: "Web Technologies", credits: 4 },
      { code: "SH3001", name: "Reasoning and Aptitude Development", credits: 2 },
    ],
    4: [
      { code: "CS4301", name: "Cloud Computing", credits: 4 },
      { code: "CS4302", name: "Cyber Security", credits: 4 },
      { code: "CS4207", name: "Major Project", credits: 8 },
      { code: "CS4211", name: "Industry Internship", credits: 6 },
    ],
  },
  "AIDS": {
    2: [
      { code: "AD2301", name: "Data Structures and Algorithms", credits: 4 },
      { code: "AD2302", name: "Database Management Systems", credits: 4 },
      { code: "AD2303", name: "Probability and Statistics", credits: 4 },
      { code: "AD2304", name: "Python Programming for Data Science", credits: 4 },
      { code: "AD2305", name: "Digital Electronics and Computer Organisation", credits: 4 },
      { code: "AD2306", name: "Object Oriented Programming", credits: 4 },
    ],
    3: [
      { code: "AD3301", name: "Machine Learning", credits: 4 },
      { code: "AD3302", name: "Big Data Analytics", credits: 4 },
      { code: "AD3303", name: "Artificial Intelligence", credits: 4 },
      { code: "AD3304", name: "Data Warehousing and Mining", credits: 4 },
      { code: "AD3306", name: "Natural Language Processing", credits: 4 },
      { code: "AD3307", name: "Deep Learning", credits: 4 },
    ],
    4: [
      { code: "AD4301", name: "Reinforcement Learning", credits: 4 },
      { code: "AD4302", name: "Computer Vision", credits: 4 },
      { code: "AD4303", name: "Business Intelligence and Data Visualisation", credits: 4 },
      { code: "AD4207", name: "Major Project", credits: 8 },
    ],
  },
  "IT": {
    2: [
      { code: "IT2301", name: "Data Structures", credits: 4 },
      { code: "IT2303", name: "Digital Electronics and Microprocessor", credits: 4 },
      { code: "IT2304", name: "Discrete Mathematics", credits: 4 },
      { code: "IT2305", name: "Operating Systems", credits: 4 },
      { code: "IT2306", name: "Database Management Systems", credits: 4 },
      { code: "IT2307", name: "Software Engineering and Project Management", credits: 4 },
      { code: "IT2308", name: "Automata Theory", credits: 4 },
    ],
    3: [
      { code: "IT3215", name: "Design and Analysis of Algorithms", credits: 4 },
      { code: "IT3218", name: "Artificial Intelligence", credits: 4 },
      { code: "IT3216", name: "Machine Learning and Deep Learning", credits: 4 },
      { code: "IT3229", name: "Cloud Computing", credits: 4 },
      { code: "IT3203", name: "Image Processing and Computer Vision", credits: 4 },
    ],
    4: [
      { code: "IT4218", name: "Network Security", credits: 4 },
      { code: "IT4263", name: "Responsible and Safe AI Systems", credits: 3 },
      { code: "IT4207", name: "Major Project", credits: 8 },
      { code: "IT4257", name: "Industry Internship", credits: 6 },
    ],
  },
};

export default function SyllabusPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [branch,   setBranch]   = useState("CSE");
  const [year,     setYear]     = useState(3);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");
  const [editing,  setEditing]  = useState<string | null>(null);
  const [newSubj,  setNewSubj]  = useState({ code: "", name: "", credits: 4 });
  const [showAdd,  setShowAdd]  = useState(false);
  const [source,   setSource]   = useState<"official"|"custom"|"fallback">("official");

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=department"); return; }
  }, []);

  useEffect(() => {
    loadSyllabus();
  }, [branch, year]);

  const loadSyllabus = async () => {
    setLoading(true); setError(""); setSaved(false);
    try {
      const r = await api.get(`/dept/syllabus/${encodeURIComponent(branch)}/${year}`);
      setSubjects(r.data.subjects || []);
      setSource(r.data.source || "official");
    } catch {
      // Use fallback data if API not available
      const fb = SYLLABUS_FALLBACK[branch]?.[year] || [];
      setSubjects(fb);
      setSource("fallback");
    } finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      await api.put(`/dept/syllabus/${encodeURIComponent(branch)}/${year}`, { subjects });
      setSaved(true);
      setSource("custom");
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  const addSubject = () => {
    if (!newSubj.code || !newSubj.name) return;
    setSubjects((p) => [...p, { ...newSubj }]);
    setNewSubj({ code: "", name: "", credits: 4 });
    setShowAdd(false);
  };

  const removeSubject = (code: string) => setSubjects((p) => p.filter((s) => s.code !== code));

  const updateSubject = (code: string, field: string, value: any) => {
    setSubjects((p) => p.map((s) => s.code === code ? { ...s, [field]: value } : s));
  };

  const totalCredits = subjects.reduce((sum, s) => sum + (parseInt(s.credits) || 0), 0);

  return (
    <DashboardLayout navItems={NAV} portalLabel="Department Portal" portalColor="#10b981">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Syllabus Manager
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              VIT Pune official curriculum · AY 2025–26
              {source === "custom" && <span className="ml-2 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Customised</span>}
              {source === "official" && <span className="ml-2 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Official</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                <CheckCircle size={15} /> Saved!
              </div>
            )}
            <button onClick={save} disabled={saving || loading}
              className="btn-primary py-2.5 px-5 text-sm disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}>
              {saving ? <><Loader2 size={15} className="animate-spin" />Saving…</> : <><Save size={15} />Save Changes</>}
            </button>
          </div>
        </div>

        {/* Selectors */}
        <div className="glass-card rounded-2xl p-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Branch</label>
              <div className="relative">
                <select value={branch} onChange={(e) => setBranch(e.target.value)}
                  className="form-input appearance-none cursor-pointer pr-10">
                  {VIT_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="form-label">Academic Year</label>
              <div className="flex gap-2">
                {YEARS.map((y) => (
                  <button key={y} onClick={() => setYear(y)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${year === y ? "text-white border-emerald-500" : "glass-light text-slate-400 border-white/5 hover:text-white"}`}
                    style={year === y ? { background: "rgba(16,185,129,0.2)" } : {}}>
                    Y{y}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats row */}
          {subjects.length > 0 && (
            <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
              <div className="text-center">
                <p className="text-2xl font-black text-white">{subjects.length}</p>
                <p className="text-slate-500 text-xs">Subjects</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-white">{totalCredits}</p>
                <p className="text-slate-500 text-xs">Total Credits</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-white">{branch}</p>
                <p className="text-slate-500 text-xs">Branch</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={15} />{error}
          </div>
        )}

        {/* Subjects list */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-white font-bold flex items-center gap-2">
              <GraduationCap size={16} className="text-emerald-400" />
              {branch} — Year {year} Subjects
            </h2>
            <button onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>
              <Plus size={12} />Add Subject
            </button>
          </div>

          {/* Add row */}
          {showAdd && (
            <div className="px-5 py-4 border-b border-white/5 glass-light">
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-2">
                  <label className="form-label text-xs">Code</label>
                  <input value={newSubj.code} onChange={(e) => setNewSubj((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className="form-input py-2 text-sm" placeholder="CS3308" />
                </div>
                <div className="col-span-7">
                  <label className="form-label text-xs">Subject Name</label>
                  <input value={newSubj.name} onChange={(e) => setNewSubj((p) => ({ ...p, name: e.target.value }))}
                    className="form-input py-2 text-sm" placeholder="e.g. Advanced Machine Learning" />
                </div>
                <div className="col-span-2">
                  <label className="form-label text-xs">Credits</label>
                  <input type="number" value={newSubj.credits} onChange={(e) => setNewSubj((p) => ({ ...p, credits: parseInt(e.target.value) }))}
                    className="form-input py-2 text-sm" min={1} max={8} />
                </div>
                <div className="col-span-1">
                  <button onClick={addSubject} className="w-full py-2 rounded-xl text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#059669,#10b981)" }}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="text-emerald-400 animate-spin" /></div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
              <p>No subjects found for this branch/year.</p>
              <button onClick={() => setShowAdd(true)} className="text-emerald-400 text-sm mt-2 hover:underline">Add the first subject</button>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-3 px-5 py-3 text-xs text-slate-600 uppercase tracking-wider font-semibold border-b border-white/5">
                <div className="col-span-2">Code</div>
                <div className="col-span-7">Subject Name</div>
                <div className="col-span-2 text-center">Credits</div>
                <div className="col-span-1"></div>
              </div>

              {subjects.map((subj, i) => (
                <div key={subj.code || i}
                  className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center border-b border-white/4 hover:bg-white/2 transition-colors ${editing === subj.code ? "bg-white/3" : ""}`}>
                  <div className="col-span-2">
                    {editing === subj.code ? (
                      <input value={subj.code} onChange={(e) => updateSubject(subj.code, "code", e.target.value)}
                        className="form-input py-1.5 text-xs w-full" />
                    ) : (
                      <span className="text-indigo-400 font-mono text-xs font-bold">{subj.code}</span>
                    )}
                  </div>
                  <div className="col-span-7">
                    {editing === subj.code ? (
                      <input value={subj.name} onChange={(e) => updateSubject(subj.code, "name", e.target.value)}
                        className="form-input py-1.5 text-sm w-full" />
                    ) : (
                      <span className="text-slate-200 text-sm">{subj.name}</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    {editing === subj.code ? (
                      <input type="number" value={subj.credits} onChange={(e) => updateSubject(subj.code, "credits", parseInt(e.target.value))}
                        className="form-input py-1.5 text-xs w-full text-center" min={1} max={8} />
                    ) : (
                      <span className="text-slate-400 text-sm font-semibold">{subj.credits} cr</span>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button onClick={() => setEditing(editing === subj.code ? null : subj.code)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => removeSubject(subj.code)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Footer total */}
              <div className="grid grid-cols-12 gap-3 px-5 py-4 bg-white/2">
                <div className="col-span-9 text-slate-500 text-sm font-semibold">Total Credits</div>
                <div className="col-span-2 text-center text-white font-black">{totalCredits}</div>
              </div>
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="glass-light rounded-xl p-4 flex items-start gap-3 border border-white/5">
          <FileText size={15} className="text-slateald-500 shrink-0 mt-0.5" />
          <p className="text-slate-500 text-xs leading-relaxed">
            Syllabus data is pre-loaded from official VIT Pune curriculum documents (AY 2025–26).
            Edits are saved per-department and override the official data only for your portal.
            First Year subjects are managed under the DESH department.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}