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

export default function VideoChatOnline() {
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
        title="Free Online Video Call | Video Chat Online with Strangers | Vibelly" 
        description="Make a free online video call with strangers right in your browser. Vibelly is the fastest free video chat online — HD video, no sign-up, works on mobile and desktop."
        canonicalUrl="/video-chat-online"
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
            Free Video Chat Online
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-normal tracking-tight leading-[1.1] mb-8"
            style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            Free Online Video Call <br />
            with Strangers
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed"
          >
            Make a free online video call in one click — no app, no account, no download. Vibelly is the fastest way to video chat online with strangers.
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
              heading: 'What is a free online video call?',
              paragraphs: [
                'A free online video call lets you see and talk to another person in real time using nothing more than your browser. Unlike video calling apps such as WhatsApp, Zoom, or FaceTime — which require an account, a phone number, or a download — a browser-based video chat like Vibelly starts the moment you arrive.',
                'With Vibelly you are not calling a specific contact. You are randomly matched with a stranger from anywhere in the world, which makes every free online video call a surprise. The connection is built on WebRTC, the same open standard that powers modern video calling, so it is fast, private, and works without plugins.',
              ],
            },
            {
              heading: 'Free video chat online vs video calling apps',
              paragraphs: ['Video calling apps are great for people you already know, but they are the wrong tool when you want to meet someone new. Here is how browser-based free video chat compares:'],
              bullets: [
                'No account, phone number, or app download required to start',
                'Meet strangers instantly instead of adding contacts first',
                'HD quality with automatic bandwidth adaptation for slow connections',
                'Anonymous by default — you control exactly what you reveal',
                'Works identically on mobile, tablet, and desktop browsers',
              ],
            },
            {
              heading: 'How to make a free online video call on Vibelly',
              paragraphs: [
                'Making a free online video call on Vibelly takes one click. Open the site, press "Video Chat", allow camera and microphone access when your browser asks, and you will be matched with a stranger in under a second.',
                'Once matched, you can toggle your camera and mic on or off without ending the call, type in the live chat panel, or skip to the next person whenever you like. Skipping re-queues both users instantly, so you always have a fresh conversation waiting.',
                'There is no time limit on free calls, and you never need a credit card. The only optional upgrade is Vibelly Premium, which unlocks gender and country filters for a more tailored free online video call experience.',
              ],
            },
            {
              heading: 'Tips for a smooth video chat experience',
              paragraphs: [
                'To get the clearest free online video call, use a wired internet connection or sit near your Wi-Fi router, close apps that stream in the background, and make sure your camera and microphone are not in use by another application.',
                'If your connection dips, Vibelly automatically lowers video quality to keep the call alive instead of dropping it. You can also switch to voice-only or text chat at any moment, and your match stays on the same connection.',
                'And because every call is ephemeral, nothing you say is stored. When the free video chat ends, the conversation ends with it.',
              ],
            },
          ]}
        />

        <CompareAlternatives
          alternatives={[
            { to: '/random-video-chat', label: 'Random Video Chat', blurb: 'Free random video calls with strangers in under a second.' },
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
            question: "Are free online video calls really free?",
            answer: "Yes. Core random video chat on Vibelly is completely free with no time limits, no credit card, and no hidden charges. Premium filters are optional upgrades."
          }
        ]} />

        <ShareButtons
          title="Free Online Video Call | Video Chat Online with Strangers | Vibelly"
          description="Make a free online video call right in your browser — no download, no sign-up, just instant video chat with strangers."
        />

        <div className="mt-auto relative z-20">
          <Footer />
        </div>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
