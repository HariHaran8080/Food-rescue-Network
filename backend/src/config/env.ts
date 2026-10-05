import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
}).refine(
  (data) => {
    if (data.NODE_ENV === 'production') {
      const insecureSecrets = [
        'replace-with-a-long-random-secret',
        'secret',
        'password',
        '12345678',
        'use-a-strong-random-secret-key-at-least-32-chars-long',
      ];
      if (insecureSecrets.includes(data.JWT_SECRET) || data.JWT_SECRET.length < 32) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'In production mode, JWT_SECRET must be a cryptographically secure random string at least 32 characters long.',
    path: ['JWT_SECRET'],
  }
);

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('CRITICAL: Environment configuration error:');
  parsedEnv.error.issues.forEach((issue) => {
    console.error(` - [${issue.path.join('.')}] ${issue.message}`);
  });
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      NODE_ENV: (process.env.NODE_ENV as any) || 'development',
      PORT: Number(process.env.PORT) || 4000,
      DATABASE_URL: process.env.DATABASE_URL || '',
      JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-for-dev-only-min-16-chars',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    };
