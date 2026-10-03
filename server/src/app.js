import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import storeRoutes from './routes/stores.js';
import ownerRoutes from './routes/owner.js';
import { errorHandler } from './utils/errors.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '20kb' }));
app.use(
  '/api/auth',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false })
);
app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/owner', ownerRoutes);
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found', errors: [] })
);
app.use(errorHandler);
export default app;
