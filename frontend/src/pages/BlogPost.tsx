import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { ArrowLeft } from 'lucide-react';
import posts from '../content/blog-posts.json';
import pages from '../content/pages.json';
import { Inline, Table } from '../components/Inline';

const renderMarkdown = (content: string) => {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    // "| a | b |" rows form a table; the first row is the header and "|---|" separators are skipped.
    if (trimmed.startsWith('|')) {
      if (lines[i - 1]?.trim().startsWith('|')) return null;
      const rows = [];
      for (let k = i; lines[k]?.trim().startsWith('|'); k++) {
        const cells = lines[k].trim().slice(1, -1).split('|').map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
      }
      return <Table key={i} rows={rows} />;
    }
    if (trimmed.startsWith('### ')) return <h3 key={i} className="text-2xl font-bold mt-10 mb-4 text-white" style={{ fontFamily: 'Georgia, serif' }}>{trimmed.slice(4)}</h3>;
    if (trimmed.startsWith('## ')) return <h2 key={i} className="text-3xl font-bold mt-12 mb-6 text-white" style={{ fontFamily: 'Georgia, serif' }}>{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith('- ')) return <li key={i} className="ml-6 list-disc mb-2 text-zinc-300"><Inline text={trimmed.slice(2)} /></li>;
    if (trimmed.match(/^[0-9]+\.\s/)) return <h3 key={i} className="text-xl font-semibold mt-8 mb-4 text-white">{trimmed}</h3>;
    if (trimmed === '') return null;
    
    return (
      <p key={i} className="mb-5 leading-relaxed text-zinc-400 text-lg">
        <Inline text={trimmed} />
      </p>
    );
  });
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = posts.find((p) => p.slug === slug);
  const relatedPosts = posts.filter((p) => p.slug !== slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#15171B] text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Post not found</h1>
        <Link to="/blog" className="text-zinc-400 hover:text-white underline">Return to Blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15171B] text-white flex flex-col font-sans">
      <SEO 
        title={`${post.title} | Vibelly Blog`}
        description={post.description}
        canonicalUrl={`/blog/${post.slug}`}
        type="article"
      />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 px-6 py-20 md:py-32 max-w-3xl mx-auto w-full">
          <Link to="/blog" className="inline-flex items-center gap-2 min-h-11 text-zinc-500 hover:text-white transition-colors mb-12">
            <ArrowLeft size={16} />
            Back to all articles
          </Link>

          <div>
            <div className="text-zinc-500 font-medium mb-4">{post.date} • By <Link to="/about" className="underline hover:text-white py-3">{post.author}</Link></div>
            <h1 className="text-4xl md:text-5xl font-normal leading-tight mb-8" style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
              {post.title}
            </h1>
            {/* Same start link as the prerendered page (scripts/prerender.cjs buildBody). */}
            <Link to="/setup/video" className="inline-flex px-8 py-4 mb-10 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">
              Start Video Chat (18+)
            </Link>
            
            <div className="w-full h-px bg-white/10 mb-12"></div>

            <div className="article-content">
              {renderMarkdown(post.content)}
            </div>
            
            <div className="mt-16 p-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-white font-semibold">{pages.author.name}</p>
              <p className="text-zinc-500 text-sm mb-2">{pages.author.role}</p>
              <p className="text-zinc-400 text-sm leading-relaxed">{pages.author.bio}</p>
            </div>

            {/* Related Posts Section */}
            {relatedPosts.length > 0 && (
              <div className="mt-20 pt-12 border-t border-white/10">
                <h3 className="text-2xl font-semibold mb-8">Read Next</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {relatedPosts.slice(0, 2).map((related) => (
                    <Link 
                      key={related.slug} 
                      to={`/blog/${related.slug}`}
                      className="block p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <h4 className="font-medium text-lg mb-2 group-hover:text-blue-400 transition-colors">{related.title}</h4>
                      <p className="text-zinc-400 text-sm line-clamp-2">{related.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
