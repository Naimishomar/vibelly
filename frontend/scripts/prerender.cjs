const fs = require('fs');
const path = require('path');

const siteUrl = 'https://vibelly.fun';
const distPath = path.resolve(__dirname, '../dist');
const publicDir = path.resolve(__dirname, '../public');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found! Run build first.');
  process.exit(1);
}

const template = fs.readFileSync(indexPath, 'utf-8');

// ─── Deterministic PRNG so every page gets stable, unique content ───
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

const esc = (str) =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const titleCase = (words) =>
  words.map((w) => (w === 'in' ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');

// ─── Data sources ───
const keywords = [
  'omegle-alternative', 'random-video-chat', 'talk-to-strangers', 'anonymous-chat',
  'video-chat-with-girls', 'free-cam-chat', 'stranger-cam', 'chat-roulette-free',
  'omegle-unbanned', 'video-call-app', 'chat-with-strangers-online', 'random-cam',
  'free-video-chat-rooms', 'meet-new-people', 'stranger-video-call', 'live-video-chat',
  'cam-to-cam-chat', 'anonymous-video-chat', 'chat-random', 'omegle-app',
];

const cities = [
  'new-york', 'los-angeles', 'chicago', 'houston', 'miami', 'san-francisco',
  'seattle', 'boston', 'austin', 'denver', 'las-vegas', 'atlanta',
  'london', 'manchester', 'birmingham', 'paris', 'berlin', 'madrid',
  'toronto', 'vancouver', 'montreal', 'sydney', 'melbourne', 'brisbane',
  'tokyo', 'osaka', 'mumbai', 'delhi', 'bangalore', 'hyderabad',
  'dubai', 'singapore', 'bangkok', 'kuala-lumpur', 'jakarta', 'manila',
  'sao-paulo', 'mexico-city', 'buenos-aires', 'nairobi', 'lagos', 'cairo',
];

const competitors = [
  'omegle', 'ometv', 'chatroulette', 'monkey-app', 'emerald-chat',
  'bazoocam', 'chatrandom', 'camsurf', 'coomeet', 'tinychat',
  'shagle', 'chathub', 'camfrog', 'joingy', 'flingster',
];

const competitorModifiers = [
  'alternative', 'alternative-free', 'alternative-no-login', 'alternative-for-girls',
  'unbanned', 'app', 'app-download', 'website-like', 'better-than', 'for-mobile',
];

// Real React app routes that serve their own SPA + Helmet SEO (skip prerendering)
const APP_ROUTE_SKIP = new Set([
  '', 'pricing', 'contact', 'terms', 'blog', 'chat', 'groups', 'setup', 'call', 'mcp', 'admin', 'oauth-callback',
]);

// ─── Page discovery ───
function extractSitemapUrls() {
  const sitemapFiles = ['sitemap-core.xml', 'sitemap-cities.xml', 'sitemap-competitors.xml', 'sitemap-trends.xml'];
  const urls = [];
  for (const file of sitemapFiles) {
    const filePath = path.join(publicDir, file);
    if (!fs.existsSync(filePath)) continue;
    const xml = fs.readFileSync(filePath, 'utf-8');
    for (const m of xml.matchAll(/<loc>(.*?)<\/loc>/g)) {
      const raw = m[1];
      if (!raw || raw === `${siteUrl}/`) continue;
      urls.push(raw.replace(siteUrl, '').replace(/^\/+/, ''));
    }
  }
  return [...new Set(urls)];
}

function fallbackPages() {
  const pages = [];
  for (const kw of keywords) pages.push({ slug: kw });
  for (const kw of keywords) {
    for (const city of cities) pages.push({ slug: `${kw}-in-${city}`, city });
  }
  for (const comp of competitors) {
    pages.push({ slug: `${comp}-alternative` });
    for (const mod of competitorModifiers) pages.push({ slug: `${comp}-${mod}` });
  }
  for (const trendPath of extractTrendUrls()) {
    pages.push({ slug: trendPath.replace(/^\/+/, '') });
  }
  return pages;
}

function buildPages() {
  const fromSitemaps = extractSitemapUrls();
  const sources = fromSitemaps.length > 0 ? fromSitemaps : fallbackPages().map((p) => p.slug);

  const pages = [];
  for (const slug of sources) {
    if (APP_ROUTE_SKIP.has(slug)) continue;
    const cityMatch = slug.match(/-in-([a-z-]+)$/);
    pages.push({ slug, city: cityMatch ? cityMatch[1] : undefined });
  }

  const seen = new Set();
  return pages.filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });
}

