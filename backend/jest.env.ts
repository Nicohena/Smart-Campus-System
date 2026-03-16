process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || 'test-deepseek-key';
process.env.DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'http://deepseek.test/v1/chat/completions';
