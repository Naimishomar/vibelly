const fs = require('fs');
const path = require('path');
const https = require('https');

const baseUrl = 'https://vibelly.fun';
const apiKey = '3d8f8a1e2b4c5d9e7f6a8b9c0d1e2f3a';

// Build the array of all URLs
const keywords = ['omegle-alternative', 'random-video-chat', 'talk-to-strangers', 'anonymous-chat'];
const cities = ["new-york", "los-angeles", "london", "sydney", "tokyo", "mumbai"];
const urlsToPing = [];
for (const kw of keywords) {
  urlsToPing.push(`${baseUrl}/${kw}`);
  for (const city of cities) {
    urlsToPing.push(`${baseUrl}/${kw}-in-${city}`);
  }
}
urlsToPing.push(`${baseUrl}/`);
urlsToPing.push(`${baseUrl}/omegle-alternative`);
urlsToPing.push(`${baseUrl}/ometv-alternative`);

const payload = JSON.stringify({
  host: 'vibelly.fun',
  key: apiKey,
  keyLocation: `https://vibelly.fun/${apiKey}.txt`,
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
