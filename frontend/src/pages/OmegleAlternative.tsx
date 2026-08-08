import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Video, Zap, MessageSquare, ArrowRight, Lock, Headphones, CheckCircle2, XCircle } from 'lucide-react';
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
        title="The Best Free Omegle Alternative in 2026 | Vibelly" 
        description="Looking for an Omegle alternative? Vibelly is the best free random video call app. Meet strangers instantly with HD video, voice chat, and strict safety measures."
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
            Vibelly is the safest, fastest, and most aesthetic random video call app on the internet.
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
              Why choose Vibelly over OmeTV?
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

        {/* Comparison Table */}
        <section className="px-6 py-20 max-w-4xl mx-auto w-full">
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[100px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2" />
            
            <h2 className="text-2xl md:text-3xl font-semibold mb-10 text-center z-10 relative">
              The Ultimate Showdown
            </h2>

            <div className="relative z-10 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr>
                    <th className="p-4 border-b border-white/10 text-zinc-500 font-medium">Feature</th>
                    <th className="p-4 border-b border-white/10 text-white font-semibold text-center text-lg">Vibelly</th>
                    <th className="p-4 border-b border-white/10 text-zinc-500 font-medium text-center">Omegle</th>
                    <th className="p-4 border-b border-white/10 text-zinc-500 font-medium text-center">OmeTV</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { label: "Account Required", v: true, o: true, t: false },
                    { label: "HD Video Quality", v: true, o: false, t: false },
                    { label: "Dark Mode Aesthetic", v: true, o: false, t: false },
                    { label: "Hidden Group Chats", v: true, o: false, t: false },
                    { label: "Active Moderation", v: true, o: false, t: true },
                    { label: "Mobile Optimized", v: true, o: false, t: true },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 border-b border-white/5 text-zinc-300 font-medium">{row.label}</td>
                      <td className="p-4 border-b border-white/5 text-center bg-white/5">
                        {row.v ? <CheckCircle2 className="mx-auto text-green-400" size={20} /> : <XCircle className="mx-auto text-red-400" size={20} />}
                      </td>
                      <td className="p-4 border-b border-white/5 text-center">
                        {row.o ? <CheckCircle2 className="mx-auto text-zinc-600" size={20} /> : <XCircle className="mx-auto text-zinc-600" size={20} />}
                      </td>
                      <td className="p-4 border-b border-white/5 text-center">
                        {row.t ? <CheckCircle2 className="mx-auto text-zinc-600" size={20} /> : <XCircle className="mx-auto text-zinc-600" size={20} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SEO Article for Keyword Depth */}
        <SeoArticle
          blocks={[
            {
              heading: 'Why Omegle shut down — and why people still search for it',
              paragraphs: [
                "Omegle was one of the internet's most famous places to talk to strangers. For more than a decade, millions of users opened their browsers to be matched randomly with someone on the other side of the world. In November 2023, the site went dark: the founder said the platform had become unsustainable to run, largely because of the cost of keeping the community safe.",
                "The shutdown left a huge gap. People who grew up using free random video chat were suddenly looking for an Omegle alternative that keeps the same magic — meeting someone completely new with one click — without the moderation problems that killed the original. That is exactly the gap Vibelly was built to fill.",
                "A good Omegle alternative today needs three things: it must be free, it must be anonymous, and it must be actively moderated. Vibelly delivers all three from day one, which is why it has become one of the fastest-growing free video chat platforms online.",
              ],
            },
            {
              heading: 'What makes Vibelly the best Omegle alternative',
              paragraphs: [
                'A random video chat site only earns the title of "best Omegle alternative" when it fixes everything the original got wrong. Here is what Vibelly does differently:',
              ],
              bullets: [
                'Free random video chat with no sign-up, no email, and no app to download',
                'HD video calls and voice-only mode powered by low-latency WebRTC',
                'AI moderation plus one-tap reporting to keep strangers respectful',
                'Fully anonymous — your identity stays private until you choose to share it',
                'Instant matching: you are connected to a new stranger in under a second',
                'Works on any phone, tablet, or desktop browser without installing anything',
              ],
            },
            {
              heading: 'How to start a free random video call on Vibelly',
              paragraphs: [
                'Getting started is the whole point of an Omegle alternative — it should take seconds, not a registration form. On Vibelly you simply open the site, press "Start Video Call" (or choose voice-only or text chat), and you are matched with a stranger immediately.',
                'The moment a match is found, WebRTC negotiates a direct, low-latency connection between the two browsers. Your camera and microphone stream straight to the other person, which keeps the video chat crisp and responsive. You can skip to the next stranger at any time, and both users are re-queued instantly.',
                'There is no setup wizard, no profile to fill in, and no payment required for the core random video call experience. Premium filters for gender and country are entirely optional upgrades.',
              ],
            },
            {
              heading: 'Omegle vs Vibelly: what actually changed',
              paragraphs: [
                'When people ask "is there anything like Omegle anymore?", what they usually mean is: can I still click one button and talk to a stranger? Yes — but the modern version is safer and better built.',
                'Omegle had no reliable identity system and famously struggled with trolls and bad actors. Vibelly layers AI screening on top of random matching, gives you a one-click report button, and makes every conversation ephemeral: when you skip or end a call, the chat is gone. It keeps the thrill of meeting a random stranger while removing the reasons the original platform was forced offline.',
                'If you miss Omegle, or if you have never used it and want to know what the hype is about, Vibelly is the closest thing to the classic experience — free, anonymous, and ready in a single click.',
              ],
            },
          ]}
        />

        <CompareAlternatives
          alternatives={[
            { to: '/ometv-alternative', label: 'OmeTV Alternative', blurb: 'Video chat online without forcing a Facebook or VK login.' },
            { to: '/chatroulette-alternative', label: 'Chatroulette Alternative', blurb: 'The modern successor to classic chat roulette.' },
            { to: '/random-video-chat', label: 'Random Video Chat', blurb: 'Free random video calls with strangers in under a second.' },
            { to: '/talk-to-strangers', label: 'Talk to Strangers', blurb: 'Instant stranger chat with video, voice, or text.' },
            { to: '/video-chat-online', label: 'Free Online Video Call', blurb: 'Make a free online video call right in your browser.' },
            { to: '/omegle-unbanned', label: 'Omegle Unban Guide', blurb: 'Everything you need to know about Omegle bans and how to avoid them.' },
          ]}
        />

        <FAQSection faqs={[
          {
            question: "Is Vibelly a good alternative to Omegle?",
            answer: "Yes! Vibelly is considered one of the best Omegle alternatives because it offers HD video quality, a clean dark-mode aesthetic, and strict moderation to keep the community safe, all without requiring an account."
          },
          {
            question: "Do I need to sign up to use Vibelly?",
            answer: "No, you don't need to sign up or provide any personal information to start using the random video chat. Just click start and instantly connect with strangers worldwide."
          },
          {
            question: "Is Vibelly safe to use?",
            answer: "We prioritize user safety above all else. Unlike Omegle, Vibelly uses advanced moderation tools and allows users to report inappropriate behavior instantly, ensuring a safe and clean environment."
          },
          {
            question: "Can I use Vibelly on my phone?",
            answer: "Absolutely. Vibelly is fully optimized for mobile browsers, meaning you can enjoy seamless video chat on your iPhone or Android device without downloading any apps."
          }
        ]} />

        <ShareButtons
          title="The Best Free Omegle Alternative in 2026 | Vibelly"
          description="Find out why Vibelly is the best free Omegle alternative — anonymous, HD, and ready in one click."
        />

        <Footer />
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      </div>
    </div>
  );
}
