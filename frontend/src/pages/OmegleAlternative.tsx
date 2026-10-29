import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export default function OmegleAlternative() {
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
        title="Omegle Alternative for Adults (18+), No Account Needed | Vibelly" 
        description="Looking for an Omegle alternative? Vibelly is free random video and text chat for adults 18+, with no account needed to start chatting."
        canonicalUrl="/omegle-alternative"
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
            The #1 Alternative to Omegle & OmeTV
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-normal tracking-tight leading-[1.1] mb-8"
            style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            Miss Omegle?<br />
            Meet the modern upgrade.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed"
          >
            Omegle shut down, but the need to talk to strangers didn't. 
            Vibelly is a free, adults-only random video call app that runs in your browser.
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
              Why choose Vibelly as your Omegle alternative?
            </h2>
            <p className="text-zinc-500 text-base max-w-xl mx-auto">
              We took everything you loved about random video chat and fixed everything you hated.
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

        {/* Comparison: sourced, on the blog */}
        <section className="px-6 py-20 max-w-3xl mx-auto w-full text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">How does Vibelly compare?</h2>
          <p className="text-zinc-400 mb-6">
            We compared nine random video chat sites, including Vibelly, on age rules, accounts, cost, and safety, using each service&apos;s own pages as sources.
          </p>
          <Link
            to="/blog/omegle-alternatives-compared"
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-full font-medium hover:bg-white/10 transition-colors"
          >
            Read the comparison
          </Link>
        </section>

        {/* SEO Article for Keyword Depth */}
        <SeoArticle
          blocks={[
            {
              heading: 'Why Omegle shut down — and why people still search for it',
              paragraphs: [
                "Omegle was one of the internet's most famous places to talk to strangers. For more than a decade, millions of users opened their browsers to be matched randomly with someone on the other side of the world. In November 2023, the site went dark: the founder said the platform had become unsustainable to run, largely because of the cost of keeping the community safe ([Omegle's closing letter](https://www.omegle.com/), [Wikipedia](https://en.wikipedia.org/wiki/Omegle)).",
                "The full story is in [What Happened to Omegle?](/blog/what-happened-to-omegle). The shutdown left a huge gap. People who grew up using free random video chat were suddenly looking for an Omegle alternative that keeps the same idea, meeting someone completely new with one click, without the moderation problems that killed the original. That is exactly the gap Vibelly was built to fill.",
                "A good Omegle alternative today needs three things: it must be free, it must not demand an account, and it must act on reports. Vibelly was built around all three from day one.",
              ],
            },
            {
              heading: 'What Vibelly offers as an Omegle alternative',
              paragraphs: [
                'Here is what Vibelly offers:',
              ],
              bullets: [
                'Free random video chat with no sign-up, no email, and no app to download',
                'Video calls powered by low-latency WebRTC, with voice-only calls on Premium',
                'One-tap reporting (sign-in required), with every report reviewed by hand',
                'No account needed: you choose what to share about yourself',
                'Instant matching: you are connected to a new stranger in seconds',
                'Works on any phone, tablet, or desktop browser without installing anything',
              ],
            },
            {
              heading: 'How to start a free random video call on Vibelly',
              paragraphs: [
                'Getting started is the whole point of an Omegle alternative — it should take seconds, not a registration form. On Vibelly you simply open the site, press "Start Video Call" (or choose text chat), and you are matched with a stranger immediately.',
                'The moment a match is found, WebRTC negotiates a direct, low-latency connection between the two browsers. Your camera and microphone stream straight to the other person, which keeps the video chat crisp and responsive. You can skip to the next stranger at any time, and both users are re-queued instantly.',
                'There is no setup wizard, no profile to fill in, and no payment required for the core random video call experience. Premium filters for gender and country are entirely optional upgrades.',
              ],
            },
          ]}
        />

        <CompareAlternatives
          alternatives={[
            { to: '/blog/omegle-alternatives-compared', label: 'Omegle Alternatives Compared', blurb: 'Nine random video chat sites compared on age rules, accounts, cost, and safety.' },
            { to: '/ometv-alternative', label: 'OmeTV Alternative', blurb: 'Random video chat with no account or social login needed.' },
            { to: '/chatroulette-alternative', label: 'Chatroulette Alternative', blurb: 'A modern alternative to classic chat roulette.' },
            { to: '/random-video-chat', label: 'Random Video Chat', blurb: 'Free random video calls with strangers in seconds.' },
            { to: '/talk-to-strangers', label: 'Talk to Strangers', blurb: 'Instant stranger chat with video, voice, or text.' },
          ]}
        />

        <KeywordBlock slug="omegle-alternative" />


        <FAQSection faqs={[
          {
            question: "Is Vibelly a good alternative to Omegle?",
            answer: "Vibelly offers free random video and text chat in your browser, an 18+ policy, and one-tap reporting (sign-in required), with no account needed to chat. For a side-by-side look at other options, read our sourced comparison of Omegle alternatives."
          },
          {
            question: "Do I need to sign up to use Vibelly?",
            answer: "No, you don't need to sign up or provide any personal information to start using the random video chat. Just click start and instantly connect with strangers worldwide. Reporting, Premium, and direct messages use a Google or GitHub sign-in."
          },
          {
            question: "Is Vibelly safe to use?",
            answer: "Vibelly is 18+ only. Every call has a one-tap Report button (sign-in required), every report is reviewed by hand, signed-in accounts that break the rules are banned, and random chat content is not stored. Only signed-in users can be reported, so skip a guest who breaks the rules."
          },
          {
            question: "Can I use Vibelly on my phone?",
            answer: "Yes. Vibelly works in any modern mobile browser, on iPhone or Android, with no app to download."
          }
        ]} />

        <ShareButtons
          title="Omegle Alternative for Adults (18+), No Account Needed | Vibelly"
          description="A free, adults-only Omegle alternative with no account needed to chat, ready in one click."
        />

        <Footer />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    </div>
  );
}
