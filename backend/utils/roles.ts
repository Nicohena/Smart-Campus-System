export const USER_ROLES = [
  'admin',
  'security',
  'proctor',
  'department',
  'student_union',
  'student',
  'library',
  'cafeteria',
  'registrar'
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const STAFF_ROLES: UserRole[] = ['security', 'proctor', 'department', 'student_union', 'library', 'cafeteria', 'registrar'];
