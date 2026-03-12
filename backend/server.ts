// Entry point: backend/server.ts
// - Loads environment variables
// - Connects to MongoDB
// - Sets up middleware (JSON parser, CORS)
// - Registers routes
// - Exports the Express `app` for testing

import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import testRoutes from './routes/test';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app: Application = express();

// Connect to MongoDB (reads MONGO_URI from process.env)
connectDB();

// Basic middleware
// Parse incoming JSON requests
app.use(express.json());
// Enable CORS for cross-origin requests
app.use(cors());

// Register routes
// Mounts the test route at /api/test
app.use('/api/test', testRoutes);

// Authentication routes mounted at /api/auth
app.use('/api/auth', authRoutes);

// Global error handler
app.use(errorHandler);

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
