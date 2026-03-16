import request from 'supertest';
import app from '../server';
import { createAndLogin, authHeader } from './helpers/testUtils';

describe('Notice System Module', () => {
  it('should allow staff to create, update, and delete a notice', async () => {
    const { token: staffToken } = await createAndLogin(app, 'staff');

    const create = await request(app)
      .post('/api/notices')
      .set(authHeader(staffToken))
      .send({
        title: 'Maintenance Window',
        description: 'Power maintenance on Saturday',
        category: 'general',
        targetAudience: 'all_students'
      });

    expect(create.status).toBe(201);
    const noticeId = create.body.data.notice._id;

    const update = await request(app)
      .patch(`/api/notices/${noticeId}`)
      .set(authHeader(staffToken))
      .send({ title: 'Updated Maintenance Window' });

    expect(update.status).toBe(200);

    const del = await request(app)
      .delete(`/api/notices/${noticeId}`)
      .set(authHeader(staffToken));

    expect(del.status).toBe(200);
  });

  it('should allow students to view notices', async () => {
    const { token: staffToken } = await createAndLogin(app, 'staff');
    const { token: studentToken } = await createAndLogin(app, 'student');

    await request(app)
      .post('/api/notices')
      .set(authHeader(staffToken))
      .send({
        title: 'Dorm Notice',
        description: 'Check-in deadline',
        category: 'general',
        targetAudience: 'all_students'
      });

    const list = await request(app).get('/api/notices').set(authHeader(studentToken));
    expect(list.status).toBe(200);
    expect(list.body.data.notices.length).toBe(1);
  });

  it('should prevent students from creating notices', async () => {
    const { token: studentToken } = await createAndLogin(app, 'student');

    const response = await request(app)
      .post('/api/notices')
      .set(authHeader(studentToken))
      .send({
        title: 'Unauthorized',
        description: 'Should fail',
        category: 'general',
        targetAudience: 'all_students'
      });

    expect(response.status).toBe(403);
  });
});
