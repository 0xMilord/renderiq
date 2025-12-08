import { Metadata } from 'next';
import Link from 'next/link';
import { BlogCard } from '@/components/blog/blog-card';
import { Badge } from '@/components/ui/badge';
import Script from 'next/script';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://renderiq.io';

export const metadata: Metadata = {
  title: 'Blog | Renderiq - AI Architectural Rendering Insights',
  description: 'Learn about AI rendering tools, architectural visualization, and best practices for architects and designers.',
  keywords: [
    'AI architecture blog',
    'architectural rendering',
    'AI visualization',
    'design tools',
    'architectural visualization',
    'AI rendering software',
  ],
  authors: [{ name: 'Renderiq' }],
  creator: 'Renderiq',
  publisher: 'Renderiq',
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    title: 'Blog | Renderiq - AI Architectural Rendering Insights',
    description: 'Learn about AI rendering tools, architectural visualization, and best practices for architects and designers.',
    type: 'website',
    url: `${siteUrl}/blog`,
    siteName: 'Renderiq',
    images: [
      {
        url: `${siteUrl}/og/blog.jpg`,
        width: 1200,
        height: 630,
        alt: 'Renderiq Blog - AI Architectural Rendering',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Renderiq - AI Architectural Rendering Insights',
    description: 'Learn about AI rendering tools, architectural visualization, and best practices.',
    images: [`${siteUrl}/og/blog.jpg`],
    creator: '@Renderiq',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

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
    
    return blogs.sort((a: any, b: any) => {
      const dateA = new Date(a.publishedAt || 0);
      const dateB = new Date(b.publishedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error: any) {
    console.error('Error loading blogs:', error?.message || error);
    return [];
  }
}

function getAllCategories(): string[] {
  const blogs = getAllBlogs();
  const categories = new Set<string>();
  
  blogs.forEach((blog: any) => {
    if (blog.category) {
      categories.add(blog.category);
    }
    if (blog.collection) {
      categories.add(blog.collection);
    }
  });
  
  return Array.from(categories).sort();
}

export default function BlogPage() {
  const blogs = getAllBlogs();
  const categories = getAllCategories();

  // CollectionPage Schema for blog listing
  const collectionPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Renderiq Blog',
    description: 'Insights, tutorials, and guides on AI-powered architectural rendering, visualization tools, and design workflows.',
    url: `${siteUrl}/blog`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: blogs.length,
      itemListElement: blogs.slice(0, 20).map((blog: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'BlogPosting',
          '@id': `${siteUrl}/blog/${blog.slug}`,
          headline: blog.title,
          description: blog.excerpt,
          datePublished: blog.publishedAt,
        },
      })),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Renderiq',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
  };

  // Breadcrumb Schema
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
    ],
  };

  return (
    <>
      <Script
        id="blog-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionPageSchema),
        }}
      />
      <Script
        id="blog-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="pt-[calc(1rem+2.75rem+1.5rem)] pb-5 px-4 sm:px-6 lg:px-8 border-b">
        <div className="w-full max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              Renderiq Blog
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              Insights, tutorials, and guides on AI-powered architectural rendering, 
              visualization tools, and design workflows for architects and designers.
            </p>
            
            {/* Categories */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <Link href="/blog">
                  <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                    All Posts
                  </Badge>
                </Link>
                {categories.map((category) => {
                  const catSlug = category.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <Link key={category} href={`/blog/category/${catSlug}`}>
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {category}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blog List */}
      <section className="py-5 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto">
          {blogs.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:gap-6 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog: any) => (
                <BlogCard key={blog.slug} blog={blog} />
              ))}
            </div>
          )}
        </div>
      </section>
      </div>
    </>
  );
}

