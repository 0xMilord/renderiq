import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { ConditionalFooter } from "@/components/conditional-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { UserOnboardingProvider } from "@/components/user-onboarding-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { JsonLd, organizationSchema, softwareSchema, websiteSchema } from "@/components/seo/json-ld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://aecosec.com'),
  title: {
    default: "AecoSec - AI Architectural Visualization & Rendering Platform",
    template: "%s | AecoSec"
  },
  description: "Transform architectural designs into photorealistic renders with AI. Real-time visualization, rapid prototyping, and intelligent material testing for architects and designers. Try our AI-powered interior design, exterior rendering, and site planning tools.",
  keywords: [
    "AI architecture",
    "architectural visualization",
    "AI rendering",
    "architectural design AI",
    "real-time architectural visualization",
    "AI interior design",
    "architectural rendering software",
    "3D rendering AI",
    "building design AI",
    "AI exterior design",
    "architectural AI software",
    "rapid prototyping architecture",
    "material testing AI",
    "generative design architecture",
    "computational design",
    "AI for architects"
  ],
  authors: [{ name: "AecoSec" }],
  creator: "AecoSec",
  publisher: "AecoSec",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://aecosec.com',
    siteName: "AecoSec",
    title: "AecoSec - AI Architectural Visualization & Rendering",
    description: "Transform architectural designs into photorealistic renders with AI. Real-time visualization for architects and designers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AecoSec - AI Architectural Visualization"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "AecoSec - AI Architectural Visualization",
    description: "Transform architectural designs into photorealistic renders with AI",
    images: ["/og-image.png"],
    creator: "@aecosec"
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
  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JsonLd data={organizationSchema} />
        <JsonLd data={softwareSchema} />
        <JsonLd data={websiteSchema} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <UserOnboardingProvider>
              <Navbar />
              <main className="min-h-screen">
                {children}
              </main>
              <ConditionalFooter />
              <BottomNav />
            </UserOnboardingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
