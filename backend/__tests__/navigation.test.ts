import request from 'supertest';
import app from '../server';
import { createAndLogin, authHeader } from './helpers/testUtils';

describe('Campus Navigation Module', () => {
  it('should allow admin to create, update, and delete a location', async () => {
    const { token: adminToken } = await createAndLogin(app, 'admin');

    const create = await request(app)
      .post('/api/navigation')
      .set(authHeader(adminToken))
      .send({
        name: 'Library',
        description: 'Main campus library',
        category: 'academic',
        building: 'B1',
        latitude: 9.02,
        longitude: 38.76
      });

    expect(create.status).toBe(201);
    const locationId = create.body.data.location._id;

    const update = await request(app)
      .patch(`/api/navigation/${locationId}`)
      .set(authHeader(adminToken))
      .send({ description: 'Updated description' });

    expect(update.status).toBe(200);

    const del = await request(app)
      .delete(`/api/navigation/${locationId}`)
      .set(authHeader(adminToken));

    expect(del.status).toBe(200);
  });

  it('should allow students to view locations', async () => {
    const { token: adminToken } = await createAndLogin(app, 'admin');
    const { token: studentToken } = await createAndLogin(app, 'student');

    await request(app)
      .post('/api/navigation')
      .set(authHeader(adminToken))
      .send({
        name: 'Cafeteria',
        description: 'Dining hall',
        category: 'service',
        building: 'C1',
        latitude: 9.03,
        longitude: 38.77
      });

    const list = await request(app).get('/api/navigation').set(authHeader(studentToken));
    expect(list.status).toBe(200);
    expect(list.body.data.locations.length).toBe(1);
  });

  it('should reject invalid location creation', async () => {
    const { token: adminToken } = await createAndLogin(app, 'admin');

    const response = await request(app)
      .post('/api/navigation')
      .set(authHeader(adminToken))
      .send({ name: 'Invalid' });

    expect(response.status).toBe(400);
  });
});
