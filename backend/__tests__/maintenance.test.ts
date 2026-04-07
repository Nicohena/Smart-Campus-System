import request from 'supertest';
import app from '../server';
import { createAndLogin, authHeader } from './helpers/testUtils';

describe('Maintenance / Issue Reporting Module', () => {
  it('should allow student to report issue and view own issues', async () => {
    const { token: studentToken } = await createAndLogin(app, 'student');

    const report = await request(app)
      .post('/api/issues/report')
      .set(authHeader(studentToken))
      .send({ issueType: 'water', description: 'Leaky faucet' });

    expect(report.status).toBe(201);

    const myIssues = await request(app)
      .get('/api/issues/my-issues')
      .set(authHeader(studentToken));

    expect(myIssues.status).toBe(200);
    expect(myIssues.body.data.issues.length).toBe(1);
  });

  it('should reject invalid issue submissions', async () => {
    const { token: studentToken } = await createAndLogin(app, 'student');

    const response = await request(app)
      .post('/api/issues/report')
      .set(authHeader(studentToken))
      .send({ issueType: 'water' });

    expect(response.status).toBe(400);
  });

  it('should allow proctor staff to view and assign issues', async () => {
    const { token: studentToken } = await createAndLogin(app, 'student');
    const { token: proctorToken, user: proctorUser } = await createAndLogin(app, 'proctor');

    const report = await request(app)
      .post('/api/issues/report')
      .set(authHeader(studentToken))
      .send({ issueType: 'power', description: 'Power outage' });

    const issueId = report.body.data.issue._id;

    const list = await request(app).get('/api/issues').set(authHeader(proctorToken));
    expect(list.status).toBe(200);

    const assign = await request(app)
      .patch(`/api/issues/${issueId}/assign`)
      .set(authHeader(proctorToken))
      .send({ assignedTechnician: proctorUser._id });

    expect(assign.status).toBe(200);
  });
});
