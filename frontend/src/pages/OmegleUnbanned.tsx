import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Unlock, Video, ArrowRight, ShieldCheck, RefreshCcw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import FAQSection from '../components/FAQSection';
import ShareButtons from '../components/ShareButtons';
import { useAuthStore } from '../store/useAuthStore';
import LoginModal from '../components/LoginModal';

export default function OmegleUnbanned() {
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
        title="How to Get Unbanned from Omegle (100% Working 2026) | Vibelly" 
        description="Banned on Omegle or OmeTV? Learn why bans happen, how to fix them, and discover Vibelly—the best unbannable random video chat alternative."
        canonicalUrl="/omegle-unbanned"
      />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 md:pt-32 md:pb-24 max-w-4xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-8"
          >
            <ShieldAlert size={16} />
            Banned from Omegle? Don't panic.
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-normal tracking-tight leading-[1.1] mb-8"
            style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}
          >
            How to Get Unbanned <br />
            From Omegle Instantly
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed"
          >
            Getting slapped with the "You have been banned" message is frustrating. We explain exactly why it happens and give you the ultimate workaround.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <button
              onClick={() => handleProtectedNavigation('/setup/video')}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              Skip the Ban & Use Vibelly Now
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </section>

        {/* Content Section */}
        <section className="px-6 py-12 max-w-3xl mx-auto w-full">
          <div className="prose prose-invert prose-lg text-zinc-400 max-w-none">
            <h2 className="text-2xl font-bold text-white mb-6">Why Did I Get Banned on Omegle?</h2>
            <p className="mb-6">
              Omegle bans are notorious for being unpredictable. Because the platform relies heavily on automated algorithms and user reports, perfectly innocent users often find themselves restricted. The most common reasons include:
            </p>
            <ul className="space-y-3 mb-10 ml-6 list-disc">
              <li><strong>Too Many Disconnects:</strong> If you skip too many people quickly, the algorithm flags you as a spam bot.</li>
              <li><strong>Being Skipped Frequently:</strong> If other users instantly skip you (perhaps because of a dark room or bad camera), Omegle assumes your content is unwanted.</li>
              <li><strong>False User Reports:</strong> Trolls often abuse the reporting system to ban innocent people.</li>
              <li><strong>Terms of Service Violations:</strong> Playing copyrighted music, showing explicit content, or promoting websites.</li>
            </ul>

            <h2 className="text-2xl font-bold text-white mb-6">How to Bypass an Omegle Ban</h2>
            <p className="mb-6">
              Omegle uses IP tracking. To bypass a ban, you technically just need a new IP address. Here are the traditional methods:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <RefreshCcw className="text-blue-400 mb-4" size={28} />
                <h3 className="text-white font-semibold text-lg mb-2">Unplug Your Router</h3>
                <p className="text-sm">Wait 5 minutes and plug it back in. Most home ISPs use dynamic IPs, so your address might change.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <ShieldCheck className="text-blue-400 mb-4" size={28} />
                <h3 className="text-white font-semibold text-lg mb-2">Use a VPN</h3>
                <p className="text-sm">Connecting to a VPN masks your IP. However, Omegle actively blocks known VPN servers.</p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-8 text-center mb-16">
              <Unlock className="mx-auto text-blue-400 mb-4" size={40} />
              <h2 className="text-2xl font-bold text-white mb-4">The Best Fix? Stop Using Omegle.</h2>
              <p className="mb-6 max-w-xl mx-auto">
                Fighting bans, paying for VPNs, and dealing with automated moderation is exhausting. That is why thousands of banned users are switching to Vibelly.
              </p>
              <button
                onClick={() => handleProtectedNavigation('/setup/video')}
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
              >
                <Video size={18} />
                Start a Call on Vibelly
              </button>
            </div>
          </div>
        </section>

        <FAQSection faqs={[
          {
            question: "How long does an Omegle ban last?",
            answer: "An Omegle ban typically lasts anywhere from 7 days to 4 months. In severe cases involving legal violations, the ban is permanent and your IP is blacklisted forever."
          },
          {
            question: "Why did I get banned on Omegle for no reason?",
            answer: "Omegle's algorithm automatically bans users who are frequently skipped by others or who skip too many people in a short time. Even if you did nothing wrong, the system might flag your rapid clicking as 'bot-like' behavior."
          },
          {
            question: "Does clearing cookies unban me on Omegle?",
            answer: "No. While Omegle does use tracking cookies, their ban system primarily relies on your IP address. Clearing cookies will not lift an IP ban."
          },
          {
            question: "Is Vibelly a good alternative if I'm banned?",
            answer: "Yes! Vibelly does not share bans with Omegle or OmeTV. If you are banned on those platforms, you can instantly start chatting on Vibelly for free without any issues."
          }
        ]} />

        <ShareButtons
          title="How to Get Unbanned from Omegle (100% Working 2026) | Vibelly"
          description="Banned from Omegle? Discover the unban-proof random video chat alternative and start talking to strangers again today."
        />

        <Footer />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    </div>
  );
}
