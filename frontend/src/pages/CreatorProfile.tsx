import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Loader2, ArrowLeft, ImageIcon, UserPlus, UserCheck, Flag, Crown, Lock, Play, X, CheckCircle2, CreditCard, RefreshCw, Wallet, QrCode, Heart, MessageCircle, Send, Trash2, ChevronLeft, ChevronRight, Plus, LayoutGrid } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import { useAuthStore } from '../store/useAuthStore';
import { reportUser, checkCreatorSubscription, createCreatorSubscriptionOrder, verifyCreatorSubscription, getCreatorPaymentDetails, saveCreatorPaymentDetails, loadScript, type CreatorSubscriptionStatus, type CreatorPaymentDetails } from '../services/livePaymentService';
import { uploadImage } from '../services/uploadService';
import { fetchCreatorPosts, createCreatorPost, deleteCreatorPost, togglePostLike, addPostComment, deletePostComment, uploadPostPhotos, type CreatorPost } from '../services/creatorPostService';

interface CreatorProfileData {
  _id: string;
  user: { _id: string; name: string; username: string; profileImage: string; premiumStatus: boolean; role: string; isBanned: boolean } | null;
  bio: string;
  coverImage: string;
  galleryPhotos: string[];
  subscriptionPrice: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

interface CreatorStream {
  roomCode: string;
  title: string;
  thumbnail: string;
  price: number;
  isPrivate: boolean;
  viewerCount: number;
}

const getBackendUrl = () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function CreatorProfile() {
  const { userId } = useParams();
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const [profile, setProfile] = useState<CreatorProfileData | null>(null);
  const [streams, setStreams] = useState<CreatorStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);

  // Creator subscription state
  const [creatorSubscription, setCreatorSubscription] = useState<CreatorSubscriptionStatus | null>(null);
  const [creatingSubOrder, setCreatingSubOrder] = useState(false);

