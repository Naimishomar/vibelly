import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import { BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlogPost {
  _id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchBlogs = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/blogs?limit=100`);
        const data = await res.json();
        if (data.success) {
          setPosts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch blogs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-[#15171B] text-white flex flex-col font-sans">
      <SEO 
        title="Vibelly Blog | Random Video Chat Tips & Guides" 
        description="Read the latest tips, guides, and news about random video chatting, online safety, and meeting strangers online."
        canonicalUrl="/blog"
        noindex
      />
      <BlinkingDotsGrid />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 px-6 py-24 md:py-32 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium mb-6">
              <BookOpen size={16} className="text-zinc-400" />
              Resources & Guides
            </div>
            <h1 className="text-4xl md:text-6xl font-normal tracking-tight mb-6" style={{ fontFamily: '"Playfair Display", "Merriweather", "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }}>
              The Vibelly Blog
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-4">
              Everything you need to know about navigating the world of random video chat safely and securely.
            </p>
            {!loading && <p className="text-zinc-500 text-sm">Showing {posts.length} articles</p>}
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="animate-spin text-white w-8 h-8" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {posts.map((post, i) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 10) * 0.05 }}
                >
                  <Link to={`/blog/${post.slug}`} className="block h-full bg-zinc-900/50 border border-white/5 rounded-2xl p-8 hover:bg-zinc-900 hover:border-white/20 transition-all group">
                    <div className="text-zinc-500 text-sm mb-4">{post.date}</div>
                    <h2 className="text-2xl font-semibold mb-3 group-hover:text-white text-zinc-200 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-zinc-400 leading-relaxed mb-6">
                      {post.description}
                    </p>
                    <div className="text-white text-sm font-medium flex items-center gap-2">
                      Read Article <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}