// ─── Content generation ───
const features = [
  '100% free with no sign-up, no email, and no app to download',
  'HD video and crisp voice powered by low-latency WebRTC',
  'fully anonymous — your identity stays private until you choose to share it',
  'AI moderation plus one-tap reporting to keep every room safe',
  'instant skip that re-queues both people in under a second',
  'works beautifully on mobile, tablet, and desktop browsers',
  'connections with strangers from 190+ countries around the world',
  'encrypted, ephemeral conversations that leave no trace',
  'gender and country filters available with Vibelly Premium',
  'a clean, modern interface with no intrusive ads or pop-ups',
];

function analyzeSlug(slug, city) {
  const words = slug.split('-');
  const compWord = competitors.find((c) => slug.includes(c));
  const isCity = Boolean(city);
  const isCompetitor = Boolean(compWord);

  const cityWords = city ? new Set(city.split('-')) : new Set();
  const cleanWords = words.filter((w) => w !== 'in' && !cityWords.has(w));
  const phrase = titleCase(cleanWords);

  let comp = null;
  if (isCompetitor) {
    comp = titleCase(compWord.split('-'));
  }

  return { words, phrase, isCity, isCompetitor, comp, compWord, cityName: city ? titleCase(city.split('-')) : null };
}

function buildDescription(info) {
  const where = info.cityName ? ` in ${info.cityName}` : '';
  return `Looking for ${info.phrase}${where}? Vibelly is the free, anonymous alternative to Omegle and OmeTV. Start ${info.phrase.toLowerCase()}${where} instantly with HD video and no sign-up.`;
}

function buildTitle(info) {
  const where = info.cityName ? ` in ${info.cityName}` : '';
  return `${info.phrase}${where} | Free Random Video Chat & Stranger Chat | Vibelly`;
}

function makeContent(info, rng) {
  const { phrase, cityName } = info;
  const where = cityName ? ` in ${cityName}` : '';
  const low = phrase.toLowerCase();

  const f = () => pick(rng, features);
  const fSet = (n) => {
    const set = new Set();
    while (set.size < n) set.add(pick(rng, features));
    return [...set];
  };
  const fList = (n, joiner = ', ') => fSet(n).join(joiner);

  const openers = info.isCompetitor
    ? [
        `Since Omegle shut down, ${low}${where} has been broken, buggy, or full of bots. Vibelly fixed all of it.`,
        `If you are tired of ${low}${where} that demands logins or leaves you staring at a loading spinner, Vibelly is the upgrade you have been waiting for.`,
        `${phrase}${where} should feel instant and safe — Vibelly is exactly that.`,
      ]
    : [
        `Looking for ${low}${where}? Vibelly is the modern home of ${low}.`,
        `${phrase}${where} should feel instant, anonymous, and genuinely fun — that is exactly what Vibelly delivers.`,
        `Whether you are at home or out in the world, ${low}${where} on Vibelly connects you with strangers in seconds.`,
      ];

  if (info.isCompetitor && info.comp) {
    openers.push(
      `${info.comp} has its share of problems — bans, bots, and paywalls. Vibelly is the ${info.comp} alternative built to solve every one of them.`
    );
  }

  const opener = pick(rng, openers);

  const citySentence = cityName
    ? ` From ${cityName} to the rest of the planet, the queue is always moving.`
    : '';

  const lead = `${opener} You will find ${f()}${citySentence}`;

  const sectionWhy = [
    `Vibelly was rebuilt from the ground up to make ${low} effortless. The experience is built on ${fList(3)}.`,
    `Most platforms that claim to offer ${low} bury you behind logins, paywalls, and pop-ups. Vibelly does the opposite: ${f()}. Everything is one click away.`,
  ];

  const sectionHow = [
    `Getting started with ${low} takes exactly one click. Open the site, press Start, and you are matched with a stranger in under a second. No setup wizard, no profile to fill in, no waiting list.`,
    `There is nothing to install and nothing to configure. ${fList(2)}. You can switch between video, voice, and text chat without leaving the page.`,
  ];

  const sectionSafe = [
    `Safety is the number one concern with ${low}, and it is the reason Vibelly is built the way it is. Every room is protected by ${fList(2, ' and ')}.`,
    `If you ever feel uncomfortable, skip to the next person or tap Report — ${f()}. Our moderation team reviews flags around the clock so the community stays friendly.`,
  ];

  const sectionStart = [
    `Ready to try ${low}? ${f()}. The next stranger is one click away${cityName ? ` — and yes, there are plenty of people in ${cityName} waiting too` : ''}.`,
  ];

  const paragraphs = [lead, ...sectionWhy, ...sectionHow, ...sectionSafe, ...sectionStart];

  const faqs = [
    {
      q: `Is ${low} on Vibelly really free?`,
      a: `Yes. ${phrase}${where} on Vibelly is completely free — no credit card, no sign-up, and no hidden fees. Premium upgrades are optional and never required to chat.`,
    },
    {
      q: `Do I need to download an app for ${low}?`,
      a: `No. ${phrase}${where} works directly in any modern browser on mobile and desktop, so there is nothing to install.`,
    },
    {
      q: `Is ${low} on Vibelly anonymous and safe?`,
      a: `Yes. Your identity stays private, conversations are ephemeral, and ${fList(2, ' plus ')} keep ${low} rooms clean and safe.`,
    },
    {
      q: `Can I use ${low}${where} right now?`,
      a: `Absolutely. Vibelly matches you with a stranger in under a second, and you can even filter by country or gender with Premium.`,
    },
  ];

  return { paragraphs, faqs };
}

