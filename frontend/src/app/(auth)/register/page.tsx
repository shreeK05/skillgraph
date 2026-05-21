"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BrainCircuit, GraduationCap, Building2, Users, ArrowRight,
  ArrowLeft, Loader2, AlertCircle, Eye, EyeOff, CheckCircle,
  AtSign, Lock, User, ShieldCheck, RotateCcw,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth, getDashboardPath, type Role } from "@/lib/auth";

const VIT_BRANCHES = ["AIDS","CSE","CSE(AI)","CSE(AIML)","CSE(DS)","CSE(IOT_CYBER)","CSE(SE)","DESH","ENTC","INSTRU","IT","MECH"];

const ROLES = [
  { id: "STUDENT"    as Role, label: "Student",    icon: GraduationCap, color: "#6366f1", desc: "I&apos;m a VIT Pune student" },
  { id: "COMPANY"    as Role, label: "Company",    icon: Building2,      color: "#f59e0b", desc: "I want to hire VIT Pune talent" },
  { id: "DEPT_ADMIN" as Role, label: "Department", icon: Users,          color: "#10b981", desc: "I&apos;m VIT Pune faculty/admin" },
];

function OTPVerifyStep({ email, role, onSuccess }: { email: string; role: Role; onSuccess: () => void }) {
  const [otp, setOtp]       = useState(["","","","","",""]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [resent, setResent]   = useState(false);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) (document.getElementById(`reg-otp-${i+1}`) as HTMLInputElement)?.focus();
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) (document.getElementById(`reg-otp-${i-1}`) as HTMLInputElement)?.focus();
  };

  const verify = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Enter all 6 digits"); return; }
    setLoading(true); setError("");
    try {
      await api.post("/auth/verify-otp", { email, otp: code, role });
      onSuccess();
    } catch (e: any) { setError(e.response?.data?.detail || "Invalid OTP"); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    try { await api.post("/auth/resend-otp", { email }); setResent(true); setTimeout(() => setResent(false), 5000); } catch {}
  };

  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 flex items-center justify-center mx-auto mb-5 border border-indigo-500/25">
        <ShieldCheck size={26} className="text-indigo-400" />
      </div>
      <h2 className="text-xl font-black text-white mb-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>Verify your email</h2>
      <p className="text-slate-400 text-sm mb-7">Enter the 6-digit code sent to <span className="text-white font-semibold">{email}</span></p>

      <div className="flex gap-2 justify-center mb-5">
        {otp.map((d, i) => (
          <input key={i} id={`reg-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-11 h-12 text-center text-white font-bold text-lg rounded-xl border transition-all focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: d ? "rgba(99,102,241,0.8)" : "rgba(255,255,255,0.1)" }}
          />
        ))}
      </div>

      {error   && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4"><AlertCircle size={14}/>{error}</div>}
      {resent  && <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs mb-4"><CheckCircle size={14}/>Code resent!</div>}

      <button onClick={verify} disabled={loading || otp.join("").length < 6} className="w-full btn-primary py-3.5 justify-center mb-3 disabled:opacity-50">
        {loading ? <><Loader2 size={16} className="animate-spin"/>Verifying…</> : "Verify & Continue"}
      </button>
      <button onClick={resend} className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1.5 justify-center mx-auto transition-colors">
        <RotateCcw size={13}/>Resend code
      </button>
    </div>
  );
}

function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login }    = useAuth();

  const rawRole  = searchParams.get("role")?.toUpperCase();
  const initRole: Role = (rawRole === "DEPT" || rawRole === "DEPARTMENT" || rawRole === "DEPT_ADMIN")
    ? "DEPT_ADMIN"
    : (ROLES.find((r) => r.id === rawRole)?.id || "STUDENT");

  const [step,         setStep]         = useState<"role"|"credentials"|"details"|"otp">("role");
  const [selectedRole, setSelectedRole] = useState<Role>(initRole);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", fullName: "", branch: "", year: "", orgName: "", prn: "" });
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const activeRole = ROLES.find((r) => r.id === selectedRole)!;

  const goNext = async () => {
    setError("");
    if (step === "role") { setStep("credentials"); return; }
    if (step === "credentials") {
      if (!form.email.trim()) { setError("Email is required"); return; }
      if (!form.password.trim() || form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords don't match"); return; }
      setStep("details"); return;
    }
    if (step === "details") {
      if (!form.fullName.trim()) { setError("Full name is required"); return; }
      if (selectedRole === "STUDENT" && (!form.branch || !form.year)) { setError("Branch and year are required for students"); return; }
      if (selectedRole === "COMPANY" && !form.orgName.trim()) { setError("Company name is required"); return; }

      setLoading(true);
      try {
        const payload: any = {
          email: form.email.trim(),
          password: form.password,
          full_name: form.fullName.trim(),
          role: selectedRole,
        };
        let endpoint = "";
        if (selectedRole === "STUDENT") {
          endpoint = "/auth/register/student";
          payload.branch = form.branch;
          payload.year_of_study = parseInt(form.year);
          payload.prn = form.prn.trim() || undefined;
        }
        if (selectedRole === "COMPANY") {
          endpoint = "/auth/register/company";
          payload.company_name = form.orgName.trim();
        }
        if (selectedRole === "DEPT_ADMIN") {
          endpoint = "/auth/register/dept";
          // Add default admin code that the backend expects
          payload.admin_code = "VITPUNE2025";
        }

        await api.post(endpoint, payload);
        setStep("otp");
      } catch (e: any) {
        setError(e.response?.data?.detail || "Registration failed. Please try again.");
      } finally { setLoading(false); }
    }
  };

  const onVerified = async () => {
    setLoading(true);
    try {
      await login(form.email.trim(), form.password, selectedRole);
      router.push(getDashboardPath(selectedRole));
    } catch {
      router.push(`/login?role=${selectedRole.toLowerCase()}`);
    } finally { setLoading(false); }
  };

  const STEP_LABELS = ["Choose Role", "Credentials", "Your Details", "Verify Email"];
  const stepIdx = ["role","credentials","details","otp"].indexOf(step);

  return (
    <div className="min-h-screen flex" style={{ background: "#020617" }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-96 flex-col justify-between p-10 border-r border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(ellipse at top left, rgba(99,102,241,0.2), transparent 70%)" }} />
        <Link href="/" className="flex items-center gap-2.5 relative">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
            <BrainCircuit size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-space-grotesk)" }}>SkillGraph</span>
        </Link>

        <div className="relative space-y-5">
          <h2 className="text-3xl font-black text-white leading-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Join VIT Pune&apos;s smartest placement platform
          </h2>
          <div className="space-y-3">
            {["Free to join for all VIT Pune students","AI-powered placement readiness score","Live mock interviews with camera","Smart job matching based on your skills"].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-slate-300 text-sm">
                <CheckCircle size={15} className="text-emerald-400 shrink-0" />{f}
              </div>
            ))}
          </div>

          {/* Step tracker */}
          <div className="glass-light rounded-2xl p-5 border border-white/5">
            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-4">Registration Steps</p>
            <div className="space-y-3">
              {STEP_LABELS.map((label, i) => (
                <div key={label} className={`flex items-center gap-3 text-sm ${i < stepIdx ? "text-emerald-400" : i === stepIdx ? "text-white font-semibold" : "text-slate-600"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < stepIdx ? "bg-emerald-500" : i === stepIdx ? "bg-indigo-600" : "bg-slate-800"}`}>
                    {i < stepIdx ? <CheckCircle size={12} /> : i + 1}
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-slate-600 text-xs relative">© 2024 SkillGraph · VIT Pune</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 justify-center mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <BrainCircuit size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-space-grotesk)" }}>SkillGraph</span>
          </Link>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Step {stepIdx + 1} of {STEP_LABELS.length}</span>
              <span className="text-slate-400 text-sm">{STEP_LABELS[stepIdx]}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((stepIdx + 1) / STEP_LABELS.length) * 100}%`, background: `linear-gradient(90deg, ${activeRole.color}, ${activeRole.color}cc)` }} />
            </div>
          </div>

          {/* ── STEP: ROLE ── */}
          {step === "role" && (
            <div>
              <h1 className="text-2xl font-black text-white mb-1.5" style={{ fontFamily: "var(--font-space-grotesk)" }}>Who are you?</h1>
              <p className="text-slate-400 text-sm mb-7">Select the portal that matches your role at VIT Pune.</p>
              <div className="space-y-3">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isActive = selectedRole === role.id;
                  return (
                    <button key={role.id} onClick={() => setSelectedRole(role.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${isActive ? "text-white" : "glass-light border-white/5 text-slate-400 hover:text-white hover:border-white/15"}`}
                      style={isActive ? { background: role.color + "15", borderColor: role.color + "50", boxShadow: `0 0 25px ${role.color}15` } : {}}>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
                        style={{ background: isActive ? role.color + "25" : "rgba(255,255,255,0.04)", border: `1px solid ${role.color}${isActive ? "50" : "20"}` }}>
                        <Icon size={20} style={{ color: role.color }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{role.label}</p>
                        <p className="text-slate-500 text-xs mt-0.5" dangerouslySetInnerHTML={{ __html: role.desc }} />
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? "border-0" : "border-slate-600"}`}
                        style={isActive ? { background: role.color } : {}}>
                        {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── STEP: CREDENTIALS ── */}
          {step === "credentials" && (
            <div>
              <h1 className="text-2xl font-black text-white mb-1.5" style={{ fontFamily: "var(--font-space-grotesk)" }}>Create your account</h1>
              <p className="text-slate-400 text-sm mb-7">Set your login credentials for SkillGraph.</p>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Email address</label>
                  <div className="relative">
                    <AtSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="form-input pl-10"
                      placeholder={selectedRole === "STUDENT" ? "prn@vitstudent.ac.in" : "you@company.com"} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type={showPwd ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} className="form-input pl-10 pr-11" placeholder="At least 8 characters" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Confirm password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} className="form-input pl-10" placeholder="Repeat your password" />
                    {form.password && form.confirmPassword && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {form.password === form.confirmPassword ? <CheckCircle size={15} className="text-emerald-400" /> : <AlertCircle size={15} className="text-red-400" />}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Password strength */}
              {form.password && (
                <div className="mt-3 space-y-1.5">
                  {[
                    { label: "8+ characters", ok: form.password.length >= 8 },
                    { label: "Uppercase letter", ok: /[A-Z]/.test(form.password) },
                    { label: "Number", ok: /\d/.test(form.password) },
                  ].map((r) => (
                    <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? "text-emerald-400" : "text-slate-600"}`}>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${r.ok ? "bg-emerald-500" : "bg-slate-700"}`}>
                        {r.ok && <CheckCircle size={10} className="text-white" />}
                      </div>
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP: DETAILS ── */}
          {step === "details" && (
            <div>
              <h1 className="text-2xl font-black text-white mb-1.5" style={{ fontFamily: "var(--font-space-grotesk)" }}>Your details</h1>
              <p className="text-slate-400 text-sm mb-7">Tell us a bit about yourself so we can personalise your experience.</p>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Full name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className="form-input pl-10" placeholder="Your full name" />
                  </div>
                </div>

                {selectedRole === "STUDENT" && (
                  <>
                    <div>
                      <label className="form-label">PRN Number <span className="text-slate-600 font-normal">(optional)</span></label>
                      <input value={form.prn} onChange={(e) => set("prn", e.target.value)} className="form-input" placeholder="e.g. 22211A0001" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Branch</label>
                        <select value={form.branch} onChange={(e) => set("branch", e.target.value)} className="form-input appearance-none cursor-pointer">
                          <option value="">Select branch</option>
                          {VIT_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Year</label>
                        <select value={form.year} onChange={(e) => set("year", e.target.value)} className="form-input appearance-none cursor-pointer">
                          <option value="">Year</option>
                          {[1,2,3,4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {(selectedRole === "COMPANY" || selectedRole === "DEPT_ADMIN") && (
                  <div>
                    <label className="form-label">{selectedRole === "COMPANY" ? "Company Name" : "Department"}</label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input value={form.orgName} onChange={(e) => set("orgName", e.target.value)} className="form-input pl-10"
                        placeholder={selectedRole === "COMPANY" ? "e.g. Google India" : "e.g. Computer Science"} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP: OTP ── */}
          {step === "otp" && (
            <OTPVerifyStep email={form.email} role={selectedRole} onSuccess={onVerified} />
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs mt-4">
              <AlertCircle size={14} className="shrink-0"/>{error}
            </div>
          )}

          {/* Nav buttons */}
          {step !== "otp" && (
            <div className={`flex gap-3 mt-6 ${step === "role" ? "justify-end" : "justify-between"}`}>
              {step !== "role" && (
                <button onClick={() => { setError(""); const s = ["role","credentials","details"]; setStep(s[s.indexOf(step) - 1] as any); }}
                  className="btn-ghost text-sm py-3 px-5">
                  <ArrowLeft size={15}/>Back
                </button>
              )}
              <button onClick={goNext} disabled={loading}
                className="btn-primary py-3 px-7 text-sm disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${activeRole.color}ee, ${activeRole.color}99)` }}>
                {loading ? <><Loader2 size={16} className="animate-spin"/>Processing…</> : step === "details" ? <>Create Account <ArrowRight size={15}/></> : <>Continue <ArrowRight size={15}/></>}
              </button>
            </div>
          )}

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{" "}
            <Link href={`/login?role=${selectedRole.toLowerCase().replace("_admin","")}`} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#020617" }}><Loader2 size={24} className="text-indigo-400 animate-spin"/></div>}>
      <RegisterForm />
    </Suspense>
  );
}
