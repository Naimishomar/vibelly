import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { ReactLenis } from 'lenis/react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import OnboardingModal from './components/OnboardingModal';

// Lazy loaded components
const Home = lazy(() => import('./pages/Home'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Registry = lazy(() => import('./pages/Registry'));
const VideoCall = lazy(() => import('./pages/VideoCall'));
const TextChat = lazy(() => import('./pages/TextChat'));
const GlobalChat = lazy(() => import('./pages/GlobalChat'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Terms = lazy(() => import('./pages/Terms'));
const Contact = lazy(() => import('./pages/Contact'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Groups = lazy(() => import('./pages/Groups'));
const GroupChat = lazy(() => import('./pages/GroupChat'));
const OmegleAlternative = lazy(() => import('./pages/OmegleAlternative'));
const OmeTvAlternative = lazy(() => import('./pages/OmeTvAlternative'));
const ChatrouletteAlternative = lazy(() => import('./pages/ChatrouletteAlternative'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const OmegleUnbanned = lazy(() => import('./pages/OmegleUnbanned'));
const RandomVideoChat = lazy(() => import('./pages/RandomVideoChat'));
const TalkToStrangers = lazy(() => import('./pages/TalkToStrangers'));
const AnonymousChat = lazy(() => import('./pages/AnonymousChat'));
const ChatWithGirls = lazy(() => import('./pages/ChatWithGirls'));
const VideoChatOnline = lazy(() => import('./pages/VideoChatOnline'));
const DynamicSeoPage = lazy(() => import('./pages/DynamicSeoPage'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const PageLoader = () => (
  <div className="min-h-screen bg-[#15171B] flex items-center justify-center">
    <Loader2 className="animate-spin text-white w-8 h-8" />
  </div>
);

function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const fetchSettings = useAuthStore(state => state.fetchSettings);

  useEffect(() => {
    checkAuth();
    fetchSettings();
  }, [checkAuth, fetchSettings]);

  // Track unique visits
  useEffect(() => {
    let visitorId = localStorage.getItem('vibe_visitor_id');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('vibe_visitor_id', visitorId);
    }

    const trackVisit = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        await fetch(`${backendUrl}/api/analytics/visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId })
        });
      } catch (error) {
        console.error('Failed to track visit', error);
      }
    };

    trackVisit();
  }, []);

  return (
    <HelmetProvider>
      <ReactLenis root>
      <Router>
        <ScrollToTop />
        <OnboardingModal />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/chat" element={<GlobalChat />} />
            <Route path="/groups" element={<Groups />}>
              <Route path=":roomId" element={<GroupChat />} />
            </Route>
            <Route path="/mcp" element={<Registry />} />
            <Route path="/setup/:type" element={<Lobby />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/call" element={<VideoCall />} />
            <Route path="/call/video" element={<VideoCall />} />
            <Route path="/call/audio" element={<VideoCall />} />
            <Route path="/call/text" element={<TextChat />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/omegle-alternative" element={<OmegleAlternative />} />
            <Route path="/ometv-alternative" element={<OmeTvAlternative />} />
            <Route path="/chatroulette-alternative" element={<ChatrouletteAlternative />} />
            <Route path="/omegle-unbanned" element={<OmegleUnbanned />} />
            <Route path="/random-video-chat" element={<RandomVideoChat />} />
            <Route path="/talk-to-strangers" element={<TalkToStrangers />} />
            <Route path="/anonymous-chat" element={<AnonymousChat />} />
            <Route path="/chat-with-girls" element={<ChatWithGirls />} />
            <Route path="/video-chat-online" element={<VideoChatOnline />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/:slug" element={<DynamicSeoPage />} />
          </Routes>
        </Suspense>
      </Router>
      </ReactLenis>
    </HelmetProvider>
  );
}

export default App;
