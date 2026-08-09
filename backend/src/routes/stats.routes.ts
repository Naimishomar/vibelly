import { Router } from 'express';
import { redisClient } from '../server';

const router = Router();

// Answer preflight for any foreign origin, then let the strict CORS middleware
// above stay untouched for the rest of the API.
router.all('*', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Public live counter — powers the embeddable "people online" widget that other
// sites embed. Returns a plain JSON count so any origin can read it.
router.get('/online', async (_req, res) => {
  try {
    const count = await redisClient.hlen('online:users');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ online: typeof count === 'number' ? count : Number(count) || 0 });
  } catch (error) {
    console.error('Error fetching online count:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ online: 0 });
  }
});

export default router;
