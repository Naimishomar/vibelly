import { useAuthStore } from '../store/useAuthStore';

export const loadScript = (src: string) => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

async function fetchWithTokenRefresh(url: string, options: RequestInit, retried = false): Promise<Response> {
  const token = useAuthStore.getState().accessToken;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) };
  let res = await fetch(url, { ...options, headers });

  if (res.status === 401 && !retried) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      const refreshRes = await fetch(`${getBackendUrl()}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const tokens = await refreshRes.json();
        useAuthStore.getState().setAuth(useAuthStore.getState().user!, tokens.accessToken, tokens.refreshToken);
        return fetchWithTokenRefresh(url, options, true);
      }
    }
    useAuthStore.getState().logout();
  }
  return res;
}

export async function checkLiveAccess(roomCode: string) {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/payment/live/access/${encodeURIComponent(roomCode)}`, {
      method: 'GET',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { access: data.access, price: data.price, token: data.token };
  } catch {
    return null;
  }
}

export interface PayResult {
  success: boolean;
  token?: string;
  error?: string;
}

export async function payForLiveStream(roomCode: string): Promise<PayResult> {
  const { user, isAuthenticated, accessToken } = useAuthStore.getState();
  if (!isAuthenticated || !user || !accessToken) {
    return { success: false, error: 'Please sign in to subscribe' };
  }

  const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  if (!res) {
    return { success: false, error: 'Razorpay SDK failed to load. Are you online?' };
  }

  try {
    const backendUrl = getBackendUrl();
    const orderRes = await fetchWithTokenRefresh(`${backendUrl}/api/payment/live/create-order`, {
      method: 'POST',
      body: JSON.stringify({ roomCode }),
    });
    const orderData = await orderRes.json();

    if (!orderData.id && !orderData.alreadyPaid) {
      return { success: false, error: orderData.error || 'Could not create order' };
    }
    if (orderData.alreadyPaid) {
      return { success: true, token: orderData.token };
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Vibelly Live',
      description: `Subscribe to live room ${roomCode}`,
      order_id: orderData.id,
      handler: async function (response: any) {
        const verifyRes = await fetchWithTokenRefresh(`${backendUrl}/api/payment/live/verify`, {
          method: 'POST',
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        }).then((r) => r.json());

        if (verifyRes.success) {
          return { success: true, token: verifyRes.token };
        }
        return { success: false, error: 'Payment verification failed' };
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: '',
      },
      theme: { color: '#ef4444' },
    };

    return await new Promise<PayResult>((resolve) => {
      const paymentObject = new (window as any).Razorpay({
        ...options,
        handler: async (response: any) => {
          resolve(await options.handler(response));
        },
      });
      paymentObject.on('payment.failed', () => {
        resolve({ success: false, error: 'Payment was not completed' });
      });
      paymentObject.open();
    });
  } catch (err) {
    console.error('Live payment failed:', err);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

export async function fetchLiveEarnings() {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/payment/live/earnings`, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Profile subscriptions (OnlyFans-style monthly) ───

export async function checkProfileAccess(creatorId: string) {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/payment/profile/access/${encodeURIComponent(creatorId)}`, {
      method: 'GET',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function subscribeToCreator(creatorId: string): Promise<PayResult> {
  const { user, isAuthenticated, accessToken } = useAuthStore.getState();
  if (!isAuthenticated || !user || !accessToken) {
    return { success: false, error: 'Please sign in to subscribe' };
  }

  const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  if (!res) {
    return { success: false, error: 'Razorpay SDK failed to load. Are you online?' };
  }

  try {
    const backendUrl = getBackendUrl();
    const orderRes = await fetchWithTokenRefresh(`${backendUrl}/api/payment/profile/create-order`, {
      method: 'POST',
      body: JSON.stringify({ creatorId }),
    });
    const orderData = await orderRes.json();

    if (!orderData.id && !orderData.alreadySubscribed) {
      return { success: false, error: orderData.error || 'Could not create order' };
    }
    if (orderData.alreadySubscribed) {
      return { success: true, token: orderData.token };
    }

    return await new Promise<PayResult>((resolve) => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Vibelly Creator Subscription',
        description: `Monthly subscription to creator`,
        order_id: orderData.id,
        handler: async (response: any) => {
          const verifyRes = await fetchWithTokenRefresh(`${backendUrl}/api/payment/profile/verify`, {
            method: 'POST',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          }).then((r) => r.json());
          resolve(verifyRes.success ? { success: true, token: verifyRes.token } : { success: false, error: 'Payment verification failed' });
        },
        prefill: { name: user.name, email: user.email, contact: '' },
        theme: { color: '#ef4444' },
      };
      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', () => resolve({ success: false, error: 'Payment was not completed' }));
      paymentObject.open();
    });
  } catch (err) {
    console.error('Profile subscription failed:', err);
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

// ─── Reporting ───

export async function reportUser(payload: {
  reportedUserId: string;
  reason: string;
  type?: 'call' | 'live' | 'profile' | 'paid-no-show';
  roomCode?: string;
  streamTitle?: string;
  amountPaid?: number;
}) {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/users/report`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.ok ? { success: true } : { success: false, error: 'Failed to submit report' };
  } catch {
    return { success: false, error: 'Failed to submit report' };
  }
}

// ─── Creator Monthly Subscription (₹500/month) ───

export interface CreatorSubscriptionStatus {
  active: boolean;
  expiresAt?: string;
  token?: string;
  price: number;
}

export async function checkCreatorSubscription(): Promise<CreatorSubscriptionStatus | null> {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/payment/creator/subscription/status`, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createCreatorSubscriptionOrder(): Promise<{ id?: string; alreadySubscribed?: boolean; token?: string; error?: string }> {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/payment/creator/subscription/create-order`, { method: 'POST' });
    return await res.json();
  } catch {
    return { error: 'Something went wrong' };
  }
}

export async function verifyCreatorSubscription(data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }): Promise<{ success: boolean; token?: string; expiresAt?: string; error?: string }> {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/payment/creator/subscription/verify`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Something went wrong' };
  }
}

// ─── Creator Payment Details (UPI/Bank for receiving user payments) ───

export interface CreatorPaymentDetails {
  upiId: string | null;
  bankAccount: string | null;
}

export async function getCreatorPaymentDetails(): Promise<CreatorPaymentDetails | null> {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/payment/creator/payment-details`, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveCreatorPaymentDetails(details: { upiId?: string; bankAccount?: string }): Promise<{ success: boolean; upiId?: string; bankAccount?: string; error?: string }> {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/payment/creator/payment-details`, {
      method: 'POST',
      body: JSON.stringify(details),
    });
    return await res.json();
  } catch (err) {
    console.error('Save creator payment details failed:', err);
    return { success: false, error: 'Something went wrong' };
  }
}

// ─── Prime Member Management ───

export interface PrimeMember {
  _id: string;
  creator: string;
  user: { _id: string; name: string; username: string; profileImage: string };
  roomCode?: string;
  createdAt: string;
}

export interface PrimeMembersResponse {
  members: PrimeMember[];
}

export async function getPrimeMembers(): Promise<PrimeMembersResponse | null> {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/payment/creator/prime-members`, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function addPrimeMember(userId: string, roomCode?: string): Promise<{ success: boolean; member?: PrimeMember; error?: string }> {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/payment/creator/prime-members`, {
      method: 'POST',
      body: JSON.stringify({ userId, roomCode }),
    });
    return await res.json();
  } catch (err) {
    console.error('Add prime member failed:', err);
    return { success: false, error: 'Something went wrong' };
  }
}

export async function removePrimeMember(userId: string, roomCode?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = roomCode 
      ? `${getBackendUrl()}/api/payment/creator/prime-members/${userId}?roomCode=${encodeURIComponent(roomCode)}`
      : `${getBackendUrl()}/api/payment/creator/prime-members/${userId}`;
    const res = await fetchWithTokenRefresh(url, { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    console.error('Remove prime member failed:', err);
    return { success: false, error: 'Something went wrong' };
  }
}
