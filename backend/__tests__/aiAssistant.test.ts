import request from 'supertest';
import axios from 'axios';
import app from '../server';
import { createAndLogin, authHeader } from './helpers/testUtils';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AI Campus Assistant Chat Module', () => {
  it('should reject unauthenticated chat requests', async () => {
    const response = await request(app).post('/api/assistant/chat').send({ message: 'Hi' });
    expect(response.status).toBe(401);
  });

  it('should return assistant reply using mocked DeepSeek', async () => {
    const { token } = await createAndLogin(app, 'student');
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        choices: [{ message: { content: 'Visit the registrar for ID replacement.' } }]
      }
    } as any);

    const response = await request(app)
      .post('/api/assistant/chat')
      .set(authHeader(token))
      .send({ message: 'How do I replace my lost ID?' });

    expect(response.status).toBe(200);
    expect(response.body.data?.reply).toBeTruthy();
  });

  it('should return fallback reply when DeepSeek responds with 402', async () => {
    const { token } = await createAndLogin(app, 'student');
    mockedAxios.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 402 },
      message: 'Payment Required'
    } as any);

    const response = await request(app)
      .post('/api/assistant/chat')
      .set(authHeader(token))
      .send({ message: "where do i go to fix dorms' electrical issue" });

    expect(response.status).toBe(200);
    expect(response.body.data?.reply).toMatch(/dorm|maintenance/i);
  });
});
