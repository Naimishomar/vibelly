import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Loader2, ArrowLeft, ImageIcon, UserPlus, UserCheck, Flag, IndianRupee, Crown, Lock, Play, X, CheckCircle2, CreditCard, RefreshCw, Wallet, QrCode } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import { useAuthStore } from '../store/useAuthStore';
import { reportUser, checkCreatorSubscription, createCreatorSubscriptionOrder, verifyCreatorSubscription, getCreatorPaymentDetails, saveCreatorPaymentDetails, loadScript, type CreatorSubscriptionStatus, type CreatorPaymentDetails } from '../services/livePaymentService';
import { uploadImage } from '../services/uploadService';

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

  const isOwnProfile = !!user && !!profile?.user && user._id === profile.user._id;

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const backendUrl = getBackendUrl();
      const viewerId = user?._id || '';
      const isOwn = isOwnProfile;
      
      const profileUrl = isOwn 
        ? `${backendUrl}/api/creator/me/profile`
        : `${backendUrl}/api/creator/${userId}?viewerId=${viewerId}`;
      
      const [profileRes, streamsRes] = await Promise.all([
        fetch(profileUrl, {
          headers: isOwn ? { 'Authorization': `Bearer ${accessToken || localStorage.getItem('vibe_token')}` } : {}
        }),
        fetch(`${backendUrl}/api/creator/streams/${userId}`),
      ]);
      if (!profileRes.ok) {
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
          <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 mb-16">
            {p.coverImage ? <img src={p.coverImage} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-800"><ImageIcon size={48} /></div>}
            {/* Avatar */}
            <div className="absolute -bottom-12 left-6 w-28 h-28 rounded-full bg-zinc-800 border-4 border-[#15171B] overflow-hidden flex-shrink-0">
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
                  <IndianRupee size={14} /> ₹{p.subscriptionPrice}/stream
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

          {/* Creator Subscription Status for own profile */}
          {isOwnProfile && (
            <div className="mb-8 bg-zinc-900/60 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Wallet size={20} className={creatorSubscription?.active ? 'text-emerald-400' : 'text-amber-400'} flex-shrink-0 />
                <div>
                  <p className="text-sm font-medium">Live Streaming Access</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {creatorSubscription?.active 
                      ? `Active until ${creatorSubscription.expiresAt ? new Date(creatorSubscription.expiresAt).toLocaleDateString() : 'N/A'}. You can go live and monetize streams.`
                      : 'Pay ₹500/month to unlock live streaming. Your profile and photos are always free.'}
                  </p>
                </div>
              </div>
              {!creatorSubscription?.active && (
                <button onClick={handleCreateSubOrder} disabled={creatingSubOrder} className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer">
                  {creatingSubOrder ? <RefreshCw className="animate-spin mx-auto" size={18} /> : <>Activate Live Streaming <IndianRupee size={14} /> 500/month</>}
                </button>
              )}
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

          {/* Gallery */}
          <h2 className="text-lg font-semibold mb-4">Photos</h2>
          {p.galleryPhotos.length === 0 && !isOwnProfile ? (
            <p className="text-zinc-500 text-sm bg-zinc-900/40 rounded-2xl border border-white/5 py-8 text-center">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {p.galleryPhotos.map((photo) => (
                <div key={photo} className="relative aspect-square rounded-xl overflow-hidden group bg-zinc-900 border border-white/10">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  {isOwnProfile && (
                    <button onClick={() => removeGalleryPhoto(photo)} className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {isOwnProfile && p.galleryPhotos.length < 12 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center text-zinc-500 hover:border-white/40 hover:text-zinc-300 transition-colors cursor-pointer">
                  <ImageIcon size={24} className="mb-2" />
                  <span className="text-xs">Add photo</span>
                  <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => e.target.files?.[0] && addGalleryPhoto(e.target.files[0])} />
                </label>
              )}
            </div>
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

          {/* Creator Profile Subscription (₹500/month) */}
          {isOwnProfile && (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Wallet size={20} className="text-amber-400" /> Creator Profile Access</h2>
                {creatorSubscription?.active && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> Active</span>}
              </div>

              {creatorSubscription?.active ? (
                <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-5">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500">Status</span><span className="text-emerald-400 font-medium">Active</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Monthly Fee</span><span className="font-medium">₹500</span></div>
                    {creatorSubscription.expiresAt && (
                      <div className="flex justify-between"><span className="text-zinc-500">Expires</span><span>{new Date(creatorSubscription.expiresAt).toLocaleDateString()}</span></div>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-3">Your creator profile is active. You can go live and receive payments from users.</p>
                </div>
              ) : (
                <div className="bg-zinc-900/40 border-2 border-dashed border-white/10 rounded-xl p-6 text-center">
                  <Wallet size={32} className="mx-auto text-zinc-600 mb-3" />
                  <p className="text-zinc-400 mb-4">Activate your creator profile for ₹500/month to go live and monetize your streams.</p>
                  <button onClick={handleCreateSubOrder} disabled={creatingSubOrder} className="inline-flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-xl font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer">
                    {creatingSubOrder ? <RefreshCw className="animate-spin mx-auto" size={18} /> : <>Activate Profile <IndianRupee size={14} /> 500/month</>}
                  </button>
                </div>
              )}
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
    </div>
  );
}
