export const USER_ROLES = [
  "admin",
  "security",
  "proctor",
  "department",
  "student_union",
  "student",
  "library",
  "cafeteria",
  "registrar",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const STAFF_ROLES: UserRole[] = ["security", "proctor", "department", "student_union", "library", "cafeteria", "registrar"];

export function titleCaseRole(role: UserRole) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
