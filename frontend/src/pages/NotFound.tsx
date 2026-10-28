import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#15171B] text-white font-sans flex flex-col">
      <SEO title="Page not found | Vibelly" noindex />
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl font-normal mb-4">Page not found</h1>
        <p className="text-zinc-400 mb-8">This page does not exist.</p>
        <Link to="/" className="bg-white text-black font-semibold px-6 py-3 rounded-xl">Go to Vibelly</Link>
      </main>
    </div>
  );
}
