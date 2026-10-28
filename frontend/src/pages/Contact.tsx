import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#15171B] text-white flex flex-col font-sans relative">
      <SEO 
        title="Contact Us | Vibelly Support" 
        description="Need help? Contact Vibelly support for any inquiries, technical issues, or feedback."
        canonicalUrl="/contact"
      />
      {/* ─── Dot Grid ─── */}
      <BlinkingDotsGrid />
      <div className="relative z-10 w-full flex flex-col items-center">
        <Navbar />
      </div>
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full pt-20 px-6 pb-32">
        <h1 className="text-5xl md:text-6xl font-normal mb-6" style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Contact Us</h1>
        <p className="text-zinc-400 mb-12 text-lg">We're here to help. Reach out to us through any of the channels below.</p>
        
        <div className="max-w-xl space-y-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Mail className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Email Us</h2>
              <a href="mailto:vibellyofficial@gmail.com" className="text-zinc-300 underline hover:text-white">vibellyofficial@gmail.com</a>
              <p className="text-zinc-400 mt-2">Support, feedback, business enquiries, and abuse reports. To report a user, include the time of the call and what happened.</p>
            </div>
          </div>
          <a
            href="mailto:vibellyofficial@gmail.com?subject=Vibelly%20support"
            className="inline-block bg-white hover:bg-zinc-200 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Send us an email
          </a>
          <p className="text-zinc-400">
            Safety concern? Read our <Link to="/safety" className="underline hover:text-white">Safety &amp; Community Rules</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
