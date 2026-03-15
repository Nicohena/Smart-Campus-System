import axios from 'axios';

interface DeepSeekMessage {
  role: 'system' | 'user';
  content: string;
}

interface DeepSeekResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

// Send summarized campus data to DeepSeek and return insights
export const generateCampusInsights = async (summary: string): Promise<string[]> => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('DeepSeek API credentials are not configured');
  }

  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content: 'You are a university campus data analyst.'
    },
    {
      role: 'user',
      content:
        'Analyze the following campus operational data and generate insights.\n\n' +
        'Provide:\n' +
        '1. Most common campus problems\n' +
        '2. Dorm blocks with the highest issues\n' +
        '3. Complaint trends\n' +
        '4. Maintenance recommendations\n' +
        '5. Administrative suggestions\n\n' +
        `Data:\n${summary}`
    }
  ];

  const response = await axios.post<DeepSeekResponse>(
    apiUrl,
    {
      model: 'deepseek-chat',
      messages,
      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    }
  );

  const content = response.data?.choices?.[0]?.message?.content || '';
  const insights = content
    .split('\n')
    .map((line) => line.replace(/^[-*\d.]+\s*/, '').trim())
    .filter(Boolean);

  return insights.length > 0 ? insights : [content.trim()].filter(Boolean);
};
