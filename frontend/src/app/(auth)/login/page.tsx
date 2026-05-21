"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit, Eye, EyeOff, GraduationCap, Building2, Users,
  ArrowRight, Loader2, AlertCircle, AtSign, Lock, ShieldCheck,
  RotateCcw, CheckCircle,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth, getDashboardPath, type Role } from "@/lib/auth";

const ROLES = [
  { id: "STUDENT" as Role,    label: "Student",    icon: GraduationCap, color: "#6366f1", desc: "Access your AI placement dashboard" },
  { id: "DEPT_ADMIN" as Role, label: "Department", icon: Users,          color: "#10b981", desc: "College faculty & admin portal" },
  { id: "COMPANY" as Role,    label: "Company",    icon: Building2,      color: "#f59e0b", desc: "Hire VIT Pune talent" },
];

function OTPModal({ email, role, onSuccess, onClose }: { email: string; role: Role; onSuccess: () => void; onClose: () => void }) {
  const [otp, setOtp]       = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [resent, setResent]   = useState(false);
  const refs = Array.from({ length: 6 }, () => useState<HTMLInputElement | null>(null));

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    // Auto-focus next
    if (val && i < 5) {
      const nextEl = document.getElementById(`otp-${i + 1}`) as HTMLInputElement;
      nextEl?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      (document.getElementById(`otp-${i - 1}`) as HTMLInputElement)?.focus();
    }
  };

  const verify = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Enter all 6 digits"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/auth/verify-otp", { email, otp: code, role });
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Invalid OTP. Please try again.");
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try {
      await api.post("/auth/resend-otp", { email });
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="glass-card rounded-3xl p-8 w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 flex items-center justify-center mx-auto mb-5 border border-indigo-500/25">
          <ShieldCheck size={26} className="text-indigo-400" />
        </div>
        <h2 className="text-xl font-black text-white mb-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>Verify your email</h2>
        <p className="text-slate-400 text-sm mb-7">
          We sent a 6-digit code to <span className="text-white font-semibold">{email}</span>
        </p>

        <div className="flex gap-2 justify-center mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-12 text-center text-white font-bold text-lg rounded-xl border transition-all focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: digit ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.1)",
                boxShadow: digit ? "0 0 12px rgba(99,102,241,0.2)" : "none",
              }}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}
        {resent && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs mb-4">
            <CheckCircle size={14} /> Code resent!
          </div>
        )}

        <button onClick={verify} disabled={loading || otp.join("").length < 6}
          className="w-full btn-primary py-3 justify-center mb-4 disabled:opacity-50">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : "Verify & Sign In"}
        </button>
        <button onClick={resend} className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1.5 justify-center mx-auto transition-colors">
          <RotateCcw size={13} /> Resend code
        </button>
        <button onClick={onClose} className="mt-3 text-slate-600 hover:text-slate-400 text-xs transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function LoginForm() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const { login, user } = useAuth();

  const rawRole  = searchParams.get("role")?.toUpperCase();
  const initRole: Role = (rawRole === "DEPT" || rawRole === "DEPARTMENT" || rawRole === "DEPT_ADMIN")
    ? "DEPT_ADMIN"
    : (ROLES.find((r) => r.id === rawRole)?.id || "STUDENT");

  const [selectedRole, setSelectedRole] = useState<Role>(initRole);
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPwd,      setShowPwd]      = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showOTP,      setShowOTP]      = useState(false);

  useEffect(() => {
    if (user) router.push(getDashboardPath(user.role));
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields"); return; }
    setError(""); setLoading(true);
    try {
      await login(email.trim(), password, selectedRole);
      router.push(getDashboardPath(selectedRole));
    } catch (err: any) {
      const msg = err.response?.data?.detail || "";
      if (msg.toLowerCase().includes("otp") || msg.toLowerCase().includes("verify")) {
        setShowOTP(true);
      } else {
        setError(msg || "Invalid email or password. Please try again.");
      }
    } finally { setLoading(false); }
  };

  const activeRole = ROLES.find((r) => r.id === selectedRole)!;

  return (
    <>
      {showOTP && (
        <OTPModal
          email={email}
          role={selectedRole}
          onSuccess={() => { setShowOTP(false); router.push(getDashboardPath(selectedRole)); }}
          onClose={() => setShowOTP(false)}
        />
      )}

      <div className="min-h-screen flex" style={{ background: "#020617" }}>
        {/* Left panel — brand */}
        <div className="hidden lg:flex w-96 flex-col justify-between p-10 border-r border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(ellipse at top left, rgba(99,102,241,0.2), transparent 70%)" }} />
          <Link href="/" className="flex items-center gap-2.5 relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <BrainCircuit size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-space-grotesk)" }}>SkillGraph</span>
          </Link>

          <div className="relative space-y-6">
            <h2 className="text-3xl font-black text-white leading-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              VIT Pune&apos;s AI Placement Platform
            </h2>
            <div className="space-y-3">
              {[
                "AI-powered readiness scoring",
                "Live mock interview coaching",
                "Smart job drive matching",
                "Real-time placement analytics",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2.5 text-slate-300 text-sm">
                  <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                  {feat}
                </div>
              ))}
            </div>
            <div className="glass-light rounded-2xl p-4 border border-white/5">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}
              </div>
              <p className="text-slate-300 text-sm italic">
                &ldquo;SkillGraph&apos;s AI interview coach transformed how I prepared. I landed my first choice!&rdquo;
              </p>
              <p className="text-slate-500 text-xs mt-2">— Priya S., CSE 2024, Microsoft</p>
            </div>
          </div>

          <p className="text-slate-600 text-xs relative">© 2024 SkillGraph · VIT Pune</p>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <Link href="/" className="flex items-center gap-2.5 justify-center mb-8 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <BrainCircuit size={18} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-space-grotesk)" }}>SkillGraph</span>
            </Link>

            <div className="mb-8">
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>Welcome back</h1>
              <p className="text-slate-400 text-sm mt-1.5">Sign in to your portal</p>
            </div>

            {/* Role selector */}
            <div className="flex gap-2 mb-6 p-1 glass-light rounded-2xl">
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isActive = selectedRole === role.id;
                return (
                  <button key={role.id} onClick={() => { setSelectedRole(role.id); setError(""); }}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${isActive ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
                    style={isActive ? { background: `linear-gradient(135deg, ${role.color}cc, ${role.color}88)`, boxShadow: `0 4px 15px ${role.color}35` } : {}}>
                    <Icon size={15} />
                    {role.label}
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-2.5 rounded-xl glass-light border text-xs text-slate-400 flex items-center gap-2 mb-6"
              style={{ borderColor: activeRole.color + "30" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: activeRole.color }} />
              {activeRole.desc}
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="form-label">Email address</label>
                <div className="relative">
                  <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="form-input pl-10" placeholder={selectedRole === "STUDENT" ? "prn@vitstudent.ac.in" : "you@company.com"}
                    required autoComplete="email" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label mb-0">Password</label>
                  <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input id="password" type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-10 pr-11" placeholder="••••••••" required autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle size={14} className="shrink-0" />{error}
                </div>
              )}

              <button id="login-submit" type="submit" disabled={loading}
                className="w-full btn-primary py-3.5 justify-center text-sm mt-1 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${activeRole.color}ee, ${activeRole.color}99)`, boxShadow: `0 8px 25px ${activeRole.color}30` }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <>Sign in as {activeRole.label} <ArrowRight size={15} /></>}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/6" />
              <span className="text-slate-600 text-xs">or</span>
              <div className="flex-1 h-px bg-white/6" />
            </div>

            <button className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/10 bg-white/4 text-slate-300 text-sm font-medium hover:bg-white/8 hover:border-white/20 transition-all"
              onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api/v1"}/auth/google?role=${selectedRole}`}>
              <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <p className="text-center text-slate-500 text-sm mt-6">
              Don&apos;t have an account?{" "}
              <Link href={`/register?role=${selectedRole.toLowerCase().replace("_admin","")}`} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#020617" }}><Loader2 size={24} className="text-indigo-400 animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}