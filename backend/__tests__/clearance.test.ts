import request from 'supertest';
import app from '../server';
import { createAndLogin, authHeader } from './helpers/testUtils';

describe('Clearance System Module', () => {
  it('should reject clearance request without academic year', async () => {
    const { token } = await createAndLogin(app, 'student');

    const response = await request(app)
      .post('/api/clearance/request')
      .set(authHeader(token))
      .send({});

    expect(response.status).toBe(400);
  });

  it('should allow student to request clearance and view records', async () => {
    const { token } = await createAndLogin(app, 'student');

    const requestRes = await request(app)
      .post('/api/clearance/request')
      .set(authHeader(token))
      .send({ academicYear: '2024/2025' });

    expect(requestRes.status).toBe(201);

    const listRes = await request(app)
      .get('/api/clearance/my-clearance')
      .set(authHeader(token));

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.records.length).toBe(1);
  });

  it('should allow proctor staff to view all clearance requests', async () => {
    const { token: studentToken } = await createAndLogin(app, 'student');
    const { token: proctorToken } = await createAndLogin(app, 'proctor');

    await request(app)
      .post('/api/clearance/request')
      .set(authHeader(studentToken))
      .send({ academicYear: '2024/2025' });

    const response = await request(app)
      .get('/api/clearance')
      .set(authHeader(proctorToken));

    expect(response.status).toBe(200);
    expect(response.body.data.records.length).toBe(1);
  });
});
