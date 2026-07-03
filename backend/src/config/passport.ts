import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import AppleStrategy from 'passport-apple';
import User, { IUser } from '../models/User';
import { ENV } from './env';

const generateUniqueUsername = (name: string) => {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  return `${base}_${Math.floor(Math.random() * 10000)}`;
};

// Generic Find or Create handler
const handleOAuthUser = async (providerField: keyof IUser, profile: any, done: any) => {
  try {
    const id = profile.id || profile.sub;
    const email = profile.emails?.[0]?.value || `${id}@${String(providerField).replace('Id', '')}.mock`;
    const name = profile.displayName || profile.name?.givenName || 'OAuth User';
    const profileImage = profile.photos?.[0]?.value || '';

    // Check if user exists by provider ID or Email
    let user = await User.findOne({ 
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
    user = new User({
      name,
      username: generateUniqueUsername(name),
      email,
      [providerField]: id,
      profileImage
    });

    await user.save();
    return done(null, user);

  } catch (error) {
    return done(error, null);
  }
};

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id') {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: process.env.NODE_ENV === 'production' ? 'https://api.vibelly.fun/api/oauth/google/callback' : `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/oauth/google/callback`
    }, (accessToken, refreshToken, profile, done) => {
        handleOAuthUser('googleId', profile, done);
    }));
}

// GitHub Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your_github_client_id') {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        callbackURL: process.env.NODE_ENV === 'production' ? 'https://api.vibelly.fun/api/oauth/github/callback' : `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/oauth/github/callback`,
        scope: ['user:email']
    }, (accessToken: string, refreshToken: string, profile: any, done: any) => {
        handleOAuthUser('githubId', profile, done);
    }));
}

// Apple Strategy
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_ID !== 'your_apple_client_id') {
    passport.use(new AppleStrategy({
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID as string,
        keyID: process.env.APPLE_KEY_ID as string,
        privateKeyString: process.env.APPLE_PRIVATE_KEY as string,
        callbackURL: '/api/oauth/apple/callback'
    }, (accessToken, refreshToken, idToken, profile, done) => {
        // Apple profile is minimal, usually we rely on idToken decoded payload
        // But for mock/structure we pass it
        handleOAuthUser('appleId', profile, done);
    }));
}

export default passport;
