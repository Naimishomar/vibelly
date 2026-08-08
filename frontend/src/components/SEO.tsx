import { Helmet } from 'react-helmet-async';
import { site, absoluteUrl, buildSeoJsonLd } from '../lib/seo';
import type { SeoPageConfig } from '../lib/seo';

export default function SEO({
  title,
  description = site.defaultDescription,
  canonicalUrl,
  type = 'website',
  imageUrl = site.defaultImage,
  faqs,
  includeOrganization = false,
  datePublished,
  noindex = false,
}: SeoPageConfig) {
  const url = absoluteUrl(canonicalUrl);
  const jsonLd = buildSeoJsonLd({
    title,
    description,
    canonicalUrl,
    type,
    imageUrl,
    faqs,
    includeOrganization,
    datePublished,
  });

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {noindex ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      {canonicalUrl && <link rel="canonical" href={url} />}

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content={site.name} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />

      {/* JSON-LD Structured Data */}
      {jsonLd.map((json, index) => (
        <script type="application/ld+json" key={index}>
          {json}
        </script>
      ))}
    </Helmet>
  );
}
