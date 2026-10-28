const fs = require('fs');
const path = require('path');
const https = require('https');

const baseUrl = 'https://vibelly.fun';
const apiKey = '3d8f8a1e2b4c5d9e7f6a8b9c0d1e2f3a';
const sitemapPath = path.join(__dirname, '..', 'dist', 'sitemap.xml');

// Submits exactly the pages scripts/prerender.cjs put in the sitemap.
const ordered = fs.existsSync(sitemapPath)
  ? [...fs.readFileSync(sitemapPath, 'utf-8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])
  : [];

if (ordered.length === 0) {
  console.log('No URLs to submit to IndexNow.');
  process.exit(0);
}

const payload = JSON.stringify({
  host: 'vibelly.fun',
  key: apiKey,
  keyLocation: `${baseUrl}/${apiKey}.txt`,
  urlList: ordered,
});

const options = {
  hostname: 'api.indexnow.org',
  port: 443,
  path: '/IndexNow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  },
};

console.log(`Submitting ${ordered.length} URLs to IndexNow (Bing/Yahoo/Yandex)...`);

const req = https.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log(`SUCCESS! IndexNow API accepted ${ordered.length} URLs. HTTP Status: ${res.statusCode}`);
      console.log('Bing will begin crawling these URLs almost immediately.');
    } else {
      console.error(`FAILED. HTTP Status: ${res.statusCode}`);
      console.error(`Response: ${responseBody}`);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(payload);
req.end();
