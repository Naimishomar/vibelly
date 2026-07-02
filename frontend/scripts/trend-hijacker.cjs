const fs = require('fs');
const path = require('path');

const siteUrl = 'https://vibelly.vercel.app';
const publicDir = path.join(__dirname, '..', 'public');

async function hijackTrends() {
  console.log('🚀 Starting Trend Hijacker via Google News RSS...');
  try {
    const res = await fetch('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    const xml = await res.text();
    
    // Extract titles using regex
    const matches = [...xml.matchAll(/<item>\s*<title>(.*?)<\/title>/g)];
    
    // Clean up titles (e.g., "Taylor Swift does something - CNN" -> "Taylor Swift does something")
    const trends = matches.map(m => {
      let title = m[1];
      if (title.includes(' - ')) {
        title = title.split(' - ').slice(0, -1).join(' - '); // Remove the publisher
      }
      return title;
    });
    
    if (trends.length === 0) {
      console.warn('No trends found.');
      return;
    }
    
    console.log(`🔥 Captured ${trends.length} viral trends! Examples: ${trends.slice(0, 3).join(', ')}`);
    
    // Generate URL slugs for each trend
    const trendUrls = [];
    for (const trend of trends) {
      // Remove stop words and make short slugs if possible
      const cleanTrend = trend.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
        
      if (!cleanTrend) continue;
      
      trendUrls.push(`${siteUrl}/video-chat-about-${cleanTrend}`);
      trendUrls.push(`${siteUrl}/talk-about-${cleanTrend}-online`);
      trendUrls.push(`${siteUrl}/${cleanTrend}-chat-room`);
      trendUrls.push(`${siteUrl}/random-video-chat-for-${cleanTrend}`);
    }
    
    // Remove duplicates
    const uniqueUrls = [...new Set(trendUrls)];
    
    console.log(`Generated ${uniqueUrls.length} highly-targeted viral URLs.`);
    
    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }
    
    // Write sitemap-trends.xml
    let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    for (const url of uniqueUrls) {
      sitemapXml += `  <url>\n    <loc>${url}</loc>\n    <changefreq>hourly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    }
    sitemapXml += `</urlset>`;
    
    fs.writeFileSync(path.join(publicDir, 'sitemap-trends.xml'), sitemapXml);
    console.log('✅ Saved sitemap-trends.xml successfully!');
    
  } catch (error) {
    console.error('Failed to hijack trends:', error);
  }
}

hijackTrends();
