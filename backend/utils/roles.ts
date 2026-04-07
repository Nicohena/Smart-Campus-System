export const USER_ROLES = [
  'admin',
  'security',
  'proctor',
  'department',
  'student_union',
  'student'
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const STAFF_ROLES: UserRole[] = ['security', 'proctor', 'department', 'student_union'];
