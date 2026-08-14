import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRouter from './routes/auth.js';
import boardsRouter from './routes/boards.js';
import tasksRouter from './routes/tasks.js';
import aiRouter from './routes/ai.js';
import { apiWriteRateLimiter } from './middleware/rateLimiter.js';

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((url) => url.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Authentication Routes
app.use('/auth', authRouter);

// Domain Resource Routes (Workspace Scoped & Rate-Limited on Write)
app.use('/boards', apiWriteRateLimiter, boardsRouter);
app.use('/tasks', apiWriteRateLimiter, tasksRouter);

// AI Layer Routes (Claude API Integration)
app.use('/ai', apiWriteRateLimiter, aiRouter);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('[Production Error Handler]:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error occurred.' : err.message
  });
});

export default app;
