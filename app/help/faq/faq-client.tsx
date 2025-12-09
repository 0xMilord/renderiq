'use client';

import { useState } from 'react';
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
import { useRef, useEffect } from 'react';
import Link from 'next/link';

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

interface FAQ {
  category: string;
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

interface FAQPageClientProps {
  faqs: FAQ[];
}

export function FAQPageClient({ faqs }: FAQPageClientProps) {
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold mb-6">
                Frequently Asked Questions
              </h1>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about Renderiq
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to know about Renderiq
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="relative mb-8">
              {showLeftArrow && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/90 shadow-md hover:bg-background/80"
                  onClick={() => scroll('left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {showRightArrow && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/90 shadow-md hover:bg-background/80"
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

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-8">
              Our support team is here to help you get the most out of Renderiq.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="mailto:support@renderiq.io"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </Link>
              <Link 
                href="/tutorials"
                className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                View Tutorials
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

