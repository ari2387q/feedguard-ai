import cors from 'cors';

export const corsMiddleware = cors({
  origin: [
    'chrome-extension://*',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
});