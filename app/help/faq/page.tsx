import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'FAQ - AI Architecture Tools | Renderiq',
  description: 'Frequently asked questions about Renderiq AI architecture tools, pricing, features, and support. Get answers to common questions about AI-powered architectural visualization.',
  keywords: [
    'AI architecture FAQ',
    'Renderiq FAQ',
    'AI rendering questions',
    'architectural visualization FAQ',
    'AI design tools help',
    'architecture software support'
  ],
};

const faqs = [
  {
    question: "What is Renderiq and how does it work?",
    answer: "Renderiq is an AI-powered architectural visualization platform that transforms sketches into hyperrealistic renders and videos. Simply upload your architectural sketch, and our AI engines analyze the design elements to generate photorealistic visualizations in minutes."
  },
  {
    question: "How accurate is the AI rendering?",
    answer: "Our AI achieves 95%+ accuracy in interpreting architectural sketches. The AI understands design elements, materials, lighting, and spatial relationships to produce highly realistic renders that closely match your design intent."
  },
  {
    question: "What types of projects can I create?",
    answer: "You can create interior designs, exterior architecture, furniture layouts, site plans, and more. Our AI supports residential, commercial, hospitality, retail, educational facilities, landscape architecture, and urban planning projects."
  },
  {
    question: "How fast is the rendering process?",
    answer: "Most renders complete in 2-5 minutes, compared to hours or days with traditional methods. Our AI-powered rendering is up to 100x faster than conventional architectural visualization tools."
  },
  {
    question: "Is my data secure and private?",
    answer: "Yes, we use enterprise-grade security with GDPR compliance, SOC 2 certification, and end-to-end encryption. Your designs remain private unless you choose to share them in our public gallery."
  },
  {
    question: "What are the pricing plans?",
    answer: "We offer a free plan with 10 credits, Starter plan at $29/month (100 credits), and Professional plan at $99/month (500 credits). Enterprise plans are available with custom pricing and features."
  },
  {
    question: "Can I integrate Renderiq with my existing workflow?",
    answer: "Yes, we offer API access, CAD software compatibility, cloud storage sync, and various export formats. We support integration with popular architecture and design software like AutoCAD, Revit, and SketchUp."
  },
  {
    question: "What output formats are available?",
    answer: "We support high-resolution image exports up to 4K, video animations, and various file formats compatible with design software. You can export for presentations, marketing materials, and client deliverables."
  },
  {
    question: "Do you offer customer support?",
    answer: "Yes, we provide comprehensive support including documentation, video tutorials, community forum, email support, and live chat for Pro subscribers. Enterprise customers receive dedicated support."
  },
  {
    question: "Can I use renders for client presentations?",
    answer: "Absolutely! Our AI-generated renders are perfect for client presentations, proposals, and marketing materials. The photorealistic quality helps clients visualize projects before construction begins."
  },
  {
    question: "What makes Renderiq different from other AI tools?",
    answer: "Renderiq offers multiple specialized AI engines, faster rendering times, higher accuracy, comprehensive feature set, and excellent customer support. We're specifically designed for architects and designers with professional-grade output quality."
  },
  {
    question: "Is there a mobile app available?",
    answer: "Renderiq is fully responsive and works on all devices through your web browser. We're developing dedicated mobile apps for iOS and Android, coming in 2025."
  }
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
};

export default function FAQPage() {
  return (
    <>
      <JsonLd data={faqSchema} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Get answers to common questions about Renderiq AI architecture tools
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {faq.question}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Still have questions?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Our support team is here to help you get the most out of Renderiq.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="mailto:support@renderiq.io"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Contact Support
                </a>
                <a 
                  href="/tutorials"
                  className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
                >
                  View Tutorials
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
