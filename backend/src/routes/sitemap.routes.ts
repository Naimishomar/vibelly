import express from 'express';
import { Blog } from '../models/Blog';
import { ENV } from '../config/env';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const frontendUrl = ENV.FRONTEND_URL || 'https://vibelly.fun';
    const blogs = await Blog.find().select('slug updatedAt').lean();

    const staticRoutes = [
      '',
      '/omegle-alternative',
      '/ometv-alternative',
      '/chatroulette-alternative',
      '/blog',
      '/terms',
      '/contact'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static routes
    for (const route of staticRoutes) {
      xml += `
  <url>
    <loc>${frontendUrl}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    }

    // Add dynamic blog routes
    for (const blog of blogs) {
      xml += `
  <url>
    <loc>${frontendUrl}/blog/${blog.slug}</loc>
    <lastmod>${new Date(blog.updatedAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    xml += '\n</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
