// file: frontend/src/lib/auth.ts
"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "./api";

export type Role = "STUDENT" | "DEPT_ADMIN" | "COMPANY" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  email_verified: boolean;
  branch?: string;
  year_of_study?: number;
  prn?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
  setTokens: (access: string, refresh: string) => void;
  fetchMe: () => Promise<void>;
  isAuthenticated: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      isAuthenticated: () => !!get().accessToken && !!get().user,

      setTokens: (access, refresh) => {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        set({ accessToken: access, refreshToken: refresh });
      },

      login: async (email, password, role) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", { email, password, role });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: {
              id: data.user_id,
              email: data.email,
              full_name: data.full_name,
              role: data.role,
              avatar_url: data.avatar_url,
              email_verified: true,
            },
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, accessToken: null, refreshToken: null });
        window.location.href = "/login";
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: "skillgraph-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

/** Route guard helper — call inside useEffect */
export function requireRole(role: Role | Role[], router: any, currentUser: AuthUser | null) {
  if (!currentUser) { router.push("/login"); return false; }
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(currentUser.role)) {
    router.push(`/${currentUser.role.toLowerCase().replace("_", "-")}/dashboard`);
    return false;
  }
  return true;
}

/** Dashboard redirect helper */
export function getDashboardPath(role: Role): string {
  switch (role) {
    case "STUDENT":    return "/student/dashboard";
    case "DEPT_ADMIN": return "/department/dashboard";
    case "COMPANY":    return "/company/dashboard";
    case "ADMIN":      return "/admin/dashboard";
    default:           return "/";
  }
}
