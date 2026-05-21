"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import {
  LayoutDashboard, User, Camera, BookOpen, Briefcase, Star,
  Mic, MicOff, Video, VideoOff, Play, Square, RotateCcw,
  ChevronRight, Loader2, CheckCircle, AlertCircle, Brain,
  MessageSquare, Clock, ThumbsUp, ThumbsDown, Award,
  Lightbulb, Target, Zap,
} from "lucide-react";

const NAV = [
  { label: "Dashboard",      href: "/student/dashboard",  icon: LayoutDashboard },
  { label: "My Profile",     href: "/student/profile",    icon: User },
  { label: "Interview Coach",href: "/student/interview",  icon: Camera },
  { label: "Learning Path",  href: "/student/learning",   icon: BookOpen },
  { label: "Job Drives",     href: "/student/jobs",       icon: Briefcase },
  { label: "Portfolio",      href: "/student/portfolio",  icon: Star },
];

const ROLES = [
  "Software Engineer", "Data Engineer", "ML Engineer",
  "Product Manager", "DevOps Engineer", "System Design",
  "Frontend Engineer", "Backend Engineer",
];

const ROUNDS = [
  { id: "DSA",           label: "DSA / Coding",         desc: "Data structures, algorithms, problem solving", color: "#6366f1" },
  { id: "System Design", label: "System Design",         desc: "Architecture, scalability, databases",         color: "#8b5cf6" },
  { id: "HR",            label: "HR / Behavioural",      desc: "STAR format, situational, culture fit",        color: "#10b981" },
  { id: "Technical",     label: "Technical Deep Dive",   desc: "Tech stack, project walkthrough, concepts",    color: "#f59e0b" },
];

const QUESTIONS: Record<string, string[]> = {
  DSA: [
    "Explain the time complexity of QuickSort in the worst case and how you'd optimise it.",
    "How would you detect a cycle in a linked list? Explain Floyd's Tortoise and Hare algorithm.",
    "Given an array of integers, find two numbers that add up to a target. What's your most optimal approach?",
    "Explain Binary Search Trees and how you'd balance an unbalanced BST.",
    "How does dynamic programming differ from plain recursion? Give a concrete example.",
  ],
  "System Design": [
    "Design a URL shortener like bit.ly. What components would you include and why?",
    "How would you design a real-time notification system for millions of concurrent users?",
    "Design a distributed file storage system similar to Google Drive. What are the key trade-offs?",
    "How would you build a scalable API rate limiter? Which data structures would you use?",
    "Design a campus placement platform like SkillGraph at scale — walk me through the architecture.",
  ],
  HR: [
    "Tell me about yourself and why you're interested in this specific role.",
    "Describe a time you faced a major challenge in a team project and how you resolved it.",
    "Where do you see yourself in 5 years, and how does this role fit into that vision?",
    "Tell me about a time you disagreed with a senior team member. How was it resolved?",
    "What is your greatest professional strength? Give a concrete example of it in action.",
  ],
  Technical: [
    "Walk me through a project you're most proud of. What was your specific contribution?",
    "Explain the difference between SQL and NoSQL databases. When would you choose each?",
    "How does React's virtual DOM work and why is it more efficient than direct DOM manipulation?",
    "What is REST API? How does it differ from GraphQL in terms of design philosophy?",
    "Explain microservices vs monolithic architecture — trade-offs for a startup vs enterprise?",
  ],
};

interface GradedAnswer {
  question: string;
  answer: string;
  score: number;
  feedback: string;
  feedback_positive: string[];
  feedback_negative: string[];
}