  // Creator payment details state (for receiving user payments)
  const [paymentDetails, setPaymentDetails] = useState<CreatorPaymentDetails | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ upiId: '', bankAccount: '' });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Profile settings state
  const [subscriptionPriceInput, setSubscriptionPriceInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Posts state
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);
  // New post modal
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostFiles, setNewPostFiles] = useState<File[]>([]);
  const [newPostPreviews, setNewPostPreviews] = useState<string[]>([]);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);
  const [postError, setPostError] = useState('');
  // Post detail modal
  const [activePost, setActivePost] = useState<CreatorPost | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Tab and Gallery states
  const [activeTab, setActiveTab] = useState<'posts' | 'gallery'>('posts');
  const [activeGalleryPhoto, setActiveGalleryPhoto] = useState<string | null>(null);

  const isOwnProfile = !!user && (userId === user._id || (!!profile?.user && user._id === profile.user._id));

  const fetchProfile = async () => {
    if (!isOwnProfile && !user) {
      // For viewing other profiles, we don't need auth
    } else if (isOwnProfile && (!isAuthenticated || !user)) {
      setError('Please sign in to view your creator profile');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const backendUrl = getBackendUrl();
      const viewerId = user?._id || '';
      const isOwn = isOwnProfile;
      
      const token = accessToken || localStorage.getItem('vibe_token');
      
      const profileUrl = isOwn 
        ? `${backendUrl}/api/creator/me/profile`
        : `${backendUrl}/api/creator/${userId}?viewerId=${viewerId}`;
      
      const headers: Record<string, string> = {};
      if (isOwn && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const [profileRes, streamsRes] = await Promise.all([
        fetch(profileUrl, { headers }),
        fetch(`${backendUrl}/api/creator/streams/${userId}`),
      ]);
      if (!profileRes.ok) {
        const errText = await profileRes.text();
        console.error('[CreatorProfile] Error response:', errText);
        setError('Creator profile not found');
        setLoading(false);
        return;
      }
      const pData = await profileRes.json();
      const sData = await streamsRes.json();
      setProfile(pData.profile);
      setIsFollowing(pData.profile.isFollowing);
      setFollowerCount(pData.profile.followerCount);
      setStreams(sData.streams || []);
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreatorData = async () => {
    if (!isOwnProfile) return;
    const [sub, details] = await Promise.all([checkCreatorSubscription(), getCreatorPaymentDetails()]);
    if (sub) setCreatorSubscription(sub);
    if (details) setPaymentDetails(details);
  };

  useEffect(() => {
    if (userId) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?._id]);

  useEffect(() => {
    if (isOwnProfile) fetchCreatorData();
  }, [isOwnProfile]);

  const loadPosts = async (page = 1) => {
    if (!userId) return;
    setPostsLoading(true);
    const data = await fetchCreatorPosts(userId, page);
    if (data) {
      setPosts(page === 1 ? data.posts : (prev) => [...prev, ...data.posts]);
      setPostsTotalPages(data.pages);
      setPostsPage(page);
    }
    setPostsLoading(false);
  };

  useEffect(() => {
    if (userId) loadPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (profile && isOwnProfile) {
      setBioInput(profile.bio || '');
      setSubscriptionPriceInput(profile.subscriptionPrice ? String(profile.subscriptionPrice) : '');
    }
  }, [profile, isOwnProfile]);

  const handleCreateSubOrder = async () => {
    setCreatingSubOrder(true);
    const result = await createCreatorSubscriptionOrder();
    setCreatingSubOrder(false);
    if (result.alreadySubscribed && result.token) {
      setCreatorSubscription({ active: true, token: result.token, price: 500 });
    } else if (result.id) {
      // Open Razorpay checkout
      const { user: currentUser, isAuthenticated, accessToken } = useAuthStore.getState();
      if (!isAuthenticated || !currentUser || !accessToken) return;
      
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) return;
      
      return new Promise<void>((resolve) => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: result.id ? 50000 : 0, // Will be set from order
          currency: 'INR',
          name: 'Vibelly Creator Profile',
          description: 'Monthly creator profile access (₹500/month)',
          order_id: result.id,
          handler: async (response: any) => {
            const verifyRes = await verifyCreatorSubscription({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.success && verifyRes.token) {
              setCreatorSubscription({ active: true, expiresAt: verifyRes.expiresAt, token: verifyRes.token, price: 500 });
            }
            resolve();
          },
          prefill: { name: currentUser.name, email: currentUser.email, contact: '' },
          theme: { color: '#ef4444' },
        };
        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.on('payment.failed', () => resolve());
        paymentObject.open();
      });
    }
  };

  const handleSavePaymentDetails = async () => {
    const { upiId, bankAccount } = paymentForm;
    if (!upiId.trim() && !bankAccount.trim()) {
      setPaymentError('Add at least UPI ID or Bank Account');
      return;
    }
    setSavingPayment(true);
    setPaymentError('');
    const result = await saveCreatorPaymentDetails({ upiId: upiId.trim() || undefined, bankAccount: bankAccount.trim() || undefined });
    setSavingPayment(false);
    if (result.success) {
      setPaymentDetails({ upiId: result.upiId || null, bankAccount: result.bankAccount || null });
      setShowPaymentForm(false);
      setPaymentForm({ upiId: '', bankAccount: '' });
    } else {
      setPaymentError(result.error || 'Failed to save payment details');
    }
  };
  
  const toggleFollow = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to follow.');
      return;
    }
    const backendUrl = getBackendUrl();
    const token = accessToken || localStorage.getItem('vibe_token');
    const res = await fetch(`${backendUrl}/api/creator/follow/${userId}`, {
      method: isFollowing ? 'DELETE' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setIsFollowing(data.isFollowing);
      setFollowerCount(data.followerCount);
    }
  };

  // ── Own-profile editing ──
  const saveProfileSettings = async () => {
    const backendUrl = getBackendUrl();
    const token = accessToken || localStorage.getItem('vibe_token');

    let coverUrl = profile?.coverImage || '';
    if (coverFile) {
      const url = await uploadImage(coverFile, 'creator-gallery');
      if (url) coverUrl = url;
    }

    const res = await fetch(`${backendUrl}/api/creator/me/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        bio: bioInput,
        coverImage: coverUrl,
        subscriptionPrice: Number(subscriptionPriceInput) || 0,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
      alert('Profile updated!');
    }
  };

  const addGalleryPhoto = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    const backendUrl = getBackendUrl();
    const token = accessToken || localStorage.getItem('vibe_token');
    const url = await uploadImage(file, 'creator-gallery');
    if (url) {
      const res = await fetch(`${backendUrl}/api/creator/me/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile((p) => p ? { ...p, galleryPhotos: data.galleryPhotos } : p);
      }
    }
    setIsUploading(false);
  };

  const removeGalleryPhoto = async (url: string) => {
    const backendUrl = getBackendUrl();
    const token = accessToken || localStorage.getItem('vibe_token');
    const res = await fetch(`${backendUrl}/api/creator/me/gallery`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile((p) => p ? { ...p, galleryPhotos: data.galleryPhotos } : p);
    }
  };

  // Post handlers
  const handleNewPostFiles = (files: File[]) => {
    const valid = files.slice(0, 3);
    setNewPostFiles(valid);
    setNewPostPreviews(valid.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmitPost = async () => {
    if (newPostFiles.length === 0) return;
    setSubmittingPost(true);
    setPostError('');
    const uploaded = await uploadPostPhotos(newPostFiles);
    if (!uploaded) {
      setPostError('Failed to upload photos. Try again.');
      setSubmittingPost(false);
      return;
    }
    const result = await createCreatorPost(uploaded.urls, uploaded.keys, newPostCaption);
    if (result.success && result.post) {
      setPosts((prev) => [result.post!, ...prev]);
      setShowNewPost(false);
      setNewPostFiles([]);
      setNewPostPreviews([]);
      setNewPostCaption('');
    } else {
      setPostError(result.error || 'Failed to create post');
    }
    setSubmittingPost(false);
  };

  const handleDeletePost = async (postId: string) => {
    const result = await deleteCreatorPost(postId);
    if (result.success) {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setActivePost(null);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!isAuthenticated) return;
    const result = await togglePostLike(postId);
    if (result.success) {
      const myId = user!._id;
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                likes: result.liked
                  ? [...p.likes, myId]
                  : p.likes.filter((id) => id !== myId),
              }
            : p
        )
      );
      if (activePost?._id === postId) {
        setActivePost((prev) =>
          prev
            ? {
                ...prev,
                likes: result.liked
                  ? [...prev.likes, myId]
                  : prev.likes.filter((id) => id !== myId),
              }
            : prev
        );
      }
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !activePost) return;
    setSubmittingComment(true);
    const result = await addPostComment(activePost._id, commentInput.trim());
    if (result.success && result.comment) {
      const newComments = [...activePost.comments, result.comment];
      setActivePost({ ...activePost, comments: newComments });
      setPosts((prev) =>
        prev.map((p) => (p._id === activePost._id ? { ...p, comments: newComments } : p))
      );
      setCommentInput('');
    }
    setSubmittingComment(false);
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const result = await deletePostComment(postId, commentId);
    if (result.success) {
      const updated = activePost
        ? { ...activePost, comments: activePost.comments.filter((c) => c._id !== commentId) }
        : null;
      setActivePost(updated);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, comments: p.comments.filter((c) => c._id !== commentId) }
            : p
        )
      );
    }
  };

  const submitReport = async () => {
    if (!userId || !reportReason.trim()) return;
    const res = await reportUser({
      reportedUserId: userId,
      reason: reportReason.trim(),
      type: 'profile',
    });
    setShowReport(false);
    setReportReason('');
    if (res.success) {
      setReportSent(true);
      setTimeout(() => setReportSent(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15171B] text-white flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#15171B] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">{error || 'Profile not found'}</p>
        <Link to="/live" className="text-sm text-white bg-white/10 px-4 py-2 rounded-lg">Back to Live</Link>
      </div>
    );
  }

  const p = profile;

  return (
    <div className="min-h-screen bg-[#15171B] text-white flex flex-col font-sans relative overflow-hidden">
      <SEO title={`${p.user?.name || 'Creator'} on Vibelly`} description={p.bio || `Follow ${p.user?.name || 'this creator'} and watch their live streams.`} />
      <BlinkingDotsGrid />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 py-10">
          <Link to="/live" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors text-sm">
            <ArrowLeft size={16} /> Back to Live
          </Link>

          {/* Cover */}
          <div className="relative mb-16">
            <div className="h-48 md:h-64 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10">
              {p.coverImage ? <img src={p.coverImage} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-800"><ImageIcon size={48} /></div>}
            </div>
            {/* Avatar */}
            <div className="absolute -bottom-12 left-6 w-28 h-28 rounded-full bg-zinc-800 border-4 border-[#15171B] overflow-hidden flex-shrink-0 z-10">
              {p.user?.profileImage ? <img src={p.user.profileImage} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-4xl font-bold">{p.user?.name?.[0]?.toUpperCase()}</span>}
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{p.user?.name}</h1>
                <span className="text-zinc-500 text-sm">@{p.user?.username}</span>
                {creatorSubscription?.active && (
                  <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <CheckCircle2 size={12} /> LIVE ENABLED
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 mt-2 max-w-xl">{p.bio || 'No bio yet.'}</p>
              <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
                <span className="flex items-center gap-1.5"><Users size={14} /> <strong className="text-white">{followerCount}</strong> followers</span>
                <span className="flex items-center gap-1.5"><Crown size={14} /> <strong className="text-white">{p.followingCount}</strong> following</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {p.subscriptionPrice > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/20 text-amber-300 px-3 py-2 rounded-xl text-sm font-semibold">
                  ₹{p.subscriptionPrice}/stream
                </div>
              )}
              {!isOwnProfile && (
                <>
                  <button onClick={toggleFollow} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer">
                    {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button onClick={() => setShowReport(true)} className="p-2 bg-zinc-800 rounded-xl text-red-400 hover:bg-zinc-700 transition-colors cursor-pointer" title="Report creator">
                    <Flag size={18} />
                  </button>
                </>
              )}
              {isOwnProfile && (
                <Link to="/live" className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer" style={{opacity: creatorSubscription?.active ? 1 : 0.5, pointerEvents: creatorSubscription?.active ? 'auto' : 'none'}}>
                  <Play size={16} /> Go Live
                </Link>
              )}
            </div>
          </div>

          {/* Creator & Premium Subscription Statuses */}
          {isOwnProfile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Creator Profile Access */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Wallet size={16} className="text-amber-400" /> Creator Profile Access
                    </h3>
                    {(creatorSubscription?.active || user?.role === 'admin') && (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-normal mb-3">
                    Required to go live and receive payments from viewers. 100% of stream earnings go straight to your account.
                  </p>
                  <div className="bg-zinc-950/40 rounded-xl p-3 text-xs space-y-1.5 border border-white/5 mb-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Status</span>
                      <span className={(creatorSubscription?.active || user?.role === 'admin') ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                        {user?.role === 'admin' ? 'Active (Free Admin)' : creatorSubscription?.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {(creatorSubscription?.active || user?.role === 'admin') && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Expires</span>
                        <span className="text-zinc-300">
                          {user?.role === 'admin' ? 'Never' : creatorSubscription?.expiresAt ? new Date(creatorSubscription.expiresAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {!creatorSubscription?.active && user?.role !== 'admin' && (
                  <button onClick={handleCreateSubOrder} disabled={creatingSubOrder} className="w-full bg-amber-500 hover:bg-amber-400 text-black py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 mt-2">
                    {creatingSubOrder ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <>Activate Creator Access (₹500/month)</>}
                  </button>
                )}
              </div>

              {/* Premium Website Access */}
              <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Crown size={16} className="text-yellow-400" /> Premium Website Access
                    </h3>
                    {user?.premiumStatus && (
                      <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-normal mb-3">
                    Unlocks HD video calls, opposite gender matching, country filters, interest matchmaking, and unlimited skips.
                  </p>
                  <div className="bg-zinc-950/40 rounded-xl p-3 text-xs space-y-1.5 border border-white/5 mb-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Status</span>
                      <span className={user?.premiumStatus ? "text-yellow-400 font-semibold" : "text-zinc-500"}>
                        {user?.premiumStatus ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {user?.premiumStatus && user?.premiumExpiryDate && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Expires</span>
                        <span className="text-zinc-300">
                          {new Date(user.premiumExpiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {!user?.premiumStatus && (
                  <Link to="/pricing" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-2 rounded-xl text-xs font-bold transition-colors text-center block mt-2">
                    Upgrade to Premium
                  </Link>
                )}
              </div>
            </div>
          )}

          {reportSent && <p className="text-emerald-400 text-sm mb-4">Report submitted. Thanks for keeping Vibelly safe.</p>}

          {/* Active streams */}
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Now
          </h2>
          {streams.length === 0 ? (
            <p className="text-zinc-500 text-sm bg-zinc-900/40 rounded-2xl border border-white/5 py-8 text-center">Not currently streaming.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {streams.map((s) => (
                <Link key={s.roomCode} to={`/live?room=${s.roomCode}`} className="group rounded-2xl bg-zinc-900/60 border border-white/10 overflow-hidden hover:bg-zinc-800/80 transition-colors">
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {s.thumbnail ? <img src={s.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-700"><Play size={36} /></div>}
                    <span className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                    </span>
                    {s.price > 0 && <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-full text-[10px] font-semibold text-amber-300"><Lock size={10} /> ₹{s.price}</span>}
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-full text-[10px] text-zinc-300"><Users size={10} /> {s.viewerCount}</span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2">{s.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Section Header with Tabs */}
          <div className="flex items-center justify-between border-b border-white/10 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center gap-2 pb-4 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
                  activeTab === 'posts'
                    ? 'border-white text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <LayoutGrid size={16} />
                Posts ({posts.length})
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`flex items-center gap-2 pb-4 px-4 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
                  activeTab === 'gallery'
                    ? 'border-white text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <ImageIcon size={16} />
                Gallery ({p.galleryPhotos?.length || 0})
              </button>
            </div>

            {/* Context-aware Actions */}
            {isOwnProfile && activeTab === 'posts' && (
              <button
                onClick={() => setShowNewPost(true)}
                className="flex items-center gap-1.5 bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer mb-3"
              >
                <Plus size={14} /> New Post
              </button>
            )}

            {isOwnProfile && activeTab === 'gallery' && (p.galleryPhotos?.length || 0) < 12 && (
              <label className="flex items-center gap-1.5 bg-white text-black text-xs font-semibold px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer mb-3">
                <Plus size={14} /> Add Photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      addGalleryPhoto(e.target.files[0]);
                    }
                  }}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>

          {/* Posts Tab Content */}
          {activeTab === 'posts' && (
            <>
              {postsLoading && posts.length === 0 ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-zinc-600" size={28} /></div>
              ) : posts.length === 0 ? (
                <div className="bg-zinc-900/40 rounded-2xl border border-white/5 py-12 text-center mb-10">
                  <ImageIcon size={40} className="mx-auto text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-sm">{isOwnProfile ? 'Share your first post!' : 'No posts yet.'}</p>
                  {isOwnProfile && (
                    <button onClick={() => setShowNewPost(true)} className="mt-3 inline-flex items-center gap-1.5 bg-white text-black text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity cursor-pointer">
                      <Plus size={14} /> Create Post
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-0.5 mb-2">
                    {posts.map((post) => {
                      const myId = user?._id || '';
                      const liked = post.likes.includes(myId);
                      return (
                        <button
                          key={post._id}
                          onClick={() => { setActivePost(post); setActivePhotoIdx(0); }}
                          className="relative aspect-square bg-zinc-900 overflow-hidden group focus:outline-none"
                        >
                          <img src={post.images[0]} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          {post.images.length > 1 && (
                            <span className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                              <ChevronRight size={12} className="text-white" />
                            </span>
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-5">
                            <span className="flex items-center gap-1.5 text-white font-semibold text-sm">
                              <Heart size={18} fill={liked ? '#ef4444' : 'none'} className={liked ? 'text-red-500' : 'text-white'} />
                              {post.likes.length}
                            </span>
                            <span className="flex items-center gap-1.5 text-white font-semibold text-sm">
                              <MessageCircle size={18} /> {post.comments.length}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {postsPage < postsTotalPages && (
                    <button
                      onClick={() => loadPosts(postsPage + 1)}
                      disabled={postsLoading}
                      className="w-full py-2.5 text-sm text-zinc-400 hover:text-white border border-white/10 rounded-xl mb-10 transition-colors cursor-pointer"
                    >
                      {postsLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Load more'}
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* Gallery Tab Content */}
          {activeTab === 'gallery' && (
            <>
              {(!p.galleryPhotos || p.galleryPhotos.length === 0) && !isUploading ? (
                <div className="bg-zinc-900/40 rounded-2xl border border-white/5 py-12 text-center mb-10">
                  <ImageIcon size={40} className="mx-auto text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-sm">{isOwnProfile ? 'Upload your first gallery photo!' : 'No gallery photos yet.'}</p>
                  {isOwnProfile && (
                    <label className="mt-3 inline-flex items-center gap-1.5 bg-white text-black text-sm font-medium px-4 py-2 rounded-xl hover:opacity-90 transition-opacity cursor-pointer">
                      <Plus size={14} /> Add Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            addGalleryPhoto(e.target.files[0]);
                          }
                        }}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-10">
                  {p.galleryPhotos?.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group shadow-md transition-all duration-300 hover:shadow-sky-500/10"
                    >
                      <img
                        src={photoUrl}
                        alt={`Gallery Photo ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                        onClick={() => setActiveGalleryPhoto(photoUrl)}
                      />
                      {isOwnProfile && (
                        <button
                          onClick={() => removeGalleryPhoto(photoUrl)}
                          className="absolute top-2.5 right-2.5 p-2 bg-black/60 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-10 hover:scale-105"
                          title="Remove photo"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                  {isUploading && (
                    <div className="relative aspect-square rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/40 animate-pulse">
                      <Loader2 className="animate-spin text-zinc-400 mb-2" size={24} />
                      <span className="text-[11px]">Uploading...</span>
                    </div>
                  )}
                  {isOwnProfile && (p.galleryPhotos?.length || 0) < 12 && !isUploading && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-zinc-500 hover:border-white/30 hover:text-zinc-300 transition-all duration-200 cursor-pointer bg-zinc-900/20 hover:bg-zinc-900/40">
                      <Plus size={20} className="mb-1" />
                      <span className="text-xs font-medium">Add Photo</span>
                      <span className="text-[9px] text-zinc-600 mt-0.5">{(p.galleryPhotos?.length || 0)} / 12</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            addGalleryPhoto(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              )}
            </>
          )}

          {/* Own-profile settings */}
          {isOwnProfile && (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-10">
              <h2 className="text-lg font-semibold mb-4">Creator Settings</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Bio</label>
                  <textarea value={bioInput} onChange={(e) => setBioInput(e.target.value)} placeholder="Tell people about yourself…" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600 min-h-[80px]" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Monthly Subscription Price (₹)</label>
                  <input type="number" min="0" value={subscriptionPriceInput} onChange={(e) => setSubscriptionPriceInput(e.target.value)} placeholder="e.g. 99" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600" />
                  <p className="text-xs text-zinc-500 mt-1.5">Set your live stream price. Users pay this to access your live streams.</p>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Cover Photo</label>
                  <label className="flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-3 cursor-pointer hover:bg-zinc-700 transition-colors text-sm">
                    <ImageIcon size={16} /> {coverFile ? coverFile.name : 'Upload cover'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setCoverFile(e.target.files[0])} />
                  </label>
                </div>
                <button onClick={saveProfileSettings} className="w-full bg-white text-black font-medium py-3 rounded-xl hover:opacity-90 transition-opacity cursor-pointer">
                  Save Settings
                </button>
              </div>
            </div>
          )}



          {/* Creator Payment Details (for receiving user payments) */}
          {isOwnProfile && (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><QrCode size={20} className="text-sky-400" /> Receive Payments</h2>
                {(paymentDetails?.upiId || paymentDetails?.bankAccount) && <span className="text-xs text-emerald-400 flex items-center gap-1"><CreditCard size={12} /> Payment details set</span>}
              </div>

              {/* Display current payment details */}
              {(paymentDetails?.upiId || paymentDetails?.bankAccount) ? (
                <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-5 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium flex items-center gap-2"><QrCode size={16} /> Your Payment Details</h3>
                    <button onClick={() => setShowPaymentForm(true)} className="text-xs text-sky-400 hover:text-sky-300">Edit</button>
                  </div>
                  <div className="space-y-2 text-sm">
                    {paymentDetails.upiId && (
                      <div className="flex justify-between"><span className="text-zinc-500">UPI ID</span><span className="font-medium font-mono">{paymentDetails.upiId}</span></div>
                    )}
                    {paymentDetails.bankAccount && (
                      <div className="flex justify-between"><span className="text-zinc-500">Bank Account</span><span className="font-medium">{paymentDetails.bankAccount}</span></div>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-3">Users will pay you directly via UPI/Bank for live stream access. Share these details with your subscribers.</p>
                </div>
              ) : (
                <div className="bg-zinc-900/40 border-2 border-dashed border-white/10 rounded-xl p-6 text-center mb-4">
                  <QrCode size={32} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-400 mb-4">Add your UPI ID or Bank Account to receive payments from users who subscribe to your live streams.</p>
                  <button onClick={() => setShowPaymentForm(true)} className="inline-flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-sky-400 transition-colors cursor-pointer">
                    <QrCode size={16} /> Add Payment Details
                  </button>
                </div>
              )}

              {/* Add/Edit Payment Details Form */}
              {showPaymentForm && (
                <div className="mt-4 bg-zinc-900/40 border border-white/5 rounded-xl p-5 space-y-4">
                  <h3 className="font-medium flex items-center gap-2"><QrCode size={16} /> {paymentDetails?.upiId || paymentDetails?.bankAccount ? 'Edit' : 'Add'} Payment Details</h3>
                  {paymentError && <p className="text-red-400 text-sm">{paymentError}</p>}
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">UPI ID</label>
                    <input type="text" value={paymentForm.upiId} onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })} placeholder="yourname@upi" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-colors" />
                    <p className="text-xs text-zinc-500 mt-1">e.g., yourname@paytm, yourname@okicici, etc.</p>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Bank Account (optional)</label>
                    <textarea value={paymentForm.bankAccount} onChange={(e) => setPaymentForm({ ...paymentForm, bankAccount: e.target.value })} placeholder="Account Holder: John Doe\nAccount No: 1234567890\nIFSC: ABCD0123456\nBank: ABC Bank" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600 min-h-[80px]" />
                    <p className="text-xs text-zinc-500 mt-1">Enter full bank details for users who prefer bank transfer.</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setShowPaymentForm(false); setPaymentError(''); }} className="flex-1 bg-zinc-800 text-white font-medium py-3 rounded-xl hover:bg-zinc-700 transition-colors cursor-pointer">
                      Cancel
                    </button>
                    <button onClick={handleSavePaymentDetails} disabled={savingPayment} className="flex-1 bg-sky-500 text-white font-medium py-3 rounded-xl hover:bg-sky-400 transition-colors disabled:opacity-50 cursor-pointer">
                      {savingPayment ? <RefreshCw className="animate-spin mx-auto" size={18} /> : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowNewPost(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><ImageIcon size={18} className="text-zinc-400" /> New Post</h3>
              <button onClick={() => setShowNewPost(false)} className="text-zinc-400 hover:text-white"><X size={18} /></button>
            </div>
            
            {postError && <p className="text-red-400 text-xs mb-3">{postError}</p>}

            <div className="space-y-4">
              {/* File Selectors / Previews */}
              {newPostPreviews.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {newPostPreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-950 border border-white/10">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          const updatedFiles = newPostFiles.filter((_, i) => i !== idx);
                          handleNewPostFiles(updatedFiles);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/70 rounded-full text-white hover:bg-black/90 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {newPostPreviews.length < 3 && (
                    <label className="aspect-square rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-zinc-500 hover:border-white/40 hover:text-zinc-300 transition-colors cursor-pointer">
                      <Plus size={16} />
                      <span className="text-[10px] mt-1">Add Photo</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            const newFiles = Array.from(e.target.files);
                            handleNewPostFiles([...newPostFiles, ...newFiles]);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <label className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-zinc-500 hover:border-white/30 hover:text-zinc-300 transition-colors cursor-pointer text-center">
                  <ImageIcon size={32} className="mb-2 text-zinc-600" />
                  <p className="text-sm font-medium">Select Photos</p>
                  <p className="text-xs text-zinc-600 mt-1">Upload up to 3 photos (JPEG, PNG)</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleNewPostFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                </label>
              )}

              {/* Caption */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Caption</label>
                <textarea
                  value={newPostCaption}
                  onChange={(e) => setNewPostCaption(e.target.value)}
                  placeholder="Write a caption... (max 500 characters)"
                  maxLength={500}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/30 transition-colors placeholder:text-zinc-700 min-h-[100px]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewPost(false)}
                  className="flex-1 bg-zinc-800 text-white font-medium py-2.5 rounded-xl hover:bg-zinc-750 transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPost}
                  disabled={submittingPost || newPostFiles.length === 0}
                  className="flex-1 bg-white text-black font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer text-sm flex items-center justify-center gap-1.5"
                >
                  {submittingPost ? <Loader2 size={16} className="animate-spin" /> : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Detail Modal */}
      {activePost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => { setActivePost(null); setCommentInput(''); }}>
          <div className="bg-[#1C1E22] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
            
            {/* Left/Top: Image slider */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
              <img
                src={activePost.images[activePhotoIdx]}
                alt=""
                className="w-full h-full object-contain max-h-[40vh] md:max-h-[80vh]"
              />
              {activePost.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : activePost.images.length - 1))}
                    className="absolute left-4 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActivePhotoIdx((prev) => (prev < activePost.images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <ChevronRight size={20} />
                  </button>
                  {/* Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-2 py-1 rounded-full">
                    {activePost.images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${idx === activePhotoIdx ? 'bg-white w-3' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right/Bottom: Info, Caption, Comments, Action bar */}
            <div className="w-full md:w-[380px] border-t md:border-t-0 md:border-l border-white/10 flex flex-col max-h-[45vh] md:max-h-[85vh]">
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800">
                    {activePost.creator.profileImage ? (
                      <img src={activePost.creator.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="w-full h-full flex items-center justify-center text-xs font-bold bg-zinc-700 text-white">
                        {activePost.creator.name[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-none">{activePost.creator.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">@{activePost.creator.username}</p>
                  </div>
                </div>
                {(isOwnProfile || activePost.creator._id === user?._id) && (
                  <button
                    onClick={() => handleDeletePost(activePost._id)}
                    className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    title="Delete post"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Scrollable Feed (Caption + Comments) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Caption */}
                {activePost.caption && (
                  <div className="flex gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                      {activePost.creator.profileImage ? (
                        <img src={activePost.creator.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-zinc-700 text-white">
                          {activePost.creator.name[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs">
                        <strong className="mr-1.5">{activePost.creator.username}</strong>
                        {activePost.caption}
                      </p>
                      <span className="text-[9px] text-zinc-600 block">
                        {new Date(activePost.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {activePost.comments.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-6">No comments yet. Start the conversation!</p>
                  ) : (
                    activePost.comments.map((comment) => {
                      const isCommentOwner = user && comment.user._id === user._id;
                      const isPostOwner = user && activePost.creator._id === user._id;
                      return (
                        <div key={comment._id} className="flex gap-3 text-sm group">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                            {comment.user.profileImage ? (
                              <img src={comment.user.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-zinc-700 text-white">
                                {comment.user.name[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-xs">
                              <strong className="mr-1.5">{comment.user.username}</strong>
                              {comment.text}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-zinc-600">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                              {(isCommentOwner || isPostOwner) && (
                                <button
                                  onClick={() => handleDeleteComment(activePost._id, comment._id)}
                                  className="text-[9px] text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions & Input Footer */}
              <div className="p-4 border-t border-white/5 space-y-3 bg-[#181a1d]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleLike(activePost._id)}
                      className="text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Heart
                        size={22}
                        fill={user && activePost.likes.includes(user._id) ? '#ef4444' : 'none'}
                        className={user && activePost.likes.includes(user._id) ? 'text-red-500 animate-pulse' : 'text-zinc-300'}
                      />
                    </button>
                    <button
                      onClick={() => commentInputRef.current?.focus()}
                      className="text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <MessageCircle size={22} />
                    </button>
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">
                    {activePost.likes.length} likes
                  </span>
                </div>

                {/* Comment Input */}
                {isAuthenticated ? (
                  <div className="flex gap-2">
                    <input
                      ref={commentInputRef}
                      type="text"
                      maxLength={300}
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/30 transition-colors"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={submittingComment || !commentInput.trim()}
                      className="p-2 bg-white text-black rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 cursor-pointer"
                    >
                      {submittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 text-center">Please sign in to like or comment.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowReport(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Flag size={18} className="text-red-400" />
              <h3 className="text-lg font-semibold">Report this creator</h3>
            </div>
            <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Describe the issue — e.g. illegal content, impersonation, fraud…" className="w-full bg-zinc-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600 min-h-[100px]" />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setShowReport(false)} className="px-4 py-2 rounded-xl text-sm text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer">Cancel</button>
              <button onClick={submitReport} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer">Submit Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Lightbox Modal */}
      {activeGalleryPhoto && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setActiveGalleryPhoto(null)}
        >
          <button
            onClick={() => setActiveGalleryPhoto(null)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors z-[120] cursor-pointer"
          >
            <X size={20} />
          </button>
          <div
            className="relative max-w-4xl max-h-[90vh] flex items-center justify-center animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeGalleryPhoto}
              alt="Gallery Photo"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
