import request from 'supertest';
import axios from 'axios';
import app from '../server';
import { createAndLogin, authHeader } from './helpers/testUtils';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AI Predictive Maintenance Module', () => {
  it('should restrict predictions to staff/admin', async () => {
    const { token } = await createAndLogin(app, 'student');

    const response = await request(app)
      .get('/api/predictions/maintenance')
      .set(authHeader(token));

    expect(response.status).toBe(403);
  });

  it('should return predictions using mocked DeepSeek', async () => {
    const { token } = await createAndLogin(app, 'admin');
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        choices: [{ message: { content: '1. Block C risk\n2. Check plumbing' } }]
      }
    } as any);

    const response = await request(app)
      .get('/api/predictions/maintenance')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.predictions.length).toBeGreaterThan(0);
  });
});
