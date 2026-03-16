import request from 'supertest';
import axios from 'axios';
import app from '../server';
import { createAndLogin, authHeader } from './helpers/testUtils';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AI Analytics Module', () => {
  it('should require staff/admin for analytics endpoints', async () => {
    const { token } = await createAndLogin(app, 'student');

    const response = await request(app)
      .get('/api/analytics/dashboard')
      .set(authHeader(token));

    expect(response.status).toBe(403);
  });

  it('should return AI insights with mocked DeepSeek', async () => {
    const { token } = await createAndLogin(app, 'staff');
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        choices: [{ message: { content: '1. Insight A\n2. Insight B' } }]
      }
    } as any);

    const response = await request(app)
      .get('/api/analytics/ai-insights')
      .set(authHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.data.insights.length).toBeGreaterThan(0);
  });
});
