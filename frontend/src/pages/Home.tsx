import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Video, Headphones, ArrowRight, Shield,
  Zap, MessageSquare, SkipForward, Globe, Check, ChevronDown, Crown, User
} from 'lucide-react';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import InteractiveHeroCards from '../components/InteractiveHeroCards';
import CurvedCarousel from '../components/CurvedCarousel';
import { useAuthStore } from '../store/useAuthStore';
import LoginModal from '../components/LoginModal';

/* ─── Data ─── */
const features = [
  {
    icon: Shield,
    title: 'Anonymous by default',
    desc: 'No account, no profile, no trace. Connect purely on vibes.',
  },
  {
    icon: Zap,
    title: 'Instant matching',
    desc: 'Our Redis queue matches you with someone in under a second. No waiting rooms.',
  },
  {
    icon: Video,
    title: 'HD video calls',
    desc: 'WebRTC-powered 480p+ video with adaptive bitrate for smooth calls worldwide.',
  },
  {
    icon: Headphones,
    title: 'Voice-only mode',
    desc: 'Keep your camera off. Audio-only for low-bandwidth or private sessions.',
  },
  {
    icon: MessageSquare,
    title: 'Live chat sidebar',
    desc: 'Type while you talk. Messages stay in session — nothing is stored after you leave.',
  },
  {
    icon: SkipForward,
    title: 'Skip anytime',
    desc: 'Not feeling the vibe? Hit skip and you\'re instantly matched with someone new.',
  },
];

const steps = [
  {
    id: 'find',
    label: 'Find a Match',
    number: '01',
    eyebrow: 'FIND A MATCH',
    title: 'One click. You\'re in the queue.',
    body: 'Hit "Start Video Call" or "Voice Only" and our matchmaking engine instantly searches for someone ready to connect. No sign-up, no profile setup — just press go.',
    bullets: [
      'Sub-second matching via Redis queue',
      'Separate queues for video and audio',
      'Guests matched anonymously by socket ID',
    ],
  },
  {
    id: 'call',
    label: 'Start the Call',
    number: '02',
    eyebrow: 'START THE CALL',
    title: 'Real-time WebRTC video or voice.',
    body: 'The moment a match is found, WebRTC negotiation begins automatically. Your camera and mic stream directly — no server relay for media, ultra-low latency.',
    bullets: [
      'WebRTC peer-to-peer via Cloudflare SFU',
      'Mic and camera toggles without dropping the call',
      'Picture-in-picture local preview, drag anywhere',
    ],
  },
  {
    id: 'chat',
    label: 'Chat & Connect',
    number: '03',
    eyebrow: 'CHAT & CONNECT',
    title: 'Talk, type, and actually connect.',
    body: 'Use the live chat panel to type while you talk. Typing indicators let you know when the other person is responding. All messages are ephemeral — gone when the call ends.',
    bullets: [
      'Real-time chat via Socket.io',
      'Live "is typing…" indicator',
      'Unread message badge on the chat button',
    ],
  },
  {
    id: 'skip',
    label: 'Skip or Stay',
    number: '04',
    eyebrow: 'SKIP OR STAY',
    title: 'Every conversation is your choice.',
    body: 'Not feeling it? Skip and you\'re back in the queue instantly. The other person is automatically re-queued too. No awkward goodbyes — just move on.',
    bullets: [
      'Skip re-queues both users simultaneously',
      'Report button for safety',
      'End call returns you cleanly to the home screen',
    ],
  },
];

const metrics = [
  {
    title: 'Matched in under 1 second',
    body: 'Our Redis-backed queue pops users in real time. From pressing the button to live call — the fastest random chat on the web.',
  },
  {
    title: 'Zero data retained after the call',
    body: 'No recordings, no logs, no chat history. When the call ends, it\'s gone. We build for privacy by default, not as an afterthought.',
  },
  {
    title: 'Same quality for every user',
    body: 'Video or voice, guest or returning user — everyone gets the same low-latency, high-quality experience. No tiers, no paywalls.',
  },
];

