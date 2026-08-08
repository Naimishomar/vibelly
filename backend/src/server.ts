import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import { Redis } from '@upstash/redis';
import { ENV } from './config/env';
import authRoutes from './routes/auth.routes';
import webrtcRoutes from './routes/webrtc.routes';
import paymentRoutes from './routes/payment.routes';
import userRoutes from './routes/user.routes';
import oauthRoutes from './routes/oauth.routes';
import uploadRoutes from './routes/upload.routes';
import chatRoutes from './routes/chat.routes';
import groupRoutes from './routes/group.routes';
import adminRoutes from './routes/admin.routes';
import blogRoutes from './routes/blog.routes';
import sitemapRoutes from './routes/sitemap.routes';
import analyticsRoutes from './routes/analytics.routes';
import settingsRoutes from './routes/settings.routes';
import referralRoutes from './routes/referral.routes';
import creatorRoutes from './routes/creator.routes';
import passport from './config/passport';

import hpp from 'hpp';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
const httpServer = createServer(app);

// CORS config
const corsOptions = {
  origin: [
    'https://vibelly.fun',
    'https://www.vibelly.fun',
    'https://vibelly.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Security Hardening
app.use(hpp());

// Rate Limiting (500 requests per 10 minutes per IP)
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 500,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Compression middleware (compresses API responses for slow networks)
app.use(compression());
// Apply CORS before helmet to ensure preflight OPTIONS passes through cleanly
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicitly handle preflight for all routes
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resource loading (needed for R2 uploads)
}));
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/webrtc', webrtcRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/sitemap.xml', sitemapRoutes);


app.get("/", (req,res)=>{
  res.send("Vibelly never gets down🚀🚀");
})

// ─── Database Connection ───
export const connectDB = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// ─── Upstash Redis (HTTP REST — no connect() needed) ───
export const redisClient = new Redis({
  url: ENV.UPSTASH_REDIS_REST_URL,
  token: ENV.UPSTASH_REDIS_REST_TOKEN,
});

export const connectRedis = async () => {
  // Upstash is HTTP-based — no persistent TCP connection required.
  // We do a quick ping to confirm credentials are valid.
  try {
    await redisClient.ping();
    console.log('✅ Upstash Redis connected');
  } catch (err) {
    console.error('❌ Upstash Redis error:', err);
    process.exit(1);
  }
};

// ─── Socket.io ───
export const io = new Server(httpServer, {
  cors: corsOptions,
});

export { httpServer, app };
