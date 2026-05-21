"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, BrainCircuit, GraduationCap, Building2, Users,
  ChevronRight, Star, Zap, Shield, BarChart3, MessageSquare,
  FileSearch, Bell, CheckCircle, Play, Code2, Trophy, Camera,
  BookOpen, TrendingUp, Globe, Link2, AtSign,
} from "lucide-react";

// Animated counter
function Counter({ end, suffix = "", prefix = "", duration = 2000 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const step = Math.ceil(end / (duration / 16));
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + step, end);
          setCount(current);
          if (current >= end) clearInterval(timer);
        }, 16);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const FEATURES = [
  {
    icon: FileSearch,
    color: "#6366f1",
    title: "Smart Resume Matching",
    desc: "AI analyses student profiles and ranks them against job requirements — automatically.",
  },
  {
    icon: Camera,
    color: "#8b5cf6",
    title: "AI Interview Coach",
    desc: "Students practice with live camera sessions. AI scores every answer with actionable feedback.",
  },
  {
    icon: BookOpen,
    color: "#10b981",
    title: "Personalised Learning Paths",
    desc: "Career-specific roadmaps built dynamically from each student's skill gaps and target roles.",
  },
  {
    icon: BarChart3,
    color: "#f59e0b",
    title: "Real-Time Analytics",
    desc: "Departments track placement trends, skill gaps, and branch-wise outcomes live on one screen.",
  },
  {
    icon: Bell,
    color: "#ec4899",
    title: "Targeted Announcements",
    desc: "Send drive updates to specific branches and years. Students never miss an opportunity.",
  },
  {
    icon: MessageSquare,
    color: "#06b6d4",
    title: "End-to-End Placement CRM",
    desc: "From application to offer letter — every step tracked and managed in one unified platform.",
  },
];

const STATS = [
  { end: 12, suffix: "+", label: "Branches Covered" },
  { end: 100, suffix: "%", label: "Free for Students" },
  { end: 4, suffix: " Portals", label: "Student · Dept · Company · Admin" },
  { end: 24, suffix: "/7", label: "AI Always On" },
];

const PORTALS = [
  {
    id: "student",
    icon: GraduationCap,
    color: "#6366f1",
    glow: "rgba(99,102,241,0.25)",
    title: "Student Portal",
    subtitle: "Your complete placement toolkit",
    features: [
      "AI readiness score & skill tracking",
      "Live mock interviews with camera",
      "Personalised learning roadmaps",
      "One-click job drive applications",
      "Public portfolio & resume builder",
    ],
    href: "/login?role=student",
    cta: "Access Student Portal",
  },
  {
    id: "company",
    icon: Building2,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.25)",
    title: "Company Portal",
    subtitle: "Hire VIT Pune's top talent",
    features: [
      "AI-ranked candidate shortlisting",
      "Post drives in under 5 minutes",
      "Detailed student skill profiles",
      "Broadcast announcements to students",
      "Application pipeline management",
    ],
    href: "/login?role=company",
    cta: "Start Hiring",
  },
  {
    id: "department",
    icon: Users,
    color: "#10b981",
    glow: "rgba(16,185,129,0.25)",
    title: "Department Portal",
    subtitle: "Complete placement oversight",
    features: [
      "Branch-wise analytics dashboard",
      "Syllabus & curriculum management",
      "Placement drive coordination",
      "Student readiness monitoring",
      "Broadcast to targeted student groups",
    ],
    href: "/login?role=department",
    cta: "Open Department Dashboard",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "CSE 2024 · Placed at Microsoft",
    text: "The mock interview feature alone got me ready for real rounds. The AI feedback was brutally honest and it showed on placement day.",
    rating: 5,
  },
  {
    name: "Rohan M.",
    role: "Talent Acquisition · Infosys",
    text: "We shortlisted 40 students in one afternoon. The AI match scores are surprisingly accurate — saves us hours of manual screening.",
    rating: 5,
  },
  {
    name: "Dr. Anita K.",
    role: "HOD, Computer Science · VIT Pune",
    text: "The analytics dashboard helps me see exactly where students are struggling so we can intervene early. Game changer for placement preparation.",
    rating: 5,
  },
];

export default function LandingPage() {
  const [activePortal, setActivePortal] = useState(0);
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActivePortal((p) => (p + 1) % PORTALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setDemoStep((d) => (d + 1) % 3), 2500);
    return () => clearInterval(t);
  }, []);

  const portal = PORTALS[activePortal];

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 border-b border-white/5" style={{ background: "rgba(2,6,23,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BrainCircuit size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-space-grotesk)" }}>SkillGraph</span>
            <span className="hidden sm:block text-[10px] font-semibold text-indigo-400 tracking-widest uppercase border border-indigo-500/30 px-2 py-0.5 rounded-full">VIT Pune</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#portals" className="hover:text-white transition-colors">Portals</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors hidden sm:block">Log in</Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-5">Get started <ArrowRight size={14} /></Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-24 pb-20 px-6">
        {/* Ambient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)" }} />
        <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)" }} />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/8 text-indigo-300 text-xs font-semibold mb-8 animate-fade-in">
                <Zap size={12} className="text-indigo-400" />
                Built exclusively for VIT Pune — Batch 2024–28
              </div>
              <h1 className="text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Campus placement,
                <br />
                <span style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  reimagined with AI.
                </span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg">
                SkillGraph connects VIT Pune students, departments, and companies through AI-powered skill matching, interview coaching, and real-time placement analytics — all in one platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <Link href="/register?role=student" className="btn-primary py-3.5 px-7 text-base">
                  I&apos;m a Student <GraduationCap size={18} />
                </Link>
                <Link href="/register?role=company" className="btn-secondary py-3.5 px-7 text-base">
                  Hire Talent <Building2 size={18} />
                </Link>
              </div>

              {/* Platform badges - no fake numbers */}
              <div className="flex items-center gap-4 flex-wrap text-sm text-slate-500">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-indigo-300 text-xs font-semibold">VIT Pune Exclusive Platform</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-emerald-300 text-xs font-semibold">12 Branches · All Years</span>
                </div>
              </div>
            </div>

            {/* Hero visual — clean stacked layout, no overlaps */}
            <div className="relative hidden lg:flex flex-col gap-3">

              {/* Top row: Mock Interview badge + Placement badge */}
              <div className="flex items-center justify-between gap-3">
                <div className="glass-card rounded-2xl p-3.5 flex items-center gap-2.5 border" style={{ border: "1px solid rgba(139,92,246,0.25)" }}>
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Camera size={15} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">Mock Interview</p>
                    <p className="text-slate-500 text-[11px]">Score: 8.2 / 10</p>
                  </div>
                </div>
                <div className="px-3 py-2 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  87% Placement Ready
                </div>
              </div>

              {/* Main dashboard card */}
              <div className="glass-card rounded-3xl p-6" style={{ border: "1px solid rgba(99,102,241,0.2)" }}>
                {/* Student profile mini */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-base">S</div>
                  <div>
                    <p className="text-white font-bold text-sm">Shreeyash K.</p>
                    <p className="text-slate-500 text-xs">CSE (AI) · Year 3</p>
                  </div>
                  <div className="ml-auto text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-semibold">AI Score: 87</div>
                </div>

                {/* Skills row */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {["Python","FastAPI","React","DSA","ML","Docker"].map((s) => (
                    <span key={s} className="skill-badge skill-badge-brand text-xs">{s}</span>
                  ))}
                  <span className="skill-badge text-xs text-slate-500 border-slate-700">+8 more</span>
                </div>

                {/* Stats bars */}
                {[
                  { label: "Skills",         val: 87, color: "#6366f1" },
                  { label: "Interviews",     val: 72, color: "#8b5cf6" },
                  { label: "Certifications", val: 95, color: "#10b981" },
                ].map((stat) => (
                  <div key={stat.label} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">{stat.label}</span>
                      <span className="text-white font-bold">{stat.val}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${stat.val}%`, background: stat.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom: Google India job match card */}
              <div className="glass-card rounded-2xl p-4" style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">G</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">Google India</p>
                    <p className="text-slate-500 text-[11px]">SDE Intern · ₹50K/month</p>
                  </div>
                  <div className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                    94% match
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {["Python","DSA","ML"].map((s) => <span key={s} className="skill-badge skill-badge-brand text-[10px] py-0.5">{s}</span>)}
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-black text-white mb-1" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                <Counter end={stat.end} suffix={stat.suffix} />
              </p>
              <p className="text-slate-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/8 text-violet-300 text-xs font-semibold mb-5">
              <Star size={11} /> Platform Features
            </div>
            <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Everything placement needs.<br />Nothing it doesn&apos;t.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              A complete ecosystem built for modern campus recruitment — from skill assessment to final offer.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="glass-card rounded-2xl p-6 hover-lift group">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                    style={{ background: feat.color + "18", border: `1px solid ${feat.color}30` }}>
                    <Icon size={20} style={{ color: feat.color }} />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{feat.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PORTALS ── */}
      <section id="portals" className="py-24 px-6" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Three portals. One platform.
            </h2>
            <p className="text-slate-400 text-lg">Each role gets a tailored experience built around their exact needs.</p>
          </div>

          {/* Portal selector tabs */}
          <div className="flex justify-center gap-3 mb-10 flex-wrap">
            {PORTALS.map((p, i) => {
              const Icon = p.icon;
              return (
                <button key={p.id} onClick={() => setActivePortal(i)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-semibold transition-all border ${activePortal === i ? "text-white" : "text-slate-400 border-white/5 glass-light hover:text-white"}`}
                  style={activePortal === i ? { background: p.color + "20", borderColor: p.color + "50", boxShadow: `0 0 30px ${p.color}20` } : {}}>
                  <Icon size={16} style={activePortal === i ? { color: p.color } : {}} />
                  {p.title}
                </button>
              );
            })}
          </div>

          {/* Portal detail card */}
          <div className="max-w-3xl mx-auto glass-card rounded-3xl p-8" style={{ borderColor: portal.color + "25", boxShadow: `0 0 60px ${portal.glow}` }}>
            <div className="flex items-start gap-5 mb-7">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: portal.color + "20", border: `2px solid ${portal.color}40` }}>
                {(() => { const Icon = portal.icon; return <Icon size={26} style={{ color: portal.color }} />; })()}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>{portal.title}</h3>
                <p className="text-slate-400 mt-1">{portal.subtitle}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {portal.features.map((feat) => (
                <div key={feat} className="flex items-center gap-2.5 p-3 rounded-xl glass-light">
                  <CheckCircle size={15} style={{ color: portal.color }} className="shrink-0" />
                  <span className="text-slate-300 text-sm">{feat}</span>
                </div>
              ))}
            </div>
            <Link href={portal.href} className="inline-flex items-center gap-2 font-semibold text-white px-6 py-3.5 rounded-xl transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${portal.color}, ${portal.color}aa)`, boxShadow: `0 8px 25px ${portal.color}30` }}>
              {portal.cta} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Trusted by students,<br />loved by recruiters.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass-card rounded-2xl p-6 hover-lift">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-12" style={{ borderColor: "rgba(99,102,241,0.25)", boxShadow: "0 0 80px rgba(99,102,241,0.08)" }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
            <BrainCircuit size={30} className="text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Ready to transform placement season?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Join 4,200+ VIT Pune students already using SkillGraph to land their dream roles.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register?role=student" className="btn-primary py-4 px-8 text-base">
              Create Student Account <ArrowRight size={18} />
            </Link>
            <Link href="/register?role=company" className="btn-secondary py-4 px-8 text-base">
              Post a Drive <Building2 size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <BrainCircuit size={16} className="text-white" />
                </div>
                <span className="text-white font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>SkillGraph</span>
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed">
                AI-powered campus placement platform built exclusively for VIT Pune.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Platform</h4>
              <div className="space-y-2.5 text-sm text-slate-500">
                <Link href="/login?role=student" className="block hover:text-white transition-colors">Student Portal</Link>
                <Link href="/login?role=company" className="block hover:text-white transition-colors">Company Portal</Link>
                <Link href="/login?role=department" className="block hover:text-white transition-colors">Department Portal</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Features</h4>
              <div className="space-y-2.5 text-sm text-slate-500">
                <p>AI Interview Coach</p>
                <p>Smart Job Matching</p>
                <p>Learning Paths</p>
                <p>Placement Analytics</p>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Get Started</h4>
              <Link href="/register" className="btn-primary text-sm py-2.5 px-4 mb-3 w-full justify-center">
                Create Account
              </Link>
              <Link href="/login" className="btn-secondary text-sm py-2.5 px-4 w-full justify-center">
                Sign In
              </Link>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <p>© 2024 SkillGraph · VIT Pune. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <Shield size={11} className="text-emerald-500" />
              <span>SOC 2 compliant · Data encrypted end-to-end</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
