import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { BottomNav } from "@/components/bottom-nav";
import { ConditionalFooter } from "@/components/conditional-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { UserOnboardingProvider } from "@/components/user-onboarding-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { JsonLd, organizationSchema, softwareSchema, websiteSchema, comprehensiveFAQSchema } from "@/components/seo/json-ld";
import { SEOMonitor, SEOAnalytics } from "@/components/seo/seo-monitor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://arqihive.com'),
  title: {
    default: "arqihive - AI Architectural Visualization & Rendering Platform",
    template: "%s | arqihive"
  },
  description: "Transform architectural sketches into hyperrealistic AI renders and videos using advanced artificial intelligence. The best AI architecture tool for architects, designers, and developers. Create stunning visualizations in minutes with our AI-powered rendering platform.",
  keywords: [
    "AI architecture tools",
    "architectural visualization AI",
    "AI rendering software",
    "sketch to render AI",
    "AI architectural design",
    "AI interior design tool",
    "AI exterior rendering",
    "AI furniture placement",
    "AI site planning",
    "architectural AI assistant",
    "AI building design",
    "AI visualization platform",
    "AI design software",
    "AI rendering engine",
    "AI architecture platform",
    "AI design tool for architects",
    "AI visualization software",
    "AI architectural rendering",
    "AI design automation",
    "AI architecture visualization",
    "best AI architecture tool",
    "AI for architectural visualization",
    "AI architecture software",
    "AI design platform",
    "AI rendering service",
    "AI architectural assistant",
    "AI visualization tool",
    "AI architecture app",
    "AI design solution",
    "AI rendering platform"
  ],
  authors: [{ name: "arqihive" }],
  creator: "arqihive",
  publisher: "arqihive",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://arqihive.com',
    siteName: "arqihive",
    title: "arqihive - AI Architectural Visualization & Rendering",
    description: "Transform architectural designs into photorealistic renders with AI. Real-time visualization for architects and designers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "arqihive - AI Architectural Visualization"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "arqihive - AI Architectural Visualization",
    description: "Transform architectural designs into photorealistic renders with AI",
    images: ["/og-image.png"],
    creator: "@arqihive"
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
        <JsonLd data={comprehensiveFAQSchema} />
        <SEOMonitor />
        <SEOAnalytics />
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
