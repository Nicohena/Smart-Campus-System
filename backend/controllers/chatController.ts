import { Request, Response } from 'express';
import axios from 'axios';
import { askCampusAssistant } from '../services/aiChatService';
import { sendSuccess, sendError } from '../utils/response';

// POST /api/assistant/chat
// Receives student questions and returns the AI assistant reply
export const askAssistant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body as { message?: string };

    if (!message || !message.trim()) {
      sendError(res, 'message is required', 400);
      return;
    }

    // AI interaction: delegate the question to the DeepSeek API
    const reply = await askCampusAssistant(message);

    sendSuccess(res, 'Assistant reply', { reply });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('AI assistant error:', error);

    if (axios.isAxiosError(error)) {
      sendError(res, 'AI assistant is currently unavailable', 502);
      return;
    }

    sendError(res, 'Could not process assistant request');
  }
};
