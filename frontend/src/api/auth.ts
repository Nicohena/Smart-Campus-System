import { apiRequest } from "./client"
import type { UserRole } from "../lib/roles"

export interface AppUser {
  _id: string
  name: string
  studentId: string
  role: UserRole
  department?: string
}

interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: AppUser
  }
}

interface RegisterPayload {
  name: string
  studentId: string
  password: string
  department?: string
  role?: UserRole
}

export const authApi = {
  login: (studentId: string, password: string) =>
    apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { studentId, password },
    }),

  logout: () =>
    apiRequest("/auth/logout", { method: "POST" }),

  register: (payload: RegisterPayload) =>
    apiRequest("/auth/register", { method: "POST", body: payload }),

  getProfile: () =>
    apiRequest("/auth/profile"),

  refreshToken: () =>
    apiRequest("/auth/refresh", { method: "POST" }),
}

export function getStoredUser(): AppUser | null {
  const raw = localStorage.getItem("user")
  if (!raw) return null

  try {
    return JSON.parse(raw) as AppUser
  } catch {
    return null
  }
}
