import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import ContentSections from '../components/ContentSections';
import pages from '../content/pages.json';

const serif = { fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' };

export default function Safety() {
  return (
    <div className="min-h-screen bg-[#15171B] text-white font-sans flex flex-col relative">
      <SEO
        title="Safety & Community Rules | Vibelly"
        description="Vibelly is for adults 18+. Read our community rules, how reporting and bans work, and how to stay safe when you talk to strangers."
        canonicalUrl="/safety"
      />
      <BlinkingDotsGrid />
      <div className="relative z-10 w-full flex flex-col items-center">
        <Navbar />
      </div>
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full pt-20 px-6 pb-32">
        <h1 className="text-5xl md:text-6xl font-normal mb-8" style={serif}>Safety &amp; Community Rules</h1>
        <div className="text-zinc-300 leading-relaxed bg-black/20 p-8 md:p-12 rounded-[2rem] border border-white/5 backdrop-blur-sm shadow-2xl">
          <p className="text-sm text-zinc-500">Last updated {pages.safety.updated}</p>
          <ContentSections sections={pages.safety.sections} />
          <p className="mt-10">
            Questions or an urgent report? Email <a href="mailto:vibellyofficial@gmail.com" className="underline hover:text-white">vibellyofficial@gmail.com</a>. Full details are in the <Link to="/terms" className="underline hover:text-white">Terms &amp; Privacy Policy</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
