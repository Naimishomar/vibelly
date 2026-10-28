import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import ContentSections from '../components/ContentSections';
import pages from '../content/pages.json';

const serif = { fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' };

export default function About() {
  return (
    <div className="min-h-screen bg-[#15171B] text-white font-sans flex flex-col relative">
      <SEO
        title="About Vibelly | Who Runs Vibelly"
        description="Vibelly is a free, adults-only random video chat built and run by Naimish Omar. Who runs it, how it is funded, and how we approach safety."
        canonicalUrl="/about"
      />
      <BlinkingDotsGrid />
      <div className="relative z-10 w-full flex flex-col items-center">
        <Navbar />
      </div>
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full pt-20 px-6 pb-32">
        <h1 className="text-5xl md:text-6xl font-normal mb-8" style={serif}>About Vibelly</h1>
        <div className="text-zinc-300 leading-relaxed bg-black/20 p-8 md:p-12 rounded-[2rem] border border-white/5 backdrop-blur-sm shadow-2xl">
          <ContentSections sections={pages.about.sections} />
          <p className="mt-10">
            Read the <Link to="/safety" className="underline hover:text-white">Safety &amp; Community Rules</Link> or email <a href="mailto:vibellyofficial@gmail.com" className="underline hover:text-white">vibellyofficial@gmail.com</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
