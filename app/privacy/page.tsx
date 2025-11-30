import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy | renderiq - AI Architectural Visualization",
  description: "Learn how renderiq protects your data and privacy. Our commitment to security and transparency in AI architectural design and rendering.",
  robots: "index, follow"
};

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you create an account, we collect your name, email address, and password. This information is necessary to provide our services and communicate with you about your account."
      },
      {
        subtitle: "Design Files and Projects",
        text: "We store the architectural designs, images, and project files you upload to our platform. These files are encrypted and stored securely to enable rendering and visualization services."
      },
      {
        subtitle: "Usage Data",
        text: "We collect information about how you use our platform, including render history, feature usage, and performance metrics to improve our services."
      },
      {
        subtitle: "Technical Information",
        text: "We automatically collect device information, IP addresses, browser type, and operating system to ensure platform security and optimize performance."
      }
    ]
  },
  {
    icon: Lock,
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "Service Delivery",
        text: "We use your information to provide AI-powered architectural visualization services, process your designs, and deliver rendered outputs."
      },
      {
        subtitle: "Platform Improvement",
        text: "Usage data helps us improve our AI models, enhance rendering quality, and develop new features based on user needs."
      },
      {
        subtitle: "Communication",
        text: "We use your email to send service updates, respond to inquiries, and share important account information. You can opt out of marketing emails anytime."
      },
      {
        subtitle: "Security and Fraud Prevention",
        text: "We monitor platform activity to detect and prevent unauthorized access, abuse, and fraudulent activities."
      }
    ]
  },
  {
    icon: Shield,
    title: "Data Security",
    content: [
      {
        subtitle: "Encryption",
        text: "All data is encrypted in transit using TLS/SSL and at rest using industry-standard AES-256 encryption."
      },
      {
        subtitle: "Access Controls",
        text: "Strict access controls ensure only authorized personnel can access user data, and all access is logged and monitored."
      },
      {
        subtitle: "Regular Audits",
        text: "We conduct regular security audits and vulnerability assessments to maintain the highest security standards."
      },
      {
        subtitle: "Secure Infrastructure",
        text: "Our platform is hosted on enterprise-grade cloud infrastructure with built-in redundancy and disaster recovery."
      }
    ]
  },
  {
    icon: Eye,
    title: "Your Rights and Choices",
    content: [
      {
        subtitle: "Access and Download",
        text: "You can access, download, and review all your data at any time through your account dashboard."
      },
      {
        subtitle: "Data Correction",
        text: "You have the right to update or correct any inaccurate personal information in your account settings."
      },
      {
        subtitle: "Data Deletion",
        text: "You can request deletion of your account and associated data. Some information may be retained for legal compliance."
      },
      {
        subtitle: "Export Your Data",
        text: "Download all your projects, renders, and account data in standard formats at any time."
      }
    ]
  },
  {
    icon: UserCheck,
    title: "Data Sharing and Third Parties",
    content: [
      {
        subtitle: "No Selling of Data",
        text: "We never sell your personal information or design files to third parties. Your designs remain your intellectual property."
      },
      {
        subtitle: "Service Providers",
        text: "We work with trusted service providers for hosting, payment processing, and analytics. All providers are bound by strict confidentiality agreements."
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose information if required by law, court order, or to protect our rights and users' safety."
      },
      {
        subtitle: "Business Transfers",
        text: "In case of merger or acquisition, user data may be transferred, but this policy will continue to apply."
      }
    ]
  }
];

export default function PrivacyPage() {
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
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Privacy & Security</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Last updated: October 3, 2025
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            At renderiq, we take your privacy seriously. This policy explains how we collect, 
            use, and protect your information when you use our AI architectural visualization platform.
          </p>
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
                      <h3 className="font-semibold mb-2">{item.subtitle}</h3>
                      <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Information */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> privacy@renderiq.com</p>
                <p><strong>Data Protection Officer:</strong> dpo@renderiq.com</p>
              </div>
              <p className="text-muted-foreground mt-6 text-sm">
                We will respond to all requests within 30 days in accordance with applicable data protection laws.
              </p>
            </CardContent>
          </Card>

          {/* Updates */}
          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">Changes to This Policy</h3>
            <p className="text-sm text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date. For significant 
              changes, we will provide more prominent notice, including email notification.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

