const fs = require('fs');
const path = require('path');

// Writes static HTML for every indexable page, plus:
//   dist/app.html  – bare SPA shell for client-only routes (see vercel.json rewrites)
//   dist/404.html  – served by Vercel with a real 404 for any unknown URL
//   dist/sitemap.xml – exactly the pages written here, nothing else
const siteUrl = 'https://vibelly.fun';
const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found! Run build first.');
  process.exit(1);
}

const template = fs.readFileSync(indexPath, 'utf-8');
const SEO_BLOCK = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/;
if (template.includes('id="prerender"')) {
  console.error('dist/index.html is already prerendered; run `vite build` before this script.');
  process.exit(1);
}
if (!SEO_BLOCK.test(template)) {
  console.error('index.html is missing the <!-- seo:start --> / <!-- seo:end --> markers.');
  process.exit(1);
}

const BLOG_POSTS = require('../src/content/blog-posts.json');
const PAGES = require('../src/content/pages.json');

const esc = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const SITE_GRAPH = [
  {
    '@type': 'Organization',
    '@id': `${siteUrl}/#org`,
    name: 'Vibelly',
    url: `${siteUrl}/`,
    logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.jpg`, width: 440, height: 440 },
    email: 'vibellyofficial@gmail.com',
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', email: 'vibellyofficial@gmail.com' },
    sameAs: ['https://instagram.com/vibelly.official'],
    address: { '@type': 'PostalAddress', addressCountry: 'IN' },
    founder: { '@id': `${siteUrl}/about#founder` },
  },
  {
    '@type': 'Person',
    '@id': `${siteUrl}/about#founder`,
    name: PAGES.author.name,
    jobTitle: PAGES.author.role,
    description: PAGES.author.bio,
    url: `${siteUrl}/about`,
  },
  {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: 'Vibelly',
    url: `${siteUrl}/`,
    inLanguage: 'en',
    publisher: { '@id': `${siteUrl}/#org` },
  },
  {
    '@type': 'WebApplication',
    '@id': `${siteUrl}/#app`,
    name: 'Vibelly',
    url: `${siteUrl}/`,
    description: 'Free random video and text chat in the browser for adults 18+. No account needed to start.',
    image: `${siteUrl}/og-image.png`,
    featureList: ['Random video chat (480p)', 'Text chat', 'Gender and country filters (Premium)', '720p HD video (Premium)', 'Voice-only calls (Premium)'],
    isAccessibleForFree: true,
    audience: { '@type': 'PeopleAudience', suggestedMinAge: 18 },
    contentRating: '18+',
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript and WebRTC',
    offers: [
      { '@type': 'Offer', seller: { '@id': `${siteUrl}/#org` }, availability: 'https://schema.org/InStock', url: `${siteUrl}/pricing`, name: 'Free', description: 'Random video (480p) and text chat, free forever', price: '0', priceCurrency: 'INR' },
      { '@type': 'Offer', seller: { '@id': `${siteUrl}/#org` }, availability: 'https://schema.org/InStock', url: `${siteUrl}/pricing`, name: 'Premium (1 day)', description: '24-hour pass, one-time payment, no auto-renewal', eligibleDuration: { '@type': 'QuantitativeValue', value: 1, unitCode: 'DAY' }, price: '9', priceCurrency: 'INR' },
      { '@type': 'Offer', seller: { '@id': `${siteUrl}/#org` }, availability: 'https://schema.org/InStock', url: `${siteUrl}/pricing`, name: 'Premium (30 days)', description: '30 days, one-time payment, no auto-renewal', eligibleDuration: { '@type': 'QuantitativeValue', value: 30, unitCode: 'DAY' }, price: '49', priceCurrency: 'INR' },
      { '@type': 'Offer', seller: { '@id': `${siteUrl}/#org` }, availability: 'https://schema.org/InStock', url: `${siteUrl}/pricing`, name: 'Premium (yearly)', description: '365 days, one-time payment, no auto-renewal', eligibleDuration: { '@type': 'QuantitativeValue', value: 365, unitCode: 'DAY' }, price: '499', priceCurrency: 'INR' },
    ],
    publisher: { '@id': `${siteUrl}/#org` },
  },
];

