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
import SeoArticle from '../components/SeoArticle';
import CompareAlternatives from '../components/CompareAlternatives';
import ShareButtons from '../components/ShareButtons';

const features = [
  {
    icon: Shield,
    title: 'Safe & Moderated',
    desc: 'Unlike Omegle, Vibelly uses AI moderation and user reporting to keep the community safe.',
  },
  {
    icon: Lock,
    title: '100% Anonymous',
    desc: 'No account required. Connect instantly without giving up your email or phone number.',
  },
  {
    icon: Video,
    title: 'HD Video Quality',
    desc: 'Powered by modern WebRTC technology for crystal clear video calls worldwide.',
  },
  {
    icon: MessageSquare,
    title: 'Hidden Groups',
    desc: 'Create private, code-only group chats that algorithms can never track.',
  },
];

export default function RandomVideoChat() {
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
        title="Free Random Video Chat Online | Meet Strangers on Vibelly" 
        description="The best free random video chat website. Meet strangers instantly online without login. Vibelly provides anonymous chat with HD video and voice."
        canonicalUrl="/random-video-chat"
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
            The #1 Free Random Video Chat
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-normal tracking-tight leading-[1.1] mb-8"
            style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            Free Random <br />
            Video Chat
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed"
          >
            Meet thousands of strangers instantly. No login required. Vibelly is the safest, fastest, and most aesthetic platform on the internet.
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

        {/* SEO Article for Keyword Depth */}
        <SeoArticle
          blocks={[
            {
              heading: 'What is random video chat?',
              paragraphs: [
                'Random video chat is exactly what it sounds like: you press a button and are instantly connected over video to a stranger you have never met. There is no friend list, no matchmaking algorithm curating your feed, and no profile to build. Every conversation is a genuine surprise.',
                'The concept was made famous by Omegle and Chatroulette, and it remains one of the most exciting ways to meet people online. Random video chat platforms match two anonymous users, let them talk for as long as they like, and let either person skip to a new stranger at any moment.',
                'Vibelly keeps that core idea but rebuilds the technology around it: modern WebRTC video, AI moderation, and an interface that starts a free video chat in under a second.',
              ],
            },
            {
              heading: 'Why try random video chat with strangers',
              paragraphs: ['People use random video chat for all kinds of reasons, but the biggest ones are:'],
              bullets: [
                'Meet people you would never cross paths with in real life',
                'Practice a new language with native speakers around the world',
                'Fight boredom with unpredictable, genuine conversations',
                'Stay anonymous — share only what you are comfortable sharing',
                'Travel socially from your couch: one call can land in Tokyo, the next in London',
              ],
            },
            {
              heading: 'How to stay safe during random video chat',
              paragraphs: [
                'Safety is the number one concern with any random video chat platform, and it is the reason Vibelly was built with moderation as a first-class feature rather than an afterthought.',
                'Every room is protected by AI screening and a one-tap report button, so inappropriate behavior can be removed instantly. All conversations are ephemeral: the moment you skip or end a call, the chat is gone and nothing is stored.',
                'As with any stranger chat, the golden rules are simple: never share personal financial information, keep your location vague, and trust your instincts — if a conversation feels wrong, skip to the next person. Vibelly makes that a single click.',
              ],
            },
            {
              heading: 'Free video chat that works everywhere',
              paragraphs: [
                'Because Vibelly runs entirely in the browser, you can start a free random video chat from a phone, tablet, or desktop without installing a single app. There is no account and no email required — just open the page and go.',
                'The experience is the same everywhere: HD video, voice-only mode, live text chat, and instant skipping. Whether you are at home, on the bus, or on a break at work, a new stranger is always one click away.',
              ],
            },
          ]}
        />

        <CompareAlternatives
          alternatives={[
            { to: '/video-chat-online', label: 'Free Online Video Call', blurb: 'Make a free online video call right in your browser.' },
            { to: '/omegle-alternative', label: 'Omegle Alternative', blurb: 'The free Omegle replacement for talking to strangers.' },
            { to: '/ometv-alternative', label: 'OmeTV Alternative', blurb: 'Video chat online without forcing a Facebook login.' },
            { to: '/talk-to-strangers', label: 'Talk to Strangers', blurb: 'Instant stranger chat with video, voice, or text.' },
            { to: '/chatroulette-alternative', label: 'Chatroulette Alternative', blurb: 'A modern, moderated take on classic chat roulette.' },
            { to: '/anonymous-chat', label: 'Anonymous Chat', blurb: 'Fully private chat rooms with no identity required.' },
          ]}
        />

        {/* FAQ Section */}
        <FAQSection faqs={[
          {
            question: "Do I need to sign up?",
            answer: "No, you don't need to sign up or provide any personal information to start using the random video chat. Just click start and instantly connect with strangers worldwide."
          },
          {
            question: "Is it safe to use?",
            answer: "We prioritize user safety above all else. We use advanced moderation tools and allow users to report inappropriate behavior instantly, ensuring a safe and clean environment."
          },
          {
            question: "Can I use it on my phone?",
            answer: "Absolutely. Our platform is fully optimized for mobile browsers, meaning you can enjoy seamless video chat on your iPhone or Android device without downloading any apps."
          },
          {
            question: "Is random video chat really free?",
            answer: "Yes. Core random video chat on Vibelly is completely free with no time limits, no credit card, and no hidden charges. Optional Premium filters are never required."
          }
        ]} />

        <ShareButtons
          title="Free Random Video Chat Online | Meet Strangers on Vibelly"
          description="Free random video chat online — meet strangers instantly with HD video, no sign-up, and no downloads."
        />

        <div className="mt-auto relative z-20">
          <Footer />
        </div>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
