export const site = {
  name: 'Vibelly',
  url: 'https://vibelly.fun',
  defaultDescription:
    'Vibelly is the ultimate free alternative to Omegle and OmeTV. Instantly connect with strangers worldwide through high-quality random video calling and chat.',
  defaultImage: 'https://i.pinimg.com/736x/bf/f9/90/bff990bfc21bdc142b69c6ed28b53b6d.jpg',
  logo: 'https://vibelly.fun/favicon.jpg',
  social: ['https://twitter.com/vibellyapp', 'https://instagram.com/vibellyapp'],
} as const;

export interface Faq {
  question: string;
  answer: string;
}

export type SeoPageType = 'website' | 'article';

export interface SeoPageConfig {
  title: string;
  description?: string;
  canonicalUrl?: string;
  type?: SeoPageType;
  imageUrl?: string;
  faqs?: Faq[];
  includeOrganization?: boolean;
  datePublished?: string;
  noindex?: boolean;
}

export const absoluteUrl = (path?: string): string =>
  path ? `${site.url}${path.startsWith('/') ? path : `/${path}`}` : site.url;

const aggregateRating = {
  '@type': 'AggregateRating',
  ratingValue: '4.9',
  ratingCount: '18452',
} as const;

export function softwareAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: site.name,
    operatingSystem: 'Web, Android, iOS',
    applicationCategory: 'SocialNetworkingApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating,
  };
}

export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
  };
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    url: site.url,
    logo: site.logo,
    sameAs: site.social,
  };
}

export function faqPageSchema(faqs: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbSchema(canonicalUrl: string) {
  const segments = canonicalUrl.split('/').filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: site.url,
      },
      ...segments.map((segment, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        item: `${site.url}/${segments.slice(0, index + 1).join('/')}`,
      })),
    ],
  };
}

export function articleSchema(config: SeoPageConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: config.title,
    image: [config.imageUrl ?? site.defaultImage],
    datePublished: config.datePublished ?? new Date().toISOString(),
    author: [
      {
        '@type': 'Organization',
        name: site.name,
        url: site.url,
      },
    ],
  };
}

export function buildSeoJsonLd(config: SeoPageConfig): string[] {
  const schemas: unknown[] = [softwareAppSchema(), webSiteSchema()];

  if (config.includeOrganization) schemas.push(organizationSchema());
  if (config.faqs && config.faqs.length > 0) schemas.push(faqPageSchema(config.faqs));
  if (config.canonicalUrl && config.canonicalUrl !== '/') schemas.push(breadcrumbSchema(config.canonicalUrl));
  if (config.type === 'article') schemas.push(articleSchema(config));

  return schemas.map((schema) => JSON.stringify(schema));
}
