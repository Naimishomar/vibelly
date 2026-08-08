import React from 'react';
import SEO from './SEO';
import { site } from '../lib/seo';

interface SeoMarkupProps {
  title?: string;
  description?: string;
  url?: string;
  isHome?: boolean;
}

export const SeoMarkup: React.FC<SeoMarkupProps> = ({
  title = 'Vibelly | The Best Free App For Random Video Chat',
  description = site.defaultDescription,
  url = `${site.url}/`,
  isHome = false,
}) => {
  let canonicalUrl: string | undefined;
  try {
    canonicalUrl = new URL(url, site.url).pathname;
  } catch {
    canonicalUrl = url;
  }

  return (
    <SEO title={title} description={description} canonicalUrl={canonicalUrl} includeOrganization={isHome} />
  );
};

export default SeoMarkup;
