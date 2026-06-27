import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import subscriptionRoutes from './routes/subscription.routes';
import promotionRoutes from './routes/promotion.routes';
import adminRoutes from './routes/admin.routes';
import profileRoutes from './routes/profile.routes';
import careerRoutes from './routes/career.routes';
import { errorHandler, notFound } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT ?? 5000;

// ─── Global Middleware ────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',');

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

import passport from './middleware/passport';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/admin', adminRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV ?? 'development'}`);
});

export default app;
