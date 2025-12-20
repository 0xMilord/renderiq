'use client';

import { useState, useEffect } from 'react';
import { ClientTweetCard } from '@/components/ui/client-tweet-card';
import { TweetNotFound } from '@/components/ui/tweet-card';

interface TwitterTestimonial {
  url: string;
  fallback?: {
    text: string;
    author: string;
    username: string;
  };
}

interface TestimonialSlideshowProps {
  testimonials: TwitterTestimonial[];
  interval?: number; // Auto-rotate interval in ms
}

// Extract tweet ID from URL
function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/);
  return match ? match[1] : null;
}

// Fallback component for when tweet can't be loaded
function TweetFallback({ fallback }: { fallback?: TwitterTestimonial['fallback'] }) {
  if (!fallback) {
    return <TweetNotFound />;
  }

  return (
    <div className="p-6 border border-border/50 rounded-2xl bg-card">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
          <span className="text-base font-semibold text-muted-foreground">
            {fallback.author.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-base text-foreground">{fallback.author}</span>
            <span className="text-sm text-muted-foreground">@{fallback.username}</span>
          </div>
          <p className="text-base text-foreground leading-relaxed">{fallback.text}</p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialSlideshow({ testimonials, interval = 6000 }: TestimonialSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (testimonials.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, interval);

    return () => clearInterval(timer);
  }, [testimonials.length, interval]);

  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex];
  const tweetId = extractTweetId(currentTestimonial.url);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="w-full max-w-2xl px-8">
        {!tweetId ? (
          <TweetFallback fallback={currentTestimonial.fallback} />
        ) : (
          <ClientTweetCard
            id={tweetId}
            components={{
              TweetNotFound: () => <TweetFallback fallback={currentTestimonial.fallback} />
            }}
            className="w-full border border-border/50 rounded-2xl bg-card/50 backdrop-blur-sm hover:border-border hover:shadow-lg transition-all duration-200"
          />
        )}
      </div>
    </div>
  );
}

