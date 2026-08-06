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

// Security: Rate limiting for auth routes (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' },
});

// Security: Rate limiting for public contact form (spam protection)
const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent, please try again later.' },
});

// Security: Rate limiting for AI endpoints (prevent abuse)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
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

const messageSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  company: z.string().trim().optional().default(''),
  projectType: z.string().trim().optional().default('Short Form'),
  budgetRange: z.string().trim().optional().default('\u20b910,000 - \u20b925,000'),
  deadline: z.string().trim().optional().default(''),
  message: z.string().trim().min(1),
});
