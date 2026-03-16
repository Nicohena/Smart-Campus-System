import request from 'supertest';
import app from '../server';
import { createAndLogin, authHeader } from './helpers/testUtils';

describe('Campus Navigation Module', () => {
  it('should allow staff to create, update, and delete a location', async () => {
    const { token: staffToken } = await createAndLogin(app, 'staff');

    const create = await request(app)
      .post('/api/navigation')
      .set(authHeader(staffToken))
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
      .set(authHeader(staffToken))
      .send({ description: 'Updated description' });

    expect(update.status).toBe(200);

    const del = await request(app)
      .delete(`/api/navigation/${locationId}`)
      .set(authHeader(staffToken));

    expect(del.status).toBe(200);
  });

  it('should allow students to view locations', async () => {
    const { token: staffToken } = await createAndLogin(app, 'staff');
    const { token: studentToken } = await createAndLogin(app, 'student');

    await request(app)
      .post('/api/navigation')
      .set(authHeader(staffToken))
      .send({
        name: 'Cafeteria',
        description: 'Dining hall',
        category: 'services',
        building: 'C1',
        latitude: 9.03,
        longitude: 38.77
      });

    const list = await request(app).get('/api/navigation').set(authHeader(studentToken));
    expect(list.status).toBe(200);
    expect(list.body.data.locations.length).toBe(1);
  });

  it('should reject invalid location creation', async () => {
    const { token: staffToken } = await createAndLogin(app, 'staff');

    const response = await request(app)
      .post('/api/navigation')
      .set(authHeader(staffToken))
      .send({ name: 'Invalid' });

    expect(response.status).toBe(400);
  });
});
