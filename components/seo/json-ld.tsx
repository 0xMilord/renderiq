'use client';

interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization Schema
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AecoSec',
  url: 'https://aecosec.com',
  logo: 'https://aecosec.com/logo.png',
  description: 'AI-powered architectural visualization and rendering platform for architects and designers',
  sameAs: [
    'https://twitter.com/aecosec',
    'https://linkedin.com/company/aecosec',
    'https://github.com/aecosec'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@aecosec.com',
    contactType: 'Customer Support',
    availableLanguage: ['English']
  }
};

// Software Application Schema
export const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AecoSec',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free trial available'
  },
  description: 'AI-powered architectural visualization platform with real-time rendering, rapid prototyping, and intelligent material testing',
  featureList: [
    'Real-time architectural visualization',
    'AI-powered rendering',
    'Rapid prototyping',
    'Material testing',
    'Interior design AI',
    'Exterior visualization',
    'Site planning'
  ],
  screenshot: 'https://aecosec.com/screenshot.png',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150'
  }
};

// WebSite Schema
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AecoSec',
  url: 'https://aecosec.com',
  description: 'Transform architectural designs into photorealistic renders with AI',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://aecosec.com/search?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
};

// Breadcrumb Schema Generator
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

// Article Schema Generator
export function generateArticleSchema({
  title,
  description,
  datePublished,
  dateModified,
  author = 'AecoSec',
  image
}: {
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: image || 'https://aecosec.com/og-image.png',
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: 'AecoSec',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aecosec.com/logo.png'
      }
    }
  };
}

// FAQ Schema Generator
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

