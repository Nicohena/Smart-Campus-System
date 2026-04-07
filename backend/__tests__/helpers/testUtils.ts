import { Application } from 'express';
import request from 'supertest';
import User, { IUser } from '../../models/User';

let userCounter = 0;

interface CreateUserInput {
  name?: string;
  studentId?: string;
  password?: string;
  role?: 'admin' | 'security' | 'proctor' | 'department' | 'student_union' | 'student';
  department?: string;
}

export const createUser = async (input: CreateUserInput = {}): Promise<IUser> => {
  userCounter += 1;
  const password = input.password || 'Password123!';
  const user = new User({
    name: input.name || `Test User ${userCounter}`,
    studentId: input.studentId || `SID${Date.now()}${userCounter}`,
    password,
    role: input.role || 'student',
    department: input.department
  });
  await user.save();
  return user;
};

export const loginUser = async (
  app: Application,
  studentId: string,
  password: string
): Promise<string> => {
  const response = await request(app).post('/api/auth/login').send({ studentId, password });
  return response.body?.data?.token as string;
};

export const createAndLogin = async (
  app: Application,
  role: 'admin' | 'security' | 'proctor' | 'department' | 'student_union' | 'student' = 'student',
  overrides: CreateUserInput = {}
): Promise<{ user: IUser; token: string }> => {
  const password = overrides.password || 'Password123!';
  const user = await createUser({ ...overrides, role, password });
  const token = await loginUser(app, user.studentId, password);
  return { user, token };
};

export const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`
});
