import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import User from '../models/User';
import LivePayment from '../models/LivePayment';
import CreatorProfile from '../models/CreatorProfile';
import CreatorSubscription from '../models/CreatorSubscription';
import PrimeMember from '../models/PrimeMember';
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

// Check access for a room (prime member or paid)
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
    const viewerId = (req as any).user.id;
    
    // Check if user is a prime member of this creator (for this room or all rooms)
    const primeMember = await PrimeMember.findOne({
      creator: room.creatorUserId,
      user: viewerId,
      $or: [{ roomCode }, { roomCode: { $exists: false } }, { roomCode: null }],
    }).lean();
    if (primeMember) {
      return res.json({ access: true, price: room.price, token: signLiveAccessToken(viewerId, roomCode) });
    }
    
    // Check if user paid via platform (legacy or UPI)
    const paid = await LivePayment.findOne({
      viewer: viewerId,
      roomCode,
      status: 'paid',
    }).lean();
    if (paid) {
      return res.json({ access: true, price: room.price, token: signLiveAccessToken(viewerId, roomCode) });
    }

    // Check if there is a pending payment
    const pending = await LivePayment.findOne({
      viewer: viewerId,
      roomCode,
      status: 'pending',
    }).lean();
    if (pending) {
      return res.json({ access: false, price: room.price, token: null, isPendingApproval: true, utr: pending.utr });
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

    await LivePayment.create({
      viewer: viewerId,
      creator: creatorId,
      roomCode,
      amount: amountPaid,
      currency: 'INR',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: 'paid',
    });

    res.json({
      success: true,
      token: signLiveAccessToken(viewerId, roomCode),
    });
  } catch (error) {
    console.error('Error verifying live payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Submit UPI payment proof (UTR) for a paid live stream
router.post('/live/submit-upi', requireAuth, async (req, res) => {
  try {
    const { roomCode, utr } = req.body;
    const viewerId = (req as any).user.id;

    if (!roomCode || !utr) {
      return res.status(400).json({ error: 'Room code and UTR are required' });
    }

    const cleanRoomCode = String(roomCode).trim().toUpperCase();
    const cleanUtr = String(utr).trim();

    // Validate UTR is 12 digits
    if (!/^\d{12}$/.test(cleanUtr)) {
      return res.status(400).json({ error: 'UTR must be exactly 12 numeric digits' });
    }

    const room = getLiveRoom(cleanRoomCode);
    if (!room) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    if (!room.creatorUserId) {
      return res.status(400).json({ error: 'Creator is not registered' });
    }

    // Check if this UTR has already been submitted to prevent double-claiming
    const duplicateUtr = await LivePayment.findOne({ utr: cleanUtr });
    if (duplicateUtr) {
      return res.status(400).json({ error: 'This transaction UTR has already been submitted' });
    }

    // Check if user already has a pending/paid payment for this room
    const existing = await LivePayment.findOne({
      viewer: viewerId,
      roomCode: cleanRoomCode,
      status: { $in: ['pending', 'paid'] },
    });

    if (existing) {
      if (existing.status === 'paid') {
        return res.json({ success: true, message: 'You already have access to this stream', token: signLiveAccessToken(viewerId, cleanRoomCode) });
      }
      return res.status(400).json({ error: 'You have already submitted a payment request for this stream' });
    }

    // Create a pending LivePayment. Split: P2P gets 100% direct to creator.
    await LivePayment.create({
      viewer: viewerId,
      creator: room.creatorUserId,
      roomCode: cleanRoomCode,
      amount: room.price,
      currency: 'INR',
      creatorShare: room.price,
      platformShare: 0,
      paymentMethod: 'upi',
      utr: cleanUtr,
      status: 'pending',
    });

    res.json({ success: true, message: 'Payment submitted successfully. Waiting for creator approval.' });
  } catch (error) {
    console.error('Error submitting UPI payment:', error);
    res.status(500).json({ error: 'Failed to submit payment proof' });
  }
});

// Get pending payments for the creator's live streams
router.get('/creator/pending-payments', requireAuth, async (req, res) => {
  try {
    const creatorId = (req as any).user.id;
    const payments = await LivePayment.find({
      creator: creatorId,
      status: 'pending',
      paymentMethod: 'upi',
    })
      .sort({ createdAt: -1 })
      .populate('viewer', 'name username profileImage')
      .lean();

    res.json({ success: true, payments });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

// Approve a pending UPI payment
router.post('/creator/approve-upi', requireAuth, async (req, res) => {
  try {
    const creatorId = (req as any).user.id;
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const payment = await LivePayment.findOne({
      _id: paymentId,
      creator: creatorId,
      status: 'pending',
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pending payment request not found' });
    }

    payment.status = 'paid';
    await payment.save();

    // Automatically add as a Prime Member for this roomCode to grant permanent access
    await PrimeMember.findOneAndUpdate(
      { creator: creatorId, user: payment.viewer, roomCode: payment.roomCode },
      { creator: creatorId, user: payment.viewer, roomCode: payment.roomCode, addedBy: creatorId },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Payment approved. Access granted to viewer.' });
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

// Decline a pending UPI payment
router.post('/creator/decline-upi', requireAuth, async (req, res) => {
  try {
    const creatorId = (req as any).user.id;
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    const payment = await LivePayment.findOne({
      _id: paymentId,
      creator: creatorId,
      status: 'pending',
    });

    if (!payment) {
      return res.status(404).json({ error: 'Pending payment request not found' });
    }

    payment.status = 'failed';
    await payment.save();

    res.json({ success: true, message: 'Payment request declined.' });
  } catch (error) {
    console.error('Error declining payment:', error);
    res.status(500).json({ error: 'Failed to decline payment' });
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

// ─── Creator Monthly Subscription (₹500/month) ───

const CREATOR_MONTHLY_PRICE = 500; // ₹500/month for creator live streaming access

const signCreatorAccessToken = (creatorId: string) => {
  return jwt.sign(
    { type: 'creator-access', creatorId },
    ENV.JWT_SECRET,
    { expiresIn: '32d' }
  );
};

// Check if creator has active subscription
router.get('/creator/subscription/status', requireAuth, async (req, res) => {
  try {
    const creatorId = (req as any).user.id;
    const user = (req as any).user;

    // Admins have free subscription forever
    if (user && user.role === 'admin') {
      return res.json({
        active: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100), // 100 years
        token: signCreatorAccessToken(creatorId),
      });
    }

    const sub = await CreatorSubscription.findOne({
      creator: creatorId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).lean();
    
    if (sub) {
      return res.json({
        active: true,
        expiresAt: sub.expiresAt,
        token: signCreatorAccessToken(creatorId),
      });
    }
    
    res.json({
      active: false,
      price: CREATOR_MONTHLY_PRICE,
      token: null,
    });
  } catch (error) {
    console.error('Error checking creator subscription:', error);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});

// Create order for creator monthly subscription
router.post('/creator/subscription/create-order', requireAuth, async (req, res) => {
  try {
    const creatorId = (req as any).user.id;
    
    const existing = await CreatorSubscription.findOne({
      creator: creatorId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).lean();
    if (existing) {
      return res.json({
        alreadySubscribed: true,
        token: signCreatorAccessToken(creatorId),
      });
    }

    const options = {
      amount: CREATOR_MONTHLY_PRICE * 100,
      currency: 'INR',
      receipt: `creator_sub_${creatorId}_${Date.now()}`,
      notes: {
        type: 'creator-subscription',
        creatorId,
      },
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating creator subscription order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify creator subscription payment
router.post('/creator/subscription/verify', requireAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const creatorId = (req as any).user.id;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = (order as any).notes || {};
    if (notes.type !== 'creator-subscription' || notes.creatorId !== creatorId) {
      return res.status(400).json({ success: false, message: 'Invalid order metadata' });
    }
    if (creatorId !== (req as any).user.id) {
      return res.status(400).json({ success: false, message: 'Payment does not belong to this user' });
    }

    const amountPaid = (order as any).amount / 100;
    if (amountPaid !== CREATOR_MONTHLY_PRICE) {
      return res.status(400).json({ success: false, message: 'Amount mismatch' });
    }

    const existing = await CreatorSubscription.findOne({
      creator: creatorId,
      status: 'active',
      expiresAt: { $gt: new Date() },
    }).lean();
    if (existing) {
      return res.json({ success: true, token: signCreatorAccessToken(creatorId) });
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await CreatorSubscription.create({
      creator: creatorId,
      price: amountPaid,
      currency: 'INR',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: 'active',
      expiresAt,
    });

    res.json({
      success: true,
      token: signCreatorAccessToken(creatorId),
      expiresAt,
    });
  } catch (error) {
    console.error('Error verifying creator subscription:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Get creator payment details (UPI/Bank) for receiving user payments
router.get('/creator/payment-details', requireAuth, async (req, res) => {
  try {
    const creatorId = (req as any).user.id;
    let profile = await CreatorProfile.findOne({ user: creatorId }).lean();
    if (!profile) {
      // Auto-create to avoid 404 race conditions when frontend fetches concurrently
      await CreatorProfile.create({ user: creatorId });
      return res.json({
        upiId: null,
        bankAccount: null,
      });
    }
    res.json({
      upiId: profile.upiId || null,
      bankAccount: profile.bankAccount || null,
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ error: 'Failed to fetch payment details' });
  }
});

// Get a specific creator's payment details (UPI/Bank) for a viewer to pay them
router.get('/creator/payment-details/:creatorId', requireAuth, async (req, res) => {
  try {
    const creatorId = String(req.params.creatorId);
    let profile = await CreatorProfile.findOne({ user: creatorId }).lean();
    if (!profile) {
      // Auto-create to avoid 404
      await CreatorProfile.create({ user: creatorId });
      return res.json({
        upiId: null,
        bankAccount: null,
      });
    }
    res.json({
      upiId: profile.upiId || null,
      bankAccount: profile.bankAccount || null,
    });
  } catch (error) {
    console.error('Error fetching creator payment details:', error);
    res.status(500).json({ error: 'Failed to fetch creator payment details' });
  }
});

// Save creator payment details (UPI/Bank)
router.post('/creator/payment-details', requireAuth, async (req, res) => {
  try {
    const creatorId = (req as any).user.id;
    const { upiId, bankAccount } = req.body;
    
    const profile = await CreatorProfile.findOneAndUpdate(
      { user: creatorId },
      { 
        upiId: upiId?.trim() || undefined,
        bankAccount: bankAccount?.trim() || undefined,
      },
      { upsert: true, new: true }
    ).lean();
    
    if (!profile) {
      return res.status(404).json({ error: 'Creator profile not found' });
    }
    
    res.json({ success: true, upiId: profile.upiId, bankAccount: profile.bankAccount });
  } catch (error) {
    console.error('Error saving payment details:', error);
    res.status(500).json({ error: 'Failed to save payment details' });
  }
});

// ─── Prime Member Management (Creator adds users who paid via UPI/Bank) ───

// List prime members for a creator
router.get('/creator/prime-members', requireAuth, async (req, res) => {
  try {
    const creatorId = (req as any).user.id;
    const members = await PrimeMember.find({ creator: creatorId })
      .populate('user', 'name username profileImage')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ members });
  } catch (error) {
    console.error('Error fetching prime members:', error);
    res.status(500).json({ error: 'Failed to fetch prime members' });
  }
});

// Add a prime member (creator manually adds user who paid via UPI/Bank)
router.post('/creator/prime-members', requireAuth, async (req, res) => {
  try {
    const creatorId = (req as any).user.id;
    const { userId, roomCode } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Verify creator has active subscription (bypassed for admins)
    const user = (req as any).user;
    if (user && user.role !== 'admin') {
      const sub = await CreatorSubscription.findOne({
        creator: creatorId,
        status: 'active',
        expiresAt: { $gt: new Date() },
      }).lean();
      if (!sub) {
        return res.status(403).json({ error: 'Creator subscription required to manage prime members' });
      }
    }
    
    const member = await PrimeMember.findOneAndUpdate(
      { creator: creatorId, user: userId, roomCode: roomCode || null },
      { creator: creatorId, user: userId, roomCode: roomCode || null, addedBy: creatorId },
      { upsert: true, new: true }
    ).populate('user', 'name username profileImage');
    
    res.json({ success: true, member });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'User is already a prime member' });
    }
    console.error('Error adding prime member:', error);
    res.status(500).json({ error: 'Failed to add prime member' });
  }
});

// Remove a prime member
router.delete('/creator/prime-members/:userId', requireAuth, async (req, res) => {
  try {
    const creatorId = (req as any).user.id;
    const userId = req.params.userId;
    const roomCode = req.query.roomCode as string | undefined;
    
    await PrimeMember.findOneAndDelete({
      creator: creatorId,
      user: userId,
      roomCode: roomCode || null,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing prime member:', error);
    res.status(500).json({ error: 'Failed to remove prime member' });
  }
});

// Razorpay Webhook Endpoint
router.post('/webhook', async (req, res) => {
  try {
    // No secret configured => refuse to grant anything. A hardcoded fallback
    // that lives in a public repo lets anyone forge a payment.captured webhook.
    const webhookSecret = ENV.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not set — rejecting webhook.');
      return res.status(500).send('Webhook not configured');
    }
    const razorpaySignature = req.headers['x-razorpay-signature'];
    if (typeof razorpaySignature !== 'string') {
      return res.status(400).send('Missing signature');
    }

    // Use the raw body buffer saved by express.json middleware
    const bodyStr = (req as any).rawBody ? (req as any).rawBody.toString() : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyStr)
      .digest('hex');

    // Constant-time compare; timingSafeEqual throws on length mismatch, so guard it.
    const expected = Buffer.from(expectedSignature, 'hex');
    const received = Buffer.from(razorpaySignature, 'hex');
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
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
