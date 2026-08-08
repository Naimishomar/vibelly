import { useAuthStore } from '../store/useAuthStore';

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export async function uploadImage(file: File, kind: 'thumbnail' | 'verification' | 'creator-gallery'): Promise<string | null> {
  try {
    const backendUrl = getBackendUrl();
    const token = useAuthStore.getState().accessToken || localStorage.getItem('vibe_token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${backendUrl}/api/upload/${kind}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch (err) {
    console.error(`Upload ${kind} failed:`, err);
    return null;
  }
}
