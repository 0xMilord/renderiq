import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Sign Up | Renderiq - Create Your Free Account",
  description: "Join Renderiq and start creating stunning AI-powered architectural visualizations. Sign up for free with Google, GitHub, or email. No credit card required.",
  openGraph: {
    title: "Sign Up | Renderiq - Create Your Free Account",
    description: "Join Renderiq and start creating stunning AI-powered architectural visualizations. Sign up for free with Google, GitHub, or email. No credit card required.",
    type: "website",
    url: `${siteUrl}/signup`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/signup.jpg`,
        width: 1200,
        height: 630,
        alt: "Sign Up - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign Up | Renderiq - Create Your Free Account",
    description: "Join Renderiq and start creating stunning AI-powered architectural visualizations. Free tier available.",
    images: [`${siteUrl}/og/signup.jpg`],
    creator: "@Renderiq",
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

