const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const siteUrl = 'https://vibelly.fun';

const today = new Date().toISOString().slice(0, 10);

// 20 Base Keywords
const keywords = [
  'omegle-alternative', 'random-video-chat', 'talk-to-strangers', 'anonymous-chat',
  'video-chat-with-girls', 'free-cam-chat', 'stranger-cam', 'chat-roulette-free',
  'omegle-unbanned', 'video-call-app', 'chat-with-strangers-online', 'random-cam',
  'free-video-chat-rooms', 'meet-new-people', 'stranger-video-call', 'live-video-chat',
  'cam-to-cam-chat', 'anonymous-video-chat', 'chat-random', 'omegle-app'
];

// Modifiers (legit long-tail, all prerendered)
const modifiers = ['', 'free', 'online', 'without-login', 'for-introverts'];

// City landing pages (each prerendered with unique geo-aware content)
const cities = [
  'new-york', 'los-angeles', 'chicago', 'houston', 'miami', 'san-francisco',
  'seattle', 'boston', 'austin', 'denver', 'las-vegas', 'atlanta',
  'london', 'manchester', 'birmingham', 'paris', 'berlin', 'madrid',
  'toronto', 'vancouver', 'montreal', 'sydney', 'melbourne', 'brisbane',
  'tokyo', 'osaka', 'mumbai', 'delhi', 'bangalore', 'hyderabad',
  'dubai', 'singapore', 'bangkok', 'kuala-lumpur', 'jakarta', 'manila',
  'sao-paulo', 'mexico-city', 'buenos-aires', 'nairobi', 'lagos', 'cairo'
];

// Real app routes that exist as React pages
const realRoutes = [
  '/', '/pricing', '/contact', '/terms', '/blog',
  '/omegle-alternative', '/ometv-alternative', '/chatroulette-alternative',
  '/random-video-chat', '/talk-to-strangers', '/anonymous-chat',
  '/chat-with-girls', '/video-chat-online', '/omegle-unbanned'
];

function xmlUrl(loc, changefreq = 'daily', priority = '0.8', lastmod = today) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function writeSitemap(name, urls, defaultChangefreq = 'daily', defaultPriority = '0.8') {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const u of urls) {
    const loc = typeof u === 'string' ? u : u.url;
    const changefreq = typeof u === 'string' ? defaultChangefreq : u.changefreq;
    const priority = typeof u === 'string' ? defaultPriority : u.priority;
    xml += xmlUrl(loc, changefreq, priority) + '\n';
  }
  xml += '</urlset>';
  fs.writeFileSync(path.join(publicDir, name), xml);
  console.log(`Saved ${name} with ${urls.length} URLs.`);
}

// ─── Core sitemap: real routes + base keywords + modifiers ───
const coreUrls = [];
for (const route of realRoutes) {
  const priority = route === '/' ? '1.0' : '0.9';
  const changefreq = route === '/' ? 'hourly' : 'weekly';
  coreUrls.push({ url: `${siteUrl}${route}`, changefreq, priority });
}
for (const kw of keywords) {
  coreUrls.push({ url: `${siteUrl}/${kw}`, changefreq: 'daily', priority: '0.9' });
}
for (const kw of keywords) {
  for (const mod of modifiers) {
    if (!mod) continue;
    coreUrls.push({ url: `${siteUrl}/${kw}-${mod}`, changefreq: 'daily', priority: '0.8' });
  }
}
writeSitemap('sitemap-core.xml', coreUrls);

// ─── City sitemap: keyword x city landing pages ───
const cityUrls = [];
for (const kw of keywords) {
  for (const city of cities) {
    cityUrls.push({ url: `${siteUrl}/${kw}-in-${city}`, changefreq: 'daily', priority: '0.7' });
  }
}
writeSitemap('sitemap-cities.xml', cityUrls);

// ─── Sitemap index (competitors + trends are written later in the build; blog is proxied) ───
let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const file of ['sitemap-core.xml', 'sitemap-cities.xml', 'sitemap-competitors.xml', 'sitemap-trends.xml', 'sitemap-blog.xml']) {
  indexXml += `  <sitemap>\n    <loc>${siteUrl}/${file}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>\n`;
}
indexXml += '</sitemapindex>';
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), indexXml);

// Clean up obsolete giant sitemaps so Google stops crawling stale thin pages
for (const oldFile of ['sitemap-1.xml', 'sitemap-2.xml', 'sitemap-3.xml']) {
  const oldPath = path.join(publicDir, oldFile);
  if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
}

console.log('✅ Saved sitemap.xml (Sitemap Index) with high-quality, fully-prerendered pages.');
