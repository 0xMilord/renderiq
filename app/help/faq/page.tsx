import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'FAQ - AI Architecture Tools | Renderiq',
  description: 'Frequently asked questions about Renderiq AI architecture tools, pricing, features, Canvas Editor, specialized tools, and support. Get answers about AI-powered architectural visualization, floor plan rendering, 3D visualization, and AEC design tools.',
  keywords: [
    'AI architecture FAQ',
    'Renderiq FAQ',
    'AI rendering questions',
    'architectural visualization FAQ',
    'AI design tools help',
    'architecture software support',
    'Canvas Editor FAQ',
    'floor plan visualization',
    '3D rendering software',
    'AEC visualization tools',
    'architectural rendering pricing',
    'AI rendering credits',
    'Google Gemini 3 Pro',
    'Veo 3.1 video generation',
    'node-based workflow editor',
    'render chains version control',
    'architectural AI tools',
    'interior design visualization',
    'commercial building rendering',
    'urban planning visualization'
  ],
};

const faqs = [
  {
    question: "What is Renderiq and how does it work?",
    answer: "Renderiq is an AI-powered architectural visualization platform powered by Google Gemini 3 Pro and Veo 3.1. Transform sketches, floor plans, and 3D models into photorealistic renders and videos using our unified chat interface or 21 specialized tools. Simply upload your design, describe what you want, and get professional-quality visualizations in 30-60 seconds. No 3D modeling software or technical skills required. Perfect for architects, interior designers, and AEC professionals."
  },
  {
    question: "What is the Canvas Editor and how does it work?",
    answer: "The Canvas Editor is a Blender-style, node-based visual workflow builder that lets you create complex render workflows by connecting nodes visually. Add Text nodes for prompts, Image nodes for AI generation, Variants nodes for creating multiple variations, Style nodes, and Material nodes. Connect nodes to build reusable workflows, execute them with one click, and save templates. Perfect for advanced users who want to automate repetitive tasks and create sophisticated visualization pipelines without coding."
  },
  {
    question: "What specialized tools does Renderiq offer?",
    answer: "Renderiq offers 21 specialized AI tools: Render Transformations (section drawings, CAD conversion, upscaling, effects), Floor Plan Tools (furnished visualization, 3D conversion, technical diagrams), Diagram Tools (exploded views, multi-angle views), Material & Texture Tools (texture changes, material alterations, lighting adjustments), Interior Design Tools (upholstery changes, product placement, item replacement, moodboard rendering), and 3D Tools (3D model rendering, enhancement). Each tool has optimized prompts for best results."
  },
  {
    question: "How accurate is the AI rendering for architectural projects?",
    answer: "Our AI achieves 95%+ accuracy in interpreting architectural sketches and designs. The AI understands design elements, materials, lighting, spatial relationships, building codes, and structural principles to produce highly realistic, technically correct renders that closely match your design intent. AEC finetunes ensure proper scale, proportions, and architectural accuracy - perfect for professional AEC work and client presentations."
  },
  {
    question: "What types of projects can I create with Renderiq?",
    answer: "You can create interior designs, exterior architecture, furniture layouts, site plans, floor plan visualizations, 3D renders, technical diagrams, and more. Our AI supports residential, commercial, hospitality, institutional, educational facilities, healthcare buildings, industrial facilities, landscape architecture, urban planning, and mixed-use developments. Perfect for architects, interior designers, and AEC professionals working on any scale of project."
  },
  {
    question: "How fast is the rendering process compared to traditional methods?",
    answer: "Most image renders complete in 30-60 seconds, up to 100x faster than traditional 3D rendering methods that take hours or days. Video generation using Veo 3.1 takes 2-5 minutes for a 5-8 second video. You'll receive real-time updates on render progress. Our AI-powered rendering eliminates the need for expensive hardware, complex software setup, and lengthy rendering times - perfect for fast-paced design workflows."
  },
  {
    question: "What are Render Chains and how do they help with design iteration?",
    answer: "Render Chains organize your renders into sequential iterations, automatically tracking your design evolution. Reference previous renders using @v1, @v2, or @latest in your prompts to maintain consistency. Chains help you track design evolution, compare iterations side-by-side, and maintain context between versions. Perfect for client presentations where you need to show design progress and explore different design directions within the same project."
  },
  {
    question: "Is my data secure and private? What about GDPR compliance?",
    answer: "Yes, security and privacy are our top priorities. All uploads are encrypted in transit and at rest. We're GDPR compliant, follow industry best practices, and never share your data with third parties. Enterprise plans include additional security features, dedicated infrastructure, and SOC 2 compliance. Your designs remain private unless you explicitly choose to share them in our public gallery. You have complete control over your data."
  },
  {
    question: "What are the pricing plans and how much do renders cost?",
    answer: "Renderiq offers flexible pricing: Free plan with 10 credits/month (3 projects, 5 renders per project), Starter plan at ₹119/month with 24 credits/month (10 projects, 10 renders per project), Pro plan at ₹499/month with 100 credits/month (unlimited projects and renders, video generation, API access), and Enterprise plan at ₹4,999/month with 1,000 credits/month (unlimited everything, team collaboration, dedicated support). Image renders cost 1-5 credits, videos cost ~25 credits per second. Annual plans available with 20-25% savings."
  },
  {
    question: "How does the credit system work? Do credits expire?",
    answer: "Credits are used to generate renders and videos. You can purchase credit packages (Starter Pack: ₹250 for 50 credits, Professional Pack: ₹499 for 100 credits, Power Pack: ₹2,499 for 500 credits, Enterprise Pack: ₹4,999 for 1,000 credits) or subscribe to a monthly plan. Purchased credits never expire and remain in your account permanently. Monthly subscription credits reset each billing cycle, but purchased credits roll over indefinitely. Perfect for flexible, pay-as-you-go usage."
  },
  {
    question: "Can I integrate Renderiq with my existing workflow or CAD software?",
    answer: "Yes! Renderiq works seamlessly with your existing workflow. Upload screenshots or exports from AutoCAD, Revit, SketchUp, or any 3D modeling software. We support common image formats (PNG, JPG, WebP) that can be exported from virtually any design tool. Export your Renderiq renders and import them back into your CAD software, presentation tools, or design documentation. API access is available for Pro and Enterprise plans to integrate Renderiq into custom workflows and automation."
  },
  {
    question: "What output formats and resolutions are available?",
    answer: "Renderiq supports high-resolution image exports from standard HD to ultra-high 4K resolution, suitable for presentations, print, or web use. Video renders can be exported in 720p or 1080p with support for various aspect ratios. All renders are stored in your project and can be downloaded at any time in common formats (PNG, JPG, WebP for images, MP4 for videos). Professional-grade output suitable for client deliverables, marketing materials, and design documentation."
  },
  {
    question: "Can I generate videos with Renderiq? How does video generation work?",
    answer: "Yes! Renderiq supports video generation using Google Veo 3.1, one of the most advanced video AI models. Create cinematic-quality architectural walkthroughs, design animations, and visualization videos from text prompts or images. Video generation costs approximately 25 credits per second. Perfect for client presentations, marketing materials, and showcasing design concepts in motion. Export videos in 720p or 1080p resolution with smooth motion and realistic lighting."
  },
  {
    question: "Do you offer customer support and documentation?",
    answer: "Yes, we provide comprehensive support including detailed documentation, video tutorials, community forum, email support (support@renderiq.io), and priority support for Pro subscribers. Enterprise customers receive dedicated support with SLA guarantees. Our documentation covers all 21 specialized tools, Canvas Editor workflows, render chains, and best practices. We're committed to helping you get the most out of Renderiq."
  },
  {
    question: "Can I use Renderiq renders for client presentations and proposals?",
    answer: "Absolutely! Renderiq renders are perfect for client presentations, proposals, marketing materials, and design documentation. The photorealistic quality helps clients visualize projects before construction begins, making it easier to communicate design intent and secure approvals. Export renders at high resolution suitable for presentations, print materials, websites, and social media. Professional-grade output that impresses clients and wins projects."
  },
  {
    question: "What makes Renderiq different from other AI tools like Midjourney or DALL-E?",
    answer: "Renderiq is purpose-built for architecture and AEC professionals. Unlike generic AI tools, our AI models are fine-tuned specifically for architectural visualization, ensuring accurate proportions, proper scale, and technically correct renders. We offer 21 specialized tools for specific tasks, a node-based Canvas Editor for complex workflows, render chains for version control, AEC-specific features, and professional-grade output that generic tools simply cannot provide. Perfect for architects who need accurate, not artistic, renders."
  },
  {
    question: "Can I collaborate with my team on Renderiq projects?",
    answer: "Yes! Renderiq supports team collaboration on Pro and Enterprise plans. Share projects with team members, work on render chains together, leave comments on renders, and track design iterations as a team. Perfect for AEC firms, design studios, and architecture teams who need to collaborate on visualization projects. Team members can view, comment, and create renders within shared projects, making it easy to coordinate design visualization work."
  },
  {
    question: "Is there a mobile app available? Can I use Renderiq on my phone or tablet?",
    answer: "Renderiq is fully responsive and works on all devices through your web browser - desktop, laptop, tablet, and mobile. The interface adapts to your screen size, making it easy to view renders, check project status, and manage your work on the go. We're developing dedicated mobile apps for iOS and Android with enhanced mobile features, coming in 2025. For now, the web app provides full functionality on all devices."
  },
  {
    question: "What AI models does Renderiq use? Why Google Gemini 3 Pro and Veo 3.1?",
    answer: "Renderiq uses Google Gemini 3 Pro for image generation and Google Veo 3.1 for video generation. Gemini 3 Pro is architecture-aware, understands design intent, maintains proper proportions, and produces photorealistic renders. Veo 3.1 creates cinematic-quality videos with smooth motion and realistic lighting. Both models are fine-tuned specifically for AEC applications, ensuring technically accurate and professional results. These are among the most advanced AI models available, giving you the best possible visualization quality."
  },
  {
    question: "Can I cancel my subscription anytime? What happens to my work and credits?",
    answer: "Yes, you can cancel your subscription at any time with no cancellation fees. Your subscription remains active until the end of your billing period. All your renders, projects, chains, and Canvas workflows remain accessible permanently. Any purchased credits stay in your account permanently and never expire. After cancellation, you'll continue to have access to your account on the Free plan, allowing you to use purchased credits and view your work. Nothing is deleted when you cancel."
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
