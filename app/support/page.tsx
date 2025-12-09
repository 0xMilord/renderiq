import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, HelpCircle, Mail, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Support Policy | Renderiq - AI Architectural Visualization",
  description: "Learn about Renderiq's support policy, response times, support channels, and how we help you succeed with our platform.",
  keywords: [
    'Renderiq support',
    'customer support',
    'technical support',
    'help center',
    'support policy',
    'customer service',
    'architecture software support',
    'AEC software support',
    'rendering software support',
    'AI architecture support'
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/support`,
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
  openGraph: {
    title: "Support Policy | Renderiq - AI Architectural Visualization",
    description: "Learn about Renderiq's support policy, response times, support channels, and how we help you succeed with our platform.",
    type: "website",
    url: `${siteUrl}/support`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/support.jpg`,
        width: 1200,
        height: 630,
        alt: "Support Policy - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Support Policy | Renderiq",
    description: "Learn about Renderiq's support policy, response times, and support channels.",
    images: [`${siteUrl}/og/support.jpg`],
    creator: "@Renderiq",
  },
};

const supportChannels = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Primary support channel for all inquiries",
    email: "support@renderiq.io",
    responseTime: "24-48 hours",
    availability: "24/7",
    bestFor: ["Technical issues", "Account questions", "Billing inquiries", "Feature requests"]
  },
  {
    icon: MessageSquare,
    title: "In-App Support",
    description: "Get help directly from the platform",
    location: "Dashboard → Help → Contact Support",
    responseTime: "24-48 hours",
    availability: "24/7",
    bestFor: ["Quick questions", "Feature guidance", "Platform navigation"]
  },
  {
    icon: HelpCircle,
    title: "Documentation & FAQ",
    description: "Self-service resources",
    location: "/docs and /help/faq",
    responseTime: "Instant",
    availability: "24/7",
    bestFor: ["How-to guides", "Common questions", "API documentation", "Troubleshooting"]
  }
];

