'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        question: 'What is Renderiq and how does it work?',
        answer: 'Renderiq is an AI-powered architectural visualization platform powered by Google Gemini 3 Pro and Veo 3.1. Transform sketches into photorealistic renders using our unified chat interface. Simply upload your design, describe what you want, and get professional-quality visualizations in minutes. No 3D modeling required.',
      },
      {
        question: 'Do I need any technical skills to use Renderiq?',
        answer: 'No! Renderiq is designed for architects, designers, and anyone who needs to visualize architectural concepts. Our unified chat interface makes it easy to create stunning renders without any prior experience. Just describe what you want or upload a sketch.',
      },
      {
        question: 'What file formats does Renderiq support?',
        answer: 'Renderiq supports common image formats including PNG, JPG, JPEG, and WebP. You can upload sketches, photos, or screenshots from 3D modeling software. We also support video input for video-to-video transformations using Veo 3.1.',
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
    category: 'Technical',
    questions: [
      {
        question: 'What AI models does Renderiq use?',
        answer: 'Renderiq uses Google Gemini 3 Pro for image generation and Veo 3.1 for video generation. Gemini 3 Pro is architecture-aware and understands design intent, while Veo 3.1 creates cinematic-quality videos from text or images. Both models are fine-tuned for AEC applications.',
      },
      {
        question: 'How long does it take to generate a render?',
        answer: 'Most image renders complete in 2-5 minutes. Video generation using Veo 3.1 may take longer depending on duration and quality settings. You\'ll receive real-time updates on your render progress, and renders are automatically added to your project chains.',
      },
      {
        question: 'What resolution can I export renders at?',
        answer: 'Renderiq supports multiple quality levels, from standard HD to ultra-high 4K resolution. Video renders can be exported in 720p or 1080p, with support for various aspect ratios. All renders are stored in your project and can be downloaded at any time.',
      },
      {
        question: 'Is my data secure and private?',
        answer: 'Yes, security and privacy are our top priorities. All uploads are encrypted, and you can choose to keep projects private or share them publicly. We\'re GDPR compliant, SOC 2 compliant, and never share your data with third parties. Enterprise plans include additional security features.',
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
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time. Your subscription will remain active until the end of your billing period, and you\'ll continue to have access to all features until then. Any purchased credits remain in your account even after cancellation.',
      },
      {
        question: 'Do unused credits roll over?',
        answer: 'Credits purchased through credit packages never expire and remain in your account indefinitely. Monthly subscription credits reset each billing cycle, but any purchased credits roll over. Perfect for pay-as-you-go usage.',
      },
    ],
  },
  {
    category: 'AEC Professionals',
    questions: [
      {
        question: 'Is Renderiq suitable for AEC (Architecture, Engineering, Construction) projects?',
        answer: 'Absolutely! Renderiq is specifically designed for AEC professionals with AEC finetunes that ensure technically correct renders. It\'s perfect for visualizing commercial buildings, industrial facilities, educational institutions, healthcare facilities, and more. The AI understands architectural elements and produces accurate, professional renders suitable for client presentations.',
      },
      {
        question: 'Does Renderiq support large-scale commercial projects?',
        answer: 'Yes! Renderiq handles projects of all scales, from small residential designs to large commercial complexes. Our AI understands architectural context and can visualize entire buildings, campuses, and developments. Perfect for AEC firms working on large-scale projects.',
      },
      {
        question: 'Can Renderiq handle mixed-use developments and urban planning?',
        answer: 'Yes! Renderiq excels at complex architectural projects including mixed-use developments, urban planning, and master planning. The AI understands spatial relationships, building scales, and can visualize entire developments with proper context and proportions.',
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

// Shortened tab names
const tabNames: Record<string, string> = {
  'General': 'General',
  'Core Features': 'Features',
  'Technical': 'Technical',
  'Projects & Organization': 'Projects',
  'Pricing & Credits': 'Pricing',
  'AEC Professionals': 'AEC',
  'Security & Privacy': 'Security',
};

export function FAQSection() {
  const [activeTab, setActiveTab] = useState(faqs[0]?.category || '');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="faq" className="bg-[hsl(72,87%,62%)] w-full overflow-x-hidden relative">
      <div className="w-full px-4 sm:px-6 lg:px-8 relative border-l-[5px] border-r-[5px] border-b-[5px] border-[hsl(0,0%,7%)]">
        <div className="w-full relative">
          <div className="text-left relative pt-8">
            <h2 className="text-4xl md:text-5xl font-bold text-[hsl(0,0%,7%)] mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-[hsl(0,0%,20%)] max-w-3xl pb-6">
              Everything you need to know about Renderiq
            </p>
          </div>
        </div>
      </div>

      <div className="w-full relative border-l-[5px] border-b-[5px] border-[hsl(0,0%,7%)]">
        {/* Black container behind FAQ */}
        <div className="absolute inset-0 bg-black -z-10"></div>
        
        <div className="flex flex-col lg:flex-row w-full overflow-hidden relative">
          {/* Left Column - 60% - FAQ Content */}
          <div className="w-full lg:w-[60%] order-1 lg:order-1 px-4 sm:px-6 lg:px-8 py-8 bg-[hsl(72,87%,62%)] relative flex flex-col border-r-[5px] border-[hsl(0,0%,7%)]">
            <div className="w-full relative px-4 sm:px-6 lg:px-8 py-6 rounded-2xl bg-background flex-1 border-[5px] border-[hsl(0,0%,7%)]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" baseId="faq-tabs">
                <div className="relative mb-8">
                  
                  {showLeftArrow && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/90 shadow-md hover:bg-background/80 text-foreground"
                      onClick={() => scroll('left')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  {showRightArrow && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/90 shadow-md hover:bg-background/80 text-foreground"
                      onClick={() => scroll('right')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                  <TabsList 
                    ref={scrollContainerRef}
                    className="flex w-full h-auto p-1 bg-muted overflow-x-auto scroll-smooth gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    onScroll={checkScrollButtons}
                  >
                    {faqs.map((category) => (
                      <TabsTrigger
                        key={category.category}
                        value={category.category}
                        className="text-xs sm:text-sm px-3 sm:px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-sm rounded-md whitespace-nowrap flex-shrink-0"
                      >
                        {tabNames[category.category] || category.category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {faqs.map((category) => (
                  <TabsContent
                    key={category.category}
                    value={category.category}
                    className="mt-0"
                  >
                    <Accordion 
                      type="single" 
                      collapsible 
                      className="w-full space-y-4"
                      baseId={`faq-accordion-${category.category}`}
                    >
                      {category.questions.map((faq, index) => (
                        <AccordionItem
                          key={index}
                          value={`item-${category.category}-${index}`}
                          className="border border-border rounded-lg px-6 bg-card"
                        >
                          <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline [&>svg]:text-muted-foreground">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>

          {/* Right Column - 40% - FAQ Image - Extended to extreme right edge */}
          <div className="w-full lg:w-[40%] flex items-center justify-end order-2 lg:order-2 bg-[hsl(72,87%,62%)] lg:ml-auto lg:mr-0 lg:pr-0 lg:relative border-r-[5px] border-[hsl(0,0%,7%)]" style={{ marginRight: 'calc((100vw - 100%) / -2)' }}>
            <div className="relative w-full h-full min-h-[400px] lg:min-h-[600px]">
              <Image
                src="/home/faq-section.svg"
                alt="FAQ Illustration"
                fill
                className="object-contain object-right"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


