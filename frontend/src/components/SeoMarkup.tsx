import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoMarkupProps {
  title?: string;
  description?: string;
  url?: string;
  isHome?: boolean;
}

export const SeoMarkup: React.FC<SeoMarkupProps> = ({ 
  title = "Vibelly | The Best Free App For Random Video Chat", 
  description = "Vibelly is the ultimate free alternative to Omegle and OmeTV. Instantly connect with strangers worldwide through high-quality random video calling and chat.",
  url = "https://vibelly.fun/",
  isHome = false
}) => {
  // Software Application Schema (Rich Snippet: Star Ratings & App Info)
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Vibelly",
    "operatingSystem": "Web, iOS, Android",
    "applicationCategory": "CommunicationApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "12450"
    }
  };

  // FAQ Schema (Rich Snippet: Dropdown FAQs in Google Search)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is Vibelly a free Omegle alternative?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Vibelly is a 100% free Omegle alternative. You can instantly start random video chatting with strangers worldwide without paying any fees or requiring a mandatory signup."
        }
      },
      {
        "@type": "Question",
        "name": "Is Vibelly safe to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We prioritize user safety with encrypted peer-to-peer connections. However, since it is a random video chat platform, users should remain vigilant and never share personal financial information with strangers."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to download an app to use Vibelly?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No download is required. Vibelly works directly in your web browser on mobile phones, tablets, and desktop computers."
        }
      }
    ]
  };

  // Organization Schema (Rich Snippet: Brand Panel)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Vibelly",
    "url": "https://vibelly.fun/",
    "logo": "https://vibelly.fun/favicon.jpg",
    "sameAs": [
      "https://twitter.com/vibellyapp",
      "https://instagram.com/vibellyapp"
    ]
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />

      {/* JSON-LD Structured Data Injection */}
      <script type="application/ld+json">
        {JSON.stringify(softwareSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
      {isHome && (
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
      )}
    </Helmet>
  );
};
