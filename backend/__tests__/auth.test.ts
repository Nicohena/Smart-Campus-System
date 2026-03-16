import request from 'supertest';
import app from '../server';
import { createUser, createAndLogin, authHeader } from './helpers/testUtils';

describe('Authentication Module', () => {
  it('should login a student successfully', async () => {
    const password = 'Password123!';
    const user = await createUser({ email: 'student1@example.edu', password, role: 'student' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data.token');
  });

  it('should fail login with wrong password', async () => {
    const user = await createUser({ email: 'student2@example.edu', password: 'Password123!' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrongpass' });

    expect(response.status).toBe(401);
  });

  it('should block student from registering new users', async () => {
    const { token } = await createAndLogin(app, 'student');

    const response = await request(app)
      .post('/api/auth/register')
      .set(authHeader(token))
      .send({
        name: 'New User',
        studentId: 'SID-REG-1',
        email: 'newuser@example.edu',
        password: 'Password123!'
      });

    expect(response.status).toBe(403);
  });

  it('should allow staff to register users', async () => {
    const { token } = await createAndLogin(app, 'staff');

    const response = await request(app)
      .post('/api/auth/register')
      .set(authHeader(token))
      .send({
        name: 'New Student',
        studentId: 'SID-REG-2',
        email: 'newstudent@example.edu',
        password: 'Password123!'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data.user');
  });
});
