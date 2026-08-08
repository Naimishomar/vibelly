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
import SeoArticle from '../components/SeoArticle';
import CompareAlternatives from '../components/CompareAlternatives';
import ShareButtons from '../components/ShareButtons';

const features = [
  {
    icon: Lock,
    title: 'No Social Login Required',
    desc: 'Unlike OmeTV which forces you to use Facebook or VK, Vibelly is 100% anonymous.',
  },
  {
    icon: Shield,
    title: 'AI Moderation',
    desc: 'We use advanced AI to keep the platform safe without needing intrusive monitoring.',
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

export default function OmeTvAlternative() {
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
        title="The Best OmeTV Alternative Without Facebook Login | Vibelly" 
        description="Looking for an OmeTV alternative that doesn't require a Facebook account? Vibelly is 100% anonymous, free, and features HD random video chat."
        canonicalUrl="/ometv-alternative"
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
            The #1 Anonymous Alternative to OmeTV
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-normal tracking-tight leading-[1.1] mb-8"
            style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            Tired of Facebook Logins?<br />
            Meet Vibelly.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed"
          >
            OmeTV forces you to link your social media. We don't. 
            Experience true random video chat with complete anonymity and zero tracking.
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
              We took everything you loved about random video chat and removed the annoying requirements.
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

        {/* SEO Article for Keyword Depth */}
        <SeoArticle
          blocks={[
            {
              heading: 'Why people look for an OmeTV alternative',
              paragraphs: [
                'OmeTV remains one of the most popular random video chat apps, but it is far from perfect. The biggest complaint by far is that it forces you to log in with your personal Facebook or VK account before you can start chatting. For people who value privacy, that single requirement is a dealbreaker.',
                'There are other frustrations too: frequent bans, an aggressive verification flow, and an experience that increasingly nudges you toward in-app purchases. When your "anonymous video chat" app demands your real identity, it stops feeling anonymous.',
                'That is why so many users search for an OmeTV alternative that keeps the good parts — HD random video chat with people around the world — and drops the social-media login requirement entirely.',
              ],
            },
            {
              heading: 'OmeTV vs Vibelly: the real differences',
              paragraphs: ['The differences between OmeTV and Vibelly come down to privacy, bans, and how the free random video chat actually works:'],
              bullets: [
                'No Facebook or VK login — Vibelly is 100% anonymous with no account required',
                'No surprise bans: skip the next stranger freely without fear of a penalty',
                'Free HD video chat with no pay-to-talk walls on the core experience',
                'AI moderation that protects you instead of spying on your social identity',
                'Optional gender and country filters with Vibelly Premium if you want them',
              ],
            },
            {
              heading: 'How to use Vibelly without logging in',
              paragraphs: [
                'Using Vibelly is deliberately friction-free because we believe anonymous video chat should start the moment you want it to. Open the site in any browser, choose video, voice, or text, and press start. You are matched with a stranger in under a second — no email, no phone number, and definitely no Facebook account.',
                'Everything runs over encrypted WebRTC streams directly between the two browsers, so your conversation is private and low-latency. When the call ends or you skip, the connection is gone. No logs, no chat history, no trace left behind.',
                'If you want more control, Vibelly Premium adds the ability to filter matches by gender or by country. The free anonymous video chat experience never requires any of that.',
              ],
            },
            {
              heading: 'What you need for smooth video chat online',
              paragraphs: [
                'To get the best experience from any OmeTV alternative, you only need three things: a reasonably modern browser (Chrome, Edge, Safari, or Firefox), a camera and microphone, and a stable internet connection.',
                'Vibelly works on desktop, iOS, and Android right in the browser — there is no app store download and no browser extension. If your video looks soft, the stream automatically adapts to your connection, and you can switch to voice-only or text chat at any point without leaving the page.',
                'Because you are never logged in, you can also use Vibelly from any device, anywhere, and your privacy travels with you.',
              ],
            },
          ]}
        />

        <CompareAlternatives
          alternatives={[
            { to: '/omegle-alternative', label: 'Omegle Alternative', blurb: 'The free Omegle replacement for random video chat.' },
            { to: '/chatroulette-alternative', label: 'Chatroulette Alternative', blurb: 'A modern, moderated take on classic chat roulette.' },
            { to: '/random-video-chat', label: 'Random Video Chat', blurb: 'Meet strangers with HD video and instant matching.' },
            { to: '/talk-to-strangers', label: 'Talk to Strangers', blurb: 'Anonymous stranger chat with video, voice, and text.' },
            { to: '/video-chat-online', label: 'Free Online Video Call', blurb: 'Make a free online video call without any downloads.' },
            { to: '/omegle-unbanned', label: 'Omegle Unban Guide', blurb: 'Understand random chat bans and how to stay unbanned.' },
          ]}
        />

        <FAQSection faqs={[
          {
            question: "Why is Vibelly better than OmeTV?",
            answer: "Unlike OmeTV, Vibelly does not force you to log in with Facebook or VK. We prioritize your privacy and offer complete anonymity while maintaining a safe, moderated environment."
          },
          {
            question: "Do I need a Facebook account to use Vibelly?",
            answer: "No! Vibelly is 100% login-free for random video chats. You do not need a Facebook, Google, or any social media account to connect with strangers."
          },
          {
            question: "Is the video quality good?",
            answer: "Yes, Vibelly uses modern WebRTC technology to provide crystal clear HD video quality, assuming your internet connection is stable."
          },
          {
            question: "Is Vibelly free to use?",
            answer: "Yes, our core random video chat feature is completely free to use for everyone around the world."
          }
        ]} />

        <ShareButtons
          title="The Best OmeTV Alternative Without Facebook Login | Vibelly"
          description="Video chat online without a Facebook login — the free, anonymous OmeTV alternative that works right in your browser."
        />

        <Footer />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    </div>
  );
}
