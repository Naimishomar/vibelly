import { fetchWithTokenRefresh } from './livePaymentService';
import { useAuthStore } from '../store/useAuthStore';

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export interface PostUser {
  _id: string;
  name: string;
  username: string;
  profileImage: string;
}

export interface PostComment {
  _id: string;
  user: PostUser;
  text: string;
  createdAt: string;
}

export interface CreatorPost {
  _id: string;
  creator: PostUser;
  images: string[];
  caption: string;
  likes: string[];
  comments: PostComment[];
  createdAt: string;
}

// Upload up to 3 photos for a post (multipart/form-data, no Content-Type override)
export async function uploadPostPhotos(files: File[]): Promise<{ urls: string[]; keys: string[] } | null> {
  try {
    const token = useAuthStore.getState().accessToken;
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const res = await fetch(`${getBackendUrl()}/api/upload/post-photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}


// Create a new post
export async function createCreatorPost(
  images: string[],
  imageKeys: string[],
  caption: string
): Promise<{ success: boolean; post?: CreatorPost; error?: string }> {
  try {
    const res = await fetchWithTokenRefresh(`${getBackendUrl()}/api/creator/posts`, {
      method: 'POST',
      body: JSON.stringify({ images, imageKeys, caption }),
    });
    return await res.json();
  } catch {
    return { success: false, error: 'Failed to create post' };
  }
}

// Fetch paginated posts for a creator
export async function fetchCreatorPosts(
  userId: string,
  page = 1
): Promise<{ posts: CreatorPost[]; total: number; pages: number } | null> {
  try {
    const res = await fetch(
      `${getBackendUrl()}/api/creator/posts/${encodeURIComponent(userId)}?page=${page}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Toggle like on a post
export async function togglePostLike(
  postId: string
): Promise<{ success: boolean; liked?: boolean; likeCount?: number; error?: string }> {
  try {
    const res = await fetchWithTokenRefresh(
      `${getBackendUrl()}/api/creator/posts/${encodeURIComponent(postId)}/like`,
      { method: 'POST' }
    );
    return await res.json();
  } catch {
    return { success: false, error: 'Failed to toggle like' };
  }
}

// Add a comment
export async function addPostComment(
  postId: string,
  text: string
): Promise<{ success: boolean; comment?: PostComment; error?: string }> {
  try {
    const res = await fetchWithTokenRefresh(
      `${getBackendUrl()}/api/creator/posts/${encodeURIComponent(postId)}/comment`,
      { method: 'POST', body: JSON.stringify({ text }) }
    );
    return await res.json();
  } catch {
    return { success: false, error: 'Failed to add comment' };
  }
}

// Delete a comment
export async function deletePostComment(
  postId: string,
  commentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetchWithTokenRefresh(
      `${getBackendUrl()}/api/creator/posts/${encodeURIComponent(postId)}/comment/${encodeURIComponent(commentId)}`,
      { method: 'DELETE' }
    );
    return await res.json();
  } catch {
    return { success: false, error: 'Failed to delete comment' };
  }
}

// Delete an entire post
export async function deleteCreatorPost(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetchWithTokenRefresh(
      `${getBackendUrl()}/api/creator/posts/${encodeURIComponent(postId)}`,
      { method: 'DELETE' }
    );
    return await res.json();
  } catch {
    return { success: false, error: 'Failed to delete post' };
  }
}
