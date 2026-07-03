const fs = require('fs');
const path = require('path');

const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found! Run build first.');
  process.exit(1);
}

let template = fs.readFileSync(indexPath, 'utf-8');

const routes = [
  {
    path: '/pricing',
    title: 'Vibelly Premium | Pricing & Plans',
    description: 'Upgrade to Vibelly Premium to unlock gender filters, location filters, and an ad-free random video chat experience.',
  },
  {
    path: '/contact',
    title: 'Contact Us | Vibelly',
    description: 'Get in touch with the Vibelly team for support, business inquiries, or feedback.',
  },
  {
    path: '/omegle-alternative',
    title: 'The Best Omegle Alternative in 2026 | Vibelly',
    description: 'Since Omegle shut down, Vibelly is the #1 free alternative for random video chat and talking to strangers online.',
  },
  {
    path: '/ometv-alternative',
    title: 'The Best OmeTV Alternative | No Bans, No Logins | Vibelly',
    description: 'Looking for a better OmeTV alternative? Try Vibelly for free, anonymous random video calling with no social login required.',
  },
  {
    path: '/chatroulette-alternative',
    title: 'Chatroulette Alternative | Free Random Video Chat | Vibelly',
    description: 'Vibelly is the modern Chatroulette alternative. Swipe, match, and talk to strangers instantly with high-quality video.',
  },
];

console.log('Generating SEO stubs for core routes...');

for (const route of routes) {
  const routeDir = path.join(distPath, route.path.substring(1));
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }

  let html = template;
  
  // Replace Title
  html = html.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`);
  html = html.replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${route.title}" />`);
  html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${route.title}" />`);
  html = html.replace(/<meta property="twitter:title" content=".*?" \/>/, `<meta property="twitter:title" content="${route.title}" />`);

  // Replace Description
  html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${route.description}" />`);
  html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${route.description}" />`);
  html = html.replace(/<meta property="twitter:description" content=".*?" \/>/, `<meta property="twitter:description" content="${route.description}" />`);

  // Update Canonical URL
  html = html.replace(/<link rel="canonical" href="https:\/\/vibelly\.fun\/" \/>/, `<link rel="canonical" href="https://vibelly.fun${route.path}" />`);
  html = html.replace(/<meta property="og:url" content="https:\/\/vibelly\.fun\/" \/>/, `<meta property="og:url" content="https://vibelly.fun${route.path}" />`);
  html = html.replace(/<meta property="twitter:url" content="https:\/\/vibelly\.fun\/" \/>/, `<meta property="twitter:url" content="https://vibelly.fun${route.path}" />`);

  fs.writeFileSync(path.join(routeDir, 'index.html'), html);
  console.log(`✅ Generated SEO stub for ${route.path}`);
}

console.log('🎉 SEO stubs generation complete!');
