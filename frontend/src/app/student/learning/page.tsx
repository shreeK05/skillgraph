"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, User, Camera, BookOpen, Briefcase, Star,
  Loader2, Map, Target, CheckCircle, ArrowRight, TrendingUp,
  Code2, Zap, ExternalLink, Lock, Clock
} from "lucide-react";

const NAV = [
  { label: "Dashboard",       href: "/student/dashboard",  icon: LayoutDashboard },
  { label: "My Profile",      href: "/student/profile",    icon: User },
  { label: "Interview Coach", href: "/student/interview",  icon: Camera },
  { label: "Learning Path",   href: "/student/learning",   icon: BookOpen },
  { label: "Job Drives",      href: "/student/jobs",       icon: Briefcase },
  { label: "Portfolio",       href: "/student/portfolio",  icon: Star },
];

const CAREER_PATHS = [
  { id: "sde",      label: "Software Engineer",   color: "#6366f1", icon: "💻" },
  { id: "ml",       label: "ML / AI Engineer",    color: "#8b5cf6", icon: "🤖" },
  { id: "data",     label: "Data Engineer",        color: "#10b981", icon: "📊" },
  { id: "devops",   label: "DevOps / Cloud",       color: "#f59e0b", icon: "☁️" },
  { id: "frontend", label: "Frontend Engineer",    color: "#06b6d4", icon: "🎨" },
  { id: "pm",       label: "Product Manager",      color: "#ec4899", icon: "📱" },
];

