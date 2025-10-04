import Script from 'next/script';

interface StructuredDataProps {
  type: 'organization' | 'software' | 'product' | 'faq' | 'article';
  data: Record<string, any>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const getSchema = () => {
    switch (type) {
      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "arqihive",
          "url": "https://arqihive.com",
          "logo": "https://arqihive.com/logo.png",
          "description": "AI-powered architectural visualization platform that transforms sketches into hyperrealistic renders and videos",
          "foundingDate": "2024",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-555-ARQIHIVE",
            "contactType": "customer service",
            "email": "support@arqihive.com"
          },
          "sameAs": [
            "https://twitter.com/arqihive",
            "https://linkedin.com/company/arqihive",
            "https://github.com/arqihive"
          ],
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "US"
          }
        };

      case 'software':
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "arqihive",
          "applicationCategory": "DesignApplication",
          "operatingSystem": "Web Browser",
          "url": "https://arqihive.com",
          "description": "Transform architectural sketches into hyperrealistic AI renders and videos using advanced AI technology",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Free tier with 10 credits"
          },
          "featureList": [
            "AI-powered architectural rendering",
            "Sketch to photorealistic visualization",
            "Real-time design iteration",
            "Video generation from sketches",
            "Multiple AI engines (Exterior, Interior, Furniture, Site Planning)",
            "High-resolution output (up to 4K)",
            "Batch processing capabilities",
            "Custom style presets",
            "API access for enterprise",
            "Secure and private processing"
          ],
          "screenshot": "https://arqihive.com/screenshot.png",
          "author": {
            "@type": "Organization",
            "name": "arqihive"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1250",
            "bestRating": "5",
            "worstRating": "1"
          },
          "review": [
            {
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5"
              },
              "author": {
                "@type": "Person",
                "name": "Sarah Chen"
              },
              "reviewBody": "arqihive has revolutionized our architectural visualization workflow. The AI quality is exceptional and saves us hours of work."
            }
          ]
        };

      case 'product':
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "arqihive AI Architecture Platform",
          "description": "AI-powered architectural visualization platform for architects and designers",
          "brand": {
            "@type": "Brand",
            "name": "arqihive"
          },
          "category": "Architecture Software",
          "offers": [
            {
              "@type": "Offer",
              "name": "Free Plan",
              "price": "0",
              "priceCurrency": "USD",
              "description": "10 free credits to get started"
            },
            {
              "@type": "Offer",
              "name": "Starter Plan",
              "price": "29",
              "priceCurrency": "USD",
              "description": "100 credits per month"
            },
            {
              "@type": "Offer",
              "name": "Professional Plan",
              "price": "99",
              "priceCurrency": "USD",
              "description": "500 credits per month"
            }
          ],
          "audience": {
            "@type": "Audience",
            "audienceType": "Architects, Interior Designers, Real Estate Developers"
          }
        };

      case 'faq':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is arqihive?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "arqihive is an AI-powered architectural visualization platform that transforms sketches into hyperrealistic renders and videos using advanced artificial intelligence technology."
              }
            },
            {
              "@type": "Question",
              "name": "How does AI architectural rendering work?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our AI engines analyze your architectural sketches and generate photorealistic visualizations by understanding design elements, materials, lighting, and spatial relationships. The process takes minutes instead of hours."
              }
            },
            {
              "@type": "Question",
              "name": "What types of projects can I create?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "You can create interior designs, exterior architecture, furniture layouts, site plans, and more. Our AI supports residential, commercial, hospitality, retail, and educational facility designs."
              }
            },
            {
              "@type": "Question",
              "name": "Is my data secure?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, we use enterprise-grade security with GDPR compliance, SOC 2 certification, and end-to-end encryption to protect your designs and data."
              }
            },
            {
              "@type": "Question",
              "name": "Can I integrate arqihive with my existing workflow?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes, we offer API access, CAD software compatibility, cloud storage sync, and various export formats to integrate seamlessly with your design workflow."
              }
            }
          ]
        };

      case 'article':
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": data.title || "AI Architectural Visualization Guide",
          "description": data.description || "Learn how AI is transforming architectural visualization",
          "author": {
            "@type": "Organization",
            "name": "arqihive"
          },
          "publisher": {
            "@type": "Organization",
            "name": "arqihive",
            "logo": {
              "@type": "ImageObject",
              "url": "https://arqihive.com/logo.png"
            }
          },
          "datePublished": data.datePublished || new Date().toISOString(),
          "dateModified": data.dateModified || new Date().toISOString(),
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url || "https://arqihive.com"
          },
          "image": data.image || "https://arqihive.com/article-image.png"
        };

      default:
        return data;
    }
  };

  const schema = getSchema();

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 2)
      }}
    />
  );
}
