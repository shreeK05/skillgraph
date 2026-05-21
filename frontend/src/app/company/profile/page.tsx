"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, Users, Briefcase, Bell, Building2,
  Save, Loader2, AlertCircle, CheckCircle, Globe, MapPin,
  ChevronDown, Plus, X,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",       href: "/company/dashboard",     icon: LayoutDashboard },
  { label: "Company Profile", href: "/company/profile",       icon: Building2 },
  { label: "Job Postings",    href: "/company/jobs",          icon: Briefcase },
  { label: "Candidates",      href: "/company/candidates",    icon: Users },
  { label: "Announcements",   href: "/company/announcements", icon: Bell },
];

const INDUSTRIES = ["Technology","Finance / FinTech","Consulting","E-Commerce","Healthcare","Manufacturing","EdTech","Media","Logistics","Other"];
const SIZES = ["1-10","11-50","51-200","201-500","501-1000","1000+"];
const PERKS = ["Health Insurance","Stock Options","Remote Work","Flexible Hours","Learning Budget","Gym Membership","Free Meals","Relocation Assistance"];

export default function CompanyProfilePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState("");
  const [error,   setError]   = useState("");
  const [perks,   setPerks]   = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login?role=company"); return; }
    api.get("/company/profile")
      .then((r) => { setProfile(r.data || {}); setPerks(r.data?.perks || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.put("/company/profile", { ...profile, perks });
      setSuccess("Profile saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Save failed");
    } finally { setSaving(false); }
  };

  const togglePerk = (p: string) => setPerks((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  if (loading) return (
    <DashboardLayout navItems={NAV} portalLabel="Company Portal" portalColor="#f59e0b">
      <div className="flex justify-center h-64 items-center"><Loader2 size={28} className="text-amber-400 animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={NAV} portalLabel="Company Portal" portalColor="#f59e0b">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>Company Profile</h1>
            <p className="text-slate-400 text-sm mt-1">Visible to students and VIT Pune placement cell</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2.5 px-5 disabled:opacity-50" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save</>}
          </button>
        </div>

        {success && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm"><CheckCircle size={16}/>{success}</div>}
        {error   && <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertCircle size={16}/>{error}</div>}

        {/* Basic Info */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Company Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Company Name</label>
              <input value={profile.name || ""} onChange={(e)=>setProfile((p:any)=>({...p,name:e.target.value}))} className="form-input" placeholder="Google India" />
            </div>
            <div>
              <label className="form-label">Industry</label>
              <div className="relative">
                <select value={profile.industry || ""} onChange={(e)=>setProfile((p:any)=>({...p,industry:e.target.value}))} className="form-input appearance-none pr-8 cursor-pointer">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map((i)=><option key={i} value={i}>{i}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className="form-label">Company Size</label>
              <div className="relative">
                <select value={profile.size || ""} onChange={(e)=>setProfile((p:any)=>({...p,size:e.target.value}))} className="form-input appearance-none pr-8 cursor-pointer">
                  <option value="">Select size</option>
                  {SIZES.map((s)=><option key={s} value={s}>{s} employees</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className="form-label">Founded Year</label>
              <input type="number" value={profile.founded_year || ""} onChange={(e)=>setProfile((p:any)=>({...p,founded_year:+e.target.value}))} className="form-input" placeholder="e.g. 2010" />
            </div>
            <div>
              <label className="form-label">Headquarters</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={profile.hq_location || ""} onChange={(e)=>setProfile((p:any)=>({...p,hq_location:e.target.value}))} className="form-input pl-9" placeholder="Bangalore, India" />
              </div>
            </div>
            <div>
              <label className="form-label">Website</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"/>
                <input value={profile.website || ""} onChange={(e)=>setProfile((p:any)=>({...p,website:e.target.value}))} className="form-input pl-9" placeholder="https://company.com" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">About the Company</label>
              <textarea value={profile.description || ""} onChange={(e)=>setProfile((p:any)=>({...p,description:e.target.value}))} className="form-input resize-none" rows={4} placeholder="Tell students about your company, culture, and mission…" />
            </div>
          </div>
        </div>

        {/* Perks */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Perks & Benefits</h2>
          <div className="flex flex-wrap gap-2">
            {PERKS.map((p) => (
              <button key={p} onClick={() => togglePerk(p)} type="button"
                className={`skill-badge transition-all ${perks.includes(p) ? "skill-badge-brand" : "border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-300"}`}>
                {perks.includes(p) && <CheckCircle size={10} />}{p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary py-3 px-8 disabled:opacity-50" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Profile</>}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