function relatedLinks(slug, rng) {
  const pool = [
    ...keywords.map((k) => `/${k}`),
    ...competitors.map((c) => `/${c}-alternative`),
    '/omegle-unbanned',
    '/video-chat-online',
    '/chat-with-girls',
    '/talk-to-strangers',
    ...keywords.slice(0, 6).map((k) => `/${k}-in-${pick(rng, cities)}`),
  ];
  const seen = new Set([`/${slug}`]);
  const links = [];
  while (links.length < 8) {
    const link = pick(rng, pool);
    if (seen.has(link)) continue;
    seen.add(link);
    links.push(link);
  }
  return links;
}

// ─── Hand-crafted flagship copy (mirrors the live React pages for top keywords) ───
const CORE_COPY = {
  'omegle-alternative': {
    title: 'The Best Free Omegle Alternative in 2026 | Vibelly',
    description:
      'Looking for an Omegle alternative? Vibelly is the best free random video call app. Meet strangers instantly with HD video, voice chat, and strict safety measures.',
    h1: 'The Best Free Omegle Alternative',
    lead: "Omegle shut down, but the need to talk to strangers didn't. Vibelly is the safest, fastest, and most aesthetic free Omegle alternative on the internet.",
    sections: [
      {
        h2: 'Why Omegle shut down and what replaced it',
        paragraphs: [
          'Omegle was the internet\'s most famous random video chat site for more than a decade, but it went offline in November 2023 after the founder said the platform had become too costly to moderate safely. That left millions of users searching for a working Omegle alternative.',
          'Vibelly was built to fill that gap: free random video chat that keeps the one-click magic of Omegle, but with modern WebRTC video, AI moderation, and real privacy protections that the original never had.',
        ],
      },
      {
        h2: 'What makes Vibelly the best Omegle alternative',
        paragraphs: [
          'A good Omegle alternative must be free, anonymous, and actively moderated. Vibelly delivers all three:',
        ],
        bullets: [
          'Free random video chat with no sign-up, no email, and no app to download',
          'HD video calls and voice-only mode powered by low-latency WebRTC',
          'AI moderation plus one-tap reporting to keep strangers respectful',
          'Fully anonymous — your identity stays private until you choose to share it',
          'Instant matching in under a second, on any phone or desktop browser',
        ],
      },
      {
        h2: 'How to start a random video call on Vibelly',
        paragraphs: [
          'Press Start, allow camera and microphone access, and you are matched with a stranger immediately. Skip to a new person anytime, and every conversation is ephemeral — when it ends, it is gone.',
        ],
      },
    ],
    faqs: [
      { q: 'Is Vibelly a good alternative to Omegle?', a: 'Yes. Vibelly offers HD video quality, a clean design, and strict moderation without requiring an account, making it one of the best Omegle alternatives.' },
      { q: 'Do I need to sign up to use Vibelly?', a: 'No. You never need to sign up or share personal information. Just click start and connect with strangers worldwide.' },
      { q: 'Is Vibelly safe to use?', a: 'Yes. Unlike Omegle, Vibelly uses advanced moderation tools and instant reporting, and every conversation is ephemeral.' },
      { q: 'Can I use Vibelly on my phone?', a: 'Absolutely. Vibelly works in any mobile browser with no app download required.' },
    ],
  },
  'ometv-alternative': {
    title: 'The Best OmeTV Alternative Without Facebook Login | Vibelly',
    description:
      "Looking for an OmeTV alternative that doesn't require a Facebook account? Vibelly is 100% anonymous, free, and features HD random video chat.",
    h1: 'The Best OmeTV Alternative Without Facebook Login',
    lead: 'OmeTV forces you to link your social media. Vibelly is a truly anonymous OmeTV alternative with zero tracking and no login required.',
    sections: [
      {
        h2: 'Why people look for an OmeTV alternative',
        paragraphs: [
          'OmeTV is popular, but it forces you to log in with your personal Facebook or VK account before you can start chatting. For anyone who wants a private, anonymous video chat, that requirement is a dealbreaker.',
          'There are also frequent bans and verification walls. Vibelly keeps the good parts of OmeTV — HD random video chat worldwide — and removes the social-media login entirely.',
        ],
      },
      {
        h2: 'OmeTV vs Vibelly: the real differences',
        paragraphs: ['The differences come down to privacy, bans, and how the free video chat actually works:'],
        bullets: [
          'No Facebook or VK login — Vibelly is 100% anonymous with no account required',
          'No surprise bans: skip the next stranger freely without penalty',
          'Free HD video chat with no pay-to-talk walls on the core experience',
          'Optional gender and country filters with Vibelly Premium',
        ],
      },
      {
        h2: 'How to use Vibelly without logging in',
        paragraphs: [
          'Open the site in any browser, choose video, voice, or text, and press start. You are matched with a stranger in under a second — no email, no phone number, and no Facebook account.',
          'Calls run over encrypted WebRTC streams directly between browsers, so conversations are private and low-latency. When a call ends, it leaves no trace.',
        ],
      },
    ],
    faqs: [
      { q: 'Why is Vibelly better than OmeTV?', a: 'Unlike OmeTV, Vibelly does not force you to log in with Facebook or VK. We prioritize privacy and complete anonymity while keeping a safe, moderated environment.' },
      { q: 'Do I need a Facebook account to use Vibelly?', a: 'No. Vibelly is 100% login-free for random video chats.' },
      { q: 'Is the video quality good?', a: 'Yes. Vibelly uses modern WebRTC technology for crystal clear HD video, assuming a stable connection.' },
      { q: 'Is Vibelly free to use?', a: 'Yes, the core random video chat experience is completely free for everyone.' },
    ],
  },
  'random-video-chat': {
    title: 'Free Random Video Chat Online | Meet Strangers on Vibelly',
    description:
      'The best free random video chat website. Meet strangers instantly online without login. Vibelly provides anonymous chat with HD video and voice.',
    h1: 'Free Random Video Chat Online',
    lead: 'Meet thousands of strangers instantly. No login required. Vibelly is the safest, fastest, and most aesthetic random video chat platform on the internet.',
    sections: [
      {
        h2: 'What is random video chat?',
        paragraphs: [
          'Random video chat connects you over video with a stranger you have never met — no friend list, no algorithm-curated feed, no profile. You press a button and are matched instantly.',
          'The concept was made famous by Omegle and Chatroulette. Vibelly keeps that excitement and rebuilds the technology: modern WebRTC video, AI moderation, and matching in under a second.',
        ],
      },
      {
        h2: 'Why try random video chat with strangers',
        bullets: [
          'Meet people you would never cross paths with in real life',
          'Practice a new language with native speakers around the world',
          'Fight boredom with unpredictable, genuine conversations',
          'Stay anonymous — share only what you are comfortable sharing',
        ],
        paragraphs: [
          'Random video chat is also completely free on Vibelly, works on any browser, and requires no account.',
        ],
      },
      {
        h2: 'How to stay safe during random video chat',
        paragraphs: [
          'Every room is protected by AI screening and a one-tap report button. Conversations are ephemeral: when you skip or end a call, nothing is stored.',
          'Never share personal financial information, keep your location vague, and trust your instincts. Skipping to a new person is always one click away.',
        ],
      },
    ],
    faqs: [
      { q: 'Do I need to sign up?', a: 'No. You never need to sign up or provide personal information to start random video chat.' },
      { q: 'Is it safe to use?', a: 'Yes. Vibelly uses advanced moderation tools and instant reporting, and all conversations are ephemeral.' },
      { q: 'Can I use it on my phone?', a: 'Yes. Vibelly is fully optimized for mobile browsers with no app download required.' },
      { q: 'Is random video chat really free?', a: 'Yes. Core random video chat is completely free with no time limits or hidden charges.' },
    ],
  },
  'video-chat-online': {
    title: 'Free Online Video Call | Video Chat Online with Strangers | Vibelly',
    description:
      'Make a free online video call with strangers right in your browser. Vibelly is the fastest free video chat online — HD video, no sign-up, works on mobile and desktop.',
    h1: 'Free Online Video Call with Strangers',
    lead: 'Make a free online video call in one click — no app, no account, no download. Vibelly is the fastest way to video chat online with strangers.',
    sections: [
      {
        h2: 'What is a free online video call?',
        paragraphs: [
          'A free online video call lets you see and talk to another person in real time using nothing more than your browser. Unlike apps that require an account or a download, Vibelly starts the moment you arrive.',
          'You are matched with a random stranger from anywhere in the world, and the connection is built on WebRTC — fast, private, and free.',
        ],
      },
      {
        h2: 'Free video chat online vs video calling apps',
        bullets: [
          'No account, phone number, or app download required to start',
          'Meet strangers instantly instead of adding contacts first',
          'HD quality with automatic bandwidth adaptation',
          'Anonymous by default — you control exactly what you reveal',
        ],
        paragraphs: [
          'Video calling apps are great for people you already know, but browser-based free video chat is the right tool for meeting someone new.',
        ],
      },
      {
        h2: 'How to make a free online video call on Vibelly',
        paragraphs: [
          'Press "Video Chat", allow camera and microphone access, and you will be matched with a stranger in under a second. Toggle your camera or mic anytime, type in the live chat panel, or skip to the next person whenever you like.',
          'There is no time limit on free calls and no credit card required. Optional Premium filters add gender and country controls.',
        ],
      },
    ],
    faqs: [
      { q: 'Are free online video calls really free?', a: 'Yes. Core random video chat on Vibelly is completely free with no time limits or hidden charges.' },
      { q: 'Do I need to sign up?', a: 'No. You never need to sign up or provide personal information to start a free online video call.' },
      { q: 'Can I use it on my phone?', a: 'Yes. Vibelly works in any mobile browser with no app download required.' },
      { q: 'Is it safe to use?', a: 'Yes. Vibelly uses advanced moderation tools, instant reporting, and ephemeral conversations.' },
    ],
  },
  'chatroulette-alternative': {
    title: 'The Best Chatroulette Alternative in 2026 | Vibelly',
    description:
      'Looking for a modern Chatroulette alternative? Vibelly offers HD random video chat, voice calls, and safe AI moderation for free.',
    h1: 'The Modern Chatroulette Alternative',
    lead: 'Chatroulette was built in the flash era. Vibelly is the modern Chatroulette alternative: fast, moderated, and beautifully designed.',
    sections: [
      {
        h2: 'Why Vibelly is the modern Chatroulette upgrade',
        paragraphs: [
          'Classic chat roulette sites struggle with bots, outdated technology, and unsafe content. Vibelly is built on modern WebRTC for instant, high-quality connections, with AI screening that filters bots and inappropriate content before you match.',
        ],
      },
      {
        h2: 'Everything you loved, rebuilt',
        bullets: [
          'Instant random matching with HD video',
          'Voice-only and text chat modes',
          'AI moderation and one-tap reporting',
          '100% free with no account required',
        ],
        paragraphs: [
          'Whether you want to talk to strangers via video or use audio-only mode, Vibelly provides the safest and most aesthetic random chat experience online today.',
        ],
      },
    ],
    faqs: [
      { q: 'Is Vibelly a good Chatroulette alternative?', a: 'Yes. Vibelly offers instant matching, HD WebRTC video, and a modern interface built as a successor to Chatroulette.' },
      { q: 'Are there bots on Vibelly?', a: 'No. Advanced AI screening filters out bots, spam, and inappropriate content so you match with real humans.' },
      { q: 'Do I need to download an app?', a: 'No. Vibelly works right in your browser on desktop and mobile.' },
    ],
  },
  'talk-to-strangers': {
    title: 'Talk to Strangers | Random Stranger Chat Online',
    description:
      'Talk to strangers from around the world on Vibelly. The ultimate random stranger chat app for instant connections, video, and anonymous messaging.',
    h1: 'Talk to Strangers Instantly',
    lead: 'Connect globally with the best random stranger chat platform. No sign-up, no app, no judgment.',
    sections: [
      {
        h2: 'Why talk to strangers online?',
        paragraphs: [
          'Talking to strangers online is one of the easiest ways to meet new people, practice languages, and discover perspectives from around the world. Vibelly makes it instant: one click connects you to a random person anywhere.',
        ],
      },
      {
        h2: 'How to talk to strangers safely',
        bullets: [
          'Stay anonymous — share only what you are comfortable with',
          'Never share personal financial information',
          'Skip any conversation instantly with one click',
          'Report inappropriate behavior immediately',
        ],
        paragraphs: [
          'Every Vibelly conversation is moderated by AI, and chat history disappears the moment the call ends.',
        ],
      },
    ],
    faqs: [
      { q: 'Is talking to strangers online safe?', a: 'Vibelly prioritizes safety with AI moderation, one-tap reporting, and ephemeral conversations that leave no trace.' },
      { q: 'Do I need to sign up?', a: 'No. You can talk to strangers instantly with no account and no email.' },
    ],
  },
  'anonymous-chat': {
    title: 'Anonymous Chat Website | Free Private Chat Rooms',
    description:
      'Looking for an anonymous chat website? Vibelly offers free, secure, and fully anonymous chat rooms and random video calls to keep your identity private.',
    h1: 'The Most Secure Anonymous Chat Website',
    lead: 'Chat freely without giving up your email, phone, or identity. Vibelly is anonymous chat done right.',
    sections: [
      {
        h2: 'What makes Vibelly truly anonymous',
        paragraphs: [
          'Vibelly requires no account, no email, and no phone number. You connect as an anonymous user, and conversations are ephemeral — when the call ends, nothing is stored.',
        ],
      },
      {
        h2: 'Anonymous chat you can trust',
        bullets: [
          'No social login, no tracking, no data retention',
          'AI moderation keeps the community clean',
          'Video, voice, and text modes',
          'Encrypted WebRTC connections',
        ],
        paragraphs: [
          'You stay in control of your identity at every moment, and can skip to a new stranger with a single click.',
        ],
      },
    ],
    faqs: [
      { q: 'Is Vibelly anonymous?', a: 'Yes. Vibelly requires no account and stores no chat history, keeping your identity completely private.' },
      { q: 'Is anonymous chat safe?', a: 'Yes. AI moderation, one-tap reporting, and ephemeral conversations make Vibelly a safe place to chat anonymously.' },
    ],
  },
  'omegle-unbanned': {
    title: 'Omegle Unbanned: How to Avoid Random Chat Bans | Vibelly',
    description:
      'Tired of being banned from random video chat? Vibelly explains how Omegle bans work and why Vibelly is the unban-proof alternative for talking to strangers.',
    h1: 'Omegle Unbanned — Chat Without the Ban Hammer',
    lead: 'Omegle bans are strict, permanent, and frustrating. Vibelly is the unban-proof random video chat alternative where skip is a right, not a punishment.',
    sections: [
      {
        h2: 'Why Omegle bans happen',
        paragraphs: [
          'Omegle bans users for many reasons — questionable activity, flagged reports, and even automated triggers you may never understand. Once banned, users are typically blocked by IP and face little recourse.',
          'Because the ban system is opaque, countless users search for "Omegle unbanned" options that simply let them talk to strangers without the threat of a permanent ban.',
        ],
      },
      {
        h2: 'Why Vibelly never punishes you for skipping',
        paragraphs: [
          'On Vibelly there is no ban hammer for skipping. Pressing "Next" is a fundamental right, not a rule violation. Our moderation targets actual bad behavior instead of punishing users who simply want a new conversation.',
        ],
        bullets: [
          'Skip to the next stranger freely, any number of times',
          'No IP bans for innocent browsing or skipping',
          'AI moderation that filters content, not identities',
          'Fully anonymous with no account to be banned',
        ],
      },
    ],
    faqs: [
      { q: 'Can I get banned on Vibelly for skipping?', a: 'No. Skipping to a new stranger is always allowed on Vibelly and never results in a ban.' },
      { q: 'Is Vibelly truly an "Omegle unbanned" option?', a: 'Yes. With no account and no ban-based moderation, Vibelly is the unban-proof way to keep talking to strangers.' },
      { q: 'Does Vibelly ban by IP?', a: 'No. Vibelly moderates actual behavior, not identities or IP addresses.' },
    ],
  },
  'chat-with-girls': {
    title: 'Random Video Chat Without Login | Vibelly',
    description:
      'Vibelly is the best platform for random video chat without login. Start connecting instantly in secure video rooms with strangers.',
    h1: 'Random Video Chat Without Login',
    lead: 'Skip the sign-up and jump straight into the action. Vibelly is random video chat without login, ready in one click.',
    sections: [
      {
        h2: 'Why "without login" matters',
        paragraphs: [
          'Most chat platforms force you to create an account or link a social profile before you can talk to anyone. Vibelly throws that out: you open the site, press start, and you are matched instantly.',
          'There is no email, no phone number, and no password to remember. Your privacy is protected by default because there is simply nothing to link to you.',
        ],
      },
      {
        h2: 'Start chatting in one click',
        bullets: [
          'HD video, voice-only, or text chat',
          'Instant matching with strangers worldwide',
          'AI moderation and one-tap reporting',
          'No app download required',
        ],
        paragraphs: [
          'Whether you want video chat with a stranger or a quiet text conversation, Vibelly gives you the full experience with zero registration.',
        ],
      },
    ],
    faqs: [
      { q: 'Do I need to create an account?', a: 'No. Vibelly is random video chat without login — you can start instantly with no email and no password.' },
      { q: 'Is it really free?', a: 'Yes. Core random video chat on Vibelly is completely free, with no time limits or hidden charges.' },
      { q: 'Can I use it on my phone?', a: 'Yes. Vibelly works in any mobile browser with no app download required.' },
    ],
  },
};

