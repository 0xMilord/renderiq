'use client';

import { useMemo } from 'react';
import { ClientTweetCard } from '@/components/ui/client-tweet-card';
import { TweetNotFound } from '@/components/ui/tweet-card';
import { Card } from '@/components/ui/card';

interface TwitterTestimonial {
  url: string;
  fallback?: {
    text: string;
    author: string;
    username: string;
  };
}

interface TwitterTestimonialsGridProps {
  testimonials: TwitterTestimonial[];
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
    <Card className="p-4 border border-border/50 rounded-2xl bg-card">
      <div className="flex flex-col gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
            {fallback.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm">{fallback.author}</div>
            <div className="text-xs text-muted-foreground">@{fallback.username}</div>
          </div>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{fallback.text}</p>
      </div>
    </Card>
  );
}

export function TwitterTestimonialsGrid({ testimonials }: TwitterTestimonialsGridProps) {
  // Distribute testimonials across 4 columns (masonry layout)
  const columns = useMemo(() => {
    const cols: TwitterTestimonial[][] = [[], [], [], []];
    
    testimonials.forEach((testimonial, index) => {
      // Distribute evenly across columns
      const colIndex = index % 4;
      cols[colIndex].push(testimonial);
    });
    
    return cols;
  }, [testimonials]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-4">
          {column.map((testimonial, index) => {
            const tweetId = extractTweetId(testimonial.url);
            
            if (!tweetId) {
              return (
                <TweetFallback
                  key={`${colIndex}-${index}`}
                  fallback={testimonial.fallback}
                />
              );
            }

            return (
              <ClientTweetCard
                key={`${colIndex}-${index}`}
                id={tweetId}
                components={{
                  TweetNotFound: () => <TweetFallback fallback={testimonial.fallback} />
                }}
                className="border border-border/50 rounded-2xl bg-card hover:border-border hover:shadow-md transition-all duration-200"
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

