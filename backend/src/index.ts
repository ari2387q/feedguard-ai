import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import summarizeRouter from './routes/summarize';
import analyzeRouter from './routes/analyze';
import userRouter from './routes/user';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: [
      'chrome-extension://*',
      'http://localhost:3000', // Next.js dashboard
      'http://localhost:5173', // Vite dev server
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/summarize', summarizeRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/user', userRouter);

/** Health-check endpoint */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Database & Server Start ──────────────────────────────────────────────────

/**
 * Connects to MongoDB and starts the Express server.
 * Falls back to running without a database if the URI is missing.
 */
async function start(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');
    } catch (err) {
      console.error('❌ MongoDB connection error:', err);
      console.warn('⚠️  Server will start without database connectivity.');
    }
  } else {
    console.warn('⚠️  MONGODB_URI not set — running without database.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 FeedGuard backend running on http://localhost:${PORT}`);
  });
}

start();

export default app;
