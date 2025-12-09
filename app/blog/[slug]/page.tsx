import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowLeft, Clock, User } from 'lucide-react';
import { Mdx } from '@/components/docs/mdx-components';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/seo/json-ld';
import { BlogCard } from '@/components/blog/blog-card';
import { getBlogAuthorAvatar } from '@/lib/utils/blog-author-avatar';
import { BlogTableOfContents } from '@/components/blog/blog-table-of-contents';
import { BlogHeaderMobile } from '@/components/blog/blog-header-mobile';
import { getSmartRecommendations } from '@/lib/utils/blog-recommendations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getAllBlogs(): any[] {
  try {
    const path = require('path');
    const fs = require('fs');
    const blogDir = path.join(process.cwd(), '.contentlayer', 'generated', 'Blog');
    
    if (!fs.existsSync(blogDir)) {
      return [];
    }
    
    const jsonFiles = fs.readdirSync(blogDir).filter((file: string) => 
      file.endsWith('.json') && file !== '_index.json'
    );
    
    const blogs = jsonFiles.map((file: string) => {
      const filePath = path.join(blogDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return content;
    });
    
    return blogs;
  } catch (error: any) {
    console.error('Error loading blogs:', error?.message || error);
    return [];
  }
}

function getBlogBySlug(slug: string): any | null {
  const blogs = getAllBlogs();
  return blogs.find((blog) => blog.slug === slug) || null;
}

