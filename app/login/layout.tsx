import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Login | Renderiq - Sign In to Your Account",
  description: "Sign in to your Renderiq account to access AI-powered architectural visualization tools. Login with Google, GitHub, or email.",
  openGraph: {
    title: "Login | Renderiq - Sign In to Your Account",
    description: "Sign in to your Renderiq account to access AI-powered architectural visualization tools. Login with Google, GitHub, or email.",
    type: "website",
    url: `${siteUrl}/login`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/login.jpg`,
        width: 1200,
        height: 630,
        alt: "Login - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Login | Renderiq - Sign In to Your Account",
    description: "Sign in to your Renderiq account to access AI-powered architectural visualization tools.",
    images: [`${siteUrl}/og/login.jpg`],
    creator: "@Renderiq",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