// ─── HTML generation ───
function buildJsonLd(info, slug, faqs) {
  const url = `${siteUrl}/${slug}`;
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Vibelly',
      operatingSystem: 'Web, Android, iOS',
      applicationCategory: 'SocialNetworkingApplication',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: info.title,
      url,
      isPartOf: { '@type': 'WebSite', name: 'Vibelly', url: siteUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
  ];
  return schemas.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n    ');
}

function buildBody(info, sections, faqs, links, h1Override) {
  const { phrase, cityName } = info;
  const where = cityName ? ` in ${cityName}` : '';

  const sectionsHtml = sections
    .slice(1)
    .map((section) => {
      const heading = section.h2 ? `      <h2>${esc(section.h2)}</h2>\n` : '';
      const paras = section.paragraphs.map((p) => `      <p>${esc(p)}</p>`).join('\n');
      const bullets = section.bullets && section.bullets.length > 0
        ? `      <ul>\n${section.bullets.map((b) => `        <li>${esc(b)}</li>`).join('\n')}\n      </ul>`
        : '';
      return `${heading}${paras}${bullets ? `\n${bullets}` : ''}`;
    })
    .join('\n');

  const faqHtml = faqs
    .map(
      (faq) =>
        `      <details>\n        <summary>${esc(faq.q)}</summary>\n        <p>${esc(faq.a)}</p>\n      </details>`
    )
    .join('\n');

  const linkHtml = links
    .map((link) => `      <a href="${esc(link)}">${esc(link.replace(/\//g, '').replace(/-/g, ' '))}</a>`)
    .join('\n');

  const h1 = h1Override || `${phrase}${where ? ` in ${cityName}` : ''}`;
  const lead = sections[0] && sections[0].paragraphs[0] ? sections[0].paragraphs[0] : '';

  return `<div id="root">
    <main>
      <h1>${esc(h1)}</h1>
      <p>${esc(lead)}</p>
${sectionsHtml}
      <h2>Frequently Asked Questions</h2>
${faqHtml}
      <h2>Explore more</h2>
      <nav>
${linkHtml}
      </nav>
    </main>
  </div>`;
}