const faqs = [
  {
    question: 'Is Vibe a free alternative to Omegle and OmeTV?',
    answer: 'Yes! Vibe is completely free to use. It is designed as the ultimate modern alternative to Omegle, OmeTV, and Chatroulette, allowing you to meet strangers online via high-quality random video calling without any registration.'
  },
  {
    question: 'How do I talk to strangers online safely?',
    answer: 'Simply click "Start Video Call" and you will be instantly matched with a random stranger. We prioritize your privacy—all chats are ephemeral, end-to-end encrypted, and no personal data is stored once you skip or end the call.'
  },
  {
    question: 'Is this random video chat app truly anonymous?',
    answer: 'Absolutely. Unlike OmeTV which requires social logins, Vibe is 100% anonymous. You do not need to create a profile, give your email, or download any app. Just open your browser and start chatting.'
  },
  {
    question: 'Can I choose who I match with?',
    answer: 'Yes! While basic random video chat is completely free, we offer premium features allowing you to filter your matches by gender (Opposite Gender or Same Gender) or specific countries for a highly tailored matchmaking experience.'
  }
];

const stats = [
  { value: '5M+', label: 'Conversations' },
  { value: '190+', label: 'Countries' },
  { value: '<1s', label: 'Match time' },
  { value: '24/7', label: 'Moderation' },
];

const blogPosts = [
  {
    title: 'Safe Fun OmeTV Alternatives: The Best Sites to chat with strangers online.',
    category: 'Chat Platforms',
    date: 'July 1, 2026',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=600&h=400&fit=crop',
    link: '/blog/ometv-alternatives'
  },
  {
    title: 'Best Websites to Chat with Strangers',
    category: 'Guides',
    date: 'June 28, 2026',
    image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=600&h=400&fit=crop',
    link: '/blog/best-websites-to-chat-with-strangers'
  },
  {
    title: 'How to Talk to a Stranger Online safely in 2026',
    category: 'Safety',
    date: 'June 24, 2026',
    image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&h=400&fit=crop',
    link: '/blog/how-to-talk-to-a-stranger-online'
  }
];

const comparisonFeatures = [
  { feature: 'Text chat', vibelly: true, ometv: true, chitchat: true, chatroulette: true },
  { feature: 'Video chat', vibelly: true, ometv: true, chitchat: true, chatroulette: true },
  { feature: 'Voice chat', vibelly: true, ometv: false, chitchat: true, chatroulette: false },
  { feature: 'Anonymous (No Login)', vibelly: true, ometv: true, chitchat: false, chatroulette: true },
  { feature: 'Gender Filter', vibelly: true, ometv: true, chitchat: false, chatroulette: true },
  { feature: 'Country Filter', vibelly: true, ometv: true, chitchat: false, chatroulette: false },
];

function FAQItem({ question, answer, isLast }: { question: string, answer: string, isLast?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`py-5 px-4 ${isLast ? '' : 'border-b border-white/10'}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full justify-between items-center text-left text-white font-medium focus:outline-none hover:text-zinc-300 transition-colors"
      >
        <span className="text-base md:text-lg pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-white' : 'text-zinc-500'}`} />
      </button>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pt-3 text-zinc-400 text-sm md:text-base leading-relaxed"
        >
          {answer}
        </motion.div>
      )}
    </div>
  );
}

