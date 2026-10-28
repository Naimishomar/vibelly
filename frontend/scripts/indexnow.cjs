const fs = require('fs');
const path = require('path');

// Runs at build time, before the new deploy goes live. Submits to IndexNow only the
// sitemap URLs whose content differs from what is live now (new pages included), so
// unchanged pages are not re-submitted on every build (Bing flags that as "batch mode").
const baseUrl = 'https://vibelly.fun';
const apiKey = '3d8f8a1e2b4c5d9e7f6a8b9c0d1e2f3a';
const distPath = path.join(__dirname, '..', 'dist');
const sitemapPath = path.join(distPath, 'sitemap.xml');

// Compare only what search engines care about: the SEO head block and the page body.
// Script/stylesheet tags are ignored because their hashed filenames change every build.
function fingerprint(html) {
  const head = (html.match(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/) || [''])[0];
  const body = (html.match(/<main>[\s\S]*?<\/main>/) || [''])[0];
  return head + body;
}

function distFile(url) {
  const route = new URL(url).pathname.replace(/^\/+/, '');
  return path.join(distPath, route, 'index.html');
}

async function isChanged(url) {
  const local = fingerprint(fs.readFileSync(distFile(url), 'utf-8'));
  try {
    const res = await fetch(url, { redirect: 'manual' });
    if (res.status !== 200) return true;
    return fingerprint(await res.text()) !== local;
  } catch {
    return false; // can't compare, so don't submit; the sitemap still covers it
  }
}

async function main() {
  if (!fs.existsSync(sitemapPath)) {
    console.log('No sitemap.xml in dist; skipping IndexNow.');
    return;
  }
  const urls = [...fs.readFileSync(sitemapPath, 'utf-8').matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  const flags = await Promise.all(urls.map(isChanged));
  const changed = urls.filter((_, i) => flags[i]);

  if (changed.length === 0) {
    console.log('IndexNow: no page content changed; nothing to submit.');
    return;
  }

  console.log(`IndexNow: submitting ${changed.length} changed URL(s):\n  ${changed.join('\n  ')}`);
  try {
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'vibelly.fun',
        key: apiKey,
        keyLocation: `${baseUrl}/${apiKey}.txt`,
        urlList: changed,
      }),
    });
    console.log(`IndexNow responded HTTP ${res.status}`);
  } catch (e) {
    console.error(`IndexNow request failed: ${e.message}`);
  }
}

main();
