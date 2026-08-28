"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
const passport_apple_1 = __importDefault(require("passport-apple"));
const User_1 = __importDefault(require("../models/User"));
const generateUniqueUsername = (name) => {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
    return `${base}_${Math.floor(Math.random() * 10000)}`;
};
// Generic Find or Create handler
const handleOAuthUser = async (providerField, profile, done) => {
    try {
        const id = profile.id || profile.sub;
        const email = profile.emails?.[0]?.value || `${id}@${String(providerField).replace('Id', '')}.mock`;
        const name = profile.displayName || profile.name?.givenName || 'OAuth User';
        const profileImage = profile.photos?.[0]?.value || '';
        // Check if user exists by provider ID or Email
        let user = await User_1.default.findOne({
            $or: [
                { [providerField]: id },
                { email }
            ]
        });
        if (user) {
            // If found by email but missing provider ID, link them
            if (!user.get(providerField)) {
                user.set(providerField, id);
                await user.save();
            }
            return done(null, user);
        }
        // Create new user
        user = new User_1.default({
            name,
            username: generateUniqueUsername(name),
            email,
            [providerField]: id,
            profileImage
        });
        await user.save();
        return done(null, user);
    }
    catch (error) {
        return done(error, null);
    }
};
// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id') {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production' ? 'https://api.vibelly.fun/api/oauth/google/callback' : `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/oauth/google/callback`
    }, (_accessToken, _refreshToken, profile, done) => {
        handleOAuthUser('googleId', profile, done);
    }));
}
// GitHub Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your_github_client_id') {
    passport_1.default.use(new passport_github2_1.Strategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production' ? 'https://api.vibelly.fun/api/oauth/github/callback' : `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/oauth/github/callback`,
        scope: ['user:email']
    }, (_accessToken, _refreshToken, profile, done) => {
        handleOAuthUser('githubId', profile, done);
    }));
}
// Apple Strategy
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_ID !== 'your_apple_client_id') {
    passport_1.default.use(new passport_apple_1.default({
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyString: process.env.APPLE_PRIVATE_KEY,
        callbackURL: '/api/oauth/apple/callback'
    }, (_accessToken, _refreshToken, _idToken, profile, done) => {
        // Apple profile is minimal, usually we rely on idToken decoded payload
        // But for mock/structure we pass it
        handleOAuthUser('appleId', profile, done);
    }));
}
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map