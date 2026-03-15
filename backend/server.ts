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

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app: Application = express();

// Connect to MongoDB (reads MONGO_URI from process.env)
connectDB();

// Basic middleware
// Parse incoming JSON requests
app.use(express.json());
// Parse cookies for refresh token handling
app.use(cookieParser());
// Enable CORS for cross-origin requests
app.use(cors());

// Register routes
// Authentication routes mounted at /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/lost-id', lostIdRoutes);
app.use('/api/clearance', clearanceRoutes);
app.use('/api/dorm', dormRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/complaints', complaintRoutes);

// (No global error handler middleware - removed per cleanup request)

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
