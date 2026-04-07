import { apiRequest } from "../../../api/client";
import type { ApiResponse } from "../../../components/admin/adminShared";

export interface StudentProfile {
  _id: string;
  name: string;
  studentId: string;
  role: string;
  email?: string;
  year?: string;
  section?: string;
  department?: string;
  isActive: boolean;
}

export const departmentApi = {
  // Get overview analytics
  getAnalytics: () => apiRequest<ApiResponse<any>>("/analytics/department"),

  // Get students list
  getStudents: () => apiRequest<ApiResponse<{ users: StudentProfile[] }>>("/auth/users"),

  // Get specific student
  getStudent: (id: string) => apiRequest<ApiResponse<{ user: StudentProfile }>>(`/auth/users/${id}`),

  // Update a student record
  updateStudent: (id: string, data: Partial<StudentProfile>) =>
    apiRequest<ApiResponse<{ user: StudentProfile }>>(`/auth/users/${id}`, {
      method: "PATCH",
      body: data,
    }),

  // Get clearances
  getClearances: () => apiRequest<ApiResponse<{ records: any[] }>>("/clearance/department"),

  // Update clearance
  updateClearance: (id: string, status: boolean, remarks?: string) =>
    apiRequest<ApiResponse<any>>(`/clearance/${id}/department`, {
      method: "PATCH",
      body: { status, remarks }, // Just hitting the endpoint approves it right now based on our backend, logic can be expanded
    }),
};
