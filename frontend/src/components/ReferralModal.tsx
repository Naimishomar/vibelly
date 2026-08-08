import { useState, useEffect } from 'react';
import { X, Gift, Check, Copy, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { buildReferralLink } from '../lib/referral';
import { useAuthStore } from '../store/useAuthStore';

interface ReferralModalProps {
  onClose: () => void;
}

interface ReferralInfo {
  code: string;
  link: string;
  count: number;
  rewardDays: number;
  rewardPerReferral: number;
}

export default function ReferralModal({ onClose }: ReferralModalProps) {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const token = useAuthStore.getState().accessToken || localStorage.getItem('vibe_token');

    fetch(`${backendUrl}/api/referral/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.success) {
          setInfo(data.referral);
        }
      })
      .catch(err => console.error('Failed to fetch referral info', err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const copyLink = async () => {
    if (!info) return;
    const link = buildReferralLink(info.code);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const nativeShare = async () => {
    if (!info) return;
    const link = buildReferralLink(info.code);
    const text = `Join me on Vibelly — free random video chat with people worldwide. Use my invite link and we both get ${info.rewardPerReferral} days of Premium!`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Vibelly', text, url: link });
        return;
      } catch (e) {
        console.error('Share cancelled', e);
      }
    }
    copyLink();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#1A1A1A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 pb-4 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-white/15 to-transparent rounded-full blur-2xl pointer-events-none" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-200 via-white to-amber-400 p-[2px]">
              <div className="w-full h-full rounded-[14px] bg-[#1A1A1A] flex items-center justify-center">
                <Gift size={20} className="text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Invite & Earn</h2>
          </div>
          <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
            Invite a friend to Vibelly. When they join, <span className="text-white font-medium">you both get {info?.rewardPerReferral ?? 3} days of Premium</span> — unlocked gender filters, profile borders & more.
          </p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Progress card */}
          <div className="rounded-2xl bg-[#131313] border border-white/5 p-4">
            {loading ? (
              <div className="flex items-center justify-center py-3">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : info ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-2xl font-bold text-white">{info.count}</p>
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500 mt-1">Friends joined</p>
                </div>
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-2xl font-bold text-white">{info.rewardDays}d</p>
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500 mt-1">Premium earned</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={copyLink}
              className="flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/85 transition-colors cursor-pointer text-sm"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
            <button
              onClick={nativeShare}
              className="flex items-center justify-center gap-2 bg-white/10 border border-white/15 text-white font-semibold py-3 rounded-xl hover:bg-white/15 transition-colors cursor-pointer text-sm"
            >
              <Link2 size={16} />
              Share
            </button>
          </div>

          {/* The link box */}
          {info && (
            <div className="flex items-center gap-2 rounded-xl bg-[#0F0F0F] border border-white/10 px-3 py-2.5">
              <Link2 size={14} className="text-zinc-500 shrink-0" />
              <span className="text-xs text-zinc-400 truncate">{buildReferralLink(info.code)}</span>
              <button
                onClick={copyLink}
                aria-label="Copy link"
                className="ml-auto shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          )}

          <p className="text-[11px] text-zinc-600 text-center leading-relaxed">
            Referral reward applies once per friend. No limits on how many friends you invite.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
