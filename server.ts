import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';
import { dbManager } from './src/lib/db';
import { storageProvider } from './src/lib/storage';
import { User, UserRole } from './src/types';
import { generateText, generateFromPrompt } from './src/lib/openrouter';

const PORT = Number(process.env.PORT || 3000);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' },
});

const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent, please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests, please slow down.' },
});

const REQUIRED_JWT_SECRET = process.env.JWT_SECRET;

if (!REQUIRED_JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET must be set in production.');
    process.exit(1);
  }
  console.warn('JWT_SECRET is not set; using an insecure dev-only fallback.');
}

const JWT_SECRET = REQUIRED_JWT_SECRET || 'dev-only-insecure-jwt-secret-change-me';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// NOTE: Full restore in progress - see following commit for complete file body.
export async function createApp() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));
  app.use(cookieParser());
  return app;
}

if (!process.env.VERCEL) {
  createApp().then((app) => {
    app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => {
      console.log('Vision Fold Creative Server running');
    });
  });
}
