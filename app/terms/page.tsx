import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, Scale, AlertCircle, Shield, Ban, Copyright, CreditCard, Users, Gavel } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Terms of Service | Renderiq - AI Architectural Visualization",
  description: "Read the comprehensive terms and conditions for using Renderiq's AI architectural visualization and rendering platform. Legally binding terms covering usage, payments, intellectual property, and more.",
  robots: "index, follow",
  openGraph: {
    title: "Terms of Service | Renderiq - AI Architectural Visualization",
    description: "Read the comprehensive terms and conditions for using Renderiq's AI architectural visualization and rendering platform. Legally binding terms covering usage, payments, intellectual property, and more.",
    type: "website",
    url: `${siteUrl}/terms`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/terms.jpg`,
        width: 1200,
        height: 630,
        alt: "Terms of Service - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Renderiq",
    description: "Read the comprehensive terms and conditions for using Renderiq's AI architectural visualization platform.",
    images: [`${siteUrl}/og/terms.jpg`],
    creator: "@Renderiq",
  },
};

const sections = [
  {
    icon: FileText,
    title: "1. Acceptance of Terms",
    content: [
      {
        text: "These Terms of Service ('Terms', 'Agreement') constitute a legally binding agreement between you ('User', 'you', 'your') and Renderiq ('Company', 'we', 'us', 'our') governing your access to and use of the Renderiq AI-powered architectural visualization platform ('Service', 'Platform') accessible at renderiq.io and related services."
      },
      {
        text: "By accessing, browsing, or using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and all applicable laws and regulations. If you do not agree with any part of these Terms, you must not access or use our Service."
      },
      {
        text: "These Terms apply to all users of the Platform, including but not limited to visitors, registered users, free trial users, paid subscribers, enterprise customers, and API users. Additional terms may apply to specific features or services."
      },
      {
        text: "If you are using the Service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms, and 'you' will refer to both you individually and the organization."
      }
    ]
  },
  {
    icon: Copyright,
    title: "2. Intellectual Property Rights",
    content: [
      {
        subtitle: "2.1 Your Content and Rights",
        text: "You retain all ownership rights to the architectural designs, drawings, sketches, project files, and other content you upload to our Platform ('Your Content'). We do not claim any ownership interest in Your Content. You grant us a limited, non-exclusive, worldwide, royalty-free license to use, store, process, and display Your Content solely for the purpose of providing the Service to you."
      },
      {
        subtitle: "2.2 Generated Content License",
        text: "AI-generated renders, visualizations, videos, and other outputs created using our Service ('Generated Content') are licensed to you for commercial and personal use. You maintain full rights to use, modify, distribute, and commercialize Generated Content in your projects, presentations, marketing materials, and client deliverables. Generated Content does not include our proprietary AI models, algorithms, or platform technology."
      },
      {
        subtitle: "2.3 Our Intellectual Property",
        text: "The Renderiq Platform, including its software, AI models, algorithms, user interface, design, functionality, documentation, trademarks, logos, and all related intellectual property, is owned by us and protected by copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Platform or included software."
      },
      {
        subtitle: "2.4 Restrictions",
        text: "You may not: (a) reverse engineer, decompile, disassemble, or attempt to extract the source code of our AI models or platform technology; (b) use our Service to train competing AI models; (c) remove or alter any copyright, trademark, or proprietary notices; (d) use our trademarks or logos without prior written consent."
      },
      {
        subtitle: "2.5 Feedback",
        text: "If you provide feedback, suggestions, or ideas about our Service, you grant us an irrevocable, perpetual, worldwide, royalty-free license to use, modify, and incorporate such feedback into our Service without any obligation to compensate you."
      }
    ]
  },
  {
    icon: Users,
    title: "3. User Accounts and Responsibilities",
    content: [
      {
        subtitle: "3.1 Account Creation",
        text: "To use certain features of our Service, you must create an account by providing accurate, current, and complete information. You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account."
      },
      {
        subtitle: "3.2 Account Security",
        text: "You agree to: (a) use a strong, unique password; (b) not share your account credentials with others; (c) immediately notify us of any unauthorized access or security breach; (d) log out from shared devices. We are not liable for any loss or damage arising from unauthorized access to your account due to your failure to maintain security."
      },
      {
        subtitle: "3.3 Account Information",
        text: "You agree to provide accurate, current, and complete information during registration and to update such information promptly if it changes. Providing false or misleading information may result in account termination."
      },
      {
        subtitle: "3.4 Account Termination",
        text: "We reserve the right to suspend or terminate your account immediately, without prior notice, if you violate these Terms, engage in fraudulent or illegal activity, or for any other reason we deem necessary to protect our Service, users, or third parties. Upon termination, your right to use the Service ceases immediately."
      },
      {
        subtitle: "3.5 Account Deletion",
        text: "You may delete your account at any time through account settings. Upon deletion, we will delete or anonymize your personal information in accordance with our Privacy Policy, subject to legal retention requirements. Some data may be retained for legal compliance or dispute resolution."
      }
    ]
  },
  {
    icon: Shield,
    title: "4. Service Usage and Limitations",
    content: [
      {
        subtitle: "4.1 Permitted Use",
        text: "You may use our Service solely for lawful purposes in accordance with these Terms. You may use the Service to create architectural visualizations, renderings, and related content for your professional or personal projects."
      },
      {
        subtitle: "4.2 Fair Use Policy",
        text: "You agree to use our Service in accordance with fair use practices. Excessive or abusive usage that degrades Service performance for other users may result in: (a) rate limiting; (b) temporary suspension; (c) account termination. We reserve the right to determine what constitutes excessive usage."
      },
      {
        subtitle: "4.3 Service Availability",
        text: "We strive for 99.9% uptime but do not guarantee uninterrupted, error-free, or secure Service. The Service may be unavailable due to: (a) scheduled maintenance (with advance notice when possible); (b) unscheduled maintenance or repairs; (c) technical failures; (d) force majeure events. We are not liable for Service unavailability."
      },
      {
        subtitle: "4.4 Credit System",
        text: "Rendering services operate on a credit system. Credits: (a) are consumed when you generate renders or use services; (b) expire according to your subscription plan terms; (c) cannot be refunded once used; (d) cannot be transferred between accounts; (e) have no cash value. Unused credits may expire at the end of your billing period or subscription term."
      },
      {
        subtitle: "4.5 API Usage",
        text: "API access is subject to rate limits, usage quotas, and additional terms specified in our API documentation. Excessive API usage may result in throttling or suspension. You may not use the API to circumvent platform limitations or create competing services."
      },
      {
        subtitle: "4.6 Service Modifications",
        text: "We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or without notice. We are not liable to you or any third party for any modification, suspension, or discontinuation of the Service."
      }
    ]
  },
  {
    icon: Ban,
    title: "5. Prohibited Content and Conduct",
    content: [
      {
        subtitle: "5.1 Prohibited Content",
        text: "You may not upload, create, generate, or share content that: (a) is illegal, harmful, threatening, abusive, harassing, defamatory, or violates any law; (b) infringes on intellectual property rights, privacy rights, or other rights of others; (c) contains malware, viruses, or malicious code; (d) is pornographic, obscene, or offensive; (e) promotes violence, discrimination, or hate speech."
      },
      {
        subtitle: "5.2 Prohibited Activities",
        text: "You may not: (a) attempt to breach security, access unauthorized areas, or interfere with Service operation; (b) use automated systems (bots, scrapers) without permission; (c) spam, phish, or engage in fraudulent activities; (d) impersonate others or provide false information; (e) interfere with other users' access or enjoyment of the Service; (f) use the Service to violate any law or regulation."
      },
      {
        subtitle: "5.3 Intellectual Property Violations",
        text: "You may not use the Platform to generate content that violates copyright, trademark, patent, or other intellectual property rights. You represent and warrant that you have all necessary rights to upload Your Content and that Your Content does not infringe any third-party rights."
      },
      {
        subtitle: "5.4 Enforcement",
        text: "We reserve the right to: (a) remove any content that violates these Terms; (b) suspend or terminate accounts of violators; (c) report illegal activity to law enforcement; (d) cooperate with legal investigations. We are not obligated to monitor content but may do so at our discretion."
      }
    ]
  },
  {
    icon: CreditCard,
    title: "6. Payment and Subscription Terms",
    content: [
      {
        subtitle: "6.1 Billing and Payment",
        text: "Subscription fees are billed in advance on a monthly or annual basis. All fees are in INR (Indian Rupees) for Indian customers and USD for international customers, unless otherwise stated. Payment is processed securely through Razorpay, a PCI DSS Level 1 compliant payment processor. You authorize us to charge your payment method for all fees due."
      },
      {
        subtitle: "6.2 Automatic Renewal",
        text: "Subscriptions automatically renew at the end of each billing period unless canceled at least 24 hours before the renewal date. You will be charged the then-current subscription fee. You can cancel your subscription at any time through your account dashboard. Cancellation takes effect at the end of your current billing period."
      },
      {
        subtitle: "6.3 Refunds",
        text: "We offer a 14-day money-back guarantee for new subscriptions, provided no credits have been used or services rendered. Refunds are not available for used credits, completed services, or subscription renewals. See our Refund Policy for complete details."
      },
      {
        subtitle: "6.4 Price Changes",
        text: "We reserve the right to modify pricing with 30 days' advance notice via email or platform notification. Existing subscribers maintain their current pricing until their next renewal date. Price changes do not apply retroactively to current billing periods."
      },
      {
        subtitle: "6.5 Failed Payments",
        text: "If a payment fails, we will attempt to retry the payment. If payment continues to fail, your subscription may be suspended or canceled. You are responsible for ensuring your payment method is valid and has sufficient funds."
      },
      {
        subtitle: "6.6 Taxes",
        text: "All prices are exclusive of applicable taxes (GST, VAT, sales tax, etc.). You are responsible for paying all taxes associated with your purchase. Tax amounts will be displayed at checkout."
      }
    ]
  }
];

const additionalSections = [
  {
    title: "7. Disclaimers and Limitation of Liability",
    content: [
      "THE SERVICE IS PROVIDED 'AS IS' AND 'AS AVAILABLE' WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY.",
      "We do not guarantee that: (a) the Service will meet your requirements; (b) the Service will be uninterrupted, timely, secure, or error-free; (c) the results obtained from the Service will be accurate or reliable; (d) any errors will be corrected.",
      "AI-generated visualizations are interpretations and may not reflect exact architectural specifications, building codes, or compliance requirements. You are solely responsible for verifying the accuracy, compliance, and suitability of Generated Content for your intended use.",
      "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.",
      "Our total liability for any claims arising from or related to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim, or one hundred dollars ($100), whichever is greater.",
      "Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so some of the above limitations may not apply to you."
    ]
  },
  {
    title: "8. Indemnification",
    content: [
      "You agree to indemnify, defend, and hold harmless Renderiq, its affiliates, officers, directors, employees, agents, and licensors from and against any and all claims, damages, obligations, losses, liabilities, costs, debts, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights, including intellectual property or privacy rights; (d) Your Content or Generated Content that infringes or violates any law or third-party rights.",
      "We reserve the right to assume exclusive defense and control of any matter subject to indemnification by you, in which case you will cooperate fully with us in asserting any available defenses."
    ]
  },
  {
    title: "9. Modifications to Service and Terms",
    content: [
      "We reserve the right to modify, suspend, or discontinue any aspect of the Service, including features, functionality, pricing, and availability, with or without notice, at any time.",
      "We may update these Terms from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make changes: (a) we will update the 'Last updated' date; (b) for material changes, we will notify you via email or prominent platform notice; (c) we will provide at least 30 days' notice for material changes.",
      "Your continued use of the Service after changes to these Terms constitutes acceptance of the updated Terms. If you do not agree to the updated Terms, you must stop using the Service and may delete your account."
    ]
  },
  {
    title: "10. Governing Law and Dispute Resolution",
    content: [
      "These Terms are governed by and construed in accordance with the laws of India, without regard to conflict of law provisions. For users outside India, these Terms are governed by the laws of your jurisdiction to the extent required by applicable law.",
      "Any disputes, controversies, or claims arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with the Arbitration and Conciliation Act, 2015 (India) or applicable arbitration laws in your jurisdiction.",
      "Arbitration proceedings shall be conducted in English and held in [City, State, India] or such other location as mutually agreed. The arbitrator's decision shall be final and binding.",
      "You may opt out of the arbitration provision within 30 days of account creation by sending written notice to legal@renderiq.io. If you opt out, disputes will be resolved in courts of competent jurisdiction.",
      "Notwithstanding the foregoing, either party may seek injunctive relief in any court of competent jurisdiction to protect intellectual property rights or prevent irreparable harm."
    ]
  }
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6">
            <Scale className="w-4 h-4" />
            <span className="text-sm font-medium">Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Last updated: January 15, 2025
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using Renderiq's AI architectural visualization platform. 
            These Terms constitute a legally binding agreement between you and Renderiq.
          </p>
        </div>
      </section>

      {/* Important Notice */}
      <section className="px-4 -mt-8">
        <div className="container mx-auto max-w-4xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Legal Notice:</strong> By using our platform, you agree to these Terms. If you're using 
              the service on behalf of an organization, you represent that you have authority to bind that 
              organization to these Terms. These Terms are legally binding and enforceable.
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

            {/* Additional Sections */}
            {additionalSections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Gavel className="w-6 h-6 text-primary" />
                  {section.title}
                </h2>
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
                <p><strong>Legal Inquiries:</strong> legal@renderiq.io</p>
                <p><strong>Support:</strong> support@renderiq.io</p>
                <p><strong>General:</strong> contact@renderiq.io</p>
                <p className="text-muted-foreground mt-4">
                  For service of legal process or formal legal notices, please contact our registered agent 
                  at the address provided in our company registration documents.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acknowledgment */}
          <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="font-semibold mb-2">Acknowledgment</h3>
            <p className="text-sm text-muted-foreground">
              By using Renderiq's platform, you acknowledge that you have read, understood, and agree to be 
              bound by these Terms of Service and our Privacy Policy. If you do not agree to these Terms, 
              please discontinue use of the platform immediately and contact us to delete your account. 
              These Terms, together with our Privacy Policy, Refund Policy, and other legal documents, 
              constitute the entire agreement between you and Renderiq regarding the Service.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
