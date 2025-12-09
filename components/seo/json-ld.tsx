interface JsonLdProps {
  data: Record<string, any>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/[<>]/g, '') }}
    />
  );
}

// Organization Schema
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Renderiq',
  url: 'https://renderiq.io',
  logo: 'https://renderiq.io/logo.svg',
  description: 'AI-powered architectural visualization and rendering platform for architects and designers',
  sameAs: [
    'https://bsky.app/profile/renderiq.bsky.social',
    'https://x.com/renderiq_ai',
    'https://github.com/renderiq-ai',
    'https://www.linkedin.com/company/renderiq-ai',
    'https://www.instagram.com/renderiq.ai',
    'https://www.youtube.com/@Renderiq_ai',
    'https://www.reddit.com/user/Renderiq-AI/',
    'https://www.threads.com/@renderiq.ai',
    'https://www.quora.com/profile/Renderiq',
    'https://discord.gg/KADV5pX3'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@renderiq.io',
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
  url: 'https://renderiq.io',
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
  screenshot: 'https://renderiq.io/screenshot.png',
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
        name: 'Mahendra Yadav'
      },
      reviewBody: 'Renderiq has revolutionized our architectural visualization workflow. The AI quality is exceptional and saves us hours of work.'
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Suresh Thakur'
      },
      reviewBody: 'As an interior designer in Bengaluru, I am genuinely impressed by the quality of renders. It’s made client approvals much faster!'
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Amar Singh'
      },
      reviewBody: 'Uploading my sketch and seeing it turn into a realistic 3D image feels like magic. Renderiq is a game changer for small studios in India.'
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Jessica Patel'
      },
      reviewBody: 'Super easy to use and the renders look like real photos! My clients have loved the visualisations for our new project pitches.'
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Tom Hargreaves'
      },
      reviewBody: "Brilliant tool. I’ve worked in London for years as an architect and this beats more complex software for speed and efficiency."
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Saanvi Menon'
      },
      reviewBody: "Tried Renderiq for a hospitality concept. Absolutely loved the lighting effects and options for material choices. Highly recommended."
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Imran Qureshi'
      },
      reviewBody: "The batch processing lets my team deliver more proposals in less time. Great for busy real estate marketing agencies in Delhi NCR."
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Emily Robinson'
      },
      reviewBody: "Renderiq is a fantastic addition to our London practice! The AI is impressive, only wish there were more style presets for UK homes."
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Rakesh Kumar'
      },
      reviewBody: "Super intuitive. I submitted a site plan and got a photorealistic visual in minutes. Loved the client feedback features as well."
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Anna Carter'
      },
      reviewBody: "Couldn’t believe how natural the videos looked! It’s helped us win a couple of new contracts here in Manchester."
    },
    {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '4',
        bestRating: '5'
      },
      author: {
        '@type': 'Person',
        name: 'Nikhil Joshi'
      },
      reviewBody: "Renderiq has made a positive difference for my architectural startup in Pune. The high-res export is great for presentations."
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
  url: 'https://renderiq.io',
  description: 'Transform architectural designs into photorealistic renders with AI',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://renderiq.io/search?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
};

// SiteNavigationElement Schema
export const siteNavigationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SiteNavigationElement',
  name: 'Main Navigation',
  url: 'https://renderiq.io',
  hasPart: [
    {
      '@type': 'SiteNavigationElement',
      name: 'Home',
      url: 'https://renderiq.io'
    },
    {
      '@type': 'SiteNavigationElement',
      name: 'Gallery',
      url: 'https://renderiq.io/gallery'
    },
    {
      '@type': 'SiteNavigationElement',
      name: 'Blog',
      url: 'https://renderiq.io/blog'
    },
    {
      '@type': 'SiteNavigationElement',
      name: 'Pricing',
      url: 'https://renderiq.io/pricing'
    },
    {
      '@type': 'SiteNavigationElement',
      name: 'Use Cases',
      url: 'https://renderiq.io/use-cases'
    },
    {
      '@type': 'SiteNavigationElement',
      name: 'About',
      url: 'https://renderiq.io/about'
    }
  ]
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
    image: image || 'https://renderiq.io/og-image.jpg',
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
        url: 'https://renderiq.io/logo.svg'
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

