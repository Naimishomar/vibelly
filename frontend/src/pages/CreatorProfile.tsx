import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, BadgeCheck, Loader2, ArrowLeft, ImageIcon, UserPlus, UserCheck, Flag, IndianRupee, Crown, Lock, Play, X, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import { useAuthStore } from '../store/useAuthStore';
import { checkProfileAccess, subscribeToCreator, reportUser } from '../services/livePaymentService';
import { uploadImage } from '../services/uploadService';

interface CreatorProfileData {
  _id: string;
  user: { _id: string; name: string; username: string; profileImage: string; premiumStatus: boolean; role: string; isBanned: boolean } | null;
  bio: string;
  coverImage: string;
  galleryPhotos: string[];
  subscriptionPrice: number;
  isVerified: boolean;
  verificationStatus: string;
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
  const [subscribed, setSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
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
      const [profileRes, streamsRes] = await Promise.all([
        fetch(`${backendUrl}/api/creator/${userId}?viewerId=${viewerId}`),
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

      // Check subscription if authenticated + not self
      if (isAuthenticated && user?._id !== userId) {
        const access = await checkProfileAccess(userId || '');
        if (access) {
          setSubscribed(!!access.access);
        }
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?._id]);

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

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to subscribe.');
      return;
    }
    setIsSubscribing(true);
    const result = await subscribeToCreator(userId || '');
    setIsSubscribing(false);
    if (result.success) {
      setSubscribed(true);
      alert('Subscribed! You now have access to this creator\'s paid streams.');
    } else {
      alert(result.error || 'Subscription failed');
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
      setSubscribed(false);
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

  const submitVerification = async () => {
    if (!selfie || !idPhoto) {
      alert('Upload both a selfie and an ID photo.');
      return;
    }
    setVerifying(true);
    const selfieUrl = await uploadImage(selfie, 'verification');
    const idUrl = await uploadImage(idPhoto, 'verification');
    if (!selfieUrl || !idUrl) {
      setVerifying(false);
      alert('Upload failed. Please try again.');
      return;
    }
    const backendUrl = getBackendUrl();
    const token = accessToken || localStorage.getItem('vibe_token');
    const res = await fetch(`${backendUrl}/api/creator/me/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ selfieUrl, idUrl }),
    });
    setVerifying(false);
    if (res.ok) {
      setShowVerify(false);
      setSelfie(null);
      setIdPhoto(null);
      alert('Verification submitted! Our team will review it shortly.');
      fetchProfile();
    } else {
      const d = await res.json();
      alert(d.error || 'Failed to submit verification');
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
                {p.isVerified && (
                  <span className="flex items-center gap-1 bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    <BadgeCheck size={12} /> VERIFIED
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
                  <IndianRupee size={14} /> {p.subscriptionPrice}/month
                </div>
              )}
              {!isOwnProfile && (
                <>
                  <button onClick={toggleFollow} className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer">
                    {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  {p.subscriptionPrice > 0 && (
                    <button onClick={handleSubscribe} disabled={isSubscribing || subscribed} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer">
                      {isSubscribing ? <Loader2 className="animate-spin w-4 h-4" /> : <Crown size={16} />}
                      {subscribed ? 'Subscribed' : `Subscribe ₹${p.subscriptionPrice}`}
                    </button>
                  )}
                  <button onClick={() => setShowReport(true)} className="p-2 bg-zinc-800 rounded-xl text-red-400 hover:bg-zinc-700 transition-colors cursor-pointer" title="Report creator">
                    <Flag size={18} />
                  </button>
                </>
              )}
              {isOwnProfile && (
                <Link to="/live" className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer">
                  <Play size={16} /> Go Live
                </Link>
              )}
            </div>
          </div>

          {/* Verification banner for own profile */}
          {isOwnProfile && p.verificationStatus !== 'approved' && (
            <div className="mb-8 bg-zinc-900/60 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Creator Verification</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {p.verificationStatus === 'pending' && 'Your verification is under review. You can start paid streams once approved.'}
                    {p.verificationStatus === 'rejected' && 'Your verification was rejected. Submit new selfie + ID photos.'}
                    {p.verificationStatus === 'none' && 'Verify your identity to enable paid streams and subscriptions. We manually review every submission to keep the platform safe.'}
                  </p>
                </div>
              </div>
              {p.verificationStatus !== 'pending' && (
                <button onClick={() => setShowVerify(true)} className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-400 transition-colors cursor-pointer">
                  <BadgeCheck size={16} /> Get Verified
                </button>
              )}
              {p.verificationStatus === 'pending' && (
                <span className="flex items-center gap-2 text-amber-300 text-sm"><Clock size={16} /> In review</span>
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
                  <p className="text-xs text-zinc-500 mt-1.5">Only verified creators can enable subscriptions. You earn 70%, Vibelly takes 30%.</p>
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
        </main>

        <Footer />
      </div>

      {/* Verification modal */}
      {showVerify && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowVerify(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={20} className="text-amber-400" />
              <h3 className="text-lg font-semibold">Creator Verification</h3>
            </div>
            <p className="text-xs text-zinc-400 mb-5">Upload a clear selfie and a government ID photo. Our team manually reviews them to protect creators and viewers from fraud.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Selfie</label>
                <label className="flex items-center justify-center gap-2 bg-zinc-800 border border-dashed border-white/20 rounded-xl px-4 py-4 cursor-pointer hover:bg-zinc-700 transition-colors text-sm">
                  {selfie ? selfie.name : 'Upload selfie'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setSelfie(e.target.files[0])} />
                </label>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5 font-medium">Government ID</label>
                <label className="flex items-center justify-center gap-2 bg-zinc-800 border border-dashed border-white/20 rounded-xl px-4 py-4 cursor-pointer hover:bg-zinc-700 transition-colors text-sm">
                  {idPhoto ? idPhoto.name : 'Upload ID photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && setIdPhoto(e.target.files[0])} />
                </label>
              </div>
              <button onClick={submitVerification} disabled={verifying} className="w-full flex items-center justify-center gap-2 bg-amber-500 text-black font-medium py-3 rounded-xl hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer">
                {verifying ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 size={18} />}
                {verifying ? 'Submitting…' : 'Submit for Review'}
              </button>
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
    </div>
  );
}
