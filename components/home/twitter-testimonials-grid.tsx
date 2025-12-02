'use client';

import { useMemo } from 'react';
import { TwitterTestimonial } from './twitter-testimonial';

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
          {column.map((testimonial, index) => (
            <TwitterTestimonial
              key={`${colIndex}-${index}`}
              tweetUrl={testimonial.url}
              fallback={testimonial.fallback}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

