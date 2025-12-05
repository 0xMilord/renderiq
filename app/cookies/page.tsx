import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Cookie, Settings, Eye, Shield, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Cookie Policy | Renderiq - AI Architectural Visualization",
  description: "Learn about how Renderiq uses cookies and similar technologies to enhance your experience and improve our services.",
  robots: "index, follow",
  openGraph: {
    title: "Cookie Policy | Renderiq - AI Architectural Visualization",
    description: "Learn about how Renderiq uses cookies and similar technologies to enhance your experience and improve our services.",
    type: "website",
    url: `${siteUrl}/cookies`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/cookies.jpg`,
        width: 1200,
        height: 630,
        alt: "Cookie Policy - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy | Renderiq",
    description: "Learn about how Renderiq uses cookies and similar technologies.",
    images: [`${siteUrl}/og/cookies.jpg`],
    creator: "@Renderiq",
  },
};

const cookieCategories = [
  {
    icon: Shield,
    title: "Essential Cookies",
    description: "Required for the Service to function properly",
    required: true,
    cookies: [
      {
        name: "Authentication Session",
        purpose: "Maintains your login session",
        duration: "Session",
        provider: "Renderiq"
      },
      {
        name: "CSRF Token",
        purpose: "Protects against cross-site request forgery attacks",
        duration: "Session",
        provider: "Renderiq"
      },
      {
        name: "Security Preferences",
        purpose: "Stores your security and privacy preferences",
        duration: "1 year",
        provider: "Renderiq"
      }
    ]
  },
  {
    icon: Settings,
    title: "Functional Cookies",
    description: "Enhance functionality and personalization",
    required: false,
    cookies: [
      {
        name: "Theme Preference",
        purpose: "Remembers your light/dark theme choice",
        duration: "1 year",
        provider: "Renderiq"
      },
      {
        name: "Language Preference",
        purpose: "Stores your preferred language",
        duration: "1 year",
        provider: "Renderiq"
      },
      {
        name: "User Preferences",
        purpose: "Remembers your UI preferences and settings",
        duration: "1 year",
        provider: "Renderiq"
      }
    ]
  },
  {
    icon: Database,
    title: "Analytics Cookies",
    description: "Help us understand how visitors use our Service",
    required: false,
    cookies: [
      {
        name: "Usage Analytics",
        purpose: "Tracks page views, feature usage, and user interactions",
        duration: "2 years",
        provider: "Renderiq (First-party)"
      },
      {
        name: "Performance Metrics",
        purpose: "Monitors platform performance and error rates",
        duration: "1 year",
        provider: "Renderiq"
      }
    ]
  },
  {
    icon: Eye,
    title: "Marketing Cookies",
    description: "Used to deliver relevant advertisements (if applicable)",
    required: false,
    cookies: [
      {
        name: "Marketing Preferences",
        purpose: "Tracks your marketing consent preferences",
        duration: "1 year",
        provider: "Renderiq"
      }
    ]
  }
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6">
            <Cookie className="w-4 h-4" />
            <span className="text-sm font-medium">Cookie Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Cookie Policy
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Last updated: January 15, 2025
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            This Cookie Policy explains how Renderiq uses cookies and similar technologies when you visit 
            our platform, what these technologies are used for, and how you can control them.
          </p>
        </div>
      </section>

      {/* Important Notice */}
      <section className="px-4 -mt-8">
        <div className="container mx-auto max-w-4xl">
          <Alert>
            <Cookie className="h-4 w-4" />
            <AlertDescription>
              <strong>Cookie Consent:</strong> Essential cookies are required for the Service to function. 
              You can manage your cookie preferences through your account settings or browser settings.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* What Are Cookies */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">What Are Cookies?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cookies are small text files that are placed on your device (computer, tablet, or mobile) when 
                you visit a website. They are widely used to make websites work more efficiently and provide 
                information to website owners.
              </p>
              <p className="text-muted-foreground">
                We use cookies and similar technologies (such as web beacons, pixels, and local storage) to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Keep you signed in and maintain your session</li>
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our Service</li>
                <li>Improve our platform's performance and functionality</li>
                <li>Provide personalized features</li>
              </ul>
            </CardContent>
          </Card>

          {/* Cookie Categories */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Types of Cookies We Use</h2>
            <div className="space-y-6">
              {cookieCategories.map((category, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <category.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {category.title}
                          {category.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          {!category.required && (
                            <Badge variant="secondary" className="text-xs">Optional</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-normal mt-1">
                          {category.description}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.cookies.map((cookie, i) => (
                        <div key={i} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-sm">{cookie.name}</p>
                            <Badge variant="outline" className="text-xs">{cookie.duration}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{cookie.purpose}</p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Provider:</strong> {cookie.provider}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Third-Party Cookies */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We may use third-party services that set their own cookies. These include:
              </p>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Payment Processing (Razorpay)</h3>
                  <p className="text-sm text-muted-foreground">
                    Razorpay uses cookies to process payments securely and prevent fraud. These cookies are 
                    essential for payment functionality.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Cloud Hosting (Supabase)</h3>
                  <p className="text-sm text-muted-foreground">
                    Supabase may use cookies for authentication and session management. These are essential 
                    for Service functionality.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Managing Cookies */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Managing Your Cookie Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Browser Settings</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  Most browsers allow you to control cookies through their settings. You can:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Block all cookies</li>
                  <li>Block third-party cookies</li>
                  <li>Delete existing cookies</li>
                  <li>Set preferences for specific websites</li>
                </ul>
                <p className="text-muted-foreground text-sm mt-2">
                  <strong>Note:</strong> Blocking essential cookies may prevent the Service from functioning properly.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Account Settings</h3>
                <p className="text-muted-foreground text-sm">
                  You can manage your cookie preferences through your account settings at Dashboard → Settings → Privacy. 
                  You can opt-out of non-essential cookies while keeping essential cookies enabled.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Browser-Specific Instructions</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
                  <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                  <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                  <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Do Not Track */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-xl">Do Not Track Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Some browsers include a "Do Not Track" (DNT) feature that signals websites you visit that you 
                do not want to have your online activity tracked. Currently, there is no standard for how DNT 
                signals should be interpreted. We do not currently respond to DNT signals, but we respect your 
                privacy choices through our cookie preferences.
              </p>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-xl">Updates to This Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for 
                other operational, legal, or regulatory reasons. We will notify you of any material changes by 
                posting the updated policy on this page and updating the "Last updated" date.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have questions about our use of cookies, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> privacy@renderiq.io</p>
                <p><strong>Support:</strong> support@renderiq.io</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}


