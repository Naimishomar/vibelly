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
import KeywordBlock from '../components/KeywordBlock';
import SeoArticle from '../components/SeoArticle';
import CompareAlternatives from '../components/CompareAlternatives';
import ShareButtons from '../components/ShareButtons';

const features = [
  {
    icon: Lock,
    title: 'No Social Login Required',
    desc: 'No account, email, or social login needed. Vibelly is anonymous by default.',
  },
  {
    icon: Shield,
    title: 'One-Tap Reporting',
    desc: 'Signed-in users can report inappropriate behavior in one tap. Every report is reviewed by hand.',
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
        title="OmeTV Alternative: Random Video Chat With No Account | Vibelly" 
        description="Looking for an OmeTV alternative? Vibelly is free, adults-only random video chat with no account, email, or social login needed to start."
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
            No Account Needed.<br />
            Meet Vibelly.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed"
          >
            No email, no phone number, no social login.
            Free, adults-only random video chat that starts in your browser.
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
                'OmeTV is one of the most popular random video chat apps. If you want an alternative where you can start without any account, inside an adults-only community where reports are reviewed by hand, Vibelly is built for exactly that.',
                'Vibelly asks for no email, no phone number, and no social media account before you chat.',
              ],
            },
            {
              heading: 'OmeTV vs Vibelly: the real differences',
              paragraphs: ['The differences between OmeTV and Vibelly come down to privacy, bans, and how the free random video chat actually works:'],
              bullets: [
                'No account, email, or social login needed to start chatting',
                'Skip to the next stranger as often as you like: skipping is never penalised',
                'Free video chat with no pay-to-talk walls on the core experience',
                'One-tap reporting for signed-in users, reviewed by hand',
                'Optional gender and country filters with Vibelly Premium if you want them',
              ],
            },
            {
              heading: 'How to use Vibelly without logging in',
              paragraphs: [
                'Using Vibelly is deliberately friction-free because we believe anonymous video chat should start the moment you want it to. Open the site in any browser, choose video or text, and press start. You are matched with a stranger in seconds — no email, no phone number, and definitely no Facebook account.',
                'Everything runs over encrypted WebRTC streams directly between the two browsers, so media is encrypted in transit and latency stays low. When the call ends or you skip, the connection is gone. Calls are never recorded, and chat history is not kept.',
                'If you want more control, Vibelly Premium adds the ability to filter matches by gender or by country. The free anonymous video chat experience never requires any of that.',
              ],
            },
            {
              heading: 'What you need for smooth video chat online',
              paragraphs: [
                'To get the best experience from any OmeTV alternative, you only need three things: a reasonably modern browser (Chrome, Edge, Safari, or Firefox), a camera and microphone, and a stable internet connection.',
                'Vibelly works on desktop, iOS, and Android right in the browser — there is no app store download and no browser extension. If your video looks soft, the stream automatically adapts to your connection, and you can switch to text chat at any point without leaving the page.',
                'Because you are never logged in, you can also use Vibelly from any device, anywhere, and your privacy travels with you.',
              ],
            },
          ]}
        />

        <CompareAlternatives
          alternatives={[
            { to: '/blog/omegle-alternatives-compared', label: 'Omegle Alternatives Compared', blurb: 'Nine random video chat sites compared on age rules, accounts, cost, and safety.' },
            { to: '/omegle-alternative', label: 'Omegle Alternative', blurb: 'The free Omegle replacement for random video chat.' },
            { to: '/chatroulette-alternative', label: 'Chatroulette Alternative', blurb: 'A modern, 18+ take on classic chat roulette.' },
            { to: '/random-video-chat', label: 'Random Video Chat', blurb: 'Meet strangers with instant video matching.' },
            { to: '/talk-to-strangers', label: 'Talk to Strangers', blurb: 'Anonymous stranger chat with video, voice, and text.' },
          ]}
        />

        <KeywordBlock slug="ometv-alternative" />


        <FAQSection faqs={[
          {
            question: "How is Vibelly different from OmeTV?",
            answer: "Vibelly needs no account or social login to start chatting, is strictly 18+, and every call has a one-tap Report button (sign-in required) reviewed by hand. For a sourced, side-by-side look at OmeTV and others, read our Omegle alternatives comparison on the blog."
          },
          {
            question: "Do I need a Facebook account to use Vibelly?",
            answer: "No. You can start a random video or text chat without any account. Reporting, Premium, and direct messages use a Google or GitHub sign-in."
          },
          {
            question: "Is the video quality good?",
            answer: "Free calls run at 480p, and Premium unlocks 720p HD. Video adapts automatically to your connection."
          },
          {
            question: "Is Vibelly free to use?",
            answer: "Yes, our core random video chat feature is completely free to use for everyone around the world."
          }
        ]} />

        <ShareButtons
          title="OmeTV Alternative: Random Video Chat With No Account | Vibelly"
          description="Video chat online with no account or social login: a free, adults-only OmeTV alternative that works right in your browser."
        />

        <Footer />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    </div>
  );
}
