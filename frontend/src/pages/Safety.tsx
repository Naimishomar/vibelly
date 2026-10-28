import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';

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
        <div className="space-y-6 text-zinc-300 leading-relaxed bg-black/20 p-8 md:p-12 rounded-[2rem] border border-white/5 backdrop-blur-sm shadow-2xl">
          <h2 className="text-3xl font-normal text-white mb-4" style={serif}>Adults only (18+)</h2>
          <p>Vibelly is only for people aged 18 or older. You must confirm you are 18+ before every chat. If you are under 18, do not use Vibelly. Accounts found to belong to minors are banned.</p>

          <h2 className="text-3xl font-normal text-white mt-10 mb-4" style={serif}>Community rules</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>No nudity, sexual content, or sexual requests.</li>
            <li>No harassment, hate speech, threats, or bullying.</li>
            <li>No spam, scams, advertising, or links to other services.</li>
            <li>No recording or screenshotting people without their consent.</li>
            <li>No illegal activity of any kind.</li>
          </ul>

          <h2 className="text-3xl font-normal text-white mt-10 mb-4" style={serif}>How reporting works</h2>
          <p>Every call has a Report button. Reports are sent to the Vibelly team, who review them and ban accounts that break these rules. Reporting requires you to be signed in, so that reports can be linked to real accounts and not abused. You can also email reports to <a href="mailto:vibellyofficial@gmail.com" className="underline hover:text-white">vibellyofficial@gmail.com</a> with the time of the call and what happened.</p>

          <h2 className="text-3xl font-normal text-white mt-10 mb-4" style={serif}>Staying safe with strangers</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Never share your full name, address, school, workplace, or financial details.</li>
            <li>Skip any conversation instantly. You never owe a stranger your time.</li>
            <li>Be careful with requests to move to another app. That is a common scam pattern.</li>
            <li>Assume anything you show on camera could be recorded by the other person.</li>
          </ul>

          <h2 className="text-3xl font-normal text-white mt-10 mb-4" style={serif}>Privacy</h2>
          <p>Video and voice calls connect directly between browsers using WebRTC, which encrypts media in transit. Vibelly does not record calls. See the <Link to="/terms" className="underline hover:text-white">Terms &amp; Privacy Policy</Link> for details.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