const HOME = {
  title: 'Vibelly | Free Random Video Chat With Strangers (18+)',
  description:
    'Free random video chat for adults 18+. Meet strangers worldwide over video or text in your browser. A modern Omegle alternative with no sign-up.',
  h1: 'Free Random Video Chat With Strangers',
  lead: 'Talk to strangers online instantly with free random video calls and text chat, right in your browser. No sign-up required. Vibelly is for adults 18+ only.',
  sections: [
    {
      h2: 'How Vibelly works',
      paragraphs: [
        'Press Start Video Call, allow camera and microphone access, confirm you are 18 or older, and you are matched with a random stranger. Skip to someone new at any time.',
      ],
    },
    {
      h2: 'Video and text chat, with voice on Premium',
      bullets: [
        'Free random video chat in any browser, with no app to download',
        'Text chat with strangers when you would rather not be on camera',
        'Voice-only calls plus gender and country filters with Vibelly Premium',
        'Groups and live streams for signed-in members, with paid streams only from verified creators',
      ],
    },
    {
      h2: 'Safety on Vibelly',
      paragraphs: [
        'Vibelly is strictly 18+. Every call has a Report button; reporting requires signing in, reports are reviewed by hand, and signed-in accounts that break the community rules are banned. Only signed-in users can be reported, so skip a guest who breaks the rules. Video and voice calls connect directly between browsers over encrypted WebRTC, and calls are never recorded.',
      ],
    },
  ],
};

// Real React pages that only need correct head tags (their body is rendered by React).
const APP_PAGES = {
  pricing: {
    title: 'Vibelly Premium Pricing: ₹9 a Day, ₹49 a Month, ₹499 a Year',
    description: 'Vibelly Premium adds gender and country filters, 720p HD video, and voice calls. ₹9 for a day, ₹49 for 30 days, or ₹499 a year.',
    h1: 'Vibelly Premium Pricing',
    sections: [
      { h2: 'Free vs Premium at a glance', table: PAGES.pricingTable },
      { h2: 'What do you get for free?', bullets: ['Random video chat at 480p', 'Text chat with strangers', 'Unlimited sessions', 'One-tap reporting (sign-in required), see [Safety & Community Rules](/safety)'] },
      {
        h2: 'What does Premium cost? ₹49 for 30 days or ₹499 for a year',
        bullets: ['Gender filters', 'HD video calls (720p)', 'Random voice calls', 'Country filters'],
      },
      { h2: 'Is there a daily pass? Yes, ₹9', paragraphs: ['Everything in Premium for 24 hours, with no commitment.'] },
      {
        h2: 'How does billing work?',
        paragraphs: [
          'Each purchase is a one-time payment through Razorpay. Plans do not renew automatically: when your time runs out you go back to the free plan. Purchases are non-refundable except where required by law.',
        ],
      },
    ],
    // Shown as questions on the page only; no FAQPage markup (Google retired FAQ rich results).
    faqs: PAGES.pricingFaq.map((f) => ({ q: f.question, a: f.answer })),
  },
  contact: {
    title: 'Contact Us | Vibelly Support',
    description: 'Need help? Email Vibelly support at vibellyofficial@gmail.com for questions, technical issues, abuse reports, or feedback.',
    h1: 'Contact Us',
    sections: [
      {
        h2: 'Email us',
        paragraphs: [
          'Email vibellyofficial@gmail.com for support, feedback, business enquiries, and abuse reports. To report a user, include the time of the call and what happened.',
        ],
      },
      ...PAGES.contact.sections,
    ],
  },
  terms: {
    title: 'Terms of Service & Privacy Policy | Vibelly',
    description: 'Vibelly terms of service and privacy policy: the rules for using Vibelly, Premium purchases, what data we store, and how to delete it.',
    h1: 'Terms of Service & Privacy Policy',
    lead: `Last updated ${PAGES.terms.updated}. ${PAGES.terms.intro}`,
    sections: PAGES.terms.sections,
  },
  about: {
    title: 'About Vibelly: Who Runs It and How It Is Funded',
    description:
      'Vibelly is a free, adults-only random video chat built and run by Naimish Omar. Who runs it, how it is funded, and how we approach safety.',
    h1: 'About Vibelly',
    pageType: 'AboutPage',
    sections: PAGES.about.sections,
  },
  safety: {
    title: 'Safety & Community Rules | Vibelly',
    description:
      'Vibelly is for adults 18+. Read our community rules, how reporting and bans work, and how to stay safe when you talk to strangers.',
    h1: 'Safety & Community Rules',
    lead: `Last updated ${PAGES.safety.updated}`,
    sections: PAGES.safety.sections,
  },
};