const supportLevels = [
  {
    plan: "Free",
    emailSupport: "Yes (48-72 hours)",
    priority: "Standard",
    documentation: "Full Access",
    community: "Yes",
    features: ["Email support", "Documentation access", "Community forum", "FAQ access"]
  },
  {
    plan: "Pro",
    emailSupport: "Yes (24-48 hours)",
    priority: "Priority",
    documentation: "Full Access + Guides",
    community: "Yes",
    features: ["Priority email support", "Enhanced documentation", "Community forum", "Feature requests", "Monthly tips"]
  },
  {
    plan: "Enterprise",
    emailSupport: "Yes (4-8 hours)",
    priority: "Highest",
    documentation: "Full Access + Custom",
    community: "Yes",
    features: ["Dedicated support", "Custom documentation", "Priority feature requests", "Account manager", "SLA guarantee"]
  }
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6">
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Support Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Support Policy
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Last updated: January 15, 2025
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Our commitment to providing excellent customer support and helping you succeed with Renderiq's 
            AI architectural visualization platform.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Overview */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Our Support Commitment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                At Renderiq, we are committed to providing timely, helpful, and professional support to all our users. 
                This Support Policy outlines our support channels, response times, and what you can expect when you 
                contact us for assistance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">Fast Response</p>
                  <p className="text-sm text-muted-foreground">24-48 hour response time</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">Expert Help</p>
                  <p className="text-sm text-muted-foreground">Knowledgeable support team</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">Multiple Channels</p>
                  <p className="text-sm text-muted-foreground">Email, docs, and more</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Channels */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Support Channels</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {supportChannels.map((channel, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <channel.icon className="w-5 h-5 text-primary" />
                      {channel.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{channel.description}</p>
                    {channel.email && (
                      <div>
                        <p className="text-sm font-medium">Email:</p>
                        <p className="text-sm text-muted-foreground">{channel.email}</p>
                      </div>
                    )}
                    {channel.location && (
                      <div>
                        <p className="text-sm font-medium">Location:</p>
                        <p className="text-sm text-muted-foreground">{channel.location}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{channel.responseTime}</Badge>
                      <Badge variant="secondary">{channel.availability}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Best for:</p>
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                        {channel.bestFor.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Support Levels */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Support by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {supportLevels.map((level, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold">{level.plan} Plan</h3>
                      <Badge variant={level.priority === "Highest" ? "default" : level.priority === "Priority" ? "secondary" : "outline"}>
                        {level.priority} Support
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Email Support:</p>
                        <p className="font-medium">{level.emailSupport}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Documentation:</p>
                        <p className="font-medium">{level.documentation}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Features:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {level.features.map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Response Times */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Response Times</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Our target response times vary by support level and issue severity:
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Free Plan</p>
                    <p className="text-sm text-muted-foreground">Standard support</p>
                  </div>
                  <Badge>48-72 hours</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Pro Plan</p>
                    <p className="text-sm text-muted-foreground">Priority support</p>
                  </div>
                  <Badge variant="secondary">24-48 hours</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Enterprise Plan</p>
                    <p className="text-sm text-muted-foreground">Dedicated support</p>
                  </div>
                  <Badge variant="default">4-8 hours</Badge>
                </div>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Response times are measured during business days (Monday-Friday, excluding holidays). 
                  Critical issues (service outages, security concerns) receive immediate attention regardless of plan level.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What We Support */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">What We Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    We Can Help With
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Platform usage and navigation</li>
                    <li>• Account setup and management</li>
                    <li>• Billing and subscription questions</li>
                    <li>• Technical issues and bugs</li>
                    <li>• Feature explanations and tutorials</li>
                    <li>• Credit and rendering questions</li>
                    <li>• API integration support</li>
                    <li>• Best practices and tips</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Limited Support For
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Custom architectural design work</li>
                    <li>• Third-party software integration</li>
                    <li>• Hardware-specific issues</li>
                    <li>• Network configuration problems</li>
                    <li>• Training for architectural software</li>
                    <li>• Legal or compliance advice</li>
                    <li>• Custom development requests</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Getting the Best Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                To help us assist you quickly and effectively, please include the following information when contacting support:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li><strong>Account Information:</strong> Your email address associated with the account</li>
                <li><strong>Issue Description:</strong> Clear description of the problem or question</li>
                <li><strong>Steps to Reproduce:</strong> If reporting a bug, detailed steps to reproduce the issue</li>
                <li><strong>Screenshots/Error Messages:</strong> Visual evidence of the issue</li>
                <li><strong>Browser/Device Info:</strong> Browser version, device type, operating system</li>
                <li><strong>Relevant Project/Render IDs:</strong> If applicable, IDs of affected projects or renders</li>
              </ul>
            </CardContent>
          </Card>

          {/* Escalation */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-2xl">Escalation Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you're not satisfied with the support you receive, you can escalate your issue:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Reply to the support email thread requesting escalation</li>
                <li>Include why you believe escalation is necessary</li>
                <li>Your issue will be reviewed by a senior support team member</li>
                <li>Enterprise customers can contact their account manager directly</li>
              </ol>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Contact Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="font-medium mb-2">Email Support:</p>
                  <p className="text-muted-foreground">support@renderiq.io</p>
                </div>
                <div>
                  <p className="font-medium mb-2">Billing & Refunds:</p>
                  <p className="text-muted-foreground">refunds@renderiq.io</p>
                </div>
                <div>
                  <p className="font-medium mb-2">Enterprise Support:</p>
                  <p className="text-muted-foreground">enterprise@renderiq.io</p>
                </div>
                <div>
                  <p className="font-medium mb-2">Response Time:</p>
                  <p className="text-muted-foreground">We aim to respond within 24-48 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Updates */}
          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Policy Updates</h3>
            <p className="text-sm text-muted-foreground">
              We may update this Support Policy from time to time. Changes will be posted on this page with an 
              updated "Last updated" date. Material changes will be communicated via email or platform notification.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


