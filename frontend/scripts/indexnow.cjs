const fs = require('fs');
const path = require('path');
const https = require('https');

const seoDataPath = path.join(__dirname, '..', 'src', 'data', 'seoPages.json');
const seoData = JSON.parse(fs.readFileSync(seoDataPath, 'utf8'));
const slugs = Object.keys(seoData);

const baseUrl = 'https://vibelly.vercel.app';
const apiKey = '3d8f8a1e2b4c5d9e7f6a8b9c0d1e2f3a';

// Build the array of all URLs
const urlsToPing = slugs.map(s => `${baseUrl}/${s}`);
urlsToPing.push(`${baseUrl}/`);
urlsToPing.push(`${baseUrl}/omegle-alternative`);
urlsToPing.push(`${baseUrl}/ometv-alternative`);

const payload = JSON.stringify({
  host: 'vibelly.vercel.app',
  key: apiKey,
  keyLocation: `https://vibelly.vercel.app/${apiKey}.txt`,
  urlList: urlsToPing
});

const options = {
  hostname: 'api.indexnow.org',
  port: 443,
  path: '/IndexNow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log(`Submitting ${urlsToPing.length} URLs to IndexNow (Bing/Yahoo/Yandex)...`);

const req = https.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log(`SUCCESS! IndexNow API accepted ${urlsToPing.length} URLs. HTTP Status: ${res.statusCode}`);
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
