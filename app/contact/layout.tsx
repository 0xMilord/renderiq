import { Metadata } from "next";
import { JsonLd } from '@/components/seo/json-ld';
import { generateContactPageSchema } from '@/components/seo/json-ld';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

// ContactPage schema
const contactPageSchema = generateContactPageSchema({
  name: 'Renderiq',
  url: `${siteUrl}/contact`,
  email: 'support@renderiq.io',
  telephone: undefined, // Add if available
  address: {
    addressCountry: 'US'
  }
});

export const metadata: Metadata = {
  title: "Contact Us | Renderiq - AI Architectural Visualization Platform",
  description: "Contact Renderiq for support, sales, partnerships, or general inquiries about our AI architectural visualization platform. We respond within 24 hours. Get help with AEC software, architectural rendering, and visualization tools.",
  keywords: [
    "contact Renderiq", "Renderiq support", "AI architecture support", "architectural rendering support", "AEC software support",
    "architecture software contact", "rendering software support", "architectural visualization support", "AI architecture help",
    "architecture software customer service", "rendering software contact", "AEC software contact", "architectural design software support"
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Contact Us | Renderiq - AI Architectural Visualization Platform",
    description: "Contact Renderiq for support, sales, partnerships, or general inquiries. We respond within 24 hours.",
    type: "website",
    url: `${siteUrl}/contact`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/contact.jpg`,
        width: 1200,
        height: 630,
        alt: "Contact Renderiq - AI Architectural Visualization Platform",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Renderiq - AI Architectural Visualization Platform",
    description: "Contact Renderiq for support, sales, partnerships, or general inquiries. We respond within 24 hours.",
    images: [`${siteUrl}/og/contact.jpg`],
    creator: "@Renderiq",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={contactPageSchema} />
      {children}
    </>
  );
}

