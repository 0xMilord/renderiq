import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        question: 'What is RenderIQ and how does it work?',
        answer: 'RenderIQ is an AI-powered architectural visualization platform that transforms sketches and 3D model snapshots into photorealistic renders and videos. Simply upload your design, customize styles and materials, and get professional-quality visualizations in minutes.',
      },
      {
        question: 'Do I need any technical skills to use RenderIQ?',
        answer: 'No technical skills required! RenderIQ is designed for architects, designers, and anyone who needs to visualize architectural concepts. Our intuitive interface makes it easy to create stunning renders without any prior experience.',
      },
      {
        question: 'What file formats does RenderIQ support?',
        answer: 'RenderIQ supports common image formats including PNG, JPG, JPEG, and WebP. You can upload sketches, photos, or screenshots from 3D modeling software. We also support video input for video-to-video transformations.',
      },
    ],
  },
  {
    category: 'Pricing & Credits',
    questions: [
      {
        question: 'How does the credit system work?',
        answer: 'Credits are used to generate renders. Each render costs credits based on quality and type (image vs video). You can purchase credit packages or subscribe to a plan that includes monthly credits. Credits never expire.',
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time. Your subscription will remain active until the end of your billing period, and you\'ll continue to have access to all features until then.',
      },
      {
        question: 'Do unused credits roll over?',
        answer: 'Yes! Credits purchased through credit packages never expire. Monthly subscription credits reset each billing cycle, but any purchased credits remain in your account indefinitely.',
      },
    ],
  },
  {
    category: 'AEC & Retail',
    questions: [
      {
        question: 'Is RenderIQ suitable for AEC (Architecture, Engineering, Construction) projects?',
        answer: 'Absolutely! RenderIQ is specifically designed for AEC professionals. It\'s perfect for visualizing commercial buildings, industrial facilities, educational institutions, healthcare facilities, and more. Our AI understands architectural elements and produces accurate, professional renders.',
      },
      {
        question: 'Can I use RenderIQ for retail store design?',
        answer: 'Yes! RenderIQ excels at retail visualization. Use it to design store layouts, visualize product displays, create marketing materials, and present retail concepts to stakeholders. Perfect for both physical retail and e-commerce visualization needs.',
      },
      {
        question: 'Does RenderIQ support large-scale commercial projects?',
        answer: 'Yes, RenderIQ can handle projects of any scale - from small residential designs to large commercial complexes. Our platform is optimized for both individual architects and large AEC firms.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        question: 'What AI models does RenderIQ use?',
        answer: 'RenderIQ uses Google\'s Gemini 3 Pro for image generation and Veo 3.1 for video generation. These are state-of-the-art AI models specifically trained for high-quality visual content creation.',
      },
      {
        question: 'How long does it take to generate a render?',
        answer: 'Most renders complete in 2-5 minutes. Video generation may take longer depending on duration and quality settings. You\'ll receive real-time updates on your render progress.',
      },
      {
        question: 'What resolution can I export renders at?',
        answer: 'RenderIQ supports multiple quality levels, from standard HD to ultra-high 4K resolution. Video renders can be exported in 720p or 1080p, with support for various aspect ratios.',
      },
      {
        question: 'Is my data secure and private?',
        answer: 'Yes, security and privacy are our top priorities. All uploads are encrypted, and you can choose to keep projects private or share them publicly. We\'re GDPR compliant and never share your data with third parties.',
      },
    ],
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-muted text-muted-foreground px-4 py-2">
            FAQ
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about RenderIQ
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">{category.category}</h3>
              {category.questions.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${categoryIndex}-${index}`}
                  className="border border-border rounded-lg px-6 mb-4"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}


