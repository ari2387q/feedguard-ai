import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {

    if (!origin) return callback(null, true);

    if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
});