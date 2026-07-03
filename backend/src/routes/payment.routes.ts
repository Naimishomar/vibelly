import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { ENV } from '../config/env';
import User from '../models/User';
import { requireAuth } from '../middlewares/auth.middleware';

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
