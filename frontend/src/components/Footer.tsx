import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import ProductHuntBadge from './ProductHuntBadge';

export default function Footer() {
  return (
    <div className="w-full px-4 md:px-6 pb-8 mt-12">
      <footer className="w-full max-w-7xl mx-auto bg-[#15171B] border border-white/10 rounded-[2rem] py-12 px-8 lg:px-12 text-sm relative z-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
        
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-base tracking-tight">
            <img 
              src="https://i.pinimg.com/736x/bf/f9/90/bff990bfc21bdc142b69c6ed28b53b6d.jpg" 
              alt="Vibelly Logo" 
              className="w-10 h-10 rounded-full object-cover shadow-lg shadow-black/50" 
            />
            <span className='text-2xl font-serif font-black'>Vibelly</span>
          </Link>
          <p className="text-zinc-500 leading-relaxed max-w-xs">
            Connect instantly with verified users globally. Next-gen premium matching for real conversations.
          </p>
          <div className="mt-4 transform scale-90 origin-left">
            <ProductHuntBadge />
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-semibold mb-2">Quick Links</h4>
          <Link to="/" className="text-zinc-400 hover:text-white transition-colors">Home</Link>
          <Link to="/pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</Link>
          <Link to="/contact" className="text-zinc-400 hover:text-white transition-colors">Contact Us</Link>
          <Link to="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms & Conditions</Link>
        </div>

        {/* Resources / Alternatives */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-semibold mb-2">Resources</h4>
          <Link to="/blog" className="text-zinc-400 hover:text-white transition-colors">Blog & Guides</Link>
          <Link to="/omegle-alternative" className="text-zinc-400 hover:text-white transition-colors">Omegle Alternative</Link>
          <Link to="/ometv-alternative" className="text-zinc-400 hover:text-white transition-colors">OmeTV Alternative</Link>
          <Link to="/chatroulette-alternative" className="text-zinc-400 hover:text-white transition-colors">Chatroulette Alternative</Link>
          <Link to="/omegle-unbanned" className="text-zinc-400 hover:text-white transition-colors">Omegle Unban Guide</Link>
          <Link to="/backlinks" className="text-zinc-400 hover:text-white transition-colors">Link to Vibelly</Link>
        </div>

        {/* Global Chat (SEO Silo) */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-semibold mb-2">Global Chat</h4>
          <Link to="/chat/usa" className="text-zinc-400 hover:text-white transition-colors">Chat in USA</Link>
          <Link to="/chat/uk" className="text-zinc-400 hover:text-white transition-colors">Chat in UK</Link>
          <Link to="/chat/india" className="text-zinc-400 hover:text-white transition-colors">Chat in India</Link>
          <Link to="/chat/canada" className="text-zinc-400 hover:text-white transition-colors">Chat in Canada</Link>
          <Link to="/chat/australia" className="text-zinc-400 hover:text-white transition-colors">Chat in Australia</Link>
        </div>

        {/* Contact info */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-semibold mb-2">Contact Us</h4>
          <div className="flex items-center gap-3 text-zinc-400">
            <Mail className="w-5 h-5 shrink-0 text-white" />
            <p>vibellyofficial@gmail.com</p>
          </div>
          <div className="flex items-center gap-3 text-zinc-400">
            <svg className="w-5 h-5 shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <a href="https://instagram.com/vibelly.official" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              @vibelly.official
            </a>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500">
        <p>© {new Date().getFullYear()} Vibelly Inc. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="/terms" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
        </div>
      </footer>
    </div>
  );
}
