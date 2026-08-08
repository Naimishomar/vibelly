import { useState } from 'react';
import { Copy, Check, Link2, Code2, Image, MessageSquareText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';

const SITE = 'https://vibelly.fun';

const ASSETS = [
  {
    icon: Image,
    title: 'Banner / Badge',
    description: 'A small, good-looking badge that links back to Vibelly. Drop it into your sidebar, footer, or about page.',
    anchor: 'Omegle alternative',
    code: `<a href="${SITE}" target="_blank" rel="noopener">\n  <img src="${SITE}/badge.svg" alt="Omegle alternative - Vibelly" width="150" height="40" />\n</a>`,
  },
  {
    icon: Link2,
    title: 'Text link (in-article)',
    description: 'Natural, keyword-rich anchor text that reads well inside blog posts or guides.',
    anchor: 'free random video chat',
    code: `If you miss Omegle, try <a href="${SITE}" target="_blank" rel="noopener">${'free'} random video chat on Vibelly</a> — it's anonymous, free, and works in your browser.`,
  },
  {
    icon: Code2,
    title: 'Embeddable chat widget',
    description: 'Put a live "Start Chatting" card on your site. Visitors click straight through to Vibelly.',
    anchor: 'chat widget',
    code: `<iframe src="${SITE}/embed.html" width="100%" height="300" style="border:0;border-radius:16px;overflow:hidden" loading="lazy" title="Vibelly - free random video chat"></iframe>`,
  },
  {
    icon: MessageSquareText,
    title: 'Link for forums / profiles',
    description: 'A clean text link perfect for Reddit, Quora, forum signatures, or your social bio.',
    anchor: 'talk to strangers online',
    code: `Free ${'talk to strangers online'}: <a href="${SITE}" target="_blank" rel="noopener">${SITE}</a> — no sign-up, no app.`,
  },
];

function CopyCard({ asset }: { asset: (typeof ASSETS)[number] }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(asset.code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  return (
    <div className="rounded-2xl bg-[#131313] border border-white/5 p-5 flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
          <asset.icon size={17} className="text-white" />
        </div>
        <h3 className="text-white font-semibold">{asset.title}</h3>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed mb-4">{asset.description}</p>

      <pre className="bg-[#0F0F0F] border border-white/10 rounded-xl p-4 overflow-x-auto text-[12px] leading-relaxed text-zinc-300 whitespace-pre-wrap flex-1 mb-4">
        {asset.code}
      </pre>

      <button
        onClick={copy}
        className="flex items-center justify-center gap-2 bg-white text-black text-sm font-semibold py-2.5 rounded-xl hover:bg-white/85 transition-colors cursor-pointer"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? 'Copied!' : 'Copy HTML'}
      </button>
    </div>
  );
}

export default function LinkToUs() {
  const [copiedMain, setCopiedMain] = useState(false);
  const mainLink = `<a href="${SITE}" target="_blank" rel="noopener">${SITE}</a>`;

  const copyMain = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(mainLink);
      }
      setCopiedMain(true);
      setTimeout(() => setCopiedMain(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#15171B] text-white flex flex-col font-sans">
      <SEO
        title="Link to Vibelly — Free Backlink Badges & Embeddable Chat Widget"
        description="Grab a free badge, banner, or embeddable chat widget for Vibelly. Perfect for blogs, forums, and directories that link to free random video chat."
        canonicalUrl="/backlinks"
        noindex
      />
      <BlinkingDotsGrid />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <section className="px-6 pt-16 pb-10 max-w-4xl mx-auto w-full text-center">
          <h1 className="text-3xl md:text-5xl font-normal tracking-tight leading-tight mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Link to Vibelly
          </h1>
          <p className="text-zinc-400 md:text-lg max-w-2xl mx-auto leading-relaxed">
            Thank you! Vibelly is free, anonymous random video chat. Add a link, badge, or the chat widget below to your
            site and help more people find a safe place to talk to strangers.
          </p>

          <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Quick link
            <button
              onClick={copyMain}
              className="flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer text-xs font-medium"
            >
              {copiedMain ? <Check size={13} /> : <Copy size={13} />}
              {copiedMain ? 'Copied' : 'Copy'}
            </button>
          </div>
        </section>

        <section className="px-6 pb-16 max-w-4xl mx-auto w-full">
          <div className="grid sm:grid-cols-2 gap-5">
            {ASSETS.map((asset) => (
              <CopyCard key={asset.title} asset={asset} />
            ))}
          </div>
        </section>

        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </div>
  );
}
