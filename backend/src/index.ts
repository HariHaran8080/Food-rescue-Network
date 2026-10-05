import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { prisma } from './config/db';
import authRoutes from './routes/auth.routes';
import donationRoutes from './routes/donation.routes';
import claimRoutes from './routes/claim.routes';
import notificationRoutes from './routes/notification.routes';
import impactRoutes from './routes/impact.routes';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { initSockets } from './sockets';
import { startExpiryJob } from './jobs/expireDonations';

const app = express();
const server = http.createServer(app);

// Disable 'X-Powered-By: Express' header to prevent technology fingerprinting
app.disable('x-powered-by');

// Trust proxy if deployed behind a reverse proxy (e.g. Nginx, Cloudflare, AWS ALB)
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Hardened HTTP Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        connectSrc: ["'self'", env.CLIENT_URL, 'https://nominatim.openstreetmap.org', 'ws:', 'wss:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xFrameOptions: { action: 'deny' },
    xContentTypeOptions: true,
  })
);

// Strict CORS Configuration
const allowedOrigins = [env.CLIENT_URL];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, server-to-server) in non-production
      if (!origin && env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      if (origin && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Blocked by CORS policy'));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  })
);

// Request body size limits to prevent Denial of Service via large payloads
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Logging: dev format in development, minimal in production to avoid log pollution
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Apply global rate limiting to all /api routes
app.use('/api', apiLimiter);

// Sensitive routes: prevent caching of private user data and tokens
app.use('/api/auth', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
}, authRoutes);

app.use('/api/donations', donationRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/impact', impactRoutes);

// Global Error Handler
app.use(errorHandler);

// Initialize WebSockets and Scheduled Jobs
initSockets(server, env.CLIENT_URL);
startExpiryJob();

server.listen(env.PORT, () => {
  console.log(`Food Rescue Network API running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown handling
function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP and WebSocket server closed.');
    try {
      await prisma.$disconnect();
      console.log('Database connection pool disconnected.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database disconnect:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if graceful fails
  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