const DEFAULT_PATHS: Record<string, { phase: string; duration: string; skills: string[]; resources: { name: string; url: string; type: string }[]; }[]> = {
  sde: [
    { phase: "Foundation", duration: "2-3 weeks", skills: ["Data Structures", "Algorithms", "Time Complexity"], resources: [{ name: "LeetCode Patterns", url: "https://leetcode.com", type: "Practice" }, { name: "NeetCode 150", url: "https://neetcode.io", type: "Video" }] },
    { phase: "Systems", duration: "3-4 weeks", skills: ["Operating Systems", "Computer Networks", "Databases"], resources: [{ name: "CS50 Harvard", url: "https://cs50.harvard.edu", type: "Course" }] },
    { phase: "Backend", duration: "4-6 weeks", skills: ["FastAPI / Node.js", "REST APIs", "SQL / NoSQL"], resources: [{ name: "FastAPI Docs", url: "https://fastapi.tiangolo.com", type: "Docs" }] },
    { phase: "System Design", duration: "4-6 weeks", skills: ["HLD / LLD", "Scalability", "CAP Theorem"], resources: [{ name: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", type: "GitHub" }] },
  ],
  ml: [
    { phase: "Python & Math", duration: "2-3 weeks", skills: ["Python", "NumPy", "Linear Algebra", "Statistics"], resources: [{ name: "3Blue1Brown Linear Algebra", url: "https://www.3blue1brown.com", type: "Video" }] },
    { phase: "Classical ML", duration: "4-5 weeks", skills: ["Scikit-Learn", "Regression", "Classification", "Clustering"], resources: [{ name: "Coursera ML by Andrew Ng", url: "https://coursera.org", type: "Course" }] },
    { phase: "Deep Learning", duration: "5-6 weeks", skills: ["PyTorch", "Neural Networks", "CNNs", "Transformers"], resources: [{ name: "fast.ai", url: "https://fast.ai", type: "Course" }] },
    { phase: "LLMs & GenAI", duration: "3-4 weeks", skills: ["LangChain", "RAG", "Fine-tuning", "Prompt Engineering"], resources: [{ name: "LangChain Docs", url: "https://python.langchain.com", type: "Docs" }] },
  ],
  data: [
    { phase: "SQL Mastery", duration: "2-3 weeks", skills: ["SQL", "Window Functions", "Query Optimization"], resources: [{ name: "Mode SQL Tutorial", url: "https://mode.com/sql-tutorial", type: "Course" }] },
    { phase: "Python for Data", duration: "3-4 weeks", skills: ["Pandas", "NumPy", "Matplotlib", "Seaborn"], resources: [{ name: "Kaggle Python", url: "https://kaggle.com/learn", type: "Course" }] },
    { phase: "Data Pipelines", duration: "4-5 weeks", skills: ["Airflow", "dbt", "Spark", "Kafka"], resources: [{ name: "Airflow Docs", url: "https://airflow.apache.org", type: "Docs" }] },
    { phase: "Cloud & Warehouses", duration: "3-4 weeks", skills: ["BigQuery", "Redshift", "Snowflake", "AWS"], resources: [{ name: "Google BigQuery", url: "https://cloud.google.com/bigquery", type: "Docs" }] },
  ],
  devops: [
    { phase: "Linux & Scripting", duration: "2-3 weeks", skills: ["Linux", "Bash", "Python scripting"], resources: [{ name: "Linux Journey", url: "https://linuxjourney.com", type: "Course" }] },
    { phase: "Containers", duration: "3-4 weeks", skills: ["Docker", "Docker Compose", "Container Registries"], resources: [{ name: "Docker Docs", url: "https://docs.docker.com", type: "Docs" }] },
    { phase: "Kubernetes & CI/CD", duration: "4-5 weeks", skills: ["Kubernetes", "Helm", "GitHub Actions", "Jenkins"], resources: [{ name: "Kubernetes.io", url: "https://kubernetes.io/docs", type: "Docs" }] },
    { phase: "Cloud (AWS/GCP)", duration: "4-5 weeks", skills: ["AWS", "IAM", "EC2", "S3", "Lambda"], resources: [{ name: "AWS Free Tier", url: "https://aws.amazon.com/free", type: "Platform" }] },
  ],
  frontend: [
    { phase: "HTML/CSS/JS", duration: "2-3 weeks", skills: ["HTML5", "CSS3", "ES6+", "Flexbox/Grid"], resources: [{ name: "MDN Web Docs", url: "https://developer.mozilla.org", type: "Docs" }] },
    { phase: "React Mastery", duration: "4-5 weeks", skills: ["React.js", "Hooks", "Context API", "React Router"], resources: [{ name: "React Official Docs", url: "https://react.dev", type: "Docs" }] },
    { phase: "Next.js & TypeScript", duration: "3-4 weeks", skills: ["Next.js", "TypeScript", "SSR/SSG", "API Routes"], resources: [{ name: "Next.js Docs", url: "https://nextjs.org/docs", type: "Docs" }] },
    { phase: "Performance & Testing", duration: "2-3 weeks", skills: ["Web Vitals", "Jest", "Cypress", "Lighthouse"], resources: [{ name: "web.dev", url: "https://web.dev", type: "Docs" }] },
  ],
  pm: [
    { phase: "PM Basics", duration: "2-3 weeks", skills: ["Product Thinking", "User Stories", "PRDs", "Roadmaps"], resources: [{ name: "Product School", url: "https://productschool.com", type: "Course" }] },
    { phase: "Analytics", duration: "3-4 weeks", skills: ["SQL", "Google Analytics", "Mixpanel", "A/B Testing"], resources: [{ name: "Mode Analytics", url: "https://mode.com", type: "Platform" }] },
    { phase: "Design Thinking", duration: "2-3 weeks", skills: ["Figma", "UX Research", "Wireframing", "User Interviews"], resources: [{ name: "Figma", url: "https://figma.com", type: "Tool" }] },
    { phase: "Go-to-Market", duration: "2-3 weeks", skills: ["Market Analysis", "OKRs", "Stakeholder Management"], resources: [{ name: "Lenny's Newsletter", url: "https://www.lennysnewsletter.com", type: "Newsletter" }] },
  ],
};

const TYPE_COLOR: Record<string, string> = {
  Course: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  Video: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  Docs: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  Practice: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  GitHub: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  Platform: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  Newsletter: "bg-pink-500/15 text-pink-400 border-pink-500/25",
  Tool: "bg-orange-500/15 text-orange-400 border-orange-500/25",
};

export default function LearningPathPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedPath, setSelectedPath] = useState("sde");
  const [loading,       setLoading]     = useState(false);
  const [aiPath,        setAiPath]      = useState<any[]|null>(null);
  const [completed,     setCompleted]   = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login?role=student");
  }, []);

  const loadAiPath = async () => {
    setLoading(true);
    const toastId = toast.loading("Analyzing Graph Database...");
    try {
      const r = await api.get(`/student/learning-path?career=${selectedPath}`);
      if (r.data?.phases) {
        setAiPath(r.data.phases);
        toast.success(r.data.message || "AI Path generated!", { id: toastId });
      } else {
        toast.error("Failed to generate AI path.", { id: toastId });
      }
    } catch {
      setAiPath(null); // fallback to default
      toast.error("Using default path due to server error.", { id: toastId });
    } finally { setLoading(false); }
  };

  const phases = (aiPath || DEFAULT_PATHS[selectedPath]) ?? [];
  const totalSkills = phases.reduce((s, p) => s + p.skills.length, 0);
  const completedCount = phases.reduce((s, p) => s + p.skills.filter((sk: string) => completed.has(sk)).length, 0);
  const progress = totalSkills > 0 ? Math.round((completedCount / totalSkills) * 100) : 0;

  const toggleSkill = (sk: string) =>
    setCompleted((prev) => { const n = new Set(prev); n.has(sk) ? n.delete(sk) : n.add(sk); return n; });

  const activePath = CAREER_PATHS.find((p) => p.id === selectedPath)!;

  return (
    <DashboardLayout navItems={NAV} portalLabel="Student Portal" portalColor="#6366f1">
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>AI Learning Path</h1>
          <p className="text-slate-400 text-sm mt-1">Personalized roadmap for your target career based on your skills</p>
        </div>

        {/* Career selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CAREER_PATHS.map((path) => (
            <button key={path.id} onClick={() => { setSelectedPath(path.id); setAiPath(null); }}
              className={`p-3.5 rounded-2xl border text-center transition-all font-semibold text-xs ${
                selectedPath === path.id ? "text-white border-opacity-60" : "glass-light text-slate-400 border-white/5 hover:border-white/15 hover:text-white"
              }`}
              style={selectedPath === path.id ? { borderColor: path.color + "60", background: path.color + "18" } : {}}
            >
              <div className="text-2xl mb-1">{path.icon}</div>
              {path.label}
            </button>
          ))}
        </div>

        {/* AI button + progress */}
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={loadAiPath} disabled={loading}
            className="btn-primary text-sm py-2.5 px-5 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg,${activePath.color}cc,${activePath.color}88)` }}
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Generating AI Path…</> : <><Zap size={15} /> Generate AI Path for Me</>}
          </button>
          {aiPath && <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-semibold flex items-center gap-1"><Zap size={10} /> AI Personalised</span>}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-slate-400 text-sm">{completedCount}/{totalSkills} skills completed</span>
            <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: activePath.color }} />
            </div>
            <span className="text-white font-bold text-sm">{progress}%</span>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin" style={{ color: activePath.color }} /></div>
          ) : phases.map((phase, i) => {
            const phaseCompleted = phase.skills.filter((s: string) => completed.has(s)).length;
            const phaseDone = phaseCompleted === phase.skills.length;
            return (
              <div key={i} className="glass-card rounded-2xl overflow-hidden">
                {/* Phase header */}
                <div className="p-5 flex items-center gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm shrink-0"
                    style={{ background: phaseDone ? "#10b981" : `${activePath.color}40`, border: `2px solid ${phaseDone ? "#10b981" : activePath.color}` }}>
                    {phaseDone ? <CheckCircle size={18} /> : i + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{phase.phase || phase.title}</h3>
                    {phase.duration && <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1.5"><Clock size={11} />{phase.duration}</p>}
                    {phase.desc && <p className="text-slate-500 text-xs mt-0.5">{phase.desc}</p>}
                  </div>
                  <span className="text-sm font-bold" style={{ color: activePath.color }}>{phaseCompleted}/{phase.skills?.length || 0}</span>
                </div>

                <div className="p-5 grid md:grid-cols-2 gap-5">
                  {/* Skills */}
                  <div>
                    <p className="form-label">{aiPath ? "Missing Skills (Graph DB)" : "Skills to Master"}</p>
                    <div className="space-y-2">
                      {(phase.skills || []).map((skill: string) => {
                        const done = completed.has(skill);
                        return (
                          <button key={skill} onClick={() => toggleSkill(skill)}
                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${done ? "glass-light" : "hover:glass-light"}`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}>
                              {done && <CheckCircle size={11} className="text-white" />}
                            </div>
                            <span className={`text-sm font-medium ${done ? "line-through text-slate-500" : "text-slate-200"}`}>{skill}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Resources (Optional if AI generated) */}
                  {(phase.resources && phase.resources.length > 0) && (
                    <div>
                      <p className="form-label">Learning Resources</p>
                      <div className="space-y-2">
                        {phase.resources.map((res: any, ri: number) => (
                          <a key={ri} href={res.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 rounded-xl glass-light hover:border-white/15 border border-white/5 transition-all group"
                          >
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TYPE_COLOR[res.type] || TYPE_COLOR.Course}`}>{res.type}</span>
                            <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{res.name}</span>
                            <ExternalLink size={12} className="ml-auto text-slate-600 group-hover:text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-slate-900">
                  <div className="h-full transition-all" style={{ width: `${(phase.skills || []).length > 0 ? (phaseCompleted/(phase.skills || []).length)*100 : 0}%`, background: activePath.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}