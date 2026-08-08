import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Flame, Heart, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import LoginModal from './LoginModal';

const IMG = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;

const MODELS = [
  { name: 'Luna', age: 24, country: 'Brazil', online: true, image: IMG('photo-1534528741775-53994a69daeb') },
  { name: 'Sofia', age: 22, country: 'Spain', online: true, image: IMG('photo-1544005313-94ddf0286df2') },
  { name: 'Amara', age: 26, country: 'Nigeria', online: true, image: IMG('photo-1508214751196-bcfd4ca60f91') },
  { name: 'Isabella', age: 23, country: 'Italy', online: true, image: IMG('photo-1531746020798-e6953c6e8e04') },
  { name: 'Mila', age: 21, country: 'Russia', online: true, image: IMG('photo-1529626455594-4ff0802cfb7e') },
  { name: 'Chloe', age: 25, country: 'France', online: true, image: IMG('photo-1517841905240-472988babdf9') },
  { name: 'Yasmin', age: 22, country: 'Morocco', online: true, image: IMG('photo-1488426862026-3ee34a7d66df') },
  { name: 'Nadia', age: 27, country: 'India', online: true, image: IMG('photo-1494790108377-be9c29b29330') },
];

export default function HotModels() {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated, guestAccessEnabled } = useAuthStore();

  const handleWatch = (path: string) => {
    if (!isAuthenticated && !guestAccessEnabled) {
      setIsLoginModalOpen(true);
    } else {
      navigate(path);
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-4 md:px-6 pb-24 relative z-10">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <p className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-red-400 mb-3">
          <Flame size={14} /> Trending Now
        </p>
        <h2
          className="text-3xl md:text-5xl font-normal text-white mb-4 leading-tight"
          style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
        >
          Hot Models Online
        </h2>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base">
          Meet today's most-watched models. Tap any card to start a live video call instantly — no sign-up needed.
        </p>
      </motion.div>

      {/* Models strip */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MODELS.map((model, idx) => (
          <motion.button
            key={model.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => handleWatch('/setup/video')}
            className="relative w-36 sm:w-44 shrink-0 snap-start rounded-2xl overflow-hidden bg-zinc-900/60 border border-white/10 group cursor-pointer text-left"
          >
            <div className="relative h-60 sm:h-72 overflow-hidden">
              <img
                src={model.image}
                alt={model.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

              {/* Live badge */}
              <span className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-red-500 px-2 py-0.5 rounded-full text-[10px] font-bold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>

              {/* Favorite */}
              <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Heart size={13} />
              </span>

              {/* Info */}
              <div className="absolute bottom-0 inset-x-0 p-3">
                <p className="text-white font-semibold text-sm leading-tight">
                  {model.name}, {model.age}
                </p>
                <p className="text-[11px] text-zinc-300 flex items-center gap-1 mt-0.5">
                  <MapPin size={10} /> {model.country}
                </p>
              </div>
            </div>

            {/* Online row */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Online now
              </span>
              <span className="text-[11px] text-white font-medium bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full transition-colors">
                Call
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </section>
  );
}