function renderPage(slug, city) {
  const rng = mulberry32(hashString(slug));
  const info = analyzeSlug(slug, city);
  const core = CORE_COPY[slug];

  let sections;
  let faqs;
  let h1Override = null;

  if (core) {
    info.title = core.title;
    info.description = core.description;
    h1Override = core.h1;
    sections = [{ h2: null, paragraphs: [core.lead] }, ...core.sections];
    faqs = core.faqs;
  } else {
    info.title = buildTitle(info);
    info.description = buildDescription(info);
    const made = makeContent(info, rng);
    const where = info.cityName ? ` in ${info.cityName}` : '';
    const low = info.phrase.toLowerCase();
    const headings = [
      `Why choose Vibelly for ${low}${where}?`,
      `How to start ${low} right now`,
      `Is ${low} on Vibelly safe?`,
      `Start ${low} today`,
    ];
    sections = made.paragraphs.map((paragraph, i) => ({
      h2: i > 0 && i - 1 < headings.length ? headings[i - 1] : null,
      paragraphs: [paragraph],
    }));
    faqs = made.faqs;
  }

  const links = relatedLinks(slug, rng);

  const url = `${siteUrl}/${slug}`;
  const jsonLd = buildJsonLd(info, slug, faqs);
  const body = buildBody(info, sections, faqs, links, h1Override);

  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(info.title)}</title>`);
  html = html.replace(
    /<meta name="title" content="[\s\S]*?" \/>/,
    `<meta name="title" content="${esc(info.title)}" />`
  );
  html = html.replace(
    /<meta name="description" content="[\s\S]*?" \/>/,
    `<meta name="description" content="${esc(info.description)}" />`
  );
  html = html.replace(/<link rel="canonical" href="[\s\S]*?" \/>/, `<link rel="canonical" href="${url}" />`);
  html = html.replace(/<meta property="og:type" content="[\s\S]*?" \/>/, '<meta property="og:type" content="website" />');
  html = html.replace(/<meta property="og:url" content="[\s\S]*?" \/>/, `<meta property="og:url" content="${url}" />`);
  html = html.replace(
    /<meta property="og:title" content="[\s\S]*?" \/>/,
    `<meta property="og:title" content="${esc(info.title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[\s\S]*?" \/>/,
    `<meta property="og:description" content="${esc(info.description)}" />`
  );
  html = html.replace(/<meta property="twitter:url" content="[\s\S]*?" \/>/, `<meta property="twitter:url" content="${url}" />`);
  html = html.replace(
    /<meta property="twitter:title" content="[\s\S]*?" \/>/,
    `<meta property="twitter:title" content="${esc(info.title)}" />`
  );
  html = html.replace(
    /<meta property="twitter:description" content="[\s\S]*?" \/>/,
    `<meta property="twitter:description" content="${esc(info.description)}" />`
  );

  html = html.replace('</head>', `    ${jsonLd}\n  </head>`);
  html = html.replace('<div id="root"></div>', body);

  return html;
}

// ─── Write all pages ───
const pages = buildPages();
console.log(`Generating ${pages.length} prerendered SEO pages...`);

let count = 0;
for (const page of pages) {
  const routeDir = path.join(distPath, page.slug);
  if (!fs.existsSync(routeDir)) fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, 'index.html'), renderPage(page.slug, page.city));
  count++;
}

console.log(`✅ Prerendered ${count} unique SEO pages.`);
