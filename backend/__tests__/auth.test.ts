import request from 'supertest';
import app from '../server';
import { createUser, createAndLogin, authHeader } from './helpers/testUtils';

describe('Authentication Module', () => {
  it('should login a student successfully', async () => {
    const password = 'Password123!';
    const user = await createUser({ studentId: 'SID-LOGIN-1', password, role: 'student' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ studentId: user.studentId, password });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data.token');
  });

  it('should fail login with wrong password', async () => {
    const user = await createUser({ studentId: 'SID-LOGIN-2', password: 'Password123!' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ studentId: user.studentId, password: 'wrongpass' });

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
        password: 'Password123!'
      });

    expect(response.status).toBe(403);
  });

  it('should allow department staff to register students', async () => {
    const { token } = await createAndLogin(app, 'department');

    const response = await request(app)
      .post('/api/auth/register')
      .set(authHeader(token))
      .send({
        name: 'New Student',
        studentId: 'SID-REG-2',
        password: 'Password123!'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('data.user');
    expect(response.body.data.user.role).toBe('student');
  });

  it('should allow admin to register staff users', async () => {
    const { token } = await createAndLogin(app, 'admin');

    const response = await request(app)
      .post('/api/auth/register')
      .set(authHeader(token))
      .send({
        name: 'Security Officer',
        studentId: 'SID-REG-3',
        password: 'Password123!',
        role: 'security'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user.role).toBe('security');
  });
});
