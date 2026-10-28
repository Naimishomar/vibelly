import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function TalkToStrangers() {
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
        title="Talk to Strangers | Random Stranger Chat Online" 
        description="Talk to strangers from around the world on Vibelly. Free random video and text chat with strangers, plus tips for starting a good conversation."
        canonicalUrl="/talk-to-strangers"
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
            Instant Connections Worldwide
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-normal tracking-tight leading-[1.1] mb-8"
            style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            Talk to <br />
            Strangers Instantly
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed"
          >
            Connect with strangers from around the world. Vibelly is a free, adults-only random video chat that runs in your browser.
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

        {/* Conversation advice */}
        <section className="px-6 py-20 max-w-3xl mx-auto w-full">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">How to start a good conversation with a stranger</h2>
          <ul className="list-disc pl-6 space-y-3 text-zinc-400 mb-6">
            <li>Open with a specific, easy question: &quot;Where are you calling from?&quot; works better than &quot;hi&quot;.</li>
            <li>Ask open questions that start with what, how, or why, then follow up on the answer.</li>
            <li>Share a little about yourself too, so it feels like a conversation, not an interview.</li>
            <li>If it is not clicking, say &quot;nice talking to you&quot; and skip. No hard feelings.</li>
          </ul>
          <p className="text-zinc-400">
            More opening lines and questions in our guide: <Link to="/blog/how-to-start-a-conversation-with-a-stranger" className="underline hover:text-white">How to Start a Conversation With a Stranger</Link>. Staying safe matters too: read the <Link to="/blog/random-video-chat-safety-checklist" className="underline hover:text-white">random video chat safety checklist</Link>.
          </p>
        </section>

        <KeywordBlock slug="talk-to-strangers" />


        {/* FAQ Section */}
        <FAQSection faqs={[
          {
            question: "Do I need to sign up?",
            answer: "No, you don't need to sign up or provide any personal information to start using the random video chat. Just click start and instantly connect with strangers worldwide."
          },
          {
            question: "Is it safe to use?",
            answer: "We prioritize user safety above all else. Vibelly is strictly 18+, every call has a one-tap Report button (sign-in required), every report is reviewed by hand, and users who break the rules are banned."
          },
          {
            question: "Can I use it on my phone?",
            answer: "Absolutely. Our platform is fully optimized for mobile browsers, meaning you can enjoy seamless video chat on your iPhone or Android device without downloading any apps."
          }
        ]} />

        <ShareButtons
          title="Talk to Strangers | Random Stranger Chat Online"
          description="Talk to strangers online with free random stranger chat — video or text, anonymous and instant."
        />

        <div className="mt-auto relative z-20">
          <Footer />
        </div>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
