'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getBlogAuthorAvatar } from '@/lib/utils/blog-author-avatar';

interface BlogCardProps {
  blog: {
    slug: string;
    url: string;
    title: string;
    excerpt: string;
    publishedAt: string;
    readingTime?: number | string;
    coverImage?: string;
    authorName?: string;
    author?: string;
    tags?: string[];
    category?: string;
    collection?: string;
    featured?: boolean;
  };
  className?: string;
  onCategoryClick?: (category: string) => void;
}

export function BlogCard({ blog, className, onCategoryClick }: BlogCardProps) {

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const blogUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${blog.url}`
      : blog.url;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: blog.excerpt,
          url: blogUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(blogUrl);
        // You could add a toast notification here
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  return (
    <Card className={cn("h-full flex flex-col transition-all hover:shadow-lg hover:scale-[1.02] overflow-hidden group pt-0 pb-6", className)}>
        {/* Cover Image - Clickable */}
        <Link href={blog.url} className="block">
          {blog.coverImage ? (
            <div className="relative w-full bg-muted overflow-hidden" style={{ aspectRatio: '1200 / 748' }}>
              <Image
                src={blog.coverImage}
                alt={blog.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {blog.featured && (
                <Badge className="absolute top-2 right-2" variant="default">
                  Featured
                </Badge>
              )}
            </div>
          ) : (
            <div className="relative w-full bg-muted flex items-center justify-center" style={{ aspectRatio: '1200 / 748' }}>
              <div className="w-16 h-16 opacity-20">
                <Image
                  src="/logo.svg"
                  alt="Renderiq"
                  width={64}
                  height={64}
                  className="w-full h-full"
                />
              </div>
              {blog.featured && (
                <Badge className="absolute top-2 right-2" variant="default">
                  Featured
                </Badge>
              )}
            </div>
          )}
        </Link>

        <CardHeader className="flex flex-col space-y-3 px-6 pt-6">
          {/* Author with Avatar */}
          {(blog.authorName || blog.author) && (
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={getBlogAuthorAvatar(blog.authorName || blog.author)}
                  alt={blog.authorName || blog.author || 'Author'}
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <span className="text-sm text-muted-foreground font-medium">
                {blog.authorName || blog.author}
              </span>
            </div>
          )}

          {/* Separator after Author */}
          {(blog.authorName || blog.author) && (
            <div className="h-px bg-border w-full" />
          )}

          {/* Date and Reading Time */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={blog.publishedAt}>
                {blog.publishedAt ? format(new Date(blog.publishedAt), 'MMM d, yyyy') : ''}
              </time>
            </div>
            {blog.readingTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{blog.readingTime} min read</span>
              </div>
            )}
          </div>

          {/* Title - Clickable */}
          <Link href={blog.url}>
            <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors cursor-pointer">
              {blog.title}
            </CardTitle>
          </Link>

          {/* Excerpt */}
          <CardDescription className="line-clamp-3 text-sm">
            {blog.excerpt}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col space-y-4 pt-2 pb-6">
          {/* Separator and Tags - Vertical layout */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-col gap-3">
              {/* Separator - Full width */}
              <div className="h-px bg-border w-full" />
              {/* Tags - Single row only */}
              <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
                {blog.tags.slice(0, 2).map((tag: string) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5 font-normal whitespace-nowrap shrink-0"
                  >
                    {tag}
                  </Badge>
                ))}
                {blog.tags.length > 2 && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-0.5 font-normal whitespace-nowrap shrink-0"
                  >
                    +{blog.tags.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons with Category */}
          <div className="flex items-center gap-2 pt-2">
            {/* Category Badge */}
            {(blog.category || blog.collection) && (
              <>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs font-medium shrink-0",
                    onCategoryClick && "cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  )}
                  onClick={onCategoryClick ? () => onCategoryClick((blog.category || blog.collection)!.toLowerCase()) : undefined}
                >
                  {blog.category || blog.collection}
                </Badge>
                {/* Vertical Separator */}
                <div className="w-px h-4 bg-border shrink-0" />
              </>
            )}
            <Button 
              asChild
              variant="default"
              size="sm"
              className="flex-1"
            >
              <Link href={blog.url}>
                View
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3 shrink-0"
              onClick={handleShare}
              title="Share blog post"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
  );
}