// ─── Hand-written pages (mirror the live React pages; slug = URL path) ───
const CORE_COPY = {
  'omegle-alternative': {
    title: 'Omegle Alternative for Adults (18+), No Account Needed | Vibelly',
    description:
      'Looking for an Omegle alternative? Vibelly is free random video and text chat for adults 18+, with no account needed to start chatting.',
    h1: 'Omegle Alternative for Adults, No Account Needed',
    lead: 'Omegle closed in November 2023. Vibelly is a free random video and text chat for adults 18+ that runs in your browser with no account needed to chat. Free video is 480p; Premium adds 720p HD, voice calls, and gender and country filters from ₹9 a day.',
    sections: [
      {
        h2: 'Why Omegle shut down and what replaced it',
        paragraphs: [
          'Omegle was the internet\'s most famous random video chat site for more than a decade, but it went offline in November 2023 after the founder said the platform had become too costly to moderate safely ([Omegle\'s closing letter](https://www.omegle.com/), [Wikipedia](https://en.wikipedia.org/wiki/Omegle)). That left millions of users searching for a working Omegle alternative.',
          'The full story, including what led up to it, is in [What Happened to Omegle?](/blog/what-happened-to-omegle).',
          'Vibelly was built to fill that gap: free random video chat that keeps the simple start-and-match idea of Omegle, but with modern WebRTC video, one-tap reporting (sign-in required), and clear rules on what is and is not stored.',
        ],
      },
      {
        h2: 'What Vibelly offers as an Omegle alternative',
        paragraphs: [
          'A good Omegle alternative should be free, need no account, and act on reports. Here is how Vibelly does it:',
        ],
        bullets: [
          'Free random video chat with no sign-up, no email, and no app to download',
          'Video calls powered by low-latency WebRTC, with voice-only calls on Premium',
          'One-tap reporting (sign-in required), with every report reviewed by hand',
          'No account needed: you choose what to share about yourself',
          'Instant matching on any phone or desktop browser',
        ],
      },
      {
        h2: 'How to start a random video call on Vibelly',
        paragraphs: [
          'Press Start, allow camera and microphone access, and you are matched with a stranger immediately. Skip to a new person anytime. Random chat content is not stored: when one ends, it is gone.',
        ],
      },
    ],
    faqs: [
      { q: 'Is Vibelly a good alternative to Omegle?', a: 'Vibelly offers free random video and text chat in your browser, an 18+ policy, and one-tap reporting (sign-in required), with no account needed to chat. Our blog has a sourced comparison of other options.' },
      { q: 'Do I need to sign up to use Vibelly?', a: 'No account is needed to chat. Just click start and connect with strangers worldwide. Reporting, Premium, and direct messages use a Google or GitHub sign-in.' },
      { q: 'Is Vibelly safe to use?', a: 'Vibelly is 18+ only. Every call has a one-tap Report button (sign-in required), every report is reviewed by hand, signed-in accounts that break the rules are banned, and random chat content is not stored. Guests cannot be reported, so skip a guest who breaks the rules.' },
      { q: 'Can I use Vibelly on my phone?', a: 'Yes. Vibelly works in any modern mobile browser, on iPhone or Android, with no app to download.' },
    ],
  },
  'ometv-alternative': {
    title: 'OmeTV Alternative: Random Video Chat With No Account | Vibelly',
    description:
      'Looking for an OmeTV alternative? Vibelly is free, adults-only random video chat with no account, email, or social login needed to start.',
    h1: 'OmeTV Alternative: Random Video Chat With No Account Needed',
    lead: 'Vibelly is a free OmeTV alternative for adults 18+: random video and text chat in your browser, with no email, phone number, or account needed to start. Signed-in users can report other signed-in users in one tap, and Premium adds filters, 720p HD, and voice calls.',
    sections: [
      {
        h2: 'Why people look for an OmeTV alternative',
        paragraphs: [
          'OmeTV is one of the most popular random video chat apps. If you want an alternative where you can start without any account, inside an adults-only community where reports are reviewed by hand, Vibelly is built for exactly that.',
          'Vibelly asks for no email, no phone number, and no social media account before you chat.',
        ],
      },
      {
        h2: 'What Vibelly offers',
        paragraphs: ['Here is what you get with Vibelly:'],
        bullets: [
          'No account, email, or social login needed to start chatting',
          'Skip to the next stranger as often as you like: skipping is never penalised',
          'Free video chat with no pay-to-talk walls on the core experience',
          'Optional gender and country filters with Vibelly Premium',
        ],
      },
      {
        h2: 'How to use Vibelly without logging in',
        paragraphs: [
          'Open the site in any browser, choose video or text, and press start. You are matched with a stranger in seconds, with no email, phone number, or social account.',
          'Calls run over encrypted WebRTC streams directly between browsers, so media is encrypted in transit and latency stays low. Calls are never recorded, and random chat messages are not kept after the call ends.',
        ],
      },
    ],
    faqs: [
      { q: 'How is Vibelly different from OmeTV?', a: 'Vibelly needs no account or social login to start chatting, is strictly 18+, and every call has a one-tap Report button (sign-in required) reviewed by hand. For a sourced, side-by-side look at OmeTV and others, read our Omegle alternatives comparison on the blog.' },
      { q: 'Do I need a Facebook account to use Vibelly?', a: 'No. Random chats need no account at all. Reporting, Premium, and direct messages use a Google or GitHub sign-in.' },
      { q: 'Is the video quality good?', a: 'Free calls run at 480p, and Premium unlocks 720p HD. Video adapts automatically to your connection.' },
      { q: 'Is Vibelly free to use?', a: 'Yes, the core random video chat experience is completely free for everyone.' },
    ],
  },
  'random-video-chat': {
    title: 'What Is Random Video Chat? How It Works and Staying Safe | Vibelly',
    description:
      'What random video chat is, how matching and WebRTC calls work, what is stored, and how to stay safe. A guide for adults 18+.',
    h1: 'What Is Random Video Chat?',
    lead: 'Random video chat pairs you with a stranger for a live one-to-one call. This guide explains how it works on Vibelly, what is and is not stored, and how to stay safe. Vibelly is free for adults 18+, runs in your browser, and needs no account to chat.',
    sections: [
      {
        h2: 'What is random video chat?',
        paragraphs: [
          'Random video chat connects you over video with a stranger you have never met — no friend list, no algorithm-curated feed, no profile. You press a button and are matched instantly.',
          'The concept was made famous by [Omegle](https://en.wikipedia.org/wiki/Omegle) and [Chatroulette](https://en.wikipedia.org/wiki/Chatroulette). Vibelly keeps that excitement and rebuilds the technology: modern WebRTC video, one-tap reporting (sign-in required), and matching in seconds.',
        ],
      },
      {
        h2: 'Why try random video chat with strangers',
        bullets: [
          'Meet people you would never cross paths with in real life',
          'Practice a new language with native speakers around the world',
          'Fight boredom with unpredictable, genuine conversations',
          'Share only what you are comfortable sharing, and keep personal details private',
        ],
        paragraphs: [
          'Random video chat on Vibelly is free, works in any browser, and needs no account.',
        ],
      },
      {
        h2: 'How to stay safe during random video chat',
        paragraphs: [
          'Every call has a one-tap Report button (sign-in required), and every report is reviewed by hand. Only signed-in users can be reported, so skip a guest who breaks the rules. Random chat content is not stored: when you skip or end a call, the conversation is gone.',
          'Never share personal financial information, keep your location vague, and trust your instincts. Skipping to a new person is always one click away.',
        ],
      },
    ],
    faqs: [
      { q: 'Do I need to sign up?', a: 'No account is needed to start a random video chat. Reporting, Premium, and direct messages use a Google or GitHub sign-in.' },
      { q: 'Is it safe to use?', a: 'Vibelly is 18+ only, every call has a one-tap Report button (sign-in required) reviewed by hand, and random chat content is not stored. Only signed-in users can be reported, so skip a guest who breaks the rules.' },
      { q: 'Can I use it on my phone?', a: 'Yes. Vibelly works in any modern mobile browser, on iPhone or Android, with no app to download.' },
      { q: 'Is random video chat really free?', a: 'Yes. Core random video chat is completely free with no time limits or hidden charges.' },
    ],
  },
  'chatroulette-alternative': {
    title: 'Chatroulette Alternative for Adults (18+) | Vibelly',
    description:
      'Looking for a Chatroulette alternative? Vibelly offers free random video and text chat for adults 18+, with no account needed to start.',
    h1: 'The Modern Chatroulette Alternative',
    lead: 'Vibelly is a free Chatroulette alternative for adults 18+. Random video (480p) and text chat run in your browser with no account needed, every call has a Report button for signed-in users, and Premium adds country and gender filters, 720p HD, and voice calls.',
    sections: [
      {
        h2: 'Why try Vibelly instead of Chatroulette',
        paragraphs: [
          'Vibelly is built on modern WebRTC for fast, direct video connections, with an 18+ policy and one-tap reporting (sign-in required) reviewed by hand.',
        ],
      },
      {
        h2: 'What you get on Vibelly',
        bullets: [
          'Instant random video matching',
          'Text chat mode, plus voice-only calls on Premium',
          'One-tap reporting (sign-in required) reviewed by hand',
          'Free video and text chat with no account required',
        ],
        paragraphs: [
          'Whether you want to talk to strangers over video or text, Vibelly gives you a clean, modern random chat experience.',
        ],
      },
    ],
    faqs: [
      { q: 'Is Vibelly a good Chatroulette alternative?', a: 'Yes. Vibelly offers instant matching, WebRTC video, and a modern interface, as an independent alternative to Chatroulette.' },
      { q: 'How does Vibelly handle bad behavior?', a: 'Every call has a one-tap Report button (sign-in required). Reports are reviewed by hand, and signed-in accounts that break the rules are banned. Only signed-in users can be reported, so skip a guest who breaks the rules.' },
      { q: 'Do I need to download an app?', a: 'No. Vibelly works right in your browser on desktop and mobile.' },
    ],
  },
  'talk-to-strangers': {
    title: 'How to Talk to Strangers Online (18+) | Vibelly',
    description:
      'How to talk to strangers online: conversation starters that work, when to skip or report, and free random video chat for adults 18+.',
    h1: 'How to Talk to Strangers Online',
    lead: 'Conversation starters that work, when to skip or report, and why people do it. When you are ready to try, Vibelly is free random video and text chat for adults 18+, with no app and no account needed.',
    // Tips come first from the talk-to-strangers block in src/content/pages.json.
    sections: [],
    faqs: [
      { q: 'Is talking to strangers online safe?', a: 'Vibelly is 18+ only. Signed-in users can report other signed-in users in one tap, reports are reviewed by hand, and random chat content is not stored. Never share personal details with strangers.' },
      { q: 'Do I need to sign up?', a: 'No. You can talk to strangers instantly with no account and no email.' },
    ],
  },
  'anonymous-chat': {
    title: 'Anonymous Chat With No Account | Vibelly',
    description:
      'Looking for an anonymous chat website? Vibelly offers free random video and text chat with no account, email, or phone number needed.',
    h1: 'Anonymous Chat Without an Account',
    lead: 'Vibelly lets adults 18+ chat with strangers over video or text without an account, email address, or phone number. This page explains exactly what anonymous means here, including what the other person can see and what Vibelly stores.',
    sections: [
      {
        h2: 'Anonymous chat on Vibelly',
        bullets: [
          'No social login needed to chat, and calls are never recorded',
          'One-tap reporting (sign-in required) to flag rule-breakers',
          'Video and text chat, plus voice calls on Premium',
          'Encrypted WebRTC connections',
        ],
        paragraphs: [
          'You decide what to share about yourself, and can skip to a new stranger with a single click.',
        ],
      },
    ],
    faqs: [
      { q: 'Is Vibelly anonymous?', a: 'You do not need an account to chat, and random chat messages are not kept after a call ends. As with any peer-to-peer video call, the other person can see your IP address, which can reveal your approximate location.' },
      { q: 'Is anonymous chat safe?', a: 'Vibelly is 18+ only, every call has a one-tap Report button (sign-in required), and random chat content is not stored. Only signed-in users can be reported, so skip a guest who breaks the rules. Never share personal details with strangers.' },
    ],
  },
};

// ─── HTML generation ───
const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

function headBlock({ title, description, url, robots = INDEX_ROBOTS, graph = [] }) {
  if (url && (!description || description.length < 50 || description.length > 155)) {
    throw new Error(`Meta description for ${url} is ${description ? description.length : 0} chars; keep it 50-155.`);
  }
  const tags = [`<title data-ssr>${esc(title)}</title>`];
  if (description) tags.push(`<meta data-ssr name="description" content="${esc(description)}" />`);
  tags.push(`<meta data-ssr name="robots" content="${robots}" />`);
  if (url) {
    tags.push(
      `<link data-ssr rel="canonical" href="${url}" />`,
      '<meta data-ssr property="og:type" content="website" />',
      `<meta data-ssr property="og:url" content="${url}" />`,
      `<meta data-ssr property="og:title" content="${esc(title)}" />`,
      `<meta data-ssr property="og:description" content="${esc(description)}" />`,
      `<meta data-ssr property="og:image" content="${siteUrl}/og-image.png" />`,
      `<meta data-ssr property="twitter:title" content="${esc(title)}" />`,
      `<meta data-ssr property="twitter:description" content="${esc(description)}" />`,
      `<meta data-ssr property="twitter:image" content="${siteUrl}/og-image.png" />`
    );
  }
  if (graph.length) {
    // `<` escaped so page copy can never close the script tag
    const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
    tags.push(`<script data-ssr type="application/ld+json">${json}</script>`);
  }
  return `<!-- seo:start -->\n    ${tags.join('\n    ')}\n    <!-- seo:end -->`;
}

