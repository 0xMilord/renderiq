import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Clock, CreditCard, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Refund Policy | Renderiq - AI Architectural Visualization",
  description: "Learn about Renderiq's refund policy for subscriptions, credit packages, and services. Understand your rights and our refund process.",
  robots: "index, follow",
  openGraph: {
    title: "Refund Policy | Renderiq - AI Architectural Visualization",
    description: "Learn about Renderiq's refund policy for subscriptions, credit packages, and services. Understand your rights and our refund process.",
    type: "website",
    url: `${siteUrl}/refund`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/refund.jpg`,
        width: 1200,
        height: 630,
        alt: "Refund Policy - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Refund Policy | Renderiq",
    description: "Learn about Renderiq's refund policy for subscriptions, credit packages, and services.",
    images: [`${siteUrl}/og/refund.jpg`],
    creator: "@Renderiq",
  },
};

const refundScenarios = [
  {
    icon: CheckCircle,
    title: "Eligible for Refund",
    color: "text-green-600",
    bgColor: "bg-green-50",
    items: [
      {
        title: "New Subscription - 14-Day Money-Back Guarantee",
        description: "New subscriptions are eligible for a full refund within 14 days of initial purchase, provided no credits have been used or services rendered.",
        conditions: [
          "Refund request must be made within 14 days of subscription start date",
          "No credits may have been used during the refund period",
          "No renders or services may have been generated using the subscription",
          "Refund will be processed to the original payment method within 5-10 business days"
        ]
      },
      {
        title: "Duplicate Payment",
        description: "If you are charged twice for the same transaction due to a technical error, we will refund the duplicate charge immediately.",
        conditions: [
          "Duplicate charge must be reported within 30 days",
          "We will verify the duplicate transaction",
          "Refund processed within 3-5 business days"
        ]
      },
      {
        title: "Service Unavailability",
        description: "If our Service is unavailable for more than 48 consecutive hours due to our fault, you may be eligible for a prorated refund.",
        conditions: [
          "Service outage must be confirmed by our team",
          "Refund amount calculated based on downtime percentage",
          "Applies only to subscription fees, not credit packages"
        ]
      },
      {
        title: "Billing Error",
        description: "If you are charged incorrectly due to our error, we will refund the incorrect amount immediately.",
        conditions: [
          "Error must be reported within 60 days",
          "We will investigate and verify the error",
          "Full refund of incorrect amount plus any fees"
        ]
      }
    ]
  },
  {
    icon: XCircle,
    title: "Not Eligible for Refund",
    color: "text-red-600",
    bgColor: "bg-red-50",
    items: [
      {
        title: "Used Credits",
        description: "Credit packages and subscription credits that have been used for renders or services are non-refundable.",
        reason: "Credits represent services already consumed and cannot be refunded once used."
      },
      {
        title: "Completed Services",
        description: "Once a render or visualization has been generated and delivered, the service is considered complete and non-refundable.",
        reason: "AI processing resources have been consumed and cannot be reversed."
      },
      {
        title: "Subscription Renewal",
        description: "Automatic subscription renewals are non-refundable unless canceled before the renewal date.",
        reason: "You have 24 hours before renewal to cancel and avoid charges."
      },
      {
        title: "Change of Mind",
        description: "Refunds are not available simply because you changed your mind about the Service after using it.",
        reason: "This is why we offer a 14-day money-back guarantee for new subscriptions."
      },
      {
        title: "Violation of Terms",
        description: "Accounts terminated for violation of our Terms of Service are not eligible for refunds.",
        reason: "Refunds are forfeited when accounts are terminated for policy violations."
      }
    ]
  }
];

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Refund Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Refund Policy
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Last updated: January 15, 2025
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            This Refund Policy outlines the circumstances under which refunds are available for Renderiq 
            subscriptions, credit packages, and services. Please read this policy carefully.
          </p>
        </div>
      </section>

      {/* Important Notice */}
      <section className="px-4 -mt-8">
        <div className="container mx-auto max-w-4xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This Refund Policy is part of our Terms of Service. By making a purchase, 
              you agree to this policy. Refund requests must be submitted through our official channels.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* General Policy */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Clock className="w-6 h-6 text-primary" />
                General Refund Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Renderiq offers refunds in specific circumstances as outlined in this policy. Our refund policy 
                is designed to be fair to both customers and our business, recognizing that AI rendering services 
                consume computational resources that cannot be recovered once used.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Key Principles:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Refunds are available for unused subscriptions within the guarantee period</li>
                  <li>Used credits and completed services are non-refundable</li>
                  <li>All refund requests are reviewed on a case-by-case basis</li>
                  <li>Refunds are processed to the original payment method</li>
                  <li>Processing time is typically 5-10 business days</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Refund Scenarios */}
          <div className="space-y-8 mb-12">
            {refundScenarios.map((scenario, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-lg ${scenario.bgColor} flex items-center justify-center`}>
                    <scenario.icon className={`w-5 h-5 ${scenario.color}`} />
                  </div>
                  <h2 className="text-2xl font-bold">{scenario.title}</h2>
                </div>
                <div className="space-y-4">
                  {scenario.items.map((item, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-muted-foreground">{item.description}</p>
                        {item.conditions && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Conditions:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {item.conditions.map((condition, j) => (
                                <li key={j}>{condition}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.reason && (
                          <div className="bg-muted/50 p-3 rounded">
                            <p className="text-sm text-muted-foreground">
                              <strong>Reason:</strong> {item.reason}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Refund Process */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <CreditCard className="w-6 h-6 text-primary" />
                How to Request a Refund
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Step 1: Submit Request</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  Submit your refund request through one of the following channels:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Email:</strong> refunds@renderiq.io</li>
                  <li><strong>Support Portal:</strong> support@renderiq.io</li>
                  <li><strong>Account Dashboard:</strong> Billing section → Request Refund</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Step 2: Provide Information</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  Include the following information in your request:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Your account email address</li>
                  <li>Invoice number or payment order ID</li>
                  <li>Date of purchase</li>
                  <li>Reason for refund request</li>
                  <li>Any supporting documentation</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Step 3: Review Process</h3>
                <p className="text-muted-foreground text-sm">
                  We will review your request within 2-3 business days. We may contact you for additional 
                  information or clarification. You will receive an email notification of our decision.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Step 4: Refund Processing</h3>
                <p className="text-muted-foreground text-sm">
                  If approved, refunds are processed to your original payment method within 5-10 business days. 
                  The time it takes for the refund to appear in your account depends on your payment provider 
                  (typically 3-5 additional business days for credit cards, 5-7 for bank transfers).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Cancellation */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-xl">Subscription Cancellation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You can cancel your subscription at any time through your account dashboard. Cancellation takes 
                effect at the end of your current billing period. You will continue to have access to the Service 
                until the end of your paid period.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Canceling your subscription does not automatically entitle you to a 
                  refund. Refunds are only available under the circumstances outlined in this policy. To avoid 
                  charges for the next billing period, cancel at least 24 hours before your renewal date.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Partial Refunds */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-xl">Partial Refunds</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                In some cases, we may offer partial refunds. For example, if you used some but not all credits 
                during the 14-day guarantee period, we may refund a prorated amount based on unused credits. 
                Partial refunds are evaluated on a case-by-case basis and are not guaranteed.
              </p>
            </CardContent>
          </Card>

          {/* Disputes */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="text-xl">Payment Disputes and Chargebacks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                If you have concerns about a charge, please contact us first at refunds@renderiq.io before 
                initiating a chargeback with your bank or credit card company. Chargebacks can result in 
                additional fees and may affect your ability to use our Service in the future.
              </p>
              <p className="text-muted-foreground text-sm">
                We are committed to resolving payment issues fairly and promptly. Contacting us directly 
                allows us to address your concerns quickly and maintain a positive relationship.
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
                For questions about refunds or to submit a refund request:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> refunds@renderiq.io</p>
                <p><strong>Support:</strong> support@renderiq.io</p>
                <p><strong>Response Time:</strong> We respond to refund requests within 2-3 business days.</p>
              </div>
            </CardContent>
          </Card>

          {/* Legal Notice */}
          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Legal Notice</h3>
            <p className="text-sm text-muted-foreground">
              This Refund Policy is part of our Terms of Service and is legally binding. By making a purchase, 
              you agree to this policy. This policy complies with applicable consumer protection laws, including 
              distance selling regulations where applicable. Your statutory rights are not affected by this policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


