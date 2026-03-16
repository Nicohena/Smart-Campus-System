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

  it('should allocate dorm to student and allow student to view assigned dorm', async () => {
    const { user: student, token: studentToken } = await createAndLogin(app, 'student');
    const { token: staffToken } = await createAndLogin(app, 'staff');

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
      .set(authHeader(staffToken))
      .send({ studentId: student.studentId, yearLevel: 'freshman' });

    expect(allocate.status).toBe(201);
    const dormId = allocate.body.data.dorm._id;

    const myDorm = await request(app)
      .get('/api/dorm/my-dorm')
      .set(authHeader(studentToken));

    expect(myDorm.status).toBe(200);
    expect(myDorm.body.data.dorm._id).toBe(dormId);
  });

  it('should issue and return a dorm key', async () => {
    const { user: student } = await createAndLogin(app, 'student');
    const { token: staffToken } = await createAndLogin(app, 'staff');

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
      .set(authHeader(staffToken))
      .send({ dormId: dorm._id, issuedTo: student._id, keyNumber: 'KEY-1' });

    expect(issueKey.status).toBe(201);
    const keyId = issueKey.body.data.key._id;

    const returnKey = await request(app)
      .patch('/api/dorm/return-key')
      .set(authHeader(staffToken))
      .send({ keyId });

    expect(returnKey.status).toBe(200);
  });
});
