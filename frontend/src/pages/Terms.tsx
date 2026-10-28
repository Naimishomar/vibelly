import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import ContentSections from '../components/ContentSections';
import pages from '../content/pages.json';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#15171B] text-white font-sans flex flex-col relative">
      <SEO 
        title="Terms of Service & Privacy Policy | Vibelly" 
        description="Read the terms of service and privacy policy for Vibelly. We prioritize your anonymity and data protection."
        canonicalUrl="/terms"
      />
      {/* ─── Dot Grid ─── */}
      <BlinkingDotsGrid />
      <div className="relative z-10 w-full flex flex-col items-center">
        <Navbar />
      </div>
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full pt-20 px-6 pb-32">
        <h1 className="text-5xl md:text-6xl font-normal mb-8" style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>Terms & Conditions</h1>
        <div className="space-y-6 text-zinc-300 leading-relaxed bg-black/20 p-8 md:p-12 rounded-[2rem] border border-white/5 backdrop-blur-sm shadow-2xl">
          <p className="text-lg">{pages.terms.intro}</p>
          <ContentSections sections={pages.terms.sections} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
