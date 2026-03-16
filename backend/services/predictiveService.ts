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

const SYSTEM_PROMPT =
  'You are an AI campus maintenance analyst.\n\n' +
  'Analyze the maintenance data and predict future issues.\n\n' +
  'Provide:\n' +
  '1. Dorm blocks likely to experience problems\n' +
  '2. Most probable issue types\n' +
  '3. Maintenance recommendations\n' +
  '4. Preventive actions for administrators';

// Sends maintenance summary data to DeepSeek and returns predictions text.
export const generateMaintenancePredictions = async (summary: string): Promise<string> => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('DeepSeek API credentials are not configured');
  }

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Data:\n${summary}` }
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

  const content = response.data?.choices?.[0]?.message?.content?.trim() || '';
  if (!content) {
    throw new Error('DeepSeek returned an empty response');
  }

  return content;
};
