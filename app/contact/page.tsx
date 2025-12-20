import { Metadata } from 'next';
import { ContactClient } from './contact-client';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

// Force dynamic rendering to avoid SSR context issues
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Contact Us | Renderiq - AI Architectural Visualization",
  description: "Get in touch with Renderiq. Contact us for support, sales inquiries, partnerships, or general questions about our AI architectural rendering platform.",
  robots: "index, follow",
  openGraph: {
    title: "Contact Us | Renderiq - AI Architectural Visualization",
    description: "Get in touch with Renderiq. Contact us for support, sales inquiries, partnerships, or general questions.",
    type: "website",
    url: `${siteUrl}/contact`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/contact.jpg`,
        width: 1200,
        height: 630,
        alt: "Contact Us - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Renderiq",
    description: "Get in touch with Renderiq. Contact us for support, sales inquiries, partnerships, or general questions.",
    images: [`${siteUrl}/og/contact.jpg`],
    creator: "@Renderiq",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
