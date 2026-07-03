const fs = require('fs');
const path = require('path');

const siteUrl = 'https://vibelly.fun';
const publicDir = path.join(__dirname, '..', 'public');

const competitors = [
  'omegle', 'ometv', 'chatroulette', 'monkey-app', 'emerald-chat', 
  'bazoocam', 'chatrandom', 'camsurf', 'coomeet', 'tinychat', 
  'shagle', 'chathub', 'camfrog', 'joingy', 'flingster'
];

const modifiers = [
  'alternative',
  'alternative-free',
  'alternative-no-login',
  'alternative-for-girls',
  'unbanned',
  'app',
  'app-download',
  'website-like',
  'better-than',
  'for-mobile'
];

async function generateCompetitorPages() {
  console.log('🚀 Starting Competitor SEO Hijacker...');
  
  const generatedUrls = [];
  
  for (const comp of competitors) {
    // Exact competitor match
    generatedUrls.push(`${siteUrl}/${comp}-alternative`);
    
    // Cross multiply
    for (const mod of modifiers) {
      generatedUrls.push(`${siteUrl}/${comp}-${mod}`);
    }
  }
  
  // Remove duplicates
  const uniqueUrls = [...new Set(generatedUrls)];
  
  console.log(`Generated ${uniqueUrls.length} competitor-targeted URLs.`);
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  
  let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const url of uniqueUrls) {
    sitemapXml += `  <url>\n    <loc>${url}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }
  sitemapXml += `</urlset>`;
  
  fs.writeFileSync(path.join(publicDir, 'sitemap-competitors.xml'), sitemapXml);
  console.log('✅ Saved sitemap-competitors.xml successfully!');
  
  // --- GOOGLE INDEXING API PING ---
  const { google } = require('googleapis');
  let auth;
  
  const localKeyPath = path.join(__dirname, '..', 'google-key.json');
  if (fs.existsSync(localKeyPath)) {
    auth = new google.auth.GoogleAuth({
      keyFile: localKeyPath,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      const keys = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: keys.client_email,
          private_key: keys.private_key,
        },
        scopes: ['https://www.googleapis.com/auth/indexing'],
      });
    } catch(e) {
      console.log('Failed to parse Google credentials JSON.');
    }
  }

  if (auth) {
    console.log('🚀 Authenticating with Google Indexing API for competitors...');
    try {
      const client = await auth.getClient();
      const indexing = google.indexing({ version: 'v3', auth: client });
      
      let successCount = 0;
      // Google limits default quotas (200/day). We ping the first 100 per build.
      const urlsToPing = uniqueUrls.slice(0, 100);
      
      for (const url of urlsToPing) {
        try {
          await indexing.urlNotifications.publish({
            requestBody: { url: url, type: 'URL_UPDATED' },
          });
          successCount++;
        } catch (err) {
          // ignore rate limits
        }
        await new Promise(r => setTimeout(r, 100));
      }
      
      console.log(`✅ Successfully blasted ${successCount} competitor URLs to Google Indexing API!`);
    } catch (e) {
      console.error('Failed indexing API:', e.message);
    }
  } else {
    console.log('⚠️ No Google JSON key found. Skipping Indexing API ping.');
  }
}

generateCompetitorPages();
