import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Mail, Globe, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Privacy Policy | Renderiq - AI Architectural Visualization",
  description: "Learn how Renderiq protects your data and privacy. Our comprehensive privacy policy covering data collection, usage, security, and your rights under GDPR, CCPA, and other data protection laws.",
  keywords: [
    'Renderiq privacy policy',
    'data privacy',
    'GDPR compliance',
    'CCPA compliance',
    'data protection',
    'privacy policy',
    'data security',
    'user privacy',
    'architectural software privacy',
    'AEC software privacy'
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/privacy`,
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
    title: "Privacy Policy | Renderiq - AI Architectural Visualization",
    description: "Learn how Renderiq protects your data and privacy. Our comprehensive privacy policy covering data collection, usage, security, and your rights under GDPR, CCPA, and other data protection laws.",
    type: "website",
    url: `${siteUrl}/privacy`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/privacy.jpg`,
        width: 1200,
        height: 630,
        alt: "Privacy Policy - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Renderiq",
    description: "Learn how Renderiq protects your data and privacy. GDPR, CCPA compliant.",
    images: [`${siteUrl}/og/privacy.jpg`],
    creator: "@Renderiq",
  },
};

const sections = [
  {
    icon: FileText,
    title: "1. Introduction and Scope",
    content: [
      {
        text: "Renderiq ('we', 'us', 'our') is committed to protecting your privacy. This Privacy Policy ('Policy') explains how we collect, use, disclose, and safeguard your information when you use our AI-powered architectural visualization platform ('Service') accessible at renderiq.io."
      },
      {
        text: "This Policy applies to all users of our Service, including visitors, registered users, subscribers, and enterprise customers. By using our Service, you consent to the data practices described in this Policy."
      },
      {
        text: "This Policy complies with applicable data protection laws including the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and other relevant privacy legislation."
      },
      {
        text: "Last Updated: January 15, 2025. We may update this Policy periodically. Material changes will be notified via email or prominent notice on our platform."
      }
    ]
  },
  {
    icon: Database,
    title: "2. Information We Collect",
    content: [
      {
        subtitle: "2.1 Personal Information",
        text: "We collect personal information that you provide directly to us, including: (a) Account Information: name, email address, password (hashed), phone number (optional), billing address; (b) Profile Information: avatar, bio, website, location; (c) Payment Information: processed securely through Razorpay - we do not store full credit card details; (d) Communication Data: messages sent through our platform, support tickets, feedback."
      },
      {
        subtitle: "2.2 Content and Project Data",
        text: "We collect and store: (a) Architectural designs, drawings, sketches, and project files you upload; (b) AI-generated renders, visualizations, and videos; (c) Project metadata including names, descriptions, tags, and settings; (d) Chat conversations and prompts used for AI generation; (e) Canvas graphs and node-based editor data."
      },
      {
        subtitle: "2.3 Usage and Technical Data",
        text: "We automatically collect: (a) Usage Data: render history, feature usage, session duration, pages visited, actions taken; (b) Technical Data: IP address, browser type and version, device information, operating system, time zone, language preferences; (c) Performance Data: rendering times, queue positions, error logs, system performance metrics; (d) Location Data: approximate location derived from IP address (country/city level)."
      },
      {
        subtitle: "2.4 Cookies and Tracking Technologies",
        text: "We use cookies, web beacons, and similar technologies. See our Cookie Policy for detailed information. Essential cookies are required for Service functionality. Analytics cookies help us improve our Service. Marketing cookies require your consent."
      }
    ]
  },
  {
    icon: Lock,
    title: "3. How We Use Your Information",
    content: [
      {
        subtitle: "3.1 Service Provision",
        text: "We use your information to: (a) Create and manage your account; (b) Process payments and manage subscriptions; (c) Provide AI-powered rendering and visualization services; (d) Store and organize your projects and renders; (e) Enable collaboration features; (f) Send service-related communications (order confirmations, receipts, invoices)."
      },
      {
        subtitle: "3.2 Service Improvement",
        text: "We analyze usage data to: (a) Improve AI model accuracy and rendering quality; (b) Enhance platform features and user experience; (c) Optimize performance and reduce processing times; (d) Develop new features based on user needs; (e) Conduct research and development (using anonymized data)."
      },
      {
        subtitle: "3.3 Communication",
        text: "We use your contact information to: (a) Send transactional emails (receipts, invoices, payment confirmations); (b) Respond to support requests and inquiries; (c) Send important service updates and security notifications; (d) With your consent, send marketing communications (you can opt-out anytime); (e) Send subscription renewal reminders and billing notifications."
      },
      {
        subtitle: "3.4 Security and Compliance",
        text: "We use information to: (a) Detect and prevent fraud, abuse, and unauthorized access; (b) Verify user identity and authenticate accounts; (c) Enforce our Terms of Service and legal agreements; (d) Comply with legal obligations and respond to legal requests; (e) Protect rights, property, and safety of users and third parties."
      }
    ]
  },
  {
    icon: Shield,
    title: "4. Data Security and Protection",
    content: [
      {
        subtitle: "4.1 Security Measures",
        text: "We implement industry-standard security measures: (a) Encryption: All data encrypted in transit using TLS 1.3/SSL and at rest using AES-256 encryption; (b) Access Controls: Role-based access control, multi-factor authentication for administrative access, regular access reviews; (c) Infrastructure Security: Enterprise-grade cloud hosting (Supabase), regular security audits, vulnerability assessments, penetration testing; (d) Data Backup: Regular automated backups with point-in-time recovery capabilities."
      },
      {
        subtitle: "4.2 Payment Security",
        text: "Payment processing is handled by Razorpay, a PCI DSS Level 1 compliant payment processor. We do not store full credit card numbers. Payment data is encrypted and transmitted securely."
      },
      {
        subtitle: "4.3 Data Breach Procedures",
        text: "In the event of a data breach affecting your personal information, we will: (a) Notify affected users within 72 hours of discovery; (b) Report to relevant data protection authorities as required by law; (c) Provide details of the breach and steps taken to mitigate risks; (d) Offer credit monitoring or identity protection services if appropriate."
      },
      {
        subtitle: "4.4 Data Retention",
        text: "We retain your data: (a) Account Data: Until account deletion request or 3 years of inactivity; (b) Project Data: Until you delete projects or account closure; (c) Payment Records: 7 years for tax and legal compliance; (d) Usage Data: Aggregated and anonymized data may be retained indefinitely for analytics; (e) Legal Requirements: Some data may be retained longer if required by law."
      }
    ]
  },
  {
    icon: Eye,
    title: "5. Your Rights and Choices",
    content: [
      {
        subtitle: "5.1 Access and Portability",
        text: "You have the right to: (a) Access all personal data we hold about you; (b) Download your data in machine-readable format (JSON, CSV); (c) Export your projects, renders, and account information; (d) Request a copy of your data by contacting privacy@renderiq.io."
      },
      {
        subtitle: "5.2 Correction and Update",
        text: "You can: (a) Update account information through your account settings; (b) Correct inaccurate data by editing your profile; (c) Request correction of data we control by contacting us."
      },
      {
        subtitle: "5.3 Deletion and Right to be Forgotten",
        text: "You can: (a) Delete individual projects and renders through the platform; (b) Request account deletion which will delete associated personal data; (c) Request deletion of specific data categories; (d) Note: Some data may be retained for legal compliance (payment records, legal disputes)."
      },
      {
        subtitle: "5.4 Objection and Restriction",
        text: "You have the right to: (a) Object to processing of your personal data for marketing purposes (opt-out available in account settings); (b) Object to processing based on legitimate interests; (c) Request restriction of processing in certain circumstances; (d) Withdraw consent where processing is based on consent."
      },
      {
        subtitle: "5.5 California Privacy Rights (CCPA)",
        text: "California residents have additional rights: (a) Right to know what personal information is collected; (b) Right to know if personal information is sold or disclosed; (c) Right to opt-out of sale of personal information (we do not sell personal information); (d) Right to non-discrimination for exercising privacy rights."
      }
    ]
  },
  {
    icon: UserCheck,
    title: "6. Data Sharing and Third Parties",
    content: [
      {
        subtitle: "6.1 We Do Not Sell Your Data",
        text: "We never sell your personal information, architectural designs, or project data to third parties. Your content remains your intellectual property."
      },
      {
        subtitle: "6.2 Service Providers",
        text: "We share data with trusted service providers under strict contracts: (a) Cloud Hosting: Supabase (data storage and hosting); (b) Payment Processing: Razorpay (payment transactions); (c) AI Services: Google Cloud Vertex AI (AI model processing); (d) Analytics: Anonymous usage analytics (no personal data); (e) Email Services: Transactional and marketing emails (with opt-out). All providers are bound by confidentiality agreements and data processing agreements."
      },
      {
        subtitle: "6.3 Legal Disclosures",
        text: "We may disclose information: (a) When required by law, court order, or legal process; (b) To comply with government requests or regulatory requirements; (c) To protect our rights, property, or safety; (d) To prevent fraud or investigate potential violations; (e) In connection with legal proceedings or disputes."
      },
      {
        subtitle: "6.4 Business Transfers",
        text: "In the event of merger, acquisition, or sale of assets, user data may be transferred to the acquiring entity. Users will be notified of such transfers, and this Privacy Policy will continue to apply."
      },
      {
        subtitle: "6.5 Public Content",
        text: "If you make projects or renders public through our gallery feature, that content becomes publicly accessible. You can make content private at any time."
      }
    ]
  },
  {
    icon: Globe,
    title: "7. International Data Transfers",
    content: [
      {
        subtitle: "7.1 Cross-Border Transfers",
        text: "Your data may be transferred to and processed in countries outside your country of residence. We ensure appropriate safeguards are in place: (a) Standard Contractual Clauses (SCCs) for EU data transfers; (b) Adequacy decisions where applicable; (c) Binding Corporate Rules for intra-group transfers."
      },
      {
        subtitle: "7.2 Data Processing Locations",
        text: "Primary data processing occurs in: (a) United States (Supabase hosting); (b) European Union (where applicable); (c) India (Razorpay payment processing). All transfers comply with applicable data protection laws."
      }
    ]
  },
  {
    icon: AlertCircle,
    title: "8. Children's Privacy",
    content: [
      {
        text: "Our Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately at privacy@renderiq.io and we will delete such information."
      }
    ]
  }
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Privacy & Security</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Last updated: January 15, 2025
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            This Privacy Policy describes how Renderiq collects, uses, and protects your personal information 
            when you use our AI architectural visualization platform. We are committed to protecting your privacy 
            and complying with GDPR, CCPA, and other applicable data protection laws.
          </p>
        </div>
      </section>

      {/* Important Notice */}
      <section className="px-4 -mt-8">
        <div className="container mx-auto max-w-4xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Legal Notice:</strong> This Privacy Policy is a legally binding document. By using our Service, 
              you acknowledge that you have read, understood, and agree to this Policy. If you do not agree, 
              please discontinue use of our Service immediately.
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
                        <h3 className="font-semibold mb-2 text-foreground">{item.subtitle}</h3>
                      )}
                      <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Information */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                9. Contact Us and Data Protection Officer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">General Inquiries</h3>
                <p className="text-muted-foreground mb-2">
                  For questions about this Privacy Policy or our data practices:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> privacy@renderiq.io</p>
                  <p><strong>Support:</strong> support@renderiq.io</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Protection Officer (DPO)</h3>
                <p className="text-muted-foreground mb-2">
                  For GDPR-related inquiries and data subject requests:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> dpo@renderiq.io</p>
                  <p><strong>Response Time:</strong> We respond to all requests within 30 days as required by law.</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Subject Requests</h3>
                <p className="text-muted-foreground mb-2">
                  To exercise your rights (access, deletion, portability, etc.), please email us with:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Your full name and email address associated with your account</li>
                  <li>Description of the request (e.g., "Request access to my personal data")</li>
                  <li>Verification of your identity (we may request additional verification)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Regulatory Complaints</h3>
                <p className="text-muted-foreground text-sm">
                  If you are located in the EU, you have the right to lodge a complaint with your local 
                  data protection authority if you believe we have violated your privacy rights.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Updates */}
          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2">10. Changes to This Privacy Policy</h3>
            <p className="text-sm text-muted-foreground mb-2">
              We may update this Privacy Policy from time to time to reflect changes in our practices, 
              technology, legal requirements, or other factors. When we make changes:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>We will update the "Last updated" date at the top of this Policy</li>
              <li>For material changes, we will notify you via email or prominent notice on our platform</li>
              <li>We will provide at least 30 days' notice for material changes</li>
              <li>Your continued use of the Service after changes constitutes acceptance of the updated Policy</li>
            </ul>
          </div>

          {/* Legal Basis */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl">11. Legal Basis for Processing (GDPR)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Under GDPR, we process your personal data based on the following legal bases:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><strong>Contract Performance:</strong> To provide our Service and fulfill our contractual obligations</li>
                <li><strong>Legitimate Interests:</strong> To improve our Service, prevent fraud, and ensure security</li>
                <li><strong>Consent:</strong> For marketing communications and non-essential cookies</li>
                <li><strong>Legal Obligation:</strong> To comply with tax, accounting, and other legal requirements</li>
                <li><strong>Vital Interests:</strong> To protect safety and security of users</li>
              </ul>
            </CardContent>
          </Card>

          {/* Acknowledgment */}
          <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="font-semibold mb-2">Acknowledgment</h3>
            <p className="text-sm text-muted-foreground">
              By using Renderiq's platform, you acknowledge that you have read, understood, and agree to be bound 
              by this Privacy Policy. If you do not agree with any part of this Policy, please discontinue use 
              of our Service immediately and contact us to delete your account.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
