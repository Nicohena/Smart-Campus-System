import request from 'supertest';
import app from '../server';
import { createAndLogin, authHeader } from './helpers/testUtils';

describe('Lost ID Replacement Module', () => {
  it('should require authentication to submit lost ID request', async () => {
    const response = await request(app).post('/api/lost-id/request').send({});
    expect(response.status).toBe(401);
  });

  it('should allow student to submit lost ID request and fetch it', async () => {
    const { token } = await createAndLogin(app, 'student');

    const submit = await request(app)
      .post('/api/lost-id/request')
      .set(authHeader(token))
      .send({});

    expect(submit.status).toBe(201);

    const list = await request(app)
      .get('/api/lost-id/my-requests')
      .set(authHeader(token));

    expect(list.status).toBe(200);
    expect(list.body.data.requests.length).toBe(1);
  });

  it('should allow department staff to view all lost ID requests', async () => {
    const { token: studentToken } = await createAndLogin(app, 'student');
    const { token: departmentToken } = await createAndLogin(app, 'department');

    await request(app).post('/api/lost-id/request').set(authHeader(studentToken)).send({});

    const response = await request(app)
      .get('/api/lost-id')
      .set(authHeader(departmentToken));

    expect(response.status).toBe(200);
    expect(response.body.data.requests.length).toBe(1);
  });
});
