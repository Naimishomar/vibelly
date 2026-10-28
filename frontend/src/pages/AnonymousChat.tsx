import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Video, Zap, MessageSquare, Lock, Headphones} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import { useAuthStore } from '../store/useAuthStore';
import LoginModal from '../components/LoginModal';
import FAQSection from '../components/FAQSection';
import KeywordBlock from '../components/KeywordBlock';
import ShareButtons from '../components/ShareButtons';

const features = [
  {
    icon: Shield,
    title: 'Adults Only (18+)',
    desc: 'Vibelly is 18+ only, and every call has a one-tap Report button (sign-in required) reviewed by hand.',
  },
  {
    icon: Lock,
    title: 'No Account Needed',
    desc: 'No account required. Connect instantly without giving up your email or phone number.',
  },
  {
    icon: Video,
    title: 'Smooth WebRTC Video',
    desc: 'Powered by modern WebRTC, with 720p HD video on Premium.',
  },
  {
    icon: MessageSquare,
    title: 'Hidden Groups',
    desc: 'Create private group chats that people can join only with a code.',
  },
];

export default function AnonymousChat() {
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
        title="Anonymous Chat With No Account | Vibelly" 
        description="Looking for an anonymous chat website? Vibelly offers free random video and text chat with no account, email, or phone number needed."
        canonicalUrl="/anonymous-chat"
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
            100% Secure & Private
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-normal tracking-tight leading-[1.1] mb-8"
            style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            Anonymous Chat <br />
            Without an Account
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed"
          >
            Chat freely without giving up your email, phone, or identity. Vibelly is a free, adults-only random video chat that runs in your browser.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button 
              onClick={() => handleProtectedNavigation('/setup/video')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Video size={20} className="group-hover:scale-110 transition-transform" />
              Video Chat
            </button>
            <button 
              onClick={() => handleProtectedNavigation('/setup/audio')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 group cursor-pointer border border-white/10 hover:border-white/20"
            >
              <Headphones size={20} className="group-hover:scale-110 transition-transform" />
              Text & Audio
            </button>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-20 bg-[#0f1115] border-y border-white/5 relative z-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4">
                    <feature.icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <KeywordBlock slug="anonymous-chat" />


        {/* FAQ Section */}
        <FAQSection faqs={[
          {
            question: "Do I need to sign up?",
            answer: "No, you don't need to sign up or provide any personal information to start using the random video chat. Just click start and instantly connect with strangers worldwide. Reporting, Premium, and direct messages use a Google or GitHub sign-in."
          },
          {
            question: "Is it safe to use?",
            answer: "Vibelly is strictly 18+. Every call has a Report button; reporting requires signing in, every report is reviewed by hand, and users who break the rules are banned."
          },
          {
            question: "Can the other person see my IP address?",
            answer: "As with any peer-to-peer video call, the other person can see your IP address, which can reveal your approximate location. Share only what you are comfortable with, and never share personal details with strangers."
          },
          {
            question: "Can I use it on my phone?",
            answer: "Yes. Vibelly works in any modern mobile browser, on iPhone or Android, with no app to download."
          }
        ]} />

        <ShareButtons
          title="Anonymous Chat With No Account | Vibelly"
          description="Anonymous chat with no account needed: free random video and text chat with strangers, right in your browser."
        />

        <div className="mt-auto relative z-20">
          <Footer />
        </div>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