// Comprehensive FAQ Schema for AI discoverability - Enhanced for PPA/PAA optimization
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
        text: 'You can create interior designs, exterior architecture, furniture layouts, site plans, and more. Our AI supports residential, commercial, hospitality, institutional, educational facilities, landscape architecture, urban planning, and renovation projects.'
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
    },
    // Additional PPA/PAA optimized questions
    {
      '@type': 'Question',
      name: 'What is the best AI architecture rendering software?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Renderiq is the best AI architecture rendering software for AEC professionals. It uses multiple state-of-the-art AI models including Google Gemini for image generation, Veo for video generation, and Hunyuan3D for 3D model creation. Our architecture-aware models maintain design accuracy, proper proportions, and photorealistic quality. Our platform offers specialized tools for exterior, interior, furniture placement, and site planning.'
      }
    },
    {
      '@type': 'Question',
      name: 'How much does architectural rendering cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Renderiq offers affordable architectural rendering starting with a free plan (10 credits). Our Starter plan is $29/month (100 credits), Professional is $99/month (500 credits), and Enterprise plans have custom pricing. This is significantly more cost-effective than traditional rendering services that charge $500-$2000 per render.'
      }
    },
    {
      '@type': 'Question',
      name: 'What is AEC software?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AEC software refers to Architecture, Engineering, and Construction software used by professionals in these industries. Renderiq is an AEC visualization platform that helps architects, engineers, and construction professionals create photorealistic renders, floor plans, site plans, and design visualizations using AI technology.'
      }
    },
    {
      '@type': 'Question',
      name: 'How do I create architectural renders?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'To create architectural renders with Renderiq, simply upload your sketch or describe your design in our unified AI chat interface. Our AI analyzes your input and generates photorealistic renders in 2-5 minutes. You can iterate, refine materials, adjust lighting, and create multiple variations quickly.'
      }
    }
  ]
};

// QAPage Schema Generator for PPA/PAA optimization (People Also Ask)
export function generateQAPageSchema(questions: { question: string; answer: string; author?: string; dateCreated?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: questions[0]?.question || 'Question',
      text: questions[0]?.question || 'Question',
      dateCreated: questions[0]?.dateCreated || new Date().toISOString(),
      author: {
        '@type': 'Organization',
        name: questions[0]?.author || 'Renderiq'
      },
      acceptedAnswer: questions.map(q => ({
        '@type': 'Answer',
        text: q.answer,
        dateCreated: q.dateCreated || new Date().toISOString(),
        author: {
          '@type': 'Organization',
          name: q.author || 'Renderiq'
        }
      })),
      suggestedAnswer: questions.slice(1).map(q => ({
        '@type': 'Answer',
        text: q.answer,
        dateCreated: q.dateCreated || new Date().toISOString(),
        author: {
          '@type': 'Organization',
          name: q.author || 'Renderiq'
        }
      }))
    }
  };
}

// HowTo Schema Generator for featured snippet optimization
export function generateHowToSchema({
  name,
  description,
  image,
  totalTime,
  estimatedCost,
  supply,
  tool,
  step
}: {
  name: string;
  description: string;
  image?: string;
  totalTime?: string;
  estimatedCost?: { currency: string; value: string };
  supply?: Array<{ '@type': 'HowToSupply'; name: string }>;
  tool?: Array<{ '@type': 'HowToTool'; name: string }>;
  step: Array<{
    '@type': 'HowToStep';
    name: string;
    text: string;
    image?: string;
    url?: string;
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    image: image || 'https://renderiq.io/og-image.jpg',
    totalTime: totalTime || 'PT5M',
    estimatedCost: estimatedCost ? {
      '@type': 'MonetaryAmount',
      currency: estimatedCost.currency,
      value: estimatedCost.value
    } : undefined,
    supply: supply || [],
    tool: tool || [{ '@type': 'HowToTool', name: 'Renderiq AI Platform' }],
    step: step.map((s, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: s.name,
      text: s.text,
      image: s.image,
      url: s.url
    }))
  };
}

// Product Schema Generator for pricing pages
export function generateProductSchema({
  name,
  description,
  image,
  brand = 'Renderiq',
  offers
}: {
  name: string;
  description: string;
  image?: string;
  brand?: string;
  offers: Array<{
    name: string;
    price: string;
    priceCurrency: string;
    availability: string;
    url?: string;
    description?: string;
  }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image || 'https://renderiq.io/og-image.jpg',
    brand: {
      '@type': 'Brand',
      name: brand
    },
    category: 'Software',
    offers: offers.map(offer => ({
      '@type': 'Offer',
      name: offer.name,
      price: offer.price,
      priceCurrency: offer.priceCurrency,
      availability: `https://schema.org/${offer.availability}`,
      url: offer.url,
      description: offer.description
    }))
  };
}

// ContactPage Schema Generator
export function generateContactPageSchema({
  name = 'Renderiq',
  url,
  telephone,
  email,
  address
}: {
  name?: string;
  url: string;
  telephone?: string;
  email?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: `${name} - Contact Us`,
    url,
    mainEntity: {
      '@type': 'Organization',
      name,
      url,
      contactPoint: [{
        '@type': 'ContactPoint',
        telephone,
        email,
        contactType: 'Customer Support',
        availableLanguage: ['English']
      }],
      address: address ? {
        '@type': 'PostalAddress',
        ...address
      } : undefined
    }
  };
}

// AboutPage Schema Generator
export function generateAboutPageSchema({
  name = 'Renderiq',
  description,
  url,
  foundingDate,
  founder
}: {
  name?: string;
  description: string;
  url: string;
  foundingDate?: string;
  founder?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${name}`,
    description,
    url,
    mainEntity: {
      '@type': 'Organization',
      name,
      description,
      url,
      foundingDate,
      founder: founder ? {
        '@type': 'Person',
        name: founder
      } : undefined
    }
  };
}

