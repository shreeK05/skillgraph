import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillGraph | AI Campus Placement Platform — VIT Pune",
  description:
    "SkillGraph is VIT Pune's AI-powered campus placement platform. Students get AI interview coaching, skill mapping, and learning paths. Companies find top talent instantly. Departments get real-time placement analytics.",
  keywords: [
    "VIT Pune placement",
    "campus placement AI",
    "skill graph",
    "mock interview",
    "placement analytics",
  ],
  openGraph: {
    title: "SkillGraph — AI Campus Placement for VIT Pune",
    description:
      "AI-powered placement platform for students, departments, and companies at VIT Pune.",
    type: "website",
  },
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} dark antialiased`}
    >
      <body className="bg-slate-950 text-slate-50 selection:bg-indigo-500/30 min-h-screen flex flex-col font-sans">
        {children}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#0f172a' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#0f172a' },
            }
          }} 
        />
      </body>
    </html>
  );
}
