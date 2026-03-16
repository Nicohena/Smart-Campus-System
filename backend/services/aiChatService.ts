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
  'You are an AI assistant for a university campus management system.\n\n' +
  'Help students with questions about:\n' +
  '- ID replacement\n' +
  '- dorm allocation\n' +
  '- maintenance reporting\n' +
  '- complaints\n' +
  '- campus navigation\n' +
  '- device registration\n' +
  '- clearance process\n\n' +
  'Provide short and helpful answers.';

// Sends a student question to DeepSeek and returns the assistant reply.
export const askCampusAssistant = async (question: string): Promise<string> => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('DeepSeek API credentials are not configured');
  }

  const messages: DeepSeekMessage[] = [
    {
      role: 'system',
      content: SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: `Student question:\n${question.trim()}`
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

  const content = response.data?.choices?.[0]?.message?.content?.trim() || '';
  if (!content) {
    throw new Error('DeepSeek returned an empty response');
  }

  return content;
};
