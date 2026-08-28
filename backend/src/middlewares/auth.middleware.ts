import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import User from '../models/User';

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized: Malformed token' });
      return;
    }
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Forbidden: Your account has been banned' });
      return;
    }

    // Lazy check for premium expiry
    if (user.premiumStatus && user.premiumExpiryDate && new Date() > user.premiumExpiryDate) {
      user.premiumStatus = false;
      await user.save();
    }

    // @ts-ignore
    req.user = user;
    next();
  } catch (error) {
    console.error('[requireAuth] Error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user: any = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not authenticated' });
      return;
    }
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error checking admin status' });
  }
};
