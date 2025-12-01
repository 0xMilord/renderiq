import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, Scale, AlertCircle, Shield, Ban, Copyright } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Terms of Service | Renderiq - AI Architectural Visualization",
  description: "Read the terms and conditions for using Renderiq's AI architectural visualization and rendering platform.",
  robots: "index, follow"
};

const sections = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    content: [
      {
        text: "By accessing or using Renderiq's platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our services."
      },
      {
        text: "These terms apply to all users of the platform, including free trial users, paid subscribers, and visitors."
      }
    ]
  },
  {
    icon: Copyright,
    title: "2. Intellectual Property Rights",
    content: [
      {
        subtitle: "Your Content",
        text: "You retain all ownership rights to the architectural designs, drawings, and files you upload to our platform. We do not claim any ownership of your original work."
      },
      {
        subtitle: "Generated Content",
        text: "AI-generated renders and visualizations are licensed to you for commercial and personal use. You maintain full rights to use these outputs in your projects, presentations, and marketing materials."
      },
      {
        subtitle: "Our Platform",
        text: "The Renderiq platform, including its software, AI models, design, and functionality, is owned by us and protected by copyright, trademark, and other intellectual property laws."
      },
      {
        subtitle: "Restrictions",
        text: "You may not reverse engineer, decompile, or attempt to extract the source code of our AI models or platform technology."
      }
    ]
  },
  {
    icon: Scale,
    title: "3. User Accounts and Responsibilities",
    content: [
      {
        subtitle: "Account Security",
        text: "You are responsible for maintaining the confidentiality of your account credentials. Any activity under your account is your responsibility."
      },
      {
        subtitle: "Accurate Information",
        text: "You agree to provide accurate, current, and complete information during registration and to update it as necessary."
      },
      {
        subtitle: "Prohibited Uses",
        text: "You may not use the platform for any illegal purposes, to upload malicious content, or to violate any third party's intellectual property rights."
      },
      {
        subtitle: "Account Termination",
        text: "We reserve the right to terminate accounts that violate these terms or engage in abusive behavior."
      }
    ]
  },
  {
    icon: Shield,
    title: "4. Service Usage and Limitations",
    content: [
      {
        subtitle: "Fair Use Policy",
        text: "You agree to use our services in accordance with fair use practices. Excessive or abusive usage may result in service limitations or account suspension."
      },
      {
        subtitle: "Service Availability",
        text: "We strive for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be communicated in advance when possible."
      },
      {
        subtitle: "Credit System",
        text: "Rendering services are based on a credit system. Credits expire according to your subscription plan and cannot be refunded or transferred."
      },
      {
        subtitle: "API Usage",
        text: "API access is subject to rate limits and additional terms specified in the API documentation."
      }
    ]
  },
  {
    icon: Ban,
    title: "5. Prohibited Content and Conduct",
    content: [
      {
        text: "You may not upload, create, or share content that is illegal, harmful, threatening, abusive, defamatory, or infringes on others' rights."
      },
      {
        text: "Prohibited activities include: attempting to breach security, spamming, phishing, spreading malware, or interfering with other users' access."
      },
      {
        text: "You may not use the platform to generate content that violates copyright, trademark, or other intellectual property rights."
      },
      {
        text: "We reserve the right to remove any content that violates these terms and may report illegal activity to authorities."
      }
    ]
  },
  {
    icon: AlertCircle,
    title: "6. Payment and Subscription Terms",
    content: [
      {
        subtitle: "Billing",
        text: "Subscription fees are billed in advance on a monthly or annual basis. All fees are in USD unless otherwise stated."
      },
      {
        subtitle: "Automatic Renewal",
        text: "Subscriptions automatically renew unless canceled at least 24 hours before the renewal date."
      },
      {
        subtitle: "Refunds",
        text: "We offer a 14-day money-back guarantee for new subscriptions. Refunds are not available for used credits or services already rendered."
      },
      {
        subtitle: "Price Changes",
        text: "We reserve the right to modify pricing with 30 days' notice. Existing subscribers maintain their current pricing until renewal."
      }
    ]
  }
];

const additionalSections = [
  {
    title: "7. Disclaimers and Limitation of Liability",
    content: [
      "The platform is provided \"as is\" without warranties of any kind, express or implied. We do not guarantee the accuracy, completeness, or suitability of AI-generated content for any purpose.",
      "You acknowledge that AI-generated visualizations are interpretations and may not reflect exact architectural specifications or compliance with building codes.",
      "To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the platform."
    ]
  },
  {
    title: "8. Indemnification",
    content: [
      "You agree to indemnify and hold harmless Renderiq, its affiliates, and employees from any claims, damages, or expenses arising from your use of the platform or violation of these terms.",
      "This includes claims related to content you upload, generate, or share through our platform."
    ]
  },
  {
    title: "9. Modifications to Service and Terms",
    content: [
      "We reserve the right to modify or discontinue any aspect of the service with reasonable notice.",
      "These Terms may be updated periodically. Continued use of the platform after changes constitutes acceptance of the new terms.",
      "Material changes will be communicated via email or platform notification."
    ]
  },
  {
    title: "10. Governing Law and Dispute Resolution",
    content: [
      "These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law provisions.",
      "Any disputes will be resolved through binding arbitration in accordance with [Arbitration Rules], except where prohibited by law.",
      "You may opt out of arbitration within 30 days of account creation by contacting legal@Renderiq.com."
    ]
  }
];

export default function TermsPage() {
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
            <Scale className="w-4 h-4" />
            <span className="text-sm font-medium">Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Last updated: October 3, 2025
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using Renderiq's AI architectural visualization platform.
          </p>
        </div>
      </section>

      {/* Important Notice */}
      <section className="px-4 -mt-8">
        <div className="container mx-auto max-w-4xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> By using our platform, you agree to these terms. 
              If you're using the service on behalf of an organization, you represent that you 
              have authority to bind that organization to these terms.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-12">
            {sections.map((section, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.content.map((item, i) => (
                    <div key={i}>
                      {item.subtitle && (
                        <h3 className="font-semibold mb-2">{item.subtitle}</h3>
                      )}
                      <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Additional Sections */}
            {additionalSections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {section.content.map((text, i) => (
                      <p key={i} className="text-muted-foreground leading-relaxed">
                        {text}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Contact */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="text-2xl">11. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> legal@Renderiq.com</p>
                <p><strong>Support:</strong> support@Renderiq.com</p>
                <p><strong>Address:</strong> [Your Business Address]</p>
              </div>
            </CardContent>
          </Card>

          {/* Acknowledgment */}
          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Acknowledgment</h3>
            <p className="text-sm text-muted-foreground">
              By using Renderiq's platform, you acknowledge that you have read, understood, and agree 
              to be bound by these Terms of Service and our Privacy Policy. If you do not agree to 
              these terms, please discontinue use of the platform immediately.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

