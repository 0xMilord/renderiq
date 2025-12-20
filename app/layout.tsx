import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { TopLoader } from "@/components/top-loader";
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
import ErrorBoundary from "@/components/error-boundary";

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
    // Core AEC Terms
    "AEC software", "architecture engineering construction software", "AEC visualization platform", "AEC technology", "AEC tools",
    // Architecture Terms
    "AI architecture tools", "architectural visualization AI", "AI rendering software", "architecture render software", "architectural rendering AI",
    "architectural visualization", "architecture visualization tool", "architectural design software", "building design software", "architectural presentation software",
    "commercial architecture software", "residential architecture software", "industrial architecture software", "architectural visualization platform",
    "architecture software", "architectural software", "architect tools", "architecture tools", "architectural design tools",
    // Engineering Terms
    "engineering visualization", "structural engineering software", "MEP engineering software", "civil engineering visualization", "engineering design software",
    "engineering rendering", "engineering visualization tools", "engineering software", "engineering design tools",
    // Construction Terms
    "construction visualization", "construction software", "construction rendering", "construction visualization tool", "construction design software",
    "pre-construction visualization", "construction planning software", "construction management software", "construction visualization platform",
    // Rendering Terms
    "AI rendering", "architectural rendering", "3D rendering software", "rendering software", "architectural rendering software", "exterior rendering software",
    "interior rendering", "commercial rendering", "real estate rendering", "building rendering", "construction rendering", "architectural visualization rendering",
    "photorealistic rendering", "3D architectural rendering", "architectural rendering AI", "AI rendering engine", "rendering platform",
    // AI Terms
    "AI architecture", "AI architectural design", "AI building design", "AI visualization platform", "AI design software", "AI rendering software",
    "AI architecture platform", "AI design tool for architects", "AI visualization software", "AI architectural rendering", "AI design automation",
    "AI architecture visualization", "best AI architecture tool", "AI for architectural visualization", "AI architecture software", "AI design platform",
    "AI rendering service", "AI architectural assistant", "AI visualization tool", "AI architecture app", "AI design solution", "AI rendering platform",
    "sketch to render AI", "AI interior design tool", "AI exterior rendering", "AI furniture placement", "AI site planning", "architectural AI assistant",
    // Software Terms
    "architecture software", "design software", "visualization software", "rendering software", "CAD software", "BIM software", "architecture design software",
    "3D architecture software", "architectural design software", "building design software", "interior design software", "exterior design software",
    // Long-tail Keywords for PPA/PAA
    "how to create architectural renders", "best AI architecture rendering software", "architectural rendering cost", "AI architecture pricing",
    "what is AEC software", "architecture rendering software free", "professional architectural rendering software", "architectural visualization services",
    "AI architecture tools for architects", "architectural rendering software comparison", "how much does architectural rendering cost",
    "best software for architectural visualization", "architectural rendering software for beginners", "commercial architectural rendering software",
    "residential architectural rendering software", "industrial architectural rendering software", "architectural rendering software reviews",
    "top architectural rendering software", "architectural rendering software features", "architectural visualization workflow",
    "how to use AI for architectural rendering", "architectural rendering software tutorial", "architectural rendering software guide"
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
        <link rel="manifest" href="/manifest.json" />
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
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-T7XGR57L');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased m-0 p-0`}
      >
        <TopLoader />
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-T7XGR57L"
            height="0" 
            width="0" 
            style={{display:'none',visibility:'hidden'}}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
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
            gtag('config', 'G-Z8NSF00GYD', {
              anonymize_ip: true,
            });
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
          <ErrorBoundary>
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
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
