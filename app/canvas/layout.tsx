import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Canvas | Renderiq - Visual Node-Based Render Editor",
  description: "Create and manage render chains visually with Renderiq's canvas editor. Connect nodes, manage versions, and visualize your design workflow.",
  openGraph: {
    title: "Canvas | Renderiq - Visual Node-Based Render Editor",
    description: "Create and manage render chains visually with Renderiq's canvas editor. Connect nodes, manage versions, and visualize your design workflow.",
    type: "website",
    url: `${siteUrl}/canvas`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/canvas.jpg`,
        width: 1200,
        height: 630,
        alt: "Canvas - Visual Node-Based Render Editor",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Canvas | Renderiq - Visual Node-Based Render Editor",
    description: "Create and manage render chains visually with Renderiq's canvas editor.",
    images: [`${siteUrl}/og/canvas.jpg`],
    creator: "@Renderiq",
  },
};

export default function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

