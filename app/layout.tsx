import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ConditionalNavbar } from "@/components/conditional-navbar";
import { BottomNav } from "@/components/bottom-nav";
import { ConditionalFooter } from "@/components/conditional-footer";
import { ThemeProvider } from "@/components/theme-provider";
import { UserOnboardingProvider } from "@/components/user-onboarding-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { JsonLd, organizationSchema, softwareSchema, websiteSchema, comprehensiveFAQSchema, siteNavigationSchema } from "@/components/seo/json-ld";
import { SEOMonitor, SEOAnalytics } from "@/components/seo/seo-monitor";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { UpdateNotification } from "@/components/pwa/update-notification";
import { InstallSuccessToast } from "@/components/pwa/install-success-toast";
import { ConsoleSecurityWarning } from "@/components/security/console-warning";
import { PostInstallSetup } from "@/components/pwa/post-install-setup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io'),
  title: {
    default: "Renderiq - AI Architectural Visualization & Rendering Platform",
    template: "%s | Renderiq"
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
  authors: [{ name: "Renderiq" }],
  creator: "Renderiq",
  publisher: "Renderiq",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://renderiq.io',
    siteName: "Renderiq",
    title: "Renderiq - AI Architectural Visualization & Rendering",
    description: "Transform architectural designs into photorealistic renders with AI. Real-time visualization for architects and designers.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Renderiq - AI Architectural Visualization"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Renderiq - AI Architectural Visualization",
    description: "Transform architectural designs into photorealistic renders with AI",
    images: ["/og-image.jpg"],
    creator: "@Renderiq"
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
      <head>
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668x2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
        <meta name="theme-color" content="#D1F24A" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#22c55e" media="(prefers-color-scheme: light)" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Renderiq" />
        <style dangerouslySetInnerHTML={{
          __html: `
            html { 
              background-color: hsl(var(--background)); 
            }
            body { 
              background-color: hsl(var(--background)); 
            }
          `
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased m-0 p-0`}
      >
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Z8NSF00GYD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Z8NSF00GYD');
          `}
        </Script>
        <JsonLd data={organizationSchema} />
        <JsonLd data={softwareSchema} />
        <JsonLd data={websiteSchema} />
        <JsonLd data={comprehensiveFAQSchema} />
        <JsonLd data={siteNavigationSchema} />
        <SEOMonitor />
        <SEOAnalytics />
        <ServiceWorkerRegister />
        <UpdateNotification />
        <InstallSuccessToast />
        <PostInstallSetup />
        <ConsoleSecurityWarning />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <UserOnboardingProvider>
              <ConditionalNavbar />
              <main>
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
