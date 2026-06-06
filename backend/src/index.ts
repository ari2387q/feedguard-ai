import express from 'express';
import { corsMiddleware } from './middleware/corsconfig';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import summarizeRouter from './routes/summarize';
import analyzeRouter from './routes/analyze';
import userRouter from './routes/user';
import spamRouter from './routes/spam';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));

app.use('/api/summarize', summarizeRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/user', userRouter);
app.use('/api/spam', spamRouter);
/** Root route for quick browser checks */
app.get('/', (_req, res) => {
  res.json({ status: 'FeedGuard backend', api: '/api/health' });
});

/** Health-check endpoint */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
