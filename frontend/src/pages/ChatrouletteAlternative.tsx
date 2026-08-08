import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Video, Zap, MessageSquare, ArrowRight, Lock, Headphones } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import { useAuthStore } from '../store/useAuthStore';
import LoginModal from '../components/LoginModal';
import FAQSection from '../components/FAQSection';
import ShareButtons from '../components/ShareButtons';

const features = [
  {
    icon: Video,
    title: 'Modern WebRTC',
    desc: 'Chatroulette was built in the flash era. Vibelly uses modern WebRTC for ultra-low latency HD video.',
  },
  {
    icon: Shield,
    title: 'AI Moderation',
    desc: 'No more unexpected inappropriate content. Our AI screening keeps the chat clean.',
  },
  {
    icon: Lock,
    title: '100% Free & Anonymous',
    desc: 'No complicated currency systems or account requirements. Just click and talk.',
  },
  {
    icon: MessageSquare,
    title: 'Hidden Groups',
    desc: 'Create private, code-only group chats that algorithms can never track.',
  },
];

export default function ChatrouletteAlternative() {
  const navigate = useNavigate();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated, guestAccessEnabled } = useAuthStore();

  const handleProtectedNavigation = (path: string) => {
    if (!isAuthenticated && !guestAccessEnabled) {
      setIsLoginModalOpen(true);
    } else {
      navigate(path);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#15171B] text-white flex flex-col font-sans">
      <SEO 
        title="The Best Chatroulette Alternative in 2026 | Vibelly" 
        description="Looking for a modern Chatroulette alternative? Vibelly offers HD random video chat, voice calls, and safe AI moderation for free."
        canonicalUrl="/chatroulette-alternative"
      />
      <BlinkingDotsGrid />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 md:pt-32 md:pb-24 max-w-4xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium mb-8"
          >
            <Zap size={16} className="text-yellow-400" />
            The Modern Chatroulette Upgrade
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-normal tracking-tight leading-[1.1] mb-8"
            style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            Chatroulette is dead.<br />
            Long live Vibelly.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed"
          >
            Experience random video chat the way it was meant to be. 
            HD video, fast matching, and an aesthetic dark-mode design.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button
              onClick={() => handleProtectedNavigation('/setup/video')}
              className="flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Start Video Call Now
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => handleProtectedNavigation('/setup/audio')}
              className="flex items-center gap-2 bg-zinc-800/60 text-white border border-zinc-700 px-8 py-3.5 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
            >
              <Headphones size={18} />
              Voice Only
            </button>
          </motion.div>
        </section>

        {/* Feature Grid */}
        <section className="px-6 py-20 max-w-6xl mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-normal mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Why switch to Vibelly?
            </h2>
            <p className="text-zinc-500 text-base max-w-xl mx-auto">
              A faster, safer, and better-looking alternative to the classic chat roulette experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 hover:bg-zinc-900 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SEO Text Block for Keyword Density */}
        <section className="px-6 py-20 max-w-3xl mx-auto w-full text-center">
          <h2 className="text-2xl font-bold mb-6 text-zinc-300">The Modern Chatroulette Alternative</h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-6">
            If you are looking for a Chatroulette alternative that feels modern and fast, Vibelly is your answer. While classic platforms struggle with bots and outdated technology, Vibelly is built on modern WebRTC for instant, high-quality connections.
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Whether you want to talk to strangers via video, or use our audio-only mode, Vibelly provides the safest and most aesthetic random chat experience on the internet today.
          </p>
        </section>

        <FAQSection faqs={[
          {
            question: "Is Vibelly a good Chatroulette alternative?",
            answer: "Yes, Vibelly was built to be the modern successor to Chatroulette. We offer instant matching, HD video powered by WebRTC, and a sleek dark-mode interface that doesn't feel like it was built in 2009."
          },
          {
            question: "Is it completely free?",
            answer: "Absolutely. You can talk to random strangers online via video or voice completely for free, with no hidden charges or premium subscriptions required to use the core features."
          },
          {
            question: "Are there bots on Vibelly?",
            answer: "We use advanced AI screening to filter out bots, spam, and inappropriate content, ensuring you actually match with real humans."
          },
          {
            question: "Do I need to download an app?",
            answer: "No download required. Vibelly works seamlessly right in your browser on both desktop and mobile devices."
          }
        ]} />

        <ShareButtons
          title="The Best Chatroulette Alternative in 2026 | Vibelly"
          description="The modern successor to classic chat roulette — free random cam chat with strangers, safe and anonymous."
        />

        <Footer />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    </div>
  );
}
