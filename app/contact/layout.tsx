import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Contact Us | Renderiq - AI Architectural Visualization Platform",
  description: "Get in touch with Renderiq. Contact our team for support, sales inquiries, partnerships, or general questions about our AI architectural visualization platform.",
  robots: "index, follow",
  openGraph: {
    title: "Contact Us | Renderiq - AI Architectural Visualization Platform",
    description: "Get in touch with Renderiq. Contact our team for support, sales inquiries, partnerships, or general questions about our AI architectural visualization platform.",
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
    description: "Get in touch with Renderiq. Contact our team for support, sales inquiries, partnerships, or general questions.",
    images: [`${siteUrl}/og/contact.jpg`],
    creator: "@Renderiq",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

