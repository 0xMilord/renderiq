import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileCheck, Shield, Database, Lock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: "Data Processing Agreement | Renderiq - AI Architectural Visualization",
  description: "Data Processing Agreement (DPA) for Renderiq's AI architectural visualization platform. GDPR-compliant data processing terms for enterprise customers.",
  robots: "index, follow",
  openGraph: {
    title: "Data Processing Agreement | Renderiq - AI Architectural Visualization",
    description: "Data Processing Agreement (DPA) for Renderiq's AI architectural visualization platform. GDPR-compliant data processing terms for enterprise customers.",
    type: "website",
    url: `${siteUrl}/dpa`,
    siteName: "Renderiq",
    images: [
      {
        url: `${siteUrl}/og/dpa.jpg`,
        width: 1200,
        height: 630,
        alt: "Data Processing Agreement - Renderiq",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Data Processing Agreement | Renderiq",
    description: "GDPR-compliant data processing terms for enterprise customers.",
    images: [`${siteUrl}/og/dpa.jpg`],
    creator: "@Renderiq",
  },
};

const dpaSections = [
  {
    icon: FileCheck,
    title: "1. Definitions and Scope",
    content: [
      {
        text: "This Data Processing Agreement ('DPA') forms part of the Terms of Service and applies when Renderiq processes personal data on behalf of customers ('Data Controller') in connection with the Service. This DPA complies with the General Data Protection Regulation (GDPR) and other applicable data protection laws."
      },
      {
        text: "For the purposes of this DPA: (a) 'Personal Data' means any information relating to an identified or identifiable natural person; (b) 'Processing' means any operation performed on Personal Data; (c) 'Data Controller' means the entity that determines the purposes and means of processing; (d) 'Data Processor' means Renderiq, which processes Personal Data on behalf of the Data Controller."
      },
      {
        text: "This DPA applies to all Personal Data processed by Renderiq in connection with providing the Service, including but not limited to: user account information, project data, architectural designs, usage data, and payment information."
      }
    ]
  },
  {
    icon: Shield,
    title: "2. Roles and Responsibilities",
    content: [
      {
        subtitle: "2.1 Data Controller Responsibilities",
        text: "As Data Controller, you are responsible for: (a) ensuring you have lawful basis for processing Personal Data; (b) obtaining necessary consents from data subjects; (c) providing accurate instructions for data processing; (d) ensuring Personal Data you provide is accurate and up-to-date; (e) complying with data protection laws applicable to you."
      },
      {
        subtitle: "2.2 Data Processor Responsibilities",
        text: "As Data Processor, Renderiq will: (a) process Personal Data only in accordance with your documented instructions and this DPA; (b) implement appropriate technical and organizational measures to protect Personal Data; (c) assist you in fulfilling data subject rights requests; (d) notify you of data breaches without undue delay; (e) maintain records of processing activities."
      },
      {
        subtitle: "2.3 Joint Responsibilities",
        text: "Both parties will cooperate in good faith to ensure compliance with applicable data protection laws and to address any data protection concerns or inquiries from data subjects or supervisory authorities."
      }
    ]
  },
  {
    icon: Lock,
    title: "3. Security Measures",
    content: [
      {
        subtitle: "3.1 Technical Safeguards",
        text: "Renderiq implements industry-standard security measures including: (a) Encryption: AES-256 encryption at rest and TLS 1.3/SSL in transit; (b) Access Controls: Role-based access control, multi-factor authentication, regular access reviews; (c) Network Security: Firewalls, intrusion detection, DDoS protection; (d) Vulnerability Management: Regular security audits, penetration testing, patch management."
      },
      {
        subtitle: "3.2 Organizational Safeguards",
        text: "We maintain: (a) Confidentiality obligations for all personnel; (b) Regular security training; (c) Incident response procedures; (d) Business continuity and disaster recovery plans; (e) Regular security assessments and audits."
      },
      {
        subtitle: "3.3 Security Certifications",
        text: "Our infrastructure providers maintain industry certifications including ISO 27001, SOC 2, and PCI DSS Level 1 compliance. We undergo regular third-party security assessments."
      }
    ]
  },
  {
    icon: Database,
    title: "4. Data Processing Details",
    content: [
      {
        subtitle: "4.1 Processing Activities",
        text: "Renderiq processes Personal Data for the following purposes: (a) Account management and authentication; (b) Service delivery and rendering; (c) Payment processing; (d) Customer support; (e) Service improvement and analytics (using anonymized data); (f) Legal compliance and fraud prevention."
      },
      {
        subtitle: "4.2 Categories of Personal Data",
        text: "We process: (a) Identity Data: name, email, phone number; (b) Account Data: username, password (hashed), profile information; (c) Content Data: architectural designs, project files, renders; (d) Usage Data: platform interactions, feature usage, performance metrics; (e) Payment Data: billing information, payment history (processed securely through Razorpay)."
      },
      {
        subtitle: "4.3 Data Subjects",
        text: "Personal Data relates to: (a) Platform users and account holders; (b) Authorized users of enterprise accounts; (c) Payment cardholders (where applicable)."
      },
      {
        subtitle: "4.4 Retention Periods",
        text: "Personal Data is retained: (a) Account Data: Until account deletion or 3 years of inactivity; (b) Project Data: Until deletion by user or account closure; (c) Payment Records: 7 years for legal compliance; (d) Usage Data: Aggregated and anonymized data may be retained indefinitely. See our Privacy Policy for detailed retention periods."
      }
    ]
  },
  {
    icon: Users,
    title: "5. Sub-Processors and Third Parties",
    content: [
      {
        subtitle: "5.1 Authorized Sub-Processors",
        text: "We use the following sub-processors: (a) Supabase (Cloud Hosting) - United States/EU; (b) Razorpay (Payment Processing) - India; (c) Google Cloud Vertex AI (AI Processing) - United States/EU; (d) Email Service Providers - United States. All sub-processors are bound by data processing agreements."
      },
      {
        subtitle: "5.2 Sub-Processor Changes",
        text: "We will notify you of any new sub-processors or changes to existing sub-processors. You may object to new sub-processors by contacting us within 30 days. If you object and we cannot accommodate your concerns, you may terminate the Service."
      },
      {
        subtitle: "5.3 International Transfers",
        text: "Personal Data may be transferred to sub-processors outside your jurisdiction. We ensure appropriate safeguards including Standard Contractual Clauses (SCCs) for EU data transfers and compliance with applicable data protection laws."
      }
    ]
  },
  {
    icon: Shield,
    title: "6. Data Subject Rights",
    content: [
      {
        subtitle: "6.1 Assistance with Rights Requests",
        text: "We will assist you in responding to data subject rights requests including: (a) Right of access; (b) Right to rectification; (c) Right to erasure ('right to be forgotten'); (d) Right to restrict processing; (e) Right to data portability; (f) Right to object; (g) Rights related to automated decision-making."
      },
      {
        subtitle: "6.2 Response Time",
        text: "We will respond to data subject rights requests within 30 days as required by law. We may extend this period by an additional 60 days for complex requests, with notification to the data subject."
      },
      {
        subtitle: "6.3 Data Export",
        text: "Upon request, we will provide Personal Data in a structured, commonly used, and machine-readable format to facilitate data portability."
      }
    ]
  }
];

const additionalSections = [
  {
    title: "7. Data Breach Notification",
    content: [
      "In the event of a personal data breach, Renderiq will notify you without undue delay and in any event within 72 hours of becoming aware of the breach, where feasible.",
      "The notification will include: (a) Description of the nature of the breach; (b) Categories and approximate number of data subjects affected; (c) Categories and approximate number of personal data records concerned; (d) Likely consequences of the breach; (e) Measures taken or proposed to address the breach.",
      "We will cooperate with you and provide reasonable assistance in connection with any data breach, including assistance with notifying supervisory authorities and data subjects where required."
    ]
  },
  {
    title: "8. Audit Rights",
    content: [
      "You have the right to audit Renderiq's compliance with this DPA, subject to: (a) Reasonable advance notice (at least 30 days); (b) Execution of a confidentiality agreement; (c) Conducting audits during business hours; (d) Limiting audits to once per year unless a breach is suspected.",
      "We will make available to you all information necessary to demonstrate compliance with this DPA and applicable data protection laws.",
      "For enterprise customers, we may provide audit reports from third-party security assessments in lieu of on-site audits."
    ]
  },
  {
    title: "9. Return and Deletion of Data",
    content: [
      "Upon termination of the Service or upon your request, we will: (a) Return all Personal Data to you in a structured, commonly used format; or (b) Delete all Personal Data, unless retention is required by law.",
      "Deletion will occur within 30 days of termination or request, subject to: (a) Legal retention requirements (e.g., payment records for 7 years); (b) Backup systems (data will be deleted from backups within 90 days); (c) Ongoing legal proceedings or disputes.",
      "You may request data deletion at any time through your account settings or by contacting privacy@renderiq.io."
    ]
  },
  {
    title: "10. Liability and Indemnification",
    content: [
      "Each party's liability under this DPA is subject to the limitations set forth in the Terms of Service.",
      "Renderiq will be liable for damages resulting from our breach of this DPA or applicable data protection laws, subject to the liability limitations in the Terms of Service.",
      "You will indemnify Renderiq against claims arising from your breach of data protection laws or your instructions that violate applicable law."
    ]
  }
];

export default function DPAPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-20 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6">
            <FileCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Data Processing Agreement</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Data Processing Agreement
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Last updated: January 15, 2025
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            This Data Processing Agreement (DPA) governs how Renderiq processes personal data on behalf of 
            customers in compliance with GDPR and other data protection laws.
          </p>
        </div>
      </section>

      {/* Important Notice */}
      <section className="px-4 -mt-8">
        <div className="container mx-auto max-w-4xl">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Legal Notice:</strong> This DPA is incorporated into and forms part of our Terms of Service. 
              It applies when Renderiq acts as a Data Processor processing personal data on your behalf. This DPA 
              is legally binding and enforceable.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-12">
            {dpaSections.map((section, idx) => (
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
              <CardTitle className="text-xl">11. Contact and Execution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For questions about this DPA or to execute a signed DPA for enterprise customers:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Data Protection Officer:</strong> dpo@renderiq.io</p>
                <p><strong>Legal:</strong> legal@renderiq.io</p>
                <p><strong>Enterprise:</strong> enterprise@renderiq.io</p>
              </div>
              <p className="text-muted-foreground text-sm mt-4">
                Enterprise customers may request a signed DPA by contacting enterprise@renderiq.io. 
                This DPA is effective upon your acceptance of our Terms of Service or execution of a signed DPA.
              </p>
            </CardContent>
          </Card>

          {/* Legal Notice */}
          <div className="mt-12 p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <h3 className="font-semibold mb-2">Legal Effect</h3>
            <p className="text-sm text-muted-foreground">
              This DPA is legally binding and forms part of the Terms of Service. By using our Service, 
              you acknowledge that you have read and agree to this DPA. This DPA complies with Article 28 
              of the GDPR and other applicable data protection laws. For enterprise customers requiring a 
              signed DPA, please contact enterprise@renderiq.io.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