/* ─── Component ─── */
export default function Home() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState('find');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated, guestAccessEnabled } = useAuthStore();

  const handleProtectedNavigation = (path: string) => {
    if (!isAuthenticated && !guestAccessEnabled) {
      setIsLoginModalOpen(true);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-[#15171B] text-white flex flex-col font-sans">
      <SEO 
        title="Vibelly | The Best Free Omegle Alternative & Random Video Chat" 
        description="Vibelly is the ultimate free alternative to Omegle and OmeTV. Instantly connect with strangers worldwide through high-quality random video calling and chat."
        canonicalUrl="/"
      />

      {/* ─── Dot Grid ─── */}
      <BlinkingDotsGrid />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* ══════════════════════════════════════════
            SECTION 1 — HERO
        ══════════════════════════════════════════ */}
        <section className="relative flex flex-col items-center justify-center text-center px-6 pt-12 pb-16 md:pt-24 md:pb-32 max-w-4xl mx-auto w-full">
          <p
            className="text-[15px] tracking-[0.2em] text-zinc-400 font-medium uppercase mb-4"
          >
            Random Video &amp; Voice Chat
          </p>

          <h1
            className="text-5xl md:text-7xl font-normal tracking-tight leading-[1.1] mb-8"
            style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            Meet someone new.
            <br />
            Right now.
          </h1>

          <p
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-xl leading-relaxed"
          >
            Anonymous real-time video and voice calls with strangers from around the world.
            No sign-up. No profile. Just press start.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button
              onClick={() => handleProtectedNavigation('/setup/video')}
              className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-md font-medium hover:bg-zinc-100 transition-colors"
            >
              Start Video Call
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => handleProtectedNavigation('/setup/audio')}
              className="flex items-center gap-2 bg-zinc-800/60 text-white border border-zinc-700 px-6 py-2.5 rounded-md font-medium hover:bg-zinc-800 transition-colors"
            >
              <Headphones size={16} />
              Voice Only
            </button>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 1.25 — STATS GRID
        ══════════════════════════════════════════ */}
        <section className="relative w-full max-w-4xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-y border-white/10 bg-zinc-900/30 backdrop-blur-sm">
            {stats.map((stat, i) => (
              <div 
                key={stat.label} 
                className={`py-8 px-4 text-center ${i !== stats.length - 1 ? 'border-r border-white/10' : ''}`}
              >
                <div className="text-3xl md:text-4xl font-semibold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500 uppercase tracking-wider font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 1.5 — FLOATING PANELS UI
        ══════════════════════════════════════════ */}
        <section className="relative w-full max-w-[1200px] mx-auto px-6 pb-20 flex flex-col items-center overflow-hidden">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-normal text-center max-w-3xl leading-tight mb-12 md:mb-20 z-20 relative"
            style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            One platform for all your spontaneous connections
          </motion.h2>

          <InteractiveHeroCards />
        </section>

        {/* ══════════════════════════════════════════
            SECTION 1.5 — CURVED CAROUSEL
        ══════════════════════════════════════════ */}
        <section className="w-full relative z-10 bg-transparent px-4 md:px-6 mb-12">
          <div className="w-full max-w-7xl mx-auto bg-[#15171B] border border-white/10 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
            <CurvedCarousel />
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 2 — QUOTE CARD
        ══════════════════════════════════════════ */}
        <section className="px-6 pb-28 max-w-3xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white text-black rounded-2xl p-10 text-center shadow-xl"
          >
            <p className="text-xl md:text-2xl font-medium leading-snug mb-5"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              In a world of curated feeds and filtered connections, a random encounter with a stranger is not a distraction. It's a reminder that the world is bigger than your algorithm.
            </p>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-xl mx-auto">
              We built Vibelly for the unscripted moment. The unexpected laugh.
              The conversation you didn't plan and couldn't forget.
              That's who we build for.
            </p>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 3 — FEATURE CARDS
        ══════════════════════════════════════════ */}
        <section className="px-6 pb-28 max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl md:text-4xl font-semibold mb-3"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Connections that happen in real time
            </h2>
            <p className="text-zinc-500 text-sm max-w-xl mx-auto leading-relaxed">
              Everything is built for the moment — anonymous, instant, and ephemeral.
              No friction between you and the next conversation.
            </p>
          </motion.div>

          {/* Feature Card Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map(({ icon: Icon, title, desc }, i) => {
              const isHighlighted = i === 1; // "Instant matching" highlighted
              return (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={`rounded-2xl p-6 border transition-all ${
                    isHighlighted
                      ? 'bg-white text-black border-white'
                      : 'bg-zinc-900/50 text-white border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <Icon
                    size={20}
                    className={`mb-4 ${isHighlighted ? 'text-zinc-500' : 'text-zinc-500'}`}
                  />
                  <p className={`font-semibold text-base mb-2 ${isHighlighted ? 'text-black' : 'text-white'}`}>
                    {title}
                  </p>
                  <p className={`text-sm leading-relaxed ${isHighlighted ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    {desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 4 — HOW IT WORKS (Sticky Scroll)
        ══════════════════════════════════════════ */}
        <section className="px-6 pb-32 max-w-6xl mx-auto w-full relative z-10">
          <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/10 rounded-[40px] p-8 md:p-16 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16 md:mb-24"
            >
              <h2
                className="text-4xl md:text-5xl font-normal mb-5"
                style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
              >
                From zero to connected
              </h2>
              <p className="text-zinc-400 text-base max-w-lg mx-auto leading-relaxed">
                No setup. No registration. No friction built into every step from the first click to the last goodbye.
              </p>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-start relative">
              {/* Left Sidebar - Sticky */}
              <div className="flex flex-col gap-2 min-w-[220px] shrink-0 sticky top-32 hidden md:flex">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      document.getElementById(`step-${step.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`text-left px-5 py-3.5 rounded-xl text-sm transition-all duration-300 ${
                      activeStep === step.id
                        ? 'bg-white text-black font-semibold shadow-lg scale-105'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>

              {/* Right Detail - Scrollable List */}
              <div className="flex-1 flex flex-col gap-32 md:pb-32">
                {steps.map((step) => (
                  <motion.div
                    key={step.id}
                    id={`step-${step.id}`}
                    onViewportEnter={() => setActiveStep(step.id)}
                    viewport={{ margin: "-40% 0px -40% 0px", amount: 'some' }}
                    className="flex flex-col transition-opacity duration-500"
                    style={{ opacity: activeStep === step.id ? 1 : 0.4 }}
                  >
                    <p className="text-[11px] tracking-[0.2em] text-zinc-500 font-semibold uppercase mb-4">
                      {step.number} &nbsp; {step.eyebrow}
                    </p>
                    <h3
                      className="text-3xl md:text-4xl font-normal text-white mb-6 leading-tight"
                      style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-zinc-400 text-base leading-relaxed mb-8 max-w-xl">
                      {step.body}
                    </p>
                    <ul className="space-y-4">
                      {step.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-sm text-zinc-300">
                          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                             <Check size={12} className="text-white" />
                          </div>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 5 — WHAT WE MEASURE
        ══════════════════════════════════════════ */}
        <section className="px-6 pb-28 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2
              className="text-3xl md:text-4xl font-semibold mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              What we measure
            </h2>
            <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed">
              Every call starts with speed and ends with privacy. Reduced wait times,
              eliminated data retention, and a consistent experience for everyone.
            </p>
          </motion.div>

          {/* 3 metric cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {metrics.map(({ title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6"
              >
                <p className="font-semibold text-sm text-white mb-3">{title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>

          {/* Bottom quote card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white text-black rounded-2xl p-8 text-center"
          >
            <p className="text-base md:text-lg text-zinc-700 leading-relaxed max-w-2xl mx-auto">
              Social algorithms know what you like. They keep showing you more of it. Vibelly is the opposite —
              the person on the other side is someone you'd never have found any other way.
              That's not a bug. <strong className="text-black">That's the feature.</strong>
            </p>
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 5.25 — PREMIUM PRICING DISCOVERY
        ══════════════════════════════════════════ */}
        <section className="px-6 pb-28 max-w-5xl mx-auto w-full relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none rounded-3xl" />
          
          <div className="flex flex-col md:flex-row items-center gap-12 bg-[#15171B] border border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-medium tracking-wide uppercase mb-6">
                <Crown size={14} className="text-yellow-400" />
                Vibelly Premium
              </div>
              
              <h2 
                className="text-3xl md:text-5xl font-normal text-white mb-6 leading-tight"
                style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
              >
                Control who you meet. <br className="hidden md:block" />
                <span className="text-zinc-400 italic">Upgrade your experience.</span>
              </h2>
              
              <p className="text-zinc-400 text-base leading-relaxed mb-8 max-w-lg">
                While random chat is free forever, Premium unlocks the power to filter your matches. 
                Meet exactly who you want, where you want, in crystal clear high-definition.
              </p>

              <button 
                onClick={() => navigate('/pricing')}
                className="bg-white text-black px-8 py-3.5 rounded-xl font-medium hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                View Premium Plans
              </button>
            </div>

            <div className="w-full md:w-[400px] flex flex-col gap-4">
              {[
                { icon: Globe, title: 'Country Filtering', desc: 'Match only with users from specific countries.' },
                { icon: User, title: 'Gender Preference', desc: 'Choose to meet the opposite or same gender.' },
                { icon: Video, title: '720p HD Video', desc: 'Upgraded video resolution for clearer calls.' },
                { icon: Shield, title: 'Premium Profile Border', desc: 'Stand out in global chat with a glowing badge.' }
              ].map((feature, i) => (
                <div key={i} className="group flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-black/10 flex items-center justify-center shrink-0 transition-colors">
                    <feature.icon size={18} className="text-white group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-black transition-colors mb-1">{feature.title}</h4>
                    <p className="text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 5.3 — HOW WE COMPARE (SEO)
        ══════════════════════════════════════════ */}
        <section className="px-6 pb-28 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-[11px] tracking-[0.2em] text-zinc-500 font-semibold uppercase mb-4">
              How we compare
            </p>
            <h2
              className="text-3xl md:text-4xl font-semibold mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              The #1 Omegle alternative - with everything Omegle never had
            </h2>
            <p className="text-zinc-500 text-sm max-w-2xl mx-auto leading-relaxed">
              Omegle shut down in 2023. Millions moved to OmeTV, Chitchat.gg, and Chatroulette. Vibelly was built to be faster, more secure, and entirely anonymous.
            </p>
          </motion.div>

          <div className="bg-[#1A1C20] border border-white/10 rounded-2xl overflow-x-auto shadow-2xl">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-sm">
                  <th className="py-5 px-6 text-zinc-400 font-semibold">Feature</th>
                  <th className="py-5 px-6 font-semibold text-white bg-white/5 text-center">Vibelly ★</th>
                  <th className="py-5 px-6 text-zinc-400 font-semibold text-center">OmeTV</th>
                  <th className="py-5 px-6 text-zinc-400 font-semibold text-center">Chitchat.gg</th>
                  <th className="py-5 px-6 text-zinc-400 font-semibold text-center">Chatroulette</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {comparisonFeatures.map((row, idx) => (
                  <tr key={row.feature} className={`border-b border-white/5 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
                    <td className="py-4 px-6 text-zinc-300 font-medium">{row.feature}</td>
                    <td className="py-4 px-6 text-center bg-white/5">
                      {row.vibelly ? <span className="inline-flex bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">✓</span> : <span className="inline-flex bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">✗</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.ometv ? <span className="inline-flex bg-green-500/10 text-green-400/70 px-3 py-1 rounded-full text-xs font-bold">✓</span> : <span className="inline-flex bg-red-500/10 text-red-400/70 px-3 py-1 rounded-full text-xs font-bold">✗</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.chitchat ? <span className="inline-flex bg-green-500/10 text-green-400/70 px-3 py-1 rounded-full text-xs font-bold">✓</span> : <span className="inline-flex bg-red-500/10 text-red-400/70 px-3 py-1 rounded-full text-xs font-bold">✗</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.chatroulette ? <span className="inline-flex bg-green-500/10 text-green-400/70 px-3 py-1 rounded-full text-xs font-bold">✓</span> : <span className="inline-flex bg-red-500/10 text-red-400/70 px-3 py-1 rounded-full text-xs font-bold">✗</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 5.5 — FAQ (SEO)
        ══════════════════════════════════════════ */}
        <section className="px-6 pb-28 max-w-3xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <h2
              className="text-3xl md:text-4xl font-semibold mb-4"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-500 text-sm">
              Everything you need to know about Vibelly's online video calling.
            </p>
          </motion.div>

          <div className="flex flex-col bg-zinc-900/60 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            {faqs.map((faq, idx) => (
              <FAQItem key={idx} question={faq.question} answer={faq.answer} isLast={idx === faqs.length - 1} />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 5.75 — BLOG PREVIEW (SEO)
        ══════════════════════════════════════════ */}
        <section className="px-6 pb-28 max-w-6xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-[11px] tracking-[0.2em] text-zinc-500 font-semibold uppercase mb-4">
                From the blog
              </p>
              <h2
                className="text-3xl md:text-4xl font-semibold mb-4"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Tips &amp; Guides for Chatting Online
              </h2>
            </motion.div>
            <button 
              onClick={() => navigate('/blog')}
              className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-full font-medium hover:bg-white/10 transition-colors"
            >
              View all posts <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post, i) => (
              <motion.div
                key={post.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col bg-[#1A1C20] border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => navigate(post.link)}
              >
                <div className="aspect-[16/9] w-full overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-xs font-bold text-white bg-white/10 px-3 py-1 rounded-full self-start mb-4">
                    {post.category}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-zinc-300 transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-zinc-500 text-xs">
                    <span>{post.date}</span>
                    <span className="text-white font-medium group-hover:underline">Read article →</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <button 
            onClick={() => navigate('/blog')}
            className="w-full mt-8 md:hidden flex justify-center items-center gap-2 bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors"
          >
            View all posts <ArrowRight size={16} />
          </button>
        </section>

        {/* ══════════════════════════════════════════
            SECTION 6 — FINAL CTA
        ══════════════════════════════════════════ */}
        <section className="px-6 pb-28 max-w-3xl mx-auto w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-5xl font-semibold mb-5"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              The next conversation is<br />one click away.
            </h2>
            <p className="text-zinc-500 text-sm mb-8">
              No account needed. Works in any modern browser.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => handleProtectedNavigation('/setup/video')}
                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-md font-medium hover:bg-zinc-100 transition-colors text-base"
              >
                <Video size={18} />
                Start a Video Call
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => handleProtectedNavigation('/setup/audio')}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
              >
                <Globe size={14} />
                Voice Only Mode
              </button>
            </div>
          </motion.div>
        </section>

        {/* ─── Footer ─── */}
        <Footer />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    </div>
  );
}
