import request from 'supertest';
import app from '../server';
import Dorm from '../models/Dorm';
import { createAndLogin, authHeader } from './helpers/testUtils';

describe('Dorm Management Module', () => {
  it('should prevent students from allocating dorms', async () => {
    const { token } = await createAndLogin(app, 'student');

    const response = await request(app)
      .post('/api/dorm/allocate')
      .set(authHeader(token))
      .send({ studentId: 'SID-123', yearLevel: 'freshman' });

    expect(response.status).toBe(403);
  });

  it('should allow proctor staff to allocate a dorm to a student', async () => {
    const { user: student } = await createAndLogin(app, 'student');
    const { token: proctorToken } = await createAndLogin(app, 'proctor');

    await Dorm.create({
      block: 'A',
      roomNumber: 101,
      capacity: 2,
      students: [],
      status: 'available',
      isSpecialNeedsDorm: false
    });

    const allocate = await request(app)
      .post('/api/dorm/allocate')
      .set(authHeader(proctorToken))
      .send({ studentId: student.studentId, yearLevel: 'freshman' });

    expect(allocate.status).toBe(201);
    expect(allocate.body).toHaveProperty('data.dorm');
  });

  it('should allow proctor staff to issue and return a dorm key', async () => {
    const { user: student } = await createAndLogin(app, 'student');
    const { token: proctorToken } = await createAndLogin(app, 'proctor');

    const dorm = await Dorm.create({
      block: 'B',
      roomNumber: 202,
      capacity: 2,
      students: [student._id],
      status: 'available',
      isSpecialNeedsDorm: false
    });

    const issueKey = await request(app)
      .post('/api/dorm/issue-key')
      .set(authHeader(proctorToken))
      .send({ dormId: dorm._id, issuedTo: student._id, keyNumber: 'KEY-1' });

    expect(issueKey.status).toBe(201);
    const keyId = issueKey.body.data.key._id;

    const returnKey = await request(app)
      .patch('/api/dorm/return-key')
      .set(authHeader(proctorToken))
      .send({ keyId });

    expect(returnKey.status).toBe(200);
  });
});
