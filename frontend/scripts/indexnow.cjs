const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const baseUrl = 'https://vibelly.fun';
const apiKey = '3d8f8a1e2b4c5d9e7f6a8b9c0d1e2f3a';
const publicDir = path.join(__dirname, '..', 'public');
const MAX_URLS = 10000;

const sitemapFiles = [
  'sitemap-core.xml',
  'sitemap-cities.xml',
  'sitemap-competitors.xml',
  'sitemap-trends.xml',
];

function extractUrls(file) {
  const filePath = path.join(publicDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping missing ${file}`);
    return [];
  }
  const xml = fs.readFileSync(filePath, 'utf-8');
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}

const allUrls = [];
for (const file of sitemapFiles) {
  allUrls.push(...extractUrls(file));
}

const unique = [...new Set(allUrls)];

// Prioritize high-value pages: competitor keywords, core keywords, trends, then everything else.
const highValuePattern =
  /alternative|unbanned|omegle|ometv|chatroulette|random-video-chat|talk-to-strangers|anonymous-chat|chat-with-girls|video-chat-online|chat-room|talk-about|video-chat-about/;
const priority = unique.filter((u) => highValuePattern.test(u));
const rest = unique.filter((u) => !priority.includes(u));

const ordered = [...priority, ...rest].slice(0, MAX_URLS);

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

// ─── Google Indexing API (IndexNow covers Bing/Yahoo/Yandex, this covers Google) ───
function loadServiceAccount() {
  const jsonEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (jsonEnv) return JSON.parse(jsonEnv);
  const fileEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (fileEnv && fs.existsSync(fileEnv)) return JSON.parse(fs.readFileSync(fileEnv, 'utf-8'));
  return null;
}

function base64Url(buf) {
  return Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function makeJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64Url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = base64Url(signer.sign(sa.private_key));
  return `${header}.${claims}.${signature}`;
}

function postJson(url, body, token, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'Content-Length': Buffer.byteLength(payload),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function getGoogleAccessToken(sa) {
  const jwt = makeJwt(sa);
  const res = await postJson(
    'https://oauth2.googleapis.com/token',
    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    null,
    'application/x-www-form-urlencoded'
  );
  if (res.status !== 200) throw new Error(`Token request failed: ${res.status} ${res.body}`);
  return JSON.parse(res.body).access_token;
}

async function googleIndexBatch(urls) {
  const sa = loadServiceAccount();
  if (!sa) {
    console.log('⚠️ No Google service account found. Skipping Google Indexing API ping.');
    return;
  }
  let token;
  try {
    token = await getGoogleAccessToken(sa);
  } catch (e) {
    console.error(`⚠️ Google token error: ${e.message}`);
    return;
  }

  // Google's batch limit is 200 notifications per request
  let sent = 0;
  for (let i = 0; i < urls.length; i += 200) {
    const batch = urls.slice(i, i + 200);
    const body = {
      urlNotificationMetadata: batch.map((u) => ({
        url: u,
        notification: { type: 'URL_UPDATED', url: u, notifyTime: new Date().toISOString() },
      })),
    };
    try {
      const res = await postJson('https://indexing.googleapis.com/v3/urlNotifications:batch', body, token);
      if (res.status === 200) {
        sent += batch.length;
      } else {
        console.error(`⚠️ Google batch failed (HTTP ${res.status}): ${res.body.slice(0, 300)}`);
        break;
      }
    } catch (e) {
      console.error(`⚠️ Google batch request error: ${e.message}`);
      break;
    }
  }
  if (sent > 0) console.log(`✅ Google Indexing API accepted ${sent} URL updates.`);
}

googleIndexBatch(ordered);
