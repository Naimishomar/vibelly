"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ENV = {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/vibe',
    // Upstash Redis (REST-based, no raw TCP connection needed)
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    JWT_SECRET: process.env.JWT_SECRET || 'supersecret_vibe_jwt_key',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'supersecret_vibe_refresh_key',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '30d',
    // TURN relay. Without it, any two peers behind symmetric NAT / mobile CGNAT
    // connect at the signaling layer (name shows) but no media flows (black video).
    // Cloudflare Realtime TURN:
    TURN_KEY_ID: process.env.TURN_KEY_ID || '',
    TURN_API_TOKEN: process.env.TURN_API_TOKEN || '',
    // ...or any static TURN (coturn, Metered, Twilio). Comma-separated urls.
    TURN_URLS: process.env.TURN_URLS || '',
    TURN_USERNAME: process.env.TURN_USERNAME || '',
    TURN_CREDENTIAL: process.env.TURN_CREDENTIAL || '',
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    FRONTEND_URL: process.env.FRONTEND_URL || 'https://vibelly.fun',
};
//# sourceMappingURL=env.js.map