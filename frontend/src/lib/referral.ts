const REF_KEY = 'vibe_ref';

const CODE_RE = /^[A-Za-z0-9]{6,16}$/;

export const getStoredRef = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REF_KEY);
};

export const setStoredRef = (code: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REF_KEY, code);
};

export const clearStoredRef = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REF_KEY);
};

/**
 * Reads `?ref=CODE` from the current URL (first visit) and stores it
 * so the referral can be claimed after the user signs up/logs in.
 */
export const captureRefFromUrl = () => {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref && CODE_RE.test(ref)) {
    setStoredRef(ref);
  }
};

export const buildReferralLink = (code: string) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vibelly.fun';
  return `${origin}/?ref=${encodeURIComponent(code)}`;
};

/**
 * Claims a stored referral after authentication. Idempotent and safe to
 * call on every app boot.
 */
export const claimPendingReferral = async (): Promise<{ success: boolean; rewardDays?: number; error?: string }> => {
  const code = getStoredRef();
  if (!code) return { success: false };

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const { useAuthStore } = await import('../store/useAuthStore');
  const token = useAuthStore.getState().accessToken || localStorage.getItem('vibe_token');

  if (!token) return { success: false };

  try {
    const res = await fetch(`${backendUrl}/api/referral/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      clearStoredRef();
      await useAuthStore.getState().checkAuth();
      return { success: true, rewardDays: data.rewardDays };
    }

    // Invalid/expired code — clear it so we don't retry forever
    if (res.status === 400) {
      clearStoredRef();
    }
    return { success: false, error: data.error };
  } catch (error) {
    console.error('Failed to claim referral:', error);
    return { success: false };
  }
};
