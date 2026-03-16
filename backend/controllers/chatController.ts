import { Request, Response } from 'express';
import axios from 'axios';
import { askCampusAssistant } from '../services/aiChatService';

// POST /api/assistant/chat
// Receives student questions and returns the AI assistant reply
export const askAssistant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body as { message?: string };

    if (!message || !message.trim()) {
      res.status(400).json({ message: 'message is required' });
      return;
    }

    // AI interaction: delegate the question to the DeepSeek API
    const reply = await askCampusAssistant(message);

    res.status(200).json({ reply });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('AI assistant error:', error);

    if (axios.isAxiosError(error)) {
      res.status(502).json({ message: 'AI assistant is currently unavailable' });
      return;
    }

    res.status(500).json({ message: 'Could not process assistant request' });
  }
};
