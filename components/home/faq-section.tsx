import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        question: 'What is Renderiq and how does it work?',
        answer: 'Renderiq is an AI-powered architectural visualization platform powered by Google Gemini 3 Pro and Veo 3.1. Transform sketches into photorealistic renders using our unified chat interface. Simply upload your design, describe what you want, and get professional-quality visualizations in minutes. No 3D modeling required.',
      },
      {
        question: 'Do I need any technical skills or 3D modeling experience?',
        answer: 'No! Renderiq is designed for architects, designers, and anyone who needs to visualize architectural concepts. Our unified chat interface makes it easy to create stunning renders without any prior experience. Just describe what you want or upload a sketch.',
      },
      {
        question: 'What file formats does Renderiq support?',
        answer: 'Renderiq supports common image formats including PNG, JPG, JPEG, and WebP. You can upload sketches, photos, or screenshots from 3D modeling software. We also support video input for video-to-video transformations using Veo 3.1.',
      },
      {
        question: 'How do I get started?',
        answer: 'Sign up for a free account and get 5 renders per month. Create a project, upload a sketch or image, and use our unified chat interface to generate renders. You can try Renderiq for as low as ₹500 using our credit-based system.',
      },
    ],
  },
  {
    category: 'Core Features',
    questions: [
      {
        question: 'What are Render Chains and how do they work?',
        answer: 'Render Chains organize your renders into sequential iterations. When you create renders in a project, they\'re automatically organized into chains. You can reference previous renders using @v1, @v2, or @latest in your prompts. Chains help you track design evolution and maintain context between iterations.',
      },
      {
        question: 'How does version control work in Renderiq?',
        answer: 'Every render you create is automatically versioned. You can see the complete history of all renders, including prompts, settings, and outputs. Reference any previous version using @v1, @v2, @latest, or by clicking on previous renders. You can also rollback to any version and create branches from specific renders.',
      },
      {
        question: 'What is the Node-Based Canvas Editor?',
        answer: 'The Canvas Editor is a Blender-style visual workflow builder. Create complex render workflows by connecting nodes visually - Text nodes for prompts, Image nodes for generation, and Variants nodes for creating variations. Perfect for advanced users who want to build reusable workflows.',
      },
      {
        question: 'How does the unified chat interface work?',
        answer: 'The unified chat interface is your main way to interact with Renderiq. Simply type what you want, upload images, and reference previous renders using @v1, @v2, or @latest. The AI understands architectural context and maintains conversation history for better results.',
      },
      {
        question: 'What are AEC finetunes and technically correct renders?',
        answer: 'AEC finetunes are specialized AI models trained specifically for architecture, engineering, and construction. They ensure renders maintain proper scale, proportions, and architectural accuracy. Technically correct renders mean the AI understands building codes, material properties, and structural elements - perfect for professional AEC work.',
      },
    ],
  },
  {
    category: 'AI & Technology',
    questions: [
      {
        question: 'What AI models does Renderiq use?',
        answer: 'Renderiq uses Google Gemini 3 Pro for image generation and Veo 3.1 for video generation. Gemini 3 Pro is architecture-aware and understands design intent, while Veo 3.1 creates cinematic-quality videos from text or images. Both models are fine-tuned for AEC applications.',
      },
      {
        question: 'How accurate are the renders? Do they maintain design intent?',
        answer: 'Yes! Renderiq uses AEC finetunes that are specifically trained to understand architectural elements, maintain proportions, and preserve design intent. The AI recognizes building components, materials, and spatial relationships to produce technically correct renders suitable for professional use.',
      },
      {
        question: 'How long does it take to generate a render?',
        answer: 'Most image renders complete in 2-5 minutes. Video generation using Veo 3.1 may take longer depending on duration and quality settings. You\'ll receive real-time updates on your render progress, and renders are automatically added to your project chains.',
      },
      {
        question: 'What resolution can I export renders at?',
        answer: 'Renderiq supports multiple quality levels, from standard HD to ultra-high 4K resolution. Video renders can be exported in 720p or 1080p, with support for various aspect ratios. All renders are stored in your project and can be downloaded at any time.',
      },
    ],
  },
  {
    category: 'Projects & Organization',
    questions: [
      {
        question: 'How do Projects work?',
        answer: 'Projects are containers for organizing your work. Each project can contain multiple render chains, and each chain contains sequential renders. Create separate projects for different clients, design phases, or building types. Projects help you stay organized and collaborate with your team.',
      },
      {
        question: 'Can I collaborate with my team?',
        answer: 'Yes! Renderiq supports team collaboration. Share projects with team members, work on render chains together, and leave comments on renders. Perfect for AEC firms and design teams who need to collaborate on visualization projects.',
      },
      {
        question: 'How do I reference previous renders?',
        answer: 'In the unified chat interface, use @v1 to reference the first render in a chain, @v2 for the second, and @latest for the most recent render. You can also click on previous renders to use them as references. This helps maintain consistency and build on previous iterations.',
      },
      {
        question: 'Can I organize renders into different chains?',
        answer: 'Absolutely! Create multiple chains within a project for different design directions, variations, or iterations. Chains are automatically created when you start rendering, but you can also create them manually. Each chain maintains its own version history.',
      },
    ],
  },
  {
    category: 'Pricing & Credits',
    questions: [
      {
        question: 'How does the credit system work?',
        answer: 'Credits are used to generate renders. Each render costs credits based on quality and type (image vs video). You can purchase credit packages starting from ₹500 or subscribe to a plan that includes monthly credits. Purchased credits never expire, making it perfect for occasional use.',
      },
      {
        question: 'Can I try Renderiq for free?',
        answer: 'Yes! Renderiq offers a free tier with 5 renders per month, HD exports, and full access to all features including render chains, version control, and the unified chat interface. Perfect for testing and learning. You can also purchase credits starting from ₹500.',
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time. Your subscription will remain active until the end of your billing period, and you\'ll continue to have access to all features until then. Any purchased credits remain in your account even after cancellation.',
      },
      {
        question: 'Do unused credits expire?',
        answer: 'No! Credits purchased through credit packages never expire. Monthly subscription credits reset each billing cycle, but any purchased credits remain in your account indefinitely. Perfect for pay-as-you-go usage.',
      },
    ],
  },
  {
    category: 'AEC & Professional Use',
    questions: [
      {
        question: 'Is Renderiq suitable for professional AEC projects?',
        answer: 'Absolutely! Renderiq is specifically designed for AEC professionals with AEC finetunes that ensure technically correct renders. It\'s perfect for visualizing commercial buildings, industrial facilities, educational institutions, healthcare facilities, and more. The AI understands architectural elements and produces accurate, professional renders suitable for client presentations.',
      },
      {
        question: 'Can I use Renderiq for retail store design?',
        answer: 'Yes! Renderiq excels at retail visualization. Use it to design store layouts, visualize product displays, create marketing materials, and present retail concepts to stakeholders. Perfect for both physical retail and e-commerce visualization needs.',
      },
      {
        question: 'Are the renders suitable for client presentations?',
        answer: 'Yes! Renderiq produces professional-quality renders suitable for client presentations, marketing materials, and design documentation. With AEC finetunes ensuring technical accuracy and 4K export options, your renders will meet professional standards.',
      },
      {
        question: 'Does Renderiq integrate with CAD or BIM software?',
        answer: 'Renderiq works with any image format, so you can export screenshots from CAD or BIM software and import them into Renderiq. We also offer API access for advanced integrations. The unified chat interface makes it easy to refine renders from CAD/BIM exports.',
      },
    ],
  },
  {
    category: 'Security & Privacy',
    questions: [
      {
        question: 'Is my data secure and private?',
        answer: 'Yes, security and privacy are our top priorities. All uploads are encrypted, and you can choose to keep projects private or share them publicly. We\'re GDPR compliant and never share your data with third parties. Enterprise plans include additional security features.',
      },
      {
        question: 'Can I keep my projects private?',
        answer: 'Yes! By default, all projects are private. You can choose to make specific projects or renders public if you want to share them. Private projects are only visible to you and team members you explicitly invite.',
      },
      {
        question: 'What happens to my renders if I cancel?',
        answer: 'All your renders, projects, and chains remain accessible even after cancellation. You can download all your work at any time. If you have purchased credits remaining, they stay in your account and never expire.',
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
            Everything you need to know about Renderiq
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


