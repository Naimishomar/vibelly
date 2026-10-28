import { Link } from 'react-router-dom';
import ContentSections from './ContentSections';
import pages from '../content/pages.json';

type Slug = keyof typeof pages.keywordBlocks;

// Page-specific answer block from src/content/pages.json (also prerendered by scripts/prerender.cjs).
export default function KeywordBlock({ slug }: { slug: Slug }) {
  const block = pages.keywordBlocks[slug];
  return (
    <section className="px-6 py-16 max-w-3xl mx-auto w-full text-zinc-300 leading-relaxed">
      <p className="text-sm text-zinc-500">Updated {block.updated}</p>
      <ContentSections sections={[block]} />
      <p className="mt-6 text-sm text-zinc-400">
        Related: <Link to="/blog/omegle-alternatives-compared" className="underline hover:text-white">Omegle alternatives compared</Link>
        {' · '}<Link to="/blog/how-to-start-a-conversation-with-a-stranger" className="underline hover:text-white">How to start a conversation</Link>
        {' · '}<Link to="/safety" className="underline hover:text-white">Safety rules</Link>
        {' · '}<Link to="/terms" className="underline hover:text-white">Terms &amp; Privacy</Link>
      </p>
    </section>
  );
}
