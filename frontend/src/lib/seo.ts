// Structured data (JSON-LD) is generated at build time by scripts/prerender.cjs and is
// left in place after React mounts, so there is a single source of truth for schema.
export const site = {
  name: 'Vibelly',
  url: 'https://vibelly.fun',
  defaultDescription:
    'Vibelly is a free random video chat for adults 18+. Meet strangers worldwide over video or text in your browser, with no sign-up needed.',
  defaultImage: 'https://vibelly.fun/og-image.png',
} as const;

export type SeoPageType = 'website' | 'article';

export interface SeoPageConfig {
  title: string;
  description?: string;
  canonicalUrl?: string;
  type?: SeoPageType;
  imageUrl?: string;
  noindex?: boolean;
}

export const absoluteUrl = (path?: string): string =>
  path ? `${site.url}${path.startsWith('/') ? path : `/${path}`}` : site.url;