function pageGraph(slug, title, description, faqs, crumbs = [], pageType = 'WebPage') {
  const url = `${siteUrl}/${slug}`;
  const graph = [
    ...SITE_GRAPH,
    {
      '@type': pageType,
      '@id': `${url}#webpage`,
      url,
      name: title.split(' | ')[0],
      description,
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': `${siteUrl}/#app` },
      breadcrumb: { '@id': `${url}#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
        ...crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 2, name, item })),
        { '@type': 'ListItem', position: crumbs.length + 2, name: title.split(' | ')[0], item: url },
      ],
    },
  ];
  if (faqs && faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    });
  }
  return graph;
}

const NAV_LINKS = [
  ['/', 'Vibelly: free random video chat'],
  ...Object.entries(CORE_COPY).map(([slug, c]) => [`/${slug}`, c.h1]),
  ['/safety', 'Safety & Community Rules'],
  ['/about', 'About Vibelly'],
  ['/pricing', 'Vibelly Premium pricing'],
  ['/contact', 'Contact Vibelly'],
  ['/terms', 'Terms & Privacy Policy'],
  ...BLOG_POSTS.map((p) => [`/blog/${p.slug}`, p.title]),
  ['/blog', 'Vibelly Blog: tips & guides'],
];

// Same inline subset as src/components/Inline.tsx: **bold** and [text](url).
const inline = (t) =>
  esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) =>
      href.startsWith('/') ? `<a href="${href}">${text}</a>` : `<a href="${href}" rel="noopener">${text}</a>`
    );

// First row is the header, as in the React <Table>.
const tableHtml = ([head, ...body]) =>
  `      <div style="overflow-x:auto"><table>\n        <thead><tr>${head.map((h) => `<th scope="col">${inline(h)}</th>`).join('')}</tr></thead>\n        <tbody>\n${body
    .map((r) => `          <tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
    .join('\n')}\n        </tbody>\n      </table></div>`;

const START_LINK = `      <p class="mb-10"><a href="/setup/video" class="inline-flex px-8 py-4 rounded-xl bg-white text-black font-semibold">Start Video Chat (18+)</a></p>\n`;

function buildBody({ h1, lead, sections = [], faqs = [] }, selfPath) {
  const sectionsHtml = sections
    .map((section) => {
      const parts = [];
      if (section.h2) parts.push(`      <h2>${esc(section.h2)}</h2>`);
      if (section.table) parts.push(tableHtml(section.table));
      for (const p of section.paragraphs || []) parts.push(`      <p>${inline(p)}</p>`);
      if (section.bullets && section.bullets.length) {
        parts.push(`      <ul>\n${section.bullets.map((b) => `        <li>${inline(b)}</li>`).join('\n')}\n      </ul>`);
      }
      return parts.join('\n');
    })
    .join('\n');

  const faqHtml = faqs.length
    ? `\n      <h2>Frequently Asked Questions</h2>\n${faqs
        .map((faq) => `      <details>\n        <summary>${esc(faq.q)}</summary>\n        <p>${esc(faq.a)}</p>\n      </details>`)
        .join('\n')}`
    : '';

  const linkHtml = NAV_LINKS.filter(([href]) => href !== selfPath)
    .map(([href, text]) => `        <li><a href="${href}">${esc(text)}</a></li>`)
    .join('\n');

  // The h1 uses the same size classes as the React hero, so React's re-render on mount is
  // not a larger paint and LCP is recorded at first paint instead of after the JS loads.
  // Prerendered markup lives beside #root, not inside it: React mounts into the empty #root
  // and SEO.tsx removes #prerender just before the real page paints (no spinner in between).
  return `<div id="prerender" data-path="${selfPath || ''}" class="min-h-screen bg-[#15171B] text-white">
    <main class="px-6 py-10 max-w-4xl mx-auto">
      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.1] mb-4" style="font-family: 'Playfair Display', Georgia, serif">${esc(h1)}</h1>
${lead ? `      <p class="text-base sm:text-lg text-zinc-400 mb-6">${esc(lead)}</p>\n` : ''}${selfPath ? START_LINK : ''}${sectionsHtml}${faqHtml}${selfPath && faqs.length ? `\n${START_LINK.trimEnd()}` : ''}
      <h2>Explore Vibelly</h2>
      <nav>
        <ul>
${linkHtml}
        </ul>
      </nav>
    </main>
  </div>
    <div id="root"></div>`;
}

// Same markdown subset BlogPost.tsx renders: ##, ###, "- " lists, "| a | b |" tables, **bold**, links, paragraphs.
function markdownToHtml(md) {
  const out = [];
  let list = [];
  let table = [];
  const flush = () => {
    if (list.length) out.push(`      <ul>\n${list.map((li) => `        <li class="ml-6 list-disc mb-2 text-zinc-300">${inline(li)}</li>`).join('\n')}\n      </ul>`);
    if (table.length) out.push(tableHtml(table));
    list = [];
    table = [];
  };
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('- ')) { list.push(line.slice(2)); continue; }
    if (line.startsWith('|')) {
      const cells = line.slice(1, -1).split('|').map((c) => c.trim());
      if (!cells.every((c) => /^-+$/.test(c))) table.push(cells);
      continue;
    }
    flush();
    if (!line) continue;
    if (line.startsWith('### ')) out.push(`      <h3>${inline(line.slice(4))}</h3>`);
    else if (line.startsWith('## ')) out.push(`      <h2>${inline(line.slice(3))}</h2>`);
    else out.push(`      <p class="mb-5 leading-relaxed text-zinc-400 text-lg">${inline(line)}</p>`);
  }
  flush();
  return out.join('\n');
}

function render(head, body) {
  let html = template.replace(SEO_BLOCK, head);
  if (body) html = html.replace('<div id="root"></div>', body);
  return html;
}

function write(relPath, html) {
  const file = path.join(distPath, relPath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

// ─── Write all pages ───
const sitemapPaths = [];
// Real content dates only (blog posts, Safety, Terms); other pages carry no <lastmod>.
const lastmod = { '/safety': PAGES.safety.updated, '/terms': PAGES.terms.updated, '/pricing': PAGES.pricingUpdated };

// Shells first: both are built from the untouched template.
write('app.html', render(headBlock({ title: 'Vibelly', robots: 'noindex, follow' })));
write(
  '404.html',
  render(headBlock({ title: 'Page not found | Vibelly', robots: 'noindex, follow' }), buildBody({ h1: 'Page not found', lead: 'This page does not exist.' }, null))
);

// Homepage FAQ is shared with the React page (src/content/pages.json).
const HOME_FAQS = PAGES.homeFaqs.map((f) => ({ q: f.question, a: f.answer }));
write(
  'index.html',
  render(
    headBlock({
      title: HOME.title,
      description: HOME.description,
      url: `${siteUrl}/`,
      graph: [
        ...SITE_GRAPH,
        {
          '@type': 'FAQPage',
          mainEntity: HOME_FAQS.map((faq) => ({
            '@type': 'Question',
            name: faq.q,
            acceptedAnswer: { '@type': 'Answer', text: faq.a },
          })),
        },
      ],
    }),
    buildBody({ ...HOME, faqs: HOME_FAQS }, '/')
  )
);
sitemapPaths.push('/');

for (const [slug, core] of Object.entries(CORE_COPY)) {
  const url = `${siteUrl}/${slug}`;
  const block = PAGES.keywordBlocks[slug];
  const page = {
    h1: core.h1,
    lead: block ? `Updated ${block.updated}. ${core.lead}` : core.lead,
    sections: block ? [...core.sections, ...block.sections] : core.sections,
    faqs: core.faqs,
  };
  const graph = pageGraph(slug, core.title, core.description, core.faqs);
  if (block) graph.find((n) => n['@id'] === `${url}#webpage`).dateModified = block.updated;
  write(
    `${slug}/index.html`,
    render(headBlock({ title: core.title, description: core.description, url, graph }), buildBody(page, `/${slug}`))
  );
  sitemapPaths.push(`/${slug}`);
  if (block) lastmod[`/${slug}`] = block.updated;
}

for (const [slug, page] of Object.entries(APP_PAGES)) {
  const url = `${siteUrl}/${slug}`;
  const graph = pageGraph(slug, page.title, page.description, null, [], page.pageType);
  if (lastmod[`/${slug}`]) graph.find((n) => n['@id'] === `${url}#webpage`).dateModified = lastmod[`/${slug}`];
  write(
    `${slug}/index.html`,
    render(
      headBlock({ title: page.title, description: page.description, url, graph }),
      buildBody({ h1: page.h1, lead: page.lead || page.description, sections: page.sections, faqs: page.faqs }, `/${slug}`)
    )
  );
  sitemapPaths.push(`/${slug}`);
}

// ─── Blog ───
{
  const title = 'Vibelly Blog | Random Video Chat Tips & Guides';
  const description = 'Tips, guides, and safety advice for random video chat, talking to strangers, and choosing an Omegle alternative.';
  const list = BLOG_POSTS.map(
    (p) => `        <li><a href="/blog/${p.slug}">${esc(p.title)}</a> - ${esc(p.description)}</li>`
  ).join('\n');
  const body = buildBody({ h1: 'The Vibelly Blog', lead: description }, '/blog').replace(
    '      <h2>Explore Vibelly</h2>',
    `      <ul>\n${list}\n      </ul>\n      <h2>Explore Vibelly</h2>`
  );
  write('blog/index.html', render(headBlock({ title, description, url: `${siteUrl}/blog`, graph: pageGraph('blog', title, description) }), body));
  sitemapPaths.push('/blog');
  lastmod['/blog'] = BLOG_POSTS.map((p) => p.updated || p.date).sort().pop();
}

for (const post of BLOG_POSTS) {
  const slug = `blog/${post.slug}`;
  const url = `${siteUrl}/${slug}`;
  const title = post.title;
  const graph = pageGraph(slug, title, post.description, null, [['Blog', `${siteUrl}/blog`]]);
  graph.find((n) => n['@id'] === `${url}#webpage`).mainEntity = { '@id': `${url}#article` };
  graph.push({
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    url,
    wordCount: post.content.split(/\s+/).filter(Boolean).length,
    headline: post.title,
    description: post.description,
    inLanguage: 'en',
    image: { '@type': 'ImageObject', url: `${siteUrl}/og-image.png`, width: 1200, height: 630 },
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { '@id': `${siteUrl}/about#founder` },
    publisher: { '@id': `${siteUrl}/#org` },
    mainEntityOfPage: { '@id': `${url}#webpage` },
  });
  const authorBox = `      <aside>\n        <p><strong>${esc(PAGES.author.name)}</strong>, ${esc(PAGES.author.role)}</p>\n        <p>${esc(PAGES.author.bio)} <a href="/about">About Vibelly</a></p>\n      </aside>`;
  const body = buildBody({ h1: post.title, lead: `${post.date} · By ${post.author}` }, `/${slug}`).replace(
    '      <h2>Explore Vibelly</h2>',
    `${markdownToHtml(post.content)}\n${authorBox}\n      <h2>Explore Vibelly</h2>`
  );
  write(`${slug}/index.html`, render(headBlock({ title, description: post.description, url, graph }), body));
  sitemapPaths.push(`/${slug}`);
  lastmod[`/${slug}`] = post.updated || post.date;
}

// <lastmod> only where we have a real modified date; fake ones teach Google to ignore the field.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths
  .map((p) => `  <url><loc>${siteUrl}${p}</loc>${lastmod[p] ? `<lastmod>${lastmod[p]}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>
`;
write('sitemap.xml', sitemap);

console.log(`✅ Prerendered ${sitemapPaths.length} pages + app.html + 404.html, sitemap.xml written.`);
