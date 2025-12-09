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
        answer: 'Renderiq is an AI-powered architectural visualization platform powered by Google Gemini 3 Pro and Veo 3.1. Transform sketches, floor plans, and 3D models into photorealistic renders and videos using our unified chat interface or specialized tools. Simply upload your design, describe what you want, and get professional-quality visualizations in minutes. No 3D modeling software or technical skills required. Perfect for architects, interior designers, and AEC professionals.',
      },
      {
        question: 'Do I need any technical skills or 3D modeling experience to use Renderiq?',
        answer: 'No! Renderiq is designed for architects, designers, and anyone who needs to visualize architectural concepts. Our unified chat interface and 21 specialized tools make it easy to create stunning renders without any prior experience. Just describe what you want, upload a sketch or floor plan, and our AI handles the rest. No CAD software, Blender, or 3D modeling knowledge needed.',
      },
      {
        question: 'What file formats does Renderiq support for uploads?',
        answer: 'Renderiq supports common image formats including PNG, JPG, JPEG, and WebP. You can upload architectural sketches, floor plans, photos, site images, or screenshots from 3D modeling software like AutoCAD, Revit, or SketchUp. We also support video input for video-to-video transformations using Veo 3.1. All uploads are processed securely and stored in your private projects.',
      },
      {
        question: 'What makes Renderiq different from other AI rendering tools like Midjourney or DALL-E?',
        answer: 'Renderiq is purpose-built for architecture and AEC professionals. Unlike generic AI tools, our AI models are fine-tuned specifically for architectural visualization, ensuring accurate proportions, proper scale, and technically correct renders. We offer 21 specialized tools for specific tasks (floor plan visualization, material changes, lighting adjustments), a node-based Canvas Editor for complex workflows, render chains for version control, and AEC-specific features that generic tools simply cannot provide.',
      },
    ],
  },
  {
    category: 'Core Features',
    questions: [
      {
        question: 'What is the Canvas Editor and how does it work?',
        answer: 'The Canvas Editor is a Blender-style, node-based visual workflow builder that lets you create complex render workflows by connecting nodes visually. Add Text nodes for prompts, Image nodes for AI generation, Variants nodes for creating multiple variations, Style nodes for applying design styles, and Material nodes for texture changes. Connect nodes to build reusable workflows, execute them with one click, and save templates for future use. Perfect for advanced users who want to automate repetitive tasks and create sophisticated visualization pipelines.',
      },
      {
        question: 'What are Render Chains and how do they help with design iteration?',
        answer: 'Render Chains organize your renders into sequential iterations, automatically tracking your design evolution. When you create renders in a project, they\'re automatically organized into chains. Reference previous renders using @v1, @v2, or @latest in your prompts to maintain consistency. Chains help you track design evolution, compare iterations side-by-side, and maintain context between versions. Perfect for client presentations where you need to show design progress.',
      },
      {
        question: 'How does version control work in Renderiq?',
        answer: 'Every render you create is automatically versioned with complete history tracking. See all previous versions including prompts, settings, and outputs. Reference any previous version using @v1, @v2, @latest, or by clicking on previous renders in the chain. You can rollback to any version, create branches from specific renders, and compare different iterations. All version history is preserved in your projects, making it easy to revisit earlier designs or show clients the evolution of your work.',
      },
      {
        question: 'What specialized tools does Renderiq offer?',
        answer: 'Renderiq offers 21 specialized AI tools for specific architectural visualization tasks: Render Transformations (section drawings, CAD conversion, upscaling, effects), Floor Plan Tools (furnished visualization, 3D conversion, technical diagrams), Diagram Tools (exploded views, multi-angle views), Material & Texture Tools (texture changes, material alterations, lighting adjustments), Interior Design Tools (upholstery changes, product placement, item replacement, moodboard rendering), and 3D Tools (3D model rendering, model enhancement). Each tool has optimized prompts and settings for best results.',
      },
      {
        question: 'How does the unified chat interface work?',
        answer: 'The unified chat interface is your main way to interact with Renderiq. Simply type what you want in natural language, upload images, and reference previous renders using @v1, @v2, or @latest. The AI understands architectural context, maintains conversation history, and provides intelligent suggestions. You can ask for material changes, lighting adjustments, style modifications, or completely new designs. The chat interface works seamlessly with all 21 specialized tools and the Canvas Editor.',
      },
      {
        question: 'What are AEC finetunes and technically correct renders?',
        answer: 'AEC finetunes are specialized AI models trained specifically for architecture, engineering, and construction applications. They ensure renders maintain proper scale, proportions, architectural accuracy, and building code compliance. Technically correct renders mean the AI understands structural elements, material properties, spatial relationships, and construction principles - perfect for professional AEC work, client presentations, and design documentation. This is what sets Renderiq apart from generic AI image generators.',
      },
      {
        question: 'Can I generate videos with Renderiq?',
        answer: 'Yes! Renderiq supports video generation using Google Veo 3.1, one of the most advanced video AI models. Create cinematic-quality architectural walkthroughs, design animations, and visualization videos from text prompts or images. Video generation costs credits based on duration (typically 25 credits per second). Perfect for client presentations, marketing materials, and showcasing design concepts in motion. Export videos in 720p or 1080p resolution.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        question: 'What AI models does Renderiq use for rendering?',
        answer: 'Renderiq uses Google Gemini 3 Pro for image generation and Google Veo 3.1 for video generation. Gemini 3 Pro is architecture-aware, understands design intent, maintains proper proportions, and produces photorealistic renders. Veo 3.1 creates cinematic-quality videos with smooth motion and realistic lighting. Both models are fine-tuned specifically for AEC applications, ensuring technically accurate and professional results suitable for client presentations and design documentation.',
      },
      {
        question: 'How long does it take to generate a render or video?',
        answer: 'Most image renders complete in 30-60 seconds, up to 100x faster than traditional 3D rendering methods. Video generation using Veo 3.1 takes longer depending on duration and quality settings - typically 2-5 minutes for a 5-8 second video. You\'ll receive real-time updates on render progress, and all renders are automatically added to your project chains. Processing time may vary based on server load and render complexity.',
      },
      {
        question: 'What resolution and quality can I export renders at?',
        answer: 'Renderiq supports multiple quality levels from standard HD to ultra-high 4K resolution. Image renders can be exported at various resolutions suitable for presentations, print, or web use. Video renders can be exported in 720p or 1080p with support for various aspect ratios. All renders are stored in your project and can be downloaded at any time. Higher quality settings may cost more credits but provide professional-grade output suitable for client deliverables.',
      },
      {
        question: 'Is my data secure and private? What about GDPR compliance?',
        answer: 'Yes, security and privacy are our top priorities. All uploads are encrypted in transit and at rest. You can choose to keep projects private or share them publicly in our gallery. We\'re GDPR compliant, follow industry best practices, and never share your data with third parties. Enterprise plans include additional security features, dedicated support, and custom data retention policies. Your designs remain private unless you explicitly choose to share them.',
      },
      {
        question: 'Can I integrate Renderiq with my existing workflow or CAD software?',
        answer: 'Yes! Renderiq works seamlessly with your existing workflow. Upload screenshots or exports from AutoCAD, Revit, SketchUp, or any 3D modeling software. We support common image formats (PNG, JPG, WebP) that can be exported from virtually any design tool. Export your Renderiq renders and import them back into your CAD software, presentation tools, or design documentation. API access is available for Pro and Enterprise plans to integrate Renderiq into custom workflows.',
      },
    ],
  },
  {
    category: 'Projects & Organization',
    questions: [
      {
        question: 'How do Projects work in Renderiq?',
        answer: 'Projects are containers for organizing your work by client, building type, or design phase. Each project can contain multiple render chains, and each chain contains sequential renders. Create separate projects for different clients, design phases, or building types. Projects help you stay organized, collaborate with your team, and manage multiple visualization tasks efficiently. Free plan includes 3 projects, Starter plan includes 10 projects, and Pro/Enterprise plans include unlimited projects.',
      },
      {
        question: 'Can I collaborate with my team on Renderiq projects?',
        answer: 'Yes! Renderiq supports team collaboration on Pro and Enterprise plans. Share projects with team members, work on render chains together, leave comments on renders, and track design iterations as a team. Perfect for AEC firms, design studios, and architecture teams who need to collaborate on visualization projects. Team members can view, comment, and create renders within shared projects, making it easy to coordinate design visualization work.',
      },
      {
        question: 'How do I reference previous renders in my prompts?',
        answer: 'In the unified chat interface, use @v1 to reference the first render in a chain, @v2 for the second, @latest for the most recent render, or click on any previous render to use it as a reference. This helps maintain consistency, build on previous iterations, and create variations of existing designs. The AI understands the context from referenced renders, making it easy to iterate on designs while maintaining design intent.',
      },
      {
        question: 'Can I organize renders into different chains within a project?',
        answer: 'Absolutely! Create multiple chains within a project for different design directions, variations, or iterations. Chains are automatically created when you start rendering, but you can also create them manually. Each chain maintains its own version history, making it easy to explore different design options, compare alternatives, and present multiple concepts to clients. Perfect for AEC professionals who need to show design variations.',
      },
    ],
  },
  {
    category: 'Pricing & Credits',
    questions: [
      {
        question: 'How does the credit system work? How much do renders cost?',
        answer: 'Credits are used to generate renders and videos. Image renders typically cost 1-5 credits depending on quality settings. Video generation costs approximately 25 credits per second using Veo 3.1. You can purchase credit packages (Starter Pack: ₹250 for 50 credits, Professional Pack: ₹499 for 100 credits, Power Pack: ₹2,499 for 500 credits, Enterprise Pack: ₹4,999 for 1,000 credits) or subscribe to a monthly plan. Purchased credits never expire, making it perfect for occasional use.',
      },
      {
        question: 'What are the subscription plans and pricing?',
        answer: 'Renderiq offers flexible pricing: Free plan with 10 credits/month (3 projects, 5 renders per project), Starter plan at ₹119/month with 24 credits/month (10 projects, 10 renders per project), Pro plan at ₹499/month with 100 credits/month (unlimited projects and renders, video generation, API access), and Enterprise plan at ₹4,999/month with 1,000 credits/month (unlimited everything, team collaboration, dedicated support). Annual plans available with 20-25% savings. All plans include access to all 21 specialized tools and the Canvas Editor.',
      },
      {
        question: 'Can I cancel my subscription anytime? What happens to my credits?',
        answer: 'Yes, you can cancel your subscription at any time with no cancellation fees. Your subscription will remain active until the end of your billing period, and you\'ll continue to have access to all features until then. Any purchased credits remain in your account permanently and never expire, even after cancellation. You can continue using purchased credits on the Free plan after your subscription ends. Perfect for flexible, pay-as-you-go usage.',
      },
      {
        question: 'Do unused subscription credits roll over to the next month?',
        answer: 'Monthly subscription credits reset each billing cycle and do not roll over. However, any credits you purchase through credit packages never expire and remain in your account indefinitely. This means you can combine subscription credits with purchased credits for maximum flexibility. Purchased credits are used first, then subscription credits. Perfect for users who need occasional extra credits beyond their monthly allocation.',
      },
      {
        question: 'What payment methods does Renderiq accept?',
        answer: 'Renderiq accepts all major payment methods through Razorpay, including credit cards, debit cards, UPI, net banking, and digital wallets. We support payments in INR (Indian Rupees) with automatic currency conversion for international users. All transactions are secure, encrypted, and processed through Razorpay\'s PCI-DSS compliant payment gateway. Enterprise customers can arrange custom payment terms and invoicing.',
      },
    ],
  },
  {
    category: 'AEC Professionals',
    questions: [
      {
        question: 'Is Renderiq suitable for AEC (Architecture, Engineering, Construction) projects?',
        answer: 'Absolutely! Renderiq is specifically designed for AEC professionals with AEC finetunes that ensure technically correct renders. Perfect for visualizing commercial buildings, industrial facilities, educational institutions, healthcare facilities, residential developments, and infrastructure projects. The AI understands architectural elements, building codes, material properties, and structural principles, producing accurate, professional renders suitable for client presentations, design documentation, and marketing materials.',
      },
      {
        question: 'Does Renderiq support large-scale commercial and institutional projects?',
        answer: 'Yes! Renderiq handles projects of all scales, from small residential designs to large commercial complexes, campuses, and master-planned developments. Our AI understands architectural context, building scales, and spatial relationships, allowing you to visualize entire buildings, campuses, and developments with proper proportions. Perfect for AEC firms working on large-scale commercial, institutional, healthcare, educational, and mixed-use projects.',
      },
      {
        question: 'Can Renderiq handle mixed-use developments, urban planning, and master planning projects?',
        answer: 'Yes! Renderiq excels at complex architectural projects including mixed-use developments, urban planning, master planning, and site planning. The AI understands spatial relationships, building scales, site context, and can visualize entire developments with proper proportions and realistic context. Perfect for architects and planners who need to visualize large-scale projects, show building relationships, and present master plans to clients and stakeholders.',
      },
      {
        question: 'Can I use Renderiq renders for client presentations and proposals?',
        answer: 'Absolutely! Renderiq renders are perfect for client presentations, proposals, marketing materials, and design documentation. The photorealistic quality helps clients visualize projects before construction begins, making it easier to communicate design intent and secure approvals. Export renders at high resolution suitable for presentations, print materials, websites, and social media. Professional-grade output that impresses clients and wins projects.',
      },
      {
        question: 'Does Renderiq support interior design and furniture visualization?',
        answer: 'Yes! Renderiq offers specialized tools for interior design including furniture placement, upholstery changes, material alterations, lighting adjustments, and moodboard rendering. Visualize interior spaces, experiment with different furniture layouts, materials, and lighting scenarios. Perfect for interior designers, architects, and design professionals who need to show clients different design options quickly and cost-effectively.',
      },
    ],
  },
  {
    category: 'Security & Privacy',
    questions: [
      {
        question: 'Is my data secure and private? What security measures are in place?',
        answer: 'Yes, security and privacy are our top priorities. All uploads are encrypted in transit (HTTPS/TLS) and at rest. We follow industry best practices, are GDPR compliant, and never share your data with third parties. Enterprise plans include additional security features, dedicated infrastructure, custom data retention policies, and SOC 2 compliance. Your designs remain private unless you explicitly choose to share them in our public gallery.',
      },
      {
        question: 'Can I keep my projects private? Who can see my renders?',
        answer: 'Yes! By default, all projects are private and only visible to you. You can choose to make specific projects or renders public if you want to share them in our gallery or with clients. Private projects are only visible to you and team members you explicitly invite (on Pro/Enterprise plans). You have complete control over the privacy of your work at all times.',
      },
      {
        question: 'What happens to my renders, projects, and credits if I cancel my subscription?',
        answer: 'All your renders, projects, chains, and Canvas workflows remain accessible even after cancellation. You can download all your work at any time. Any purchased credits stay in your account permanently and never expire. After cancellation, you\'ll continue to have access to your account on the Free plan, allowing you to use purchased credits and view your work. Nothing is deleted when you cancel.',
      },
      {
        question: 'Does Renderiq comply with GDPR and data protection regulations?',
        answer: 'Yes, Renderiq is GDPR compliant and follows international data protection best practices. We implement appropriate technical and organizational measures to protect your personal data and design files. You have the right to access, modify, or delete your data at any time. Enterprise customers can request custom data processing agreements and compliance documentation. Your privacy and data security are our top priorities.',
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
  const [mounted, setMounted] = useState(false);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Prevent hydration mismatch by not rendering Radix components until mounted
  if (!mounted) {
    return (
      <section id="faq" className="bg-[hsl(72,87%,62%)] w-full overflow-x-hidden relative">
        <div className="w-full px-4 sm:px-6 lg:px-8 relative border-l-[2px] border-r-[2px] border-b-[2px] border-[hsl(0,0%,7%)]">
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
        <div className="w-full relative border-l-[2px] border-b-[2px] border-[hsl(0,0%,7%)]">
          <div className="absolute inset-0 bg-black -z-10"></div>
          <div className="flex flex-col lg:flex-row w-full overflow-hidden relative">
            <div className="w-full lg:w-[60%] order-1 lg:order-1 px-4 sm:px-6 lg:px-8 py-8 bg-[hsl(72,87%,62%)] relative flex flex-col border-r-[2px] border-[hsl(0,0%,7%)]">
              <div className="w-full relative px-4 sm:px-6 lg:px-8 py-6 rounded-2xl bg-background flex-1 border-[2px] border-[hsl(0,0%,7%)] min-h-[400px]">
                {/* Loading state */}
              </div>
            </div>
            <div className="w-full lg:w-[40%] flex items-center justify-end order-2 lg:order-2 bg-[hsl(72,87%,62%)] lg:ml-auto lg:mr-0 lg:pr-0 lg:relative border-r-[2px] border-[hsl(0,0%,7%)]" style={{ marginRight: 'calc((100vw - 100%) / -2)' }}>
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

  return (
    <section id="faq" className="bg-[hsl(72,87%,62%)] w-full overflow-x-hidden relative">
      <div className="w-full px-4 sm:px-6 lg:px-8 relative border-l-[2px] border-r-[2px] border-b-[2px] border-[hsl(0,0%,7%)]">
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

      <div className="w-full relative border-l-[2px] border-b-[2px] border-[hsl(0,0%,7%)]">
        {/* Black container behind FAQ */}
        <div className="absolute inset-0 bg-black -z-10"></div>
        
        <div className="flex flex-col lg:flex-row w-full overflow-hidden relative">
          {/* Left Column - 60% - FAQ Content */}
          <div className="w-full lg:w-[60%] order-1 lg:order-1 px-4 sm:px-6 lg:px-8 py-8 bg-[hsl(72,87%,62%)] relative flex flex-col border-r-[2px] border-[hsl(0,0%,7%)]">
            <div className="w-full relative px-4 sm:px-6 lg:px-8 py-6 rounded-2xl bg-background flex-1 border-[2px] border-[hsl(0,0%,7%)]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          <div className="w-full lg:w-[40%] flex items-center justify-end order-2 lg:order-2 bg-[hsl(72,87%,62%)] lg:ml-auto lg:mr-0 lg:pr-0 lg:relative border-r-[2px] border-[hsl(0,0%,7%)]" style={{ marginRight: 'calc((100vw - 100%) / -2)' }}>
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