export async function generateStaticParams() {
  try {
    const blogs = getAllBlogs();
    return blogs.map((blog) => ({
      slug: blog.slug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);

  if (!blog) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';
  const blogUrl = `${siteUrl}/blog/${slug}`;
  const coverImageUrl = blog.coverImage 
    ? (blog.coverImage.startsWith('http') ? blog.coverImage : `${siteUrl}${blog.coverImage}`)
    : `${siteUrl}/og-image.jpg`;

  return {
    title: blog.seoTitle || blog.title,
    description: blog.seoDescription || blog.excerpt,
    keywords: blog.keywords || blog.tags || [],
    authors: [{ name: blog.authorName || blog.author || 'Renderiq Team' }],
    creator: blog.authorName || blog.author || 'Renderiq Team',
    publisher: 'Renderiq',
    alternates: {
      canonical: blogUrl,
    },
    openGraph: {
      title: blog.seoTitle || blog.title,
      description: blog.seoDescription || blog.excerpt,
      type: 'article',
      url: blogUrl,
      siteName: 'Renderiq',
      publishedTime: blog.publishedAt,
      modifiedTime: blog.publishedAt,
      authors: [blog.authorName || blog.author || 'Renderiq Team'],
      tags: blog.tags || [],
      images: [
        {
          url: coverImageUrl,
          alt: blog.title,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.seoTitle || blog.title,
      description: blog.seoDescription || blog.excerpt,
      images: [coverImageUrl],
      creator: blog.authorName || blog.author || '@Renderiq',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  // Generate structured data
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';
  
  // Get smart recommendations: 50% related + 50% diverse/random
  const allBlogs = getAllBlogs();
  const relatedBlogs = getSmartRecommendations(blog, allBlogs, 4);

  // Related Articles ItemList Schema
  const relatedArticlesSchema = relatedBlogs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Related Articles',
    itemListElement: relatedBlogs.map((relatedBlog: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'BlogPosting',
        '@id': `${siteUrl}/blog/${relatedBlog.slug}`,
        headline: relatedBlog.title,
        description: relatedBlog.excerpt,
        datePublished: relatedBlog.publishedAt,
      },
    })),
  } : null;
  const blogUrl = `${siteUrl}/blog/${slug}`;
  const coverImageUrl = blog.coverImage 
    ? (blog.coverImage.startsWith('http') ? blog.coverImage : `${siteUrl}${blog.coverImage}`)
    : `${siteUrl}/og-image.jpg`;

  // Calculate word count and reading time
  const wordCount = blog.body?.raw 
    ? blog.body.raw.replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean).length 
    : (blog.excerpt?.split(/\s+/).length || 0) * 50; // Estimate if no body
  const readingTimeMinutes = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min
  const timeRequired = `PT${readingTimeMinutes}M`;

  // Extract article section (category)
  const articleSection = blog.category || blog.collection || 'General';

  // Article schema (generated server-side) - Using BlogPosting instead of Article
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: blog.seoDescription || blog.excerpt,
    image: coverImageUrl,
    datePublished: blog.publishedAt,
    dateModified: blog.publishedAt,
    author: {
      '@type': 'Person',
      name: blog.authorName || blog.author || 'Renderiq Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Renderiq',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': blogUrl,
    },
    articleSection: articleSection,
    wordCount: wordCount,
    timeRequired: timeRequired,
    inLanguage: 'en-US',
    // Speakable structured data for voice search
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'h2', '.excerpt'],
    },
  };

  // Breadcrumb schema (generated server-side)
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: blog.title,
        item: blogUrl,
      },
    ],
  };

  // Extract FAQ from content (if structured) or generate from common questions
  const faqs: { question: string; answer: string }[] = [];
  
  // Try to extract FAQs from content (look for Q: and A: patterns, **Q:** and **A:** patterns)
  if (blog.body?.raw) {
    const rawContent = blog.body.raw;
    
    // Pattern 1: **Q:** and **A:** format
    const faqPattern1 = rawContent.match(/\*\*Q:\s*([\s\S]+?)\*\*\s*\n\*\*A:\s*([\s\S]+?)(?=\n\n|\*\*Q:|$)/g);
    if (faqPattern1) {
      faqPattern1.forEach((match) => {
        const [, question, answer] = match.match(/\*\*Q:\s*([\s\S]+?)\*\*\s*\n\*\*A:\s*([\s\S]+)/) || [];
        if (question && answer) {
          faqs.push({
            question: question.trim().replace(/\*\*/g, ''),
            answer: answer.trim().replace(/\*\*/g, '').substring(0, 500), // Limit answer length
          });
        }
      });
    }
    
    // Pattern 2: Q: and A: format (without bold)
    if (faqs.length === 0) {
      const faqPattern2 = rawContent.match(/Q:\s*([\s\S]+?)\nA:\s*([\s\S]+?)(?=\n\n|Q:|$)/g);
      if (faqPattern2) {
        faqPattern2.forEach((match) => {
          const [, question, answer] = match.match(/Q:\s*([\s\S]+?)\nA:\s*([\s\S]+)/) || [];
          if (question && answer) {
            faqs.push({
              question: question.trim(),
              answer: answer.trim().substring(0, 500), // Limit answer length
            });
          }
        });
      }
    }
  }

  // Add default FAQs if none found (optimized for SERP)
  if (faqs.length === 0) {
    const mainKeyword = blog.keywords?.[0] || blog.tags?.[0] || 'architectural rendering';
    faqs.push(
      {
        question: `What is ${mainKeyword}?`,
        answer: blog.excerpt.substring(0, 300),
      },
      {
        question: `How does Renderiq help with ${mainKeyword}?`,
        answer: `Renderiq uses multiple state-of-the-art AI models including Google Gemini for image generation, Veo for video generation, and Hunyuan3D for 3D model creation. Our architecture-aware models maintain design accuracy and create professional visualizations in minutes. The unified chat interface and render chains make it easy to iterate and refine designs.`,
      },
      {
        question: `Is ${mainKeyword} free?`,
        answer: `Yes, Renderiq offers a free tier with 5 renders per month, HD exports, and full access to all features including the unified chat interface and render chains. Perfect for testing and learning.`,
      }
    );
  }

  // FAQ schema (generated server-side)
  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <>
      {/* Structured Data */}
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      <div className="min-h-screen bg-background">
        {/* Header */}
        <BlogHeaderMobile />

      {/* Article */}
      <article className="py-4 px-4 sm:py-5 sm:px-6 lg:px-8 lg:ml-0 ml-12 lg:pt-[calc(1rem+2.75rem+1.5rem)] pt-10">
        <div className="w-full">
          <div className="flex gap-6 lg:gap-8">
            {/* Main Content - Full width on mobile, flex-1 on desktop to fill remaining space */}
            <div className="w-full lg:flex-1 min-w-0">
              {/* Cover Image */}
              {blog.coverImage && (
                <div className="relative w-full mb-2 rounded-lg overflow-hidden bg-muted" style={{ aspectRatio: '1200 / 748' }}>
                  <Image
                    src={blog.coverImage}
                    alt={blog.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 896px"
                  />
                </div>
              )}

              {/* Header */}
              <header className="mb-2">
                <h1 className="text-4xl md:text-5xl font-bold mb-1">{blog.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={blog.publishedAt}>
                      {blog.publishedAt ? format(new Date(blog.publishedAt), 'MMMM d, yyyy') : ''}
                    </time>
                  </div>
                  {blog.readingTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{blog.readingTime} min read</span>
                    </div>
                  )}
                </div>
              </header>

              {/* Excerpt */}
              {blog.excerpt && (
                <div className="mb-4 p-2 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <p className="text-lg text-muted-foreground">{blog.excerpt}</p>
                </div>
              )}

              {/* Content */}
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <Mdx code={blog.body.code} />
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t">
                <Button variant="outline" asChild>
                  <Link href="/blog">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Blog
                  </Link>
                </Button>
              </div>

              {/* Author Bio, Tags, and Related Posts - Bottom Section */}
              <div className="mt-8 space-y-6">
                {/* Tags */}
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-semibold text-muted-foreground mr-2">Tags:</span>
                    {blog.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Author Bio */}
                {(blog.authorName || blog.author) && (
                  <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted shrink-0">
                        <Image
                          src={getBlogAuthorAvatar(blog.authorName || blog.author)}
                          alt={blog.authorName || blog.author || 'Author'}
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{blog.authorName || blog.author}</h3>
                        {blog.authorBio && (
                          <p className="text-sm text-muted-foreground">{blog.authorBio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Posts */}
                {relatedBlogs.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Related Articles</h2>
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                      {relatedBlogs.map((relatedBlog: any) => (
                        <BlogCard key={relatedBlog.slug} blog={relatedBlog} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Table of Contents - Right Sidebar - 1/4 width */}
            <aside>
              <BlogTableOfContents />
            </aside>
          </div>
        </div>
      </article>
      </div>
    </>
  );
}

