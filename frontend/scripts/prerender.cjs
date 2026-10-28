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
    logo: `${siteUrl}/favicon.jpg`,
    email: 'vibellyofficial@gmail.com',
    sameAs: ['https://instagram.com/vibelly.official'],
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
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript and WebRTC',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': `${siteUrl}/#org` },
  },
];

const HOME = {
  title: 'Vibelly | The Best Free Omegle Alternative & Random Video Chat',
  description:
    'Free random video chat for adults 18+. Meet strangers worldwide over video or text in your browser. A modern Omegle alternative with no sign-up.',
  h1: 'The Best Free Omegle Alternative & Random Video Chat',
  lead: 'Talk to strangers online instantly with free random video calls and text chat, right in your browser. No sign-up required. Vibelly is for adults 18+ only.',
  sections: [
    {
      h2: 'How Vibelly works',
      paragraphs: [
        'Press Start Video Call, allow camera and microphone access, confirm you are 18 or older, and you are matched with a random stranger. Skip to someone new at any time.',
      ],
    },
    {
      h2: 'Video, voice, and text chat',
      bullets: [
        'Free random video chat in any browser, with no app to download',
        'Text chat with strangers when you would rather not be on camera',
        'Voice-only calls plus gender and country filters with Vibelly Premium',
        'Group chats and live streams with the Vibelly community',
      ],
    },
    {
      h2: 'Safety on Vibelly',
      paragraphs: [
        'Vibelly is strictly 18+. Every call has a Report button, and our team reviews reports and bans users who break the community rules. Video and voice calls connect directly between browsers over encrypted WebRTC, and calls are never recorded.',
      ],
    },
  ],
};

