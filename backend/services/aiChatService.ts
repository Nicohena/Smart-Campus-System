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

const DEFAULT_FALLBACK_REPLY =
  'The AI assistant is temporarily unavailable. For dorm electrical issues, submit a maintenance report through the dorm/maintenance office and include your dorm, room number, and issue details.';

const buildFallbackReply = (question: string): string => {
  const normalized = question.toLowerCase();
  const isDormMaintenanceQuestion =
    normalized.includes('dorm') ||
    normalized.includes('electrical') ||
    normalized.includes('maintenance') ||
    normalized.includes('power') ||
    normalized.includes('light');

  if (isDormMaintenanceQuestion) {
    return 'For dorm electrical issues, submit a maintenance report to the dorm maintenance office and include your dorm, room number, and issue details for faster handling.';
  }

  return DEFAULT_FALLBACK_REPLY;
};

// Sends a student question to DeepSeek and returns the assistant reply.
export const askCampusAssistant = async (question: string): Promise<string> => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl = process.env.DEEPSEEK_API_URL;

  if (!apiKey || !apiUrl) {
    return buildFallbackReply(question);
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

  try {
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
      return buildFallbackReply(question);
    }

    return content;
  } catch (error) {
    const maybeError = error as {
      response?: { status?: number };
      code?: string;
      isAxiosError?: boolean;
    };
    const status = maybeError?.response?.status;
    const code = maybeError?.code;
    const isAxiosLike = axios.isAxiosError(error) || maybeError?.isAxiosError === true;

    if (isAxiosLike) {
      // Billing / quota / upstream temporary issues should not break UX.
      if (status === 402 || status === 429 || (status !== undefined && status >= 500)) {
        return buildFallbackReply(question);
      }

      // Timeouts and network errors also receive fallback guidance.
      if (code === 'ECONNABORTED' || code === 'ENOTFOUND' || code === 'ECONNRESET') {
        return buildFallbackReply(question);
      }
    }

    throw error;
  }
};
