import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/vibe',

  // Upstash Redis (REST-based, no raw TCP connection needed)
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',

  JWT_SECRET: process.env.JWT_SECRET || 'supersecret_vibe_jwt_key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'supersecret_vibe_refresh_key',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '30d',

  CLOUDFLARE_APP_ID: process.env.CLOUDFLARE_APP_ID || 'mock_app_id',
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || 'mock_api_token',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',

  FRONTEND_URL: process.env.FRONTEND_URL || 'https://vibelly.fun',
};
