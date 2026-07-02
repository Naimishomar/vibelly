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
import seoDataRaw from '../data/seoPages.json';

const seoData: Record<string, any> = seoDataRaw;

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
      
    return {
      title: `${formattedTopic} | Free Random Video Call App & Stranger Chat`,
      h1: `Connect Instantly via ${formattedTopic}`,
      desc: `Looking for ${formattedTopic}? Join Vibelly, the ultimate free alternative for random video chatting. Instantly connect with strangers worldwide with zero registration.`,
      tagline: 'Instant Connection',
      subH1: `Experience the best of ${formattedTopic} with our high-quality video chat.`
    };
  };

  const pageData = (slug && seoData[slug]) ? seoData[slug] : generateWildcardData(slug || 'random-video-chat');

  // Dynamic content logic
  const h1Words = pageData.h1.split(' ');
  const h1FirstPart = h1Words.slice(0, Math.max(1, h1Words.length - 2)).join(' ');
  const h1SecondPart = h1Words.slice(Math.max(1, h1Words.length - 2)).join(' ');

  const allSlugs = Object.keys(seoData);
  const relatedPages = useMemo(() => {
    const shuffled = [...allSlugs].sort(() => 0.5 - Math.random());
    return shuffled.filter(s => s !== slug).slice(0, 12);
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#15171B] text-white flex flex-col font-sans">
      <SEO 
        title={pageData.title} 
        description={pageData.desc}
        canonicalUrl={`/${slug}`}
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
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-sm"
                >
                  {seoData[relatedSlug].title.split('|')[0].trim()}
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
