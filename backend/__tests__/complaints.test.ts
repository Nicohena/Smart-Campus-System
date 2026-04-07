import request from 'supertest';
import app from '../server';
import { createAndLogin, authHeader } from './helpers/testUtils';

describe('Complaints System Module', () => {
  it('should allow student to submit complaint and view own complaints', async () => {
    const { token: studentToken } = await createAndLogin(app, 'student');

    const submit = await request(app)
      .post('/api/complaints')
      .set(authHeader(studentToken))
      .send({ category: 'cafeteria', title: 'Cafeteria', description: 'Food quality issue' });

    expect(submit.status).toBe(201);

    const myComplaints = await request(app)
      .get('/api/complaints/my')
      .set(authHeader(studentToken));

    expect(myComplaints.status).toBe(200);
    expect(myComplaints.body.data.complaints.length).toBe(1);
  });

  it('should reject invalid complaint submissions', async () => {
    const { token: studentToken } = await createAndLogin(app, 'student');

    const response = await request(app)
      .post('/api/complaints')
      .set(authHeader(studentToken))
      .send({ category: 'services' });

    expect(response.status).toBe(400);
  });

  it('should allow student union staff to update complaint status', async () => {
    const { token: studentToken } = await createAndLogin(app, 'student');
    const { token: unionToken } = await createAndLogin(app, 'student_union');

    const submit = await request(app)
      .post('/api/complaints')
      .set(authHeader(studentToken))
      .send({ category: 'library', title: 'Library', description: 'Noise complaint' });

    const complaintId = submit.body.data.complaint._id;

    const update = await request(app)
      .patch(`/api/complaints/${complaintId}/status`)
      .set(authHeader(unionToken))
      .send({ status: 'under_review' });

    expect(update.status).toBe(200);
  });
});
