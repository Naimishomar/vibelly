const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const siteUrl = 'https://vibelly.vercel.app';

// 20 Base Keywords
const keywords = [
  'omegle-alternative', 'random-video-chat', 'talk-to-strangers', 'anonymous-chat',
  'video-chat-with-girls', 'free-cam-chat', 'stranger-cam', 'chat-roulette-free',
  'omegle-unbanned', 'video-call-app', 'chat-with-strangers-online', 'random-cam',
  'free-video-chat-rooms', 'meet-new-people', 'stranger-video-call', 'live-video-chat',
  'cam-to-cam-chat', 'anonymous-video-chat', 'chat-random', 'omegle-app'
];

// 5 Modifiers
const modifiers = [
  '', 'free', 'online', 'without-login', 'for-introverts'
];

// 1000 Cities (sampled)
const cities = [
  "new-york", "los-angeles", "chicago", "houston", "phoenix", "philadelphia", "san-antonio", "san-diego", "dallas", "sanjose",
  "austin", "jacksonville", "fort-worth", "columbus", "san-francisco", "charlotte", "indianapolis", "seattle", "denver", "washington",
  "boston", "el-paso", "nashville", "detroit", "oklahoma-city", "portland", "las-vegas", "memphis", "louisville", "baltimore",
  "london", "birmingham", "manchester", "glasgow", "newcastle", "sheffield", "liverpool", "leeds", "bristol", "edinburgh",
  "toronto", "montreal", "vancouver", "calgary", "edmonton", "ottawa", "winnipeg", "quebec-city", "hamilton", "kitchener",
  "sydney", "melbourne", "brisbane", "perth", "adelaide", "gold-coast", "cranbourne", "canberra", "newcastle-au", "wollongong",
  "tokyo", "yokohama", "osaka", "nagoya", "sapporo", "fukuoka", "kobe", "kyoto", "kawasaki", "saitama",
  "mumbai", "delhi", "bangalore", "hyderabad", "ahmedabad", "chennai", "kolkata", "surat", "pune", "jaipur",
  "berlin", "hamburg", "munich", "cologne", "frankfurt", "stuttgart", "dusseldorf", "leipzig", "dortmund", "essen",
  "paris", "marseille", "lyon", "toulouse", "nice", "nantes", "strasbourg", "montpellier", "bordeaux", "lille",
  // We repeat variations or expand slightly to hit massive numbers
];

// 10 Adjectives
const adjectives = [
  '', 'best', 'top', 'fast', 'secure', 'no-signup', 'hd', 'local', 'stranger', 'random', 'new'
];

// Generate 100,000+ permutations
let allUrls = [];

console.log('Generating URL permutations...');

for (const kw of keywords) {
  for (const mod of modifiers) {
    for (const adj of adjectives) {
      // Just kw + mod + adj
      let base = kw;
      if (adj) base = `${adj}-${base}`;
      if (mod) base += `-${mod}`;
      allUrls.push(`${siteUrl}/${base}`);
      
      // kw + mod + adj + city
      for (const city of cities) {
        allUrls.push(`${siteUrl}/${base}-in-${city}`);
      }
    }
  }
}

// Remove duplicates
allUrls = [...new Set(allUrls)];

console.log(`Generated ${allUrls.length} unique URLs!`);

// Chunk into sitemaps of 40,000 URLs each (Google limit is 50k)
const chunkSize = 40000;
const chunks = [];
for (let i = 0; i < allUrls.length; i += chunkSize) {
  chunks.push(allUrls.slice(i, i + chunkSize));
}

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

// Write the child sitemaps
const sitemapFiles = [];
for (let i = 0; i < chunks.length; i++) {
  const sitemapName = `sitemap-${i + 1}.xml`;
  sitemapFiles.push(sitemapName);
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const url of chunks[i]) {
    xml += `  <url>\n    <loc>${url}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
  xml += `</urlset>`;
  
  fs.writeFileSync(path.join(publicDir, sitemapName), xml);
  console.log(`Saved ${sitemapName} with ${chunks[i].length} URLs.`);
}

// Write the sitemap_index.xml
let indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const file of sitemapFiles) {
  indexXml += `  <sitemap>\n    <loc>${siteUrl}/${file}</loc>\n  </sitemap>\n`;
}
indexXml += `</sitemapindex>`;

// Overwrite the main sitemap.xml to act as the index
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), indexXml);
console.log('Saved sitemap.xml (Sitemap Index).');

console.log('✅ Successfully built 100k+ page architecture!');
