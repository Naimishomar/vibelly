import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import User from '../models/User';
import LivePayment from '../models/LivePayment';
import CreatorProfile from '../models/CreatorProfile';
import ProfileSubscription from '../models/ProfileSubscription';
import { requireAuth } from '../middlewares/auth.middleware';
import { getLiveRoom } from '../socket/liveRooms';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: ENV.RAZORPAY_KEY_ID,
  key_secret: ENV.RAZORPAY_KEY_SECRET,
});

router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    // VALIDATION: Prevent users from passing arbitrary amounts (e.g. 1 INR) to get premium.
    const validAmounts = [9, 49, 499];
    if (!amount || typeof amount !== 'number' || !validAmounts.includes(amount)) {
      return res.status(400).json({ error: 'Invalid or missing amount' });
    }

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: `receipt_order_${Math.floor(Math.random() * 1000)}`,
      notes: {
        userId: (req as any).user.id
      }
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating razorpay order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", ENV.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is successful, upgrade user to premium
      const user = await User.findById((req as any).user.id);
      if (user) {
        // Fetch order to verify the exact amount paid against our system
        const order = await razorpay.orders.fetch(razorpay_order_id);
        const amountPaid = (order as any).amount / 100;
        
        let daysToAdd = 0;
        
        // STRICT MAPPING: Only award days if the amount precisely matches our known plans
        if (amountPaid === 9) daysToAdd = 1;
        else if (amountPaid === 49) daysToAdd = 30;
        else if (amountPaid === 499) daysToAdd = 365;
        else {
          console.error(`Invalid payment amount detected: ${amountPaid} for user ${user._id}`);
          return res.status(400).json({ success: false, message: "Invalid payment amount detected." });
        }

        user.premiumStatus = true;
        
        const now = new Date();
        if (user.premiumExpiryDate && user.premiumExpiryDate > now) {
          // Add to existing premium duration
          const newExpiry = new Date(user.premiumExpiryDate);
          newExpiry.setDate(newExpiry.getDate() + daysToAdd);
          user.premiumExpiryDate = newExpiry;
        } else {
          // Set new premium expiry
          const newExpiry = new Date();
          newExpiry.setDate(newExpiry.getDate() + daysToAdd);
          user.premiumExpiryDate = newExpiry;
        }
        
        await user.save();
      }
      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature sent!" });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// ─── Live Stream Subscriptions ───
// Viewer pays to unlock a creator's paid live room. Split: 70% creator / 30% platform.

const signLiveAccessToken = (viewerId: string, roomCode: string) => {
  return jwt.sign(
    { type: 'live-access', viewerId, roomCode },
    ENV.JWT_SECRET,
    { expiresIn: '12h' }
  );
};

