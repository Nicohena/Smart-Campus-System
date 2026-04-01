import { apiRequest } from "./client"

interface LoginResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: {
      _id: string
      name: string
      studentId: string
      role: "student" | "staff" | "admin"
      department?: string
    }
  }
}

export const authApi = {
  login: (studentId: string, password: string) =>
    apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { studentId, password },
    }),

  logout: () =>
    apiRequest("/auth/logout", { method: "POST" }),

  getProfile: () =>
    apiRequest("/auth/profile"),

  refreshToken: () =>
    apiRequest("/auth/refresh", { method: "POST" }),
}