export default function InterviewCoachPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [step, setStep] = useState<"setup" | "interview" | "review">("setup");
  const [selectedRole, setSelectedRole] = useState("Software Engineer");
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<GradedAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [sessionScore, setSessionScore] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) router.push("/login?role=student");
  }, []);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
      setCameraOn(true);
      setCameraError("");
    } catch {
      setCameraError("Camera access denied. You can still type your answers below.");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOn(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startInterview = () => {
    if (!selectedRound) { setError("Please select a round type first"); return; }
    const qs = [...(QUESTIONS[selectedRound] || [])].sort(() => Math.random() - 0.5).slice(0, 3);
    setQuestions(qs);
    setCurrentQ(0);
    setAnswers([]);
    setStep("interview");
    startCamera();
    setTimeLeft(120);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
    }, 1000);
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) { setError("Please type your answer before submitting"); return; }
    setProcessing(true); setError("");
    if (timerRef.current) clearInterval(timerRef.current);

    let graded: GradedAnswer;
    try {
      const res = await api.post("/student/interview/grade", {
        role: selectedRole,
        round_type: selectedRound,
        question: questions[currentQ],
        answer: currentAnswer,
      });
      graded = {
        question: questions[currentQ],
        answer: currentAnswer,
        score: res.data.score ?? 6,
        feedback: res.data.feedback ?? "",
        feedback_positive: res.data.feedback_positive ?? [],
        feedback_negative: res.data.feedback_negative ?? [],
      };
    } catch {
      // Fallback scoring if backend unreachable
      const wordCount = currentAnswer.split(" ").length;
      const mockScore = Math.min(10, Math.max(4, Math.round(wordCount / 10) + 3));
      graded = {
        question: questions[currentQ],
        answer: currentAnswer,
        score: mockScore,
        feedback: "Good attempt. Review the feedback below.",
        feedback_positive: ["You provided an answer with some detail."],
        feedback_negative: ["Try to use more specific technical terms and examples."],
      };
    }

    const newAnswers = [...answers, graded];
    setAnswers(newAnswers);
    setCurrentAnswer("");

    if (currentQ + 1 < questions.length) {
      setCurrentQ((q) => q + 1);
      setTimeLeft(120);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
      }, 1000);
    } else {
      const avg = newAnswers.reduce((s, a) => s + a.score, 0) / newAnswers.length;
      setSessionScore(Math.round(avg * 10) / 10);
      try {
        await api.post("/student/interview/session", {
          role: selectedRole, round_type: selectedRound, score: avg, transcript: newAnswers,
        });
      } catch {}
      stopCamera();
      setStep("review");
    }
    setProcessing(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const activeRound = ROUNDS.find((r) => r.id === selectedRound);

  return (
    <DashboardLayout navItems={NAV} portalLabel="Student Portal" portalColor="#6366f1">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            AI Interview Coach
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Practice with live camera · Get AI scoring and detailed feedback on every answer
          </p>
        </div>

        {/* ── SETUP ── */}
        {step === "setup" && (
          <div className="space-y-5">
            {/* Role + Round row */}
            <div className="grid lg:grid-cols-2 gap-5">
              {/* Role */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <Target size={18} className="text-indigo-400" /> Target Role
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((role) => (
                    <button key={role} onClick={() => setSelectedRole(role)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-semibold text-left transition-all border ${
                        selectedRole === role
                          ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                          : "glass-light border-transparent text-slate-400 hover:text-white hover:border-white/10"
                      }`}
                    >{role}</button>
                  ))}
                </div>
              </div>

              {/* Round */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <MessageSquare size={18} className="text-violet-400" /> Round Type
                </h2>
                <div className="space-y-2">
                  {ROUNDS.map((round) => (
                    <button key={round.id} onClick={() => setSelectedRound(round.id)}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all border ${
                        selectedRound === round.id
                          ? "border-white/20"
                          : "border-white/5 glass-light hover:border-white/15"
                      }`}
                      style={selectedRound === round.id ? { background: round.color + "15", borderColor: round.color + "40" } : {}}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedRound === round.id ? "border-0" : "border-slate-600"
                      }`} style={selectedRound === round.id ? { background: round.color } : {}}>
                        {selectedRound === round.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{round.label}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{round.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Camera setup */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                <Video size={18} className="text-emerald-400" /> Camera Setup
              </h2>
              <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-white/5">
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  {!cameraOn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                      <Camera size={40} className="mb-2 opacity-30" />
                      <p className="text-sm">Camera preview will appear here</p>
                    </div>
                  )}
                  {cameraOn && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-white text-xs font-semibold">LIVE</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <button onClick={cameraOn ? stopCamera : startCamera}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                      cameraOn ? "bg-slate-700 text-white hover:bg-slate-600" : "btn-secondary"
                    }`}
                  >
                    {cameraOn ? <><VideoOff size={16} />Turn off camera</> : <><Video size={16} />Test camera</>}
                  </button>
                  <button onClick={() => setMicOn(!micOn)}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                      micOn ? "btn-secondary" : "bg-red-500/20 border border-red-500/30 text-red-400"
                    }`}
                  >
                    {micOn ? <><Mic size={16} />Microphone on</> : <><MicOff size={16} />Microphone off</>}
                  </button>

                  {cameraError && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <p>{cameraError}</p>
                    </div>
                  )}

                  <div className="glass-light rounded-xl p-3 space-y-1.5">
                    {[
                      "3 questions per session",
                      "2 minutes per answer",
                      "AI scores per round type (DSA/HR/Design/Tech)",
                      "Detailed positive & negative feedback",
                      "Session saved to your profile",
                    ].map((t) => (
                      <p key={t} className="flex items-center gap-2 text-xs text-slate-500">
                        <CheckCircle size={11} className="text-emerald-500 shrink-0" />{t}
                      </p>
                    ))}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                      <AlertCircle size={14} />{error}
                    </div>
                  )}

                  <button onClick={startInterview} disabled={!selectedRound}
                    className="w-full btn-primary py-3.5 justify-center text-base disabled:opacity-40 disabled:cursor-not-allowed"
                    style={activeRound ? { background: `linear-gradient(135deg, ${activeRound.color}dd, ${activeRound.color}88)` } : {}}
                  >
                    <Play size={18} />Start Interview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── INTERVIEW ── */}
        {step === "interview" && (
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Left: Camera + progress */}
            <div className="space-y-4">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="relative aspect-video bg-slate-900">
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  {!cameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera size={28} className="text-slate-600" />
                    </div>
                  )}
                  {/* Timer overlay */}
                  <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg font-bold text-sm flex items-center gap-1.5 ${
                    timeLeft < 30 ? "bg-red-500/80 text-white animate-pulse" : "bg-black/60 text-white"
                  }`}>
                    <Clock size={12} />{formatTime(timeLeft)}
                  </div>
                  {cameraOn && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-white text-xs font-bold">LIVE</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="glass-card rounded-2xl p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-3">Session Progress</p>
                <div className="flex gap-2 mb-2">
                  {questions.map((_, i) => (
                    <div key={i} className={`flex-1 h-2 rounded-full transition-all ${
                      i < currentQ ? "bg-emerald-500" : i === currentQ ? "bg-indigo-500" : "bg-slate-700"
                    }`} />
                  ))}
                </div>
                <p className="text-slate-400 text-xs">Question {currentQ + 1} of {questions.length}</p>
                <p className="text-slate-600 text-xs mt-1">{selectedRound} · {selectedRole}</p>
              </div>

              {/* Previous answers mini */}
              {answers.length > 0 && (
                <div className="glass-card rounded-2xl p-4 space-y-2">
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Answered</p>
                  {answers.map((a, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-slate-400 text-xs">Q{i + 1}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        a.score >= 8 ? "text-emerald-400 bg-emerald-500/15" :
                        a.score >= 6 ? "text-indigo-400 bg-indigo-500/15" :
                        "text-amber-400 bg-amber-500/15"
                      }`}>{a.score}/10</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Question + Answer */}
            <div className="lg:col-span-2 space-y-4">
              {/* Question card */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <span className="text-violet-400 font-bold text-xs">Q{currentQ + 1}</span>
                  </div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    {selectedRound} · {selectedRole}
                  </span>
                </div>
                <p className="text-white text-lg font-semibold leading-relaxed">
                  {questions[currentQ]}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-amber-500/5 border border-amber-500/10 rounded-xl px-3 py-2">
                  <Lightbulb size={13} className="text-amber-400 shrink-0" />
                  {selectedRound === "DSA" && "Tip: Mention the approach first, then time/space complexity. Explain trade-offs."}
                  {selectedRound === "System Design" && "Tip: Break it down — requirements → high-level design → components → trade-offs."}
                  {selectedRound === "HR" && "Tip: Use the STAR format — Situation, Task, Action, Result. Be specific and quantify."}
                  {selectedRound === "Technical" && "Tip: Explain your reasoning. Mention technologies, patterns, and why you'd choose them."}
                </div>
              </div>

              {/* Answer area */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-white font-semibold text-sm">Your Answer</label>
                  <span className="text-slate-500 text-xs">{currentAnswer.split(" ").filter(Boolean).length} words</span>
                </div>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="form-input min-h-[140px] resize-none text-sm leading-relaxed"
                  placeholder={
                    selectedRound === "DSA" ? "Describe your approach, data structures used, and time/space complexity..." :
                    selectedRound === "System Design" ? "Walk through your design: requirements, components, trade-offs, scalability..." :
                    selectedRound === "HR" ? "Describe the situation, your role, what you did, and the outcome (STAR format)..." :
                    "Explain the concept, technologies involved, and why you'd make these choices..."
                  }
                  rows={6}
                />
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle size={14} />{error}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setCurrentAnswer("")} className="btn-ghost text-sm" disabled={processing}>
                    <RotateCcw size={14} />Clear
                  </button>
                  <button onClick={submitAnswer} disabled={processing || !currentAnswer.trim()}
                    className="btn-primary flex-1 py-3 justify-center disabled:opacity-50"
                  >
                    {processing ? (
                      <><Loader2 size={16} className="animate-spin" />AI is grading…</>
                    ) : (
                      <>{currentQ + 1 < questions.length ? "Submit & Next Question" : "Finish Session"} <ChevronRight size={16} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── REVIEW ── */}
        {step === "review" && (
          <div className="space-y-6">
            {/* Score card */}
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="relative w-32 h-32 mx-auto mb-5">
                <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
                  <circle cx="64" cy="64" r="52" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="10" />
                  <circle cx="64" cy="64" r="52" fill="none"
                    stroke={sessionScore! >= 8 ? "#10b981" : sessionScore! >= 6 ? "#6366f1" : "#f59e0b"}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52 * ((sessionScore || 0) / 10)} ${2 * Math.PI * 52}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white font-black text-3xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>{sessionScore}</span>
                  <span className="text-slate-500 text-xs">/ 10</span>
                </div>
              </div>
              <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Session Complete!
              </h2>
              <p className="text-slate-400 mb-2">
                {sessionScore! >= 8 ? "Excellent! You're well prepared for real interviews." :
                 sessionScore! >= 6 ? "Good performance — a bit more practice and you'll be interview-ready." :
                 "Keep practising! Review the detailed feedback below to improve."}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mb-6">
                <Zap size={12} className="text-indigo-400" />
                {selectedRound} round · {selectedRole}
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setStep("setup"); setAnswers([]); setSessionScore(null); }} className="btn-primary text-sm py-2.5 px-6">
                  <RotateCcw size={15} />Practice Again
                </button>
              </div>
            </div>

            {/* Per-question breakdown */}
            <div className="space-y-4">
              {answers.map((ans, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 space-y-4">
                  {/* Question + score header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">Q{i + 1}</div>
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{selectedRound}</span>
                      </div>
                      <p className="text-white font-semibold">{ans.question}</p>
                    </div>
                    <div className={`shrink-0 px-4 py-2 rounded-xl font-black text-xl ${
                      ans.score >= 8 ? "text-emerald-400 bg-emerald-500/10" :
                      ans.score >= 6 ? "text-indigo-400 bg-indigo-500/10" :
                      "text-amber-400 bg-amber-500/10"
                    }`} style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {ans.score}/10
                    </div>
                  </div>

                  {/* Your answer */}
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-2">Your Answer</p>
                    <p className="text-slate-300 text-sm leading-relaxed bg-slate-800/40 rounded-xl p-3">{ans.answer}</p>
                  </div>

                  {/* AI Feedback split */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Positives */}
                    {ans.feedback_positive?.length > 0 && (
                      <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <ThumbsUp size={11} />What you did well
                        </p>
                        <ul className="space-y-1.5">
                          {ans.feedback_positive.map((f, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-slate-300">
                              <CheckCircle size={10} className="text-emerald-400 shrink-0 mt-0.5" />{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Negatives */}
                    {ans.feedback_negative?.length > 0 && (
                      <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <ThumbsDown size={11} />Areas to improve
                        </p>
                        <ul className="space-y-1.5">
                          {ans.feedback_negative.map((f, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-slate-300">
                              <AlertCircle size={10} className="text-amber-400 shrink-0 mt-0.5" />{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}