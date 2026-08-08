import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Video, Zap, MessageSquare, Lock, Headphones } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import { useAuthStore } from '../store/useAuthStore';
import LoginModal from '../components/LoginModal';
import FAQSection from '../components/FAQSection';

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

// ─── Indexability gate ───
// These must stay in sync with frontend/generate-100k-sitemaps.cjs so that every
// sitemapped (and prerendered) URL is indexable while unknown patterns are noindexed.
const BASE_KEYWORDS = [
  'omegle-alternative', 'random-video-chat', 'talk-to-strangers', 'anonymous-chat',
  'video-chat-with-girls', 'free-cam-chat', 'stranger-cam', 'chat-roulette-free',
  'omegle-unbanned', 'video-call-app', 'chat-with-strangers-online', 'random-cam',
  'free-video-chat-rooms', 'meet-new-people', 'stranger-video-call', 'live-video-chat',
  'cam-to-cam-chat', 'anonymous-video-chat', 'chat-random', 'omegle-app',
];
const MODIFIERS = ['free', 'online', 'without-login', 'for-introverts'];
const CITIES = [
  'new-york', 'los-angeles', 'chicago', 'houston', 'miami', 'san-francisco',
  'seattle', 'boston', 'austin', 'denver', 'las-vegas', 'atlanta',
  'london', 'manchester', 'birmingham', 'paris', 'berlin', 'madrid',
  'toronto', 'vancouver', 'montreal', 'sydney', 'melbourne', 'brisbane',
  'tokyo', 'osaka', 'mumbai', 'delhi', 'bangalore', 'hyderabad',
  'dubai', 'singapore', 'bangkok', 'kuala-lumpur', 'jakarta', 'manila',
  'sao-paulo', 'mexico-city', 'buenos-aires', 'nairobi', 'lagos', 'cairo',
];
const COMPETITORS = [
  'omegle', 'ometv', 'chatroulette', 'monkey-app', 'emerald-chat',
  'bazoocam', 'chatrandom', 'camsurf', 'coomeet', 'tinychat',
  'shagle', 'chathub', 'camfrog', 'joingy', 'flingster',
];
const COMP_MODIFIERS = [
  'alternative', 'alternative-free', 'alternative-no-login', 'alternative-for-girls',
  'unbanned', 'app', 'app-download', 'website-like', 'better-than', 'for-mobile',
];

function isKnownSeoSlug(s: string): boolean {
  for (const kw of BASE_KEYWORDS) {
    if (s === kw) return true;
    for (const mod of MODIFIERS) if (s === `${kw}-${mod}`) return true;
    for (const city of CITIES) if (s === `${kw}-in-${city}`) return true;
  }
  for (const comp of COMPETITORS) {
    for (const mod of COMP_MODIFIERS) if (s === `${comp}-${mod}`) return true;
  }
  if (/^video-chat-about-/.test(s)) return true;
  if (/^talk-about-.+-online$/.test(s)) return true;
  if (/-chat-room$/.test(s)) return true;
  return false;
}

export default function DynamicSeoPage() {
  const { slug } = useParams<{ slug: string }>();
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
  }, [slug]);

  // If slug is not in our database, generate a Wildcard Page dynamically!
  const generateWildcardData = (slugStr: string) => {
    // Convert 'random-video-call-free' to 'Random Video Call Free'
    const formattedTopic = slugStr
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const isCompetitor = ['omegle', 'ometv', 'chatroulette', 'monkey', 'bazoocam', 'emerald', 'chatrandom', 'opentalk', 'whoapp', 'azar', 'chatspin'].some(c => slugStr.includes(c));

    // Detect a "in-city" suffix so local pages get unique, geo-aware copy.
    const cityMatch = slugStr.match(/-in-([a-z-]+)$/);
    const city = cityMatch
      ? cityMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : null;

    const geo = city ? ` in ${city}` : '';

    if (isCompetitor) {
      return {
        title: `${formattedTopic} | Vibelly - The Best Alternative`,
        h1: `The #1 ${formattedTopic}${geo}`,
        desc: `Searching for a ${formattedTopic}${geo}? Vibelly is the fastest, safest, and most beautiful alternative. Start an anonymous HD video chat instantly with zero registration.`,
        tagline: 'Top Rated Alternative',
        subH1: `Omegle is gone, and other apps are full of bots. Experience the ultimate ${formattedTopic}${geo} with our modern, moderated platform.`
      };
    }

    if (city) {
      return {
        title: `${formattedTopic} in ${city} | Free Random Video Chat`,
        h1: `${formattedTopic} in ${city}`,
        desc: `Looking for ${formattedTopic} in ${city}? Join Vibelly, the ultimate free platform for random video chatting. Instantly connect with strangers from ${city} and worldwide with zero registration.`,
        tagline: 'Popular in Your City',
        subH1: `Meet strangers from ${city} and around the world with our high-quality video chat. No sign-up required.`
      };
    }

    return {
      title: `${formattedTopic} | Free Random Video Call App & Stranger Chat`,
      h1: `Connect Instantly via ${formattedTopic}`,
      desc: `Looking for ${formattedTopic}? Join Vibelly, the ultimate free platform for random video chatting. Instantly connect with strangers worldwide with zero registration.`,
      tagline: 'Instant Connection',
      subH1: `Experience the best of ${formattedTopic} with our high-quality video chat.`
    };
  };

  const pageData = generateWildcardData(slug || 'random-video-chat');

  // Only pages listed in our sitemaps (all of which get unique prerendered HTML)
  // should be indexed. Anything else — random backlinks, typos, unknown patterns —
  // gets noindex so Google doesn't see low-value infinite pages.
  const noindex = useMemo(() => {
    const s = slug || '';
    if (!s) return false;
    if (isKnownSeoSlug(s)) return false;
    return true;
  }, [slug]);

  // Dynamic content logic
  const h1Words = pageData.h1.split(' ');
  const h1FirstPart = h1Words.slice(0, Math.max(1, h1Words.length - 2)).join(' ');
  const h1SecondPart = h1Words.slice(Math.max(1, h1Words.length - 2)).join(' ');

  const relatedPages = useMemo(() => {
    // Deterministically derive related SEO slugs from the current slug (stable links + pure render).
    const seeds = [
      'random-video-chat', 'omegle-alternative', 'talk-to-strangers', 'anonymous-chat',
      'video-chat-with-girls', 'free-cam-chat', 'stranger-cam', 'chat-roulette-free',
      'omegle-unbanned', 'video-call-app', 'chat-with-strangers-online', 'random-cam',
      'free-video-chat-rooms', 'meet-new-people', 'stranger-video-call', 'live-video-chat',
      'cam-to-cam-chat', 'anonymous-video-chat', 'chat-random', 'omegle-app'
    ];
    const cities = [
      'new-york', 'london', 'tokyo', 'paris', 'sydney', 'mumbai', 'toronto', 'berlin',
      'madrid', 'dubai', 'singapore', 'los-angeles', 'chicago', 'houston', 'miami'
    ];

    let hash = 2166136261;
    const slugSeed = slug || 'random-video-chat';
    for (let i = 0; i < slugSeed.length; i++) {
      hash ^= slugSeed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const pickIndex = (i: number) => {
      hash = Math.imul(hash ^ (hash >>> 15), 2246822507) + (hash & 0x7fffffff);
      hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
      hash ^= hash >>> 16;
      return ((hash >>> 0) + i) % cities.length;
    };

    const possibleSlugs = [
      ...seeds,
      ...seeds.map((s, i) => `${s}-in-${cities[pickIndex(i)]}`),
      ...seeds.map(s => `${s}-for-introverts`),
      ...seeds.map(s => `${s}-for-gamers`)
    ];

    return possibleSlugs.filter(s => s !== slug).slice(0, 12);
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#15171B] text-white flex flex-col font-sans">
      <SEO
        title={pageData.title}
        description={pageData.desc}
        canonicalUrl={`/${slug}`}
        noindex={noindex}
        faqs={[
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
          }
        ]}
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
            {pageData.tagline}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-normal tracking-tight leading-[1.1] mb-8"
            style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            {h1FirstPart} <br className="hidden sm:block" />
            {h1SecondPart}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed"
          >
            {pageData.subH1} Vibelly is the safest, fastest, and most aesthetic platform on the internet.
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
          }
        ]} />

        {/* Internal Linking Mesh */}
        <section className="px-6 py-16 bg-[#15171B] relative z-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Explore More</h2>
            <div className="flex flex-wrap gap-3">
              {relatedPages.map((relatedSlug) => (
                <Link
                  key={relatedSlug}
                  to={`/${relatedSlug}`}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-sm capitalize"
                >
                  {relatedSlug.replace(/-/g, ' ')}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-auto relative z-20">
          <Footer />
        </div>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
