"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, User, Camera, BookOpen, Briefcase, Star,
  Globe, Award, Trophy, ExternalLink,
  Code2, CheckCircle, Loader2, Share2, Copy, Link2, GitBranch,
} from "lucide-react";

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

export default function PortfolioPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [certs,   setCerts]   = useState<any[]>([]);
  const [hacks,   setHacks]   = useState<any[]>([]);
  const [skills,  setSkills]  = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=student"); return; }
    Promise.all([
      api.get("/student/profile"),
      api.get("/student/certifications"),
      api.get("/student/hackathons"),
    ]).then(([pr, cr, hr]) => {
      setProfile(pr.data.profile || {});
      setSkills((pr.data.extracted_skills || []).map((s: any) => s.canonical || s.name || s));
      setCerts(cr.data || []);
      setHacks(hr.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const portfolioUrl = typeof window !== "undefined" ? `${window.location.origin}/p/${user?.id}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(portfolioUrl);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <DashboardLayout navItems={NAV} portalLabel="Student Portal" portalColor="#6366f1">
      <div className="flex justify-center h-64 items-center"><Loader2 size={28} className="text-indigo-400 animate-spin" /></div>
    </DashboardLayout>
  );

  const name   = profile?.full_name || user?.email?.split("@")[0] || "Student";
  const branch = profile?.branch || "VIT Pune";
  const year   = profile?.year_of_study;
  const cgpa   = profile?.cgpa;
  const readiness = profile?.readiness_score || 0;

  return (
    <DashboardLayout navItems={NAV} portalLabel="Student Portal" portalColor="#6366f1">
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>My Portfolio</h1>
            <p className="text-slate-400 text-sm mt-1">Your public placement profile — shareable with companies</p>
          </div>
          <button onClick={copyLink}
            className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2"
          >
            {copied ? <><CheckCircle size={14} className="text-emerald-400" /> Copied!</> : <><Share2 size={14} /> Share Link</>}
          </button>
        </div>

        {/* Hero card */}
        <div className="glass-card rounded-3xl p-8 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at top left, rgba(99,102,241,0.3), transparent 60%)" }} />

          <div className="relative flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shrink-0 relative"
              style={profile?.photo_url ? { backgroundImage: `url(${profile.photo_url})`, backgroundSize: "cover" } : { background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              {!profile?.photo_url && name[0]}
              {/* Readiness badge */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-2 border-[#0f172a] flex items-center justify-center text-white text-xs font-black">
                {readiness}
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-black text-white">{name}</h2>
              <p className="text-slate-400 text-sm mt-1">
                {branch}{year ? ` · Year ${year}` : ""}{cgpa ? ` · CGPA ${cgpa.toFixed(2)}` : ""}
              </p>
              {profile?.bio && <p className="text-slate-300 text-sm mt-3 leading-relaxed">{profile.bio}</p>}

              {/* Links */}
              <div className="flex items-center gap-3 mt-4">
                {profile?.github_url && (
                  <a href={profile.github_url} target="_blank" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs glass-light px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/15">
                    <Github size={13} /> GitHub
                  </a>
                )}
                {profile?.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs glass-light px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/15">
                    <Linkedin size={13} /> LinkedIn
                  </a>
                )}
                {profile?.portfolio_url && (
                  <a href={profile.portfolio_url} target="_blank" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs glass-light px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/15">
                    <Globe size={13} /> Website
                  </a>
                )}
              </div>
            </div>

            {/* Readiness ring */}
            <div className="hidden sm:block shrink-0 text-center">
              <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="6" />
                <circle cx="40" cy="40" r="32" fill="none" stroke="url(#pg)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2*Math.PI*32*(readiness/100)} ${2*Math.PI*32*(1-readiness/100)}`} />
                <defs><linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1"/><stop offset="100%" stopColor="#8b5cf6"/></linearGradient></defs>
              </svg>
              <p className="text-white font-black text-xl -mt-14 relative z-10">{readiness}%</p>
              <p className="text-slate-500 text-xs mt-8">AI Readiness</p>
            </div>
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Code2 size={16} className="text-indigo-400" /> Technical Skills</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="skill-badge skill-badge-brand">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certs.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Award size={16} className="text-amber-400" /> Certifications</h3>
            <div className="space-y-3">
              {certs.map((cert) => (
                <div key={cert.id} className="flex items-center gap-3 p-3 rounded-xl glass-light">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Award size={16} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{cert.name}</p>
                    <p className="text-slate-500 text-xs">{cert.issuer}{cert.issue_date ? ` · ${cert.issue_date}` : ""}</p>
                  </div>
                  {cert.credential_url && (
                    <a href={cert.credential_url} target="_blank" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hackathons */}
        {hacks.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Trophy size={16} className="text-violet-400" /> Hackathons & Competitions</h3>
            <div className="space-y-3">
              {hacks.map((hack) => (
                <div key={hack.id} className="flex items-start gap-3 p-3 rounded-xl glass-light">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Trophy size={16} className="text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{hack.event_name}</p>
                      {hack.position && <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">{hack.position}</span>}
                    </div>
                    {hack.description && <p className="text-slate-400 text-xs mt-1">{hack.description}</p>}
                    <p className="text-slate-600 text-xs mt-0.5">{hack.year}</p>
                  </div>
                  {hack.proof_url && (
                    <a href={hack.proof_url} target="_blank" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {skills.length === 0 && certs.length === 0 && hacks.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-600">
            <Star size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-base font-semibold text-slate-400">Your portfolio is empty</p>
            <p className="text-sm mt-1">Add skills, certifications and hackathons in your profile</p>
          </div>
        )}

        {/* Share CTA */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Share your portfolio</p>
            <p className="text-slate-500 text-xs mt-0.5 truncate">{portfolioUrl}</p>
          </div>
          <button onClick={copyLink} className="btn-primary text-xs py-2 px-4 shrink-0">
            {copied ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy Link</>}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}