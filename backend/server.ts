// Entry point: backend/server.ts
// - Loads environment variables
// - Connects to MongoDB
// - Sets up middleware (JSON parser, CORS)
// - Registers routes
// - Exports the Express `app` for testing

import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth';
import lostIdRoutes from './routes/lostIdRoutes';
import clearanceRoutes from './routes/clearanceRoutes';
import dormRoutes from './routes/dormRoutes';
import issueRoutes from './routes/issueRoutes';
import complaintRoutes from './routes/complaintRoutes';
import noticeRoutes from './routes/noticeRoutes';
import deviceRoutes from './routes/deviceRoutes';
import navigationRoutes from './routes/navigationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import chatRoutes from './routes/chatRoutes';
import predictiveRoutes from './routes/predictiveRoutes';

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app: Application = express();

// Connect to MongoDB (reads MONGO_URI from process.env)
// Skip auto-connect during tests to allow the test harness to manage connections.
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Basic middleware
// Parse incoming JSON requests
app.use(express.json());
// Parse cookies for refresh token handling
app.use(cookieParser());
// Enable CORS - allow configured origins and pass cookies (credentials)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true, // Required so the browser sends / receives the refreshToken cookie
  })
);

// Register routes
// Authentication routes mounted at /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/lost-id', lostIdRoutes);
app.use('/api/clearance', clearanceRoutes);
app.use('/api/dorm', dormRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assistant', chatRoutes);
app.use('/api/predictions', predictiveRoutes);

// Global error-handling middleware (must have 4 params so Express recognises it as error handler)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Export the app for testing purposes
export default app;

// Start server if this file is executed directly
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
  });
}
