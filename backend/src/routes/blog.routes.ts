import express from 'express';
import { getAllBlogs, getBlogBySlug, getRelatedBlogs } from '../controllers/blog.controller';
import { Blog } from '../models/Blog';

const router = express.Router();

router.get('/', getAllBlogs);
router.get('/related/:slug', getRelatedBlogs);

// XML sitemap for all blog posts (consumed by the frontend via /sitemap-blog.xml proxy)
router.get('/sitemap.xml', async (_req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'https://vibelly.fun';
    const blogs = await Blog.find().select('slug updatedAt').lean();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const blog of blogs) {
      xml += `  <url>\n    <loc>${frontendUrl}/blog/${blog.slug}</loc>\n    <lastmod>${new Date(blog.updatedAt).toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }
    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    console.error('Blog sitemap generation error:', error);
    res.status(500).send('Error generating blog sitemap');
  }
});

router.get('/:slug', getBlogBySlug);

export default router;