// Real React pages that only need correct head tags (their body is rendered by React).
const APP_PAGES = {
  pricing: {
    title: 'Vibelly Premium | Enhance Your Random Chat Experience',
    description: 'Vibelly Premium adds gender and country filters, 720p HD video, and voice calls. ₹49 a month, ₹499 a year, or ₹9 for a single day.',
    h1: 'Vibelly Premium',
    sections: [
      { h2: 'Free', bullets: ['Random video chat at 480p', 'Text chat with strangers', 'Unlimited sessions', 'One-tap reporting'] },
      {
        h2: 'Premium: ₹49 per month or ₹499 per year',
        bullets: ['Opposite gender matching', 'HD video calls (720p)', 'Random voice calls', 'Country filters', 'Interest matching'],
      },
      { h2: 'Daily pass: ₹9', paragraphs: ['Everything in Premium for 24 hours, with no commitment.'] },
    ],
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
    ],
  },
  terms: {
    title: 'Terms of Service & Privacy Policy | Vibelly',
    description: 'Read the terms of service and privacy policy for Vibelly. We prioritize your anonymity and data protection.',
    h1: 'Terms & Conditions',
    lead: PAGES.terms.intro,
    sections: PAGES.terms.sections,
  },
  about: {
    title: 'About Vibelly | Who Runs Vibelly',
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
    title: 'The Best Free Omegle Alternative in 2026 | Vibelly',
    description:
      'Looking for an Omegle alternative? Vibelly is free random video chat for adults 18+, with text chat, one-tap reporting, and no sign-up needed.',
    h1: 'Omegle Alternative: Free Random Video Chat for Adults',
    lead: "Omegle shut down, but the need to talk to strangers didn't. Vibelly is a free, adults-only Omegle alternative that runs in your browser.",
    sections: [
      {
        h2: 'Why Omegle shut down and what replaced it',
        paragraphs: [
          'Omegle was the internet\'s most famous random video chat site for more than a decade, but it went offline in November 2023 after the founder said the platform had become too costly to moderate safely. That left millions of users searching for a working Omegle alternative.',
          'Vibelly was built to fill that gap: free random video chat that keeps the one-click magic of Omegle, but with modern WebRTC video, one-tap reporting, and real privacy protections that the original never had.',
        ],
      },
      {
        h2: 'What makes Vibelly the best Omegle alternative',
        paragraphs: [
          'A good Omegle alternative must be free, anonymous, and actively moderated. Vibelly delivers all three:',
        ],
        bullets: [
          'Free random video chat with no sign-up, no email, and no app to download',
          'Video calls powered by low-latency WebRTC, with voice-only calls on Premium',
          'One-tap reporting, with every report reviewed by our team',
          'Fully anonymous — your identity stays private until you choose to share it',
          'Instant matching on any phone or desktop browser',
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
      { q: 'Is Vibelly a good alternative to Omegle?', a: 'Yes. Vibelly offers smooth video, a clean design, and one-tap reporting without requiring an account, making it one of the best Omegle alternatives.' },
      { q: 'Do I need to sign up to use Vibelly?', a: 'No. You never need to sign up or share personal information. Just click start and connect with strangers worldwide.' },
      { q: 'Is Vibelly safe to use?', a: 'Vibelly is 18+ only, every call has a one-tap Report button reviewed by our team, and every conversation is ephemeral.' },
      { q: 'Can I use Vibelly on my phone?', a: 'Absolutely. Vibelly works in any mobile browser with no app download required.' },
    ],
  },
  'ometv-alternative': {
    title: 'OmeTV Alternative: Random Video Chat With No Account | Vibelly',
    description:
      'Looking for an OmeTV alternative? Vibelly is free, adults-only random video chat with no account, email, or social login needed to start.',
    h1: 'OmeTV Alternative: Random Video Chat With No Account Needed',
    lead: 'No email, no phone number, no social login. Vibelly is a free, adults-only OmeTV alternative that starts in your browser.',
    sections: [
      {
        h2: 'Why people look for an OmeTV alternative',
        paragraphs: [
          'OmeTV is one of the most popular random video chat apps. If you want an alternative where you can start without any account, inside an adults-only community with reports reviewed by a real team, Vibelly is built for exactly that.',
          'Vibelly asks for no email, no phone number, and no social media account before you chat. Privacy is the default, not an upgrade.',
        ],
      },
      {
        h2: 'What Vibelly offers',
        paragraphs: ['Here is what you get with Vibelly:'],
        bullets: [
          'No account, email, or social login needed to start chatting',
          'No surprise bans: skip the next stranger freely without penalty',
          'Free video chat with no pay-to-talk walls on the core experience',
          'Optional gender and country filters with Vibelly Premium',
        ],
      },
      {
        h2: 'How to use Vibelly without logging in',
        paragraphs: [
          'Open the site in any browser, choose video or text, and press start. You are matched with a stranger in seconds, with no email, phone number, or social account.',
          'Calls run over encrypted WebRTC streams directly between browsers, so conversations are private and low-latency. Calls are never recorded, and chat messages are not kept after the call ends.',
        ],
      },
    ],
    faqs: [
      { q: 'How is Vibelly different from OmeTV?', a: 'Vibelly needs no account or social login to start chatting, is strictly 18+, and every call has a one-tap Report button reviewed by our team. For a sourced, side-by-side look at OmeTV and others, read our Omegle alternatives comparison on the blog.' },
      { q: 'Do I need a Facebook account to use Vibelly?', a: 'No. Vibelly is 100% login-free for random video chats.' },
      { q: 'Is the video quality good?', a: 'Free calls run at 480p, and Premium unlocks 720p HD. Video adapts automatically to your connection.' },
      { q: 'Is Vibelly free to use?', a: 'Yes, the core random video chat experience is completely free for everyone.' },
    ],
  },
  'random-video-chat': {
    title: 'Free Random Video Chat Online | Meet Strangers on Vibelly',
    description:
      'The best free random video chat website. Meet strangers instantly online without login. Vibelly provides anonymous video and text chat.',
    h1: 'Free Random Video Chat Online',
    lead: 'Meet strangers instantly. No login required. Vibelly is a free, adults-only random video chat that runs in your browser.',
    sections: [
      {
        h2: 'What is random video chat?',
        paragraphs: [
          'Random video chat connects you over video with a stranger you have never met — no friend list, no algorithm-curated feed, no profile. You press a button and are matched instantly.',
          'The concept was made famous by Omegle and Chatroulette. Vibelly keeps that excitement and rebuilds the technology: modern WebRTC video, one-tap reporting, and matching in seconds.',
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
          'Every call has a one-tap Report button, and our team reviews every report. Conversations are ephemeral: when you skip or end a call, the conversation is not stored.',
          'Never share personal financial information, keep your location vague, and trust your instincts. Skipping to a new person is always one click away.',
        ],
      },
    ],
    faqs: [
      { q: 'Do I need to sign up?', a: 'No. You never need to sign up or provide personal information to start random video chat.' },
      { q: 'Is it safe to use?', a: 'Vibelly is 18+ only, every call has a one-tap Report button reviewed by our team, and all conversations are ephemeral.' },
      { q: 'Can I use it on my phone?', a: 'Yes. Vibelly is fully optimized for mobile browsers with no app download required.' },
      { q: 'Is random video chat really free?', a: 'Yes. Core random video chat is completely free with no time limits or hidden charges.' },
    ],
  },
  'chatroulette-alternative': {
    title: 'The Best Chatroulette Alternative in 2026 | Vibelly',
    description:
      'Looking for a modern Chatroulette alternative? Vibelly offers random video chat, text chat, and one-tap reporting for free.',
    h1: 'The Modern Chatroulette Alternative',
    lead: 'Chatroulette was built in the flash era. Vibelly is the modern Chatroulette alternative: fast, moderated, and beautifully designed.',
    sections: [
      {
        h2: 'Why Vibelly is the modern Chatroulette upgrade',
        paragraphs: [
          'Classic chat roulette sites struggle with bots, outdated technology, and unsafe content. Vibelly is built on modern WebRTC for instant, high-quality connections, plus one-tap reporting reviewed by our team.',
        ],
      },
      {
        h2: 'Everything you loved, rebuilt',
        bullets: [
          'Instant random video matching',
          'Text chat mode, plus voice-only calls on Premium',
          'One-tap reporting reviewed by our team',
          '100% free with no account required',
        ],
        paragraphs: [
          'Whether you want to talk to strangers over video or text, Vibelly gives you a clean, modern random chat experience.',
        ],
      },
    ],
    faqs: [
      { q: 'Is Vibelly a good Chatroulette alternative?', a: 'Yes. Vibelly offers instant matching, WebRTC video, and a modern interface built as a successor to Chatroulette.' },
      { q: 'How does Vibelly handle bad behavior?', a: 'Every call has a one-tap Report button. Our team reviews reports and bans users who break the rules.' },
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
          'Every Vibelly call has a one-tap Report button, and chat history disappears the moment the call ends.',
        ],
      },
    ],
    faqs: [
      { q: 'Is talking to strangers online safe?', a: 'Vibelly is 18+ only and prioritizes safety with one-tap reporting, team review of every report, and ephemeral conversations.' },
      { q: 'Do I need to sign up?', a: 'No. You can talk to strangers instantly with no account and no email.' },
    ],
  },
  'anonymous-chat': {
    title: 'Anonymous Chat Website | Free Private Chat Rooms',
    description:
      'Looking for an anonymous chat website? Vibelly offers free, secure, and fully anonymous chat rooms and random video calls to keep your identity private.',
    h1: 'Anonymous Chat Without an Account',
    lead: 'Chat freely without giving up your email, phone, or identity. Vibelly is anonymous chat done right.',
    sections: [
      {
        h2: 'What makes Vibelly truly anonymous',
        paragraphs: [
          'Vibelly requires no account, no email, and no phone number. You connect as an anonymous user, and conversations are ephemeral — when the call ends, the conversation is not stored.',
        ],
      },
      {
        h2: 'Anonymous chat you can trust',
        bullets: [
          'No social login, and calls are never recorded',
          'One-tap reporting keeps the community clean',
          'Video, voice, and text modes',
          'Encrypted WebRTC connections',
        ],
        paragraphs: [
          'You stay in control of your identity at every moment, and can skip to a new stranger with a single click.',
        ],
      },
    ],
    faqs: [
      { q: 'Is Vibelly anonymous?', a: 'Yes. Vibelly requires no account to chat, and chat messages are not kept after a call ends.' },
      { q: 'Is anonymous chat safe?', a: 'Yes. An 18+ policy, one-tap reporting, and ephemeral conversations make Vibelly a safe place to chat anonymously.' },
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
      name: title,
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
  ...Object.entries(CORE_COPY).map(([slug, c]) => [`/${slug}`, c.h1]),
  ['/safety', 'Safety & Community Rules'],
  ['/about', 'About Vibelly'],
  ['/blog', 'Vibelly Blog: tips & guides'],
];

function buildBody({ h1, lead, sections = [], faqs = [] }, selfPath) {
  const sectionsHtml = sections
    .map((section) => {
      const parts = [];
      if (section.h2) parts.push(`      <h2>${esc(section.h2)}</h2>`);
      for (const p of section.paragraphs || []) parts.push(`      <p>${esc(p)}</p>`);
      if (section.bullets && section.bullets.length) {
        parts.push(`      <ul>\n${section.bullets.map((b) => `        <li>${esc(b)}</li>`).join('\n')}\n      </ul>`);
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

  return `<div id="root">
    <main>
      <h1>${esc(h1)}</h1>
${lead ? `      <p>${esc(lead)}</p>\n` : ''}${sectionsHtml}${faqHtml}
      <h2>Explore Vibelly</h2>
      <nav>
        <ul>
${linkHtml}
        </ul>
      </nav>
    </main>
  </div>`;
}

// Same markdown subset BlogPost.tsx renders: ##, ###, "- " lists, **bold**, paragraphs.
function markdownToHtml(md) {
  const inline = (t) =>
    esc(t)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) =>
        href.startsWith('/') ? `<a href="${href}">${text}</a>` : `<a href="${href}" rel="noopener">${text}</a>`
      );
  const out = [];
  let list = [];
  const flush = () => {
    if (list.length) out.push(`      <ul>\n${list.map((li) => `        <li>${inline(li)}</li>`).join('\n')}\n      </ul>`);
    list = [];
  };
  for (const raw of md.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('- ')) { list.push(line.slice(2)); continue; }
    flush();
    if (!line) continue;
    if (line.startsWith('### ')) out.push(`      <h3>${inline(line.slice(4))}</h3>`);
    else if (line.startsWith('## ')) out.push(`      <h2>${inline(line.slice(3))}</h2>`);
    else out.push(`      <p>${inline(line)}</p>`);
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

// Shells first: both are built from the untouched template.
write('app.html', render(headBlock({ title: 'Vibelly' })));
write(
  '404.html',
  render(headBlock({ title: 'Page not found | Vibelly', robots: 'noindex, follow' }), buildBody({ h1: 'Page not found', lead: 'This page does not exist.' }, null))
);

write(
  'index.html',
  render(
    headBlock({ title: HOME.title, description: HOME.description, url: `${siteUrl}/`, graph: SITE_GRAPH }),
    buildBody(HOME, '/')
  )
);
sitemapPaths.push('/');

for (const [slug, core] of Object.entries(CORE_COPY)) {
  const url = `${siteUrl}/${slug}`;
  const page = { h1: core.h1, lead: core.lead, sections: core.sections, faqs: core.faqs };
  write(
    `${slug}/index.html`,
    render(
      headBlock({ title: core.title, description: core.description, url, graph: pageGraph(slug, core.title, core.description, core.faqs) }),
      buildBody(page, `/${slug}`)
    )
  );
  sitemapPaths.push(`/${slug}`);
}

for (const [slug, page] of Object.entries(APP_PAGES)) {
  const url = `${siteUrl}/${slug}`;
  write(
    `${slug}/index.html`,
    render(
      headBlock({ title: page.title, description: page.description, url, graph: pageGraph(slug, page.title, page.description, null, [], page.pageType) }),
      buildBody({ h1: page.h1, lead: page.lead || page.description, sections: page.sections }, `/${slug}`)
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
}

for (const post of BLOG_POSTS) {
  const slug = `blog/${post.slug}`;
  const url = `${siteUrl}/${slug}`;
  const title = `${post.title} | Vibelly Blog`;
  const graph = pageGraph(slug, title, post.description, null, [['Blog', `${siteUrl}/blog`]]);
  graph.push({
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: `${siteUrl}/og-image.png`,
    datePublished: post.date,
    dateModified: post.date,
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
}

// No <lastmod>: we have no real per-page modified dates, and fake ones teach Google to ignore the field.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join('\n')}
</urlset>
`;
write('sitemap.xml', sitemap);

console.log(`✅ Prerendered ${sitemapPaths.length} pages + app.html + 404.html, sitemap.xml written.`);