// Check access for a room (already paid?) without charging again.
router.get('/live/access/:roomCode', requireAuth, async (req, res) => {
  try {
    const roomCode = String(req.params.roomCode || '').trim().toUpperCase();
    const room = getLiveRoom(roomCode);
    if (!room) return res.status(404).json({ error: 'Stream not found' });
    if (room.price <= 0) {
      return res.json({ access: true, price: 0, token: null });
    }
    // Creator always has access to their own room.
    if (room.creatorUserId && room.creatorUserId === (req as any).user.id) {
      return res.json({ access: true, price: room.price, token: null });
    }
    const paid = await LivePayment.findOne({
      viewer: (req as any).user.id,
      roomCode,
      status: 'paid',
    }).lean();
    if (paid) {
      return res.json({ access: true, price: room.price, token: signLiveAccessToken((req as any).user.id, roomCode) });
    }
    res.json({ access: false, price: room.price, token: null });
  } catch (error) {
    console.error('Error checking live access:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
});

// Create a Razorpay order for a paid live room.
router.post('/live/create-order', requireAuth, async (req, res) => {
  try {
    const roomCode = ((req.body || {}).roomCode || '').trim().toUpperCase();
    const room = getLiveRoom(roomCode);
    if (!room) return res.status(404).json({ error: 'Stream not found' });
    if (!room.price || room.price <= 0) {
      return res.status(400).json({ error: 'This stream is free to watch' });
    }
    if (!room.creatorUserId) {
      return res.status(400).json({ error: 'Creator is not registered for payouts' });
    }
    if (room.creatorUserId === (req as any).user.id) {
      return res.status(400).json({ error: 'You cannot pay for your own stream' });
    }

    const alreadyPaid = await LivePayment.findOne({
      viewer: (req as any).user.id,
      roomCode,
      status: 'paid',
    }).lean();
    if (alreadyPaid) {
      return res.json({
        alreadyPaid: true,
        token: signLiveAccessToken((req as any).user.id, roomCode),
      });
    }

    const options = {
      amount: room.price * 100, // paise
      currency: 'INR',
      receipt: `live_${roomCode}_${Date.now()}`,
      notes: {
        type: 'live-subscription',
        viewerId: (req as any).user.id,
        creatorId: room.creatorUserId,
        roomCode,
      },
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating live order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify a live subscription payment, credit creator 70% / platform 30%.
router.post('/live/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Invalid signature sent!' });
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = (order as any).notes || {};
    const roomCode = (notes.roomCode || '').trim().toUpperCase();
    const viewerId = notes.viewerId;
    const creatorId = notes.creatorId;
    if (!roomCode || !viewerId || !creatorId) {
      return res.status(400).json({ success: false, message: 'Invalid order metadata' });
    }
    if (viewerId !== (req as any).user.id) {
      return res.status(400).json({ success: false, message: 'Payment does not belong to this user' });
    }

    const amountPaid = (order as any).amount / 100;
    const room = getLiveRoom(roomCode);
    if (room && amountPaid !== room.price) {
      return res.status(400).json({ success: false, message: 'Amount mismatch' });
    }

    const existing = await LivePayment.findOne({
      viewer: viewerId,
      roomCode,
      status: 'paid',
    }).lean();
    if (existing) {
      return res.json({ success: true, token: signLiveAccessToken(viewerId, roomCode) });
    }

    const creatorShare = Math.round(amountPaid * 0.7);
    const platformShare = Math.round(amountPaid * 0.3);

    await LivePayment.create({
      viewer: viewerId,
      creator: creatorId,
      roomCode,
      amount: amountPaid,
      currency: 'INR',
      creatorShare,
      platformShare,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: 'paid',
    });

    await User.findByIdAndUpdate(creatorId, { $inc: { liveEarnings: creatorShare } });

    res.json({
      success: true,
      token: signLiveAccessToken(viewerId, roomCode),
      creatorShare,
      platformShare,
    });
  } catch (error) {
    console.error('Error verifying live payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Creator earnings overview.
router.get('/live/earnings', requireAuth, async (req, res) => {
  try {
    const user = await User.findById((req as any).user.id).select('liveEarnings');
    const payments = await LivePayment.find({ creator: (req as any).user.id, status: 'paid' })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('viewer', 'name username profileImage');
    res.json({ success: true, liveEarnings: user?.liveEarnings || 0, payments });
  } catch (error) {
    console.error('Error fetching live earnings:', error);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// ─── Profile Subscriptions (OnlyFans-style monthly) ───

const signProfileAccessToken = (subscriberId: string, creatorId: string) => {
  return jwt.sign(
    { type: 'profile-access', subscriberId, creatorId },
    ENV.JWT_SECRET,
    { expiresIn: '32d' }
  );
};

// Check if current user has an active subscription to a creator.
router.get('/profile/access/:creatorId', requireAuth, async (req, res) => {
  try {
    const creatorId = String(req.params.creatorId || '');
    const sub = await ProfileSubscription.findOne({
      subscriber: (req as any).user.id,
      creator: creatorId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).lean();
    if (sub) {
      return res.json({
        access: true,
        token: signProfileAccessToken((req as any).user.id, creatorId),
        expiresAt: sub.expiresAt,
      });
    }
    const creator = await CreatorProfile.findOne({ user: creatorId }).lean();
    res.json({
      access: false,
      price: creator?.subscriptionPrice || 0,
      token: null,
    });
  } catch (error) {
    console.error('Error checking profile access:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
});

// Create a Razorpay order for a monthly profile subscription.
router.post('/profile/create-order', requireAuth, async (req, res) => {
  try {
    const creatorId = ((req.body || {}).creatorId || '').trim();
    if (!creatorId) return res.status(400).json({ error: 'Creator is required' });

    const profile = await CreatorProfile.findOne({ user: creatorId }).lean();
    if (!profile) return res.status(404).json({ error: 'Creator profile not found' });
    if (profile.verification.status !== 'approved') {
      return res.status(400).json({ error: 'This creator is not verified yet' });
    }
    const price = profile.subscriptionPrice || 0;
    if (price <= 0) return res.status(400).json({ error: 'This creator does not offer a subscription' });
    if (creatorId === (req as any).user.id) {
      return res.status(400).json({ error: 'You cannot subscribe to yourself' });
    }

    const existing = await ProfileSubscription.findOne({
      subscriber: (req as any).user.id,
      creator: creatorId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).lean();
    if (existing) {
      return res.json({
        alreadySubscribed: true,
        token: signProfileAccessToken((req as any).user.id, creatorId),
      });
    }

    const options = {
      amount: price * 100,
      currency: 'INR',
      receipt: `profile_${creatorId}_${Date.now()}`,
      notes: {
        type: 'profile-subscription',
        subscriberId: (req as any).user.id,
        creatorId,
      },
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating profile order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify a profile subscription payment; credit creator 70% / platform 30%, valid 30 days.
router.post('/profile/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Invalid signature sent!' });
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = (order as any).notes || {};
    const subscriberId = notes.subscriberId;
    const creatorId = notes.creatorId;
    if (!subscriberId || !creatorId) {
      return res.status(400).json({ success: false, message: 'Invalid order metadata' });
    }
    if (subscriberId !== (req as any).user.id) {
      return res.status(400).json({ success: false, message: 'Payment does not belong to this user' });
    }

    const amountPaid = (order as any).amount / 100;
    const profile = await CreatorProfile.findOne({ user: creatorId }).lean();
    if (profile && amountPaid !== profile.subscriptionPrice) {
      return res.status(400).json({ success: false, message: 'Amount mismatch' });
    }

    const existing = await ProfileSubscription.findOne({
      subscriber: subscriberId,
      creator: creatorId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).lean();
    if (existing) {
      return res.json({ success: true, token: signProfileAccessToken(subscriberId, creatorId) });
    }

    const creatorShare = Math.round(amountPaid * 0.7);
    const platformShare = Math.round(amountPaid * 0.3);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await ProfileSubscription.create({
      subscriber: subscriberId,
      creator: creatorId,
      price: amountPaid,
      currency: 'INR',
      creatorShare,
      platformShare,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: 'active',
      expiresAt,
    });

    await User.findByIdAndUpdate(creatorId, { $inc: { liveEarnings: creatorShare } });

    res.json({
      success: true,
      token: signProfileAccessToken(subscriberId, creatorId),
      creatorShare,
      platformShare,
      expiresAt,
    });
  } catch (error) {
    console.error('Error verifying profile payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Razorpay Webhook Endpoint
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = ENV.RAZORPAY_WEBHOOK_SECRET || 'fallback_secret_never_use_in_prod';
    const razorpaySignature = req.headers['x-razorpay-signature'];
    
    // Use the raw body buffer saved by express.json middleware
    const bodyStr = (req as any).rawBody ? (req as any).rawBody.toString() : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyStr)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.error('Webhook signature mismatch!');
      return res.status(400).send('Invalid signature');
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload.payment.entity;
      const amountPaid = paymentEntity.amount / 100;
      const userId = paymentEntity.notes?.userId;

      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          let daysToAdd = 0;
          if (amountPaid === 9) daysToAdd = 1;
          else if (amountPaid === 49) daysToAdd = 30;
          else if (amountPaid === 499) daysToAdd = 365;

          if (daysToAdd > 0) {
            user.premiumStatus = true;
            const now = new Date();
            if (user.premiumExpiryDate && user.premiumExpiryDate > now) {
              const newExpiry = new Date(user.premiumExpiryDate);
              newExpiry.setDate(newExpiry.getDate() + daysToAdd);
              user.premiumExpiryDate = newExpiry;
            } else {
              const newExpiry = new Date();
              newExpiry.setDate(newExpiry.getDate() + daysToAdd);
              user.premiumExpiryDate = newExpiry;
            }
            await user.save();
            console.log(`Webhook successfully granted Premium to user: ${userId}`);
          }
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook failed');
  }
});

export default router;
