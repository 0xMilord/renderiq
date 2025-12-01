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
  name: 'Renderiq',
  url: 'https://Renderiq.com',
  logo: 'https://Renderiq.com/logo.png',
  description: 'AI-powered architectural visualization and rendering platform for architects and designers',
  sameAs: [
    'https://twitter.com/Renderiq',
    'https://linkedin.com/company/Renderiq',
    'https://github.com/Renderiq'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@Renderiq.com',
    contactType: 'Customer Support',
    availableLanguage: ['English']
  }
};

// Software Application Schema - Enhanced for AI discoverability
export const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Renderiq',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web Browser',
  url: 'https://Renderiq.com',
  description: 'Transform architectural sketches into hyperrealistic AI renders and videos using advanced artificial intelligence technology',
  offers: [
    {
      '@type': 'Offer',
      name: 'Free Plan',
      price: '0',
      priceCurrency: 'USD',
      description: '10 free credits to get started with AI rendering'
    },
    {
      '@type': 'Offer',
      name: 'Starter Plan',
      price: '29',
      priceCurrency: 'USD',
      description: '100 AI rendering credits per month'
    },
    {
      '@type': 'Offer',
      name: 'Professional Plan',
      price: '99',
      priceCurrency: 'USD',
      description: '500 AI rendering credits per month'
    }
  ],
  featureList: [
    'AI-powered architectural rendering',
    'Sketch to photorealistic visualization',
    'Real-time design iteration',
    'Video generation from sketches',
    'Multiple AI engines (Exterior, Interior, Furniture, Site Planning)',
    'High-resolution output (up to 4K)',
    'Batch processing capabilities',
    'Custom style presets',
    'API access for enterprise',
    'Secure and private processing',
    'Material and lighting testing',
    'Rapid prototyping',
    'Client presentation tools'
  ],
  screenshot: 'https://Renderiq.com/screenshot.png',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1250',
    bestRating: '5',
    worstRating: '1'
  },
  review: [
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Sarah Chen'
      },
      reviewBody: 'Renderiq has revolutionized our architectural visualization workflow. The AI quality is exceptional and saves us hours of work.'
    }
  ],
  audience: {
    '@type': 'Audience',
    audienceType: 'Architects, Interior Designers, Real Estate Developers, Construction Companies'
  },
  author: {
    '@type': 'Organization',
    name: 'Renderiq'
  }
};

// WebSite Schema
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Renderiq',
  url: 'https://Renderiq.com',
  description: 'Transform architectural designs into photorealistic renders with AI',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://Renderiq.com/search?q={search_term_string}',
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
  author = 'Renderiq',
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
    image: image || 'https://Renderiq.com/og-image.jpg',
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      name: 'Renderiq',
      logo: {
        '@type': 'ImageObject',
        url: 'https://Renderiq.com/logo.png'
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

// Comprehensive FAQ Schema for AI discoverability
export const comprehensiveFAQSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Renderiq?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Renderiq is an AI-powered architectural visualization platform that transforms sketches into hyperrealistic renders and videos using advanced artificial intelligence technology. It helps architects, designers, and developers create stunning visualizations in minutes instead of hours.'
      }
    },
    {
      '@type': 'Question',
      name: 'How does AI architectural rendering work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our AI engines analyze your architectural sketches and generate photorealistic visualizations by understanding design elements, materials, lighting, and spatial relationships. The AI processes your input through multiple specialized engines for exterior, interior, furniture placement, and site planning.'
      }
    },
    {
      '@type': 'Question',
      name: 'What types of architectural projects can I create?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can create interior designs, exterior architecture, furniture layouts, site plans, and more. Our AI supports residential, commercial, hospitality, retail, educational facilities, landscape architecture, urban planning, and renovation projects.'
      }
    },
    {
      '@type': 'Question',
      name: 'Is my architectural data secure and private?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we use enterprise-grade security with GDPR compliance, SOC 2 certification, and end-to-end encryption to protect your designs and data. Your projects remain private unless you choose to share them in our public gallery.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I integrate Renderiq with my existing design workflow?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we offer API access, CAD software compatibility, cloud storage sync, and various export formats to integrate seamlessly with your design workflow. We support integration with popular architecture and design software.'
      }
    },
    {
      '@type': 'Question',
      name: 'What is the pricing for AI architectural rendering?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We offer a free plan with 10 credits to get started. Our Starter plan is $29/month with 100 credits, and Professional plan is $99/month with 500 credits. Enterprise plans are available with custom pricing and features.'
      }
    },
    {
      '@type': 'Question',
      name: 'How fast is the AI rendering process?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our AI rendering typically completes in 2-5 minutes for most architectural visualizations. This is significantly faster than traditional rendering methods that can take hours or days.'
      }
    },
    {
      '@type': 'Question',
      name: 'What output formats are available?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We support high-resolution image exports up to 4K, video animations, and various file formats compatible with design software. You can also export for presentations, marketing materials, and client deliverables.'
      }
    },
    {
      '@type': 'Question',
      name: 'Do you offer customer support for architects?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we provide comprehensive customer support including documentation, video tutorials, community forum, email support, and live chat for Pro plan subscribers. Enterprise customers receive dedicated support.'
      }
    },
    {
      '@type': 'Question',
      name: 'Can I use Renderiq for client presentations?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely! Our AI-generated renders are perfect for client presentations, proposals, and marketing materials. The photorealistic quality helps clients visualize projects before construction begins.'
      }
    }
  ]
};

