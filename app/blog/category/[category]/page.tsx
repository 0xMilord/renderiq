import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogCard } from '@/components/blog/blog-card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((category) => ({
    category: category.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ category: string }> 
}): Promise<Metadata> {
  const { category } = await params;
  const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  
  return {
    title: `${categoryName} | Blog | Renderiq`,
    description: `Browse all ${categoryName} blog posts about AI architectural rendering, visualization tools, and design workflows.`,
  };
}

export default async function CategoryPage({ 
  params 
}: { 
  params: Promise<{ category: string }> 
}) {
  const { category } = await params;
  const allBlogs = getAllBlogs();
  const categories = getAllCategories();
  
  // Normalize category for comparison
  const normalizedCategory = category.replace(/-/g, ' ').toLowerCase();
  
  // Filter blogs by category or collection
  const filteredBlogs = allBlogs.filter((blog: any) => {
    const blogCategory = blog.category?.toLowerCase();
    const blogCollection = blog.collection?.toLowerCase();
    return blogCategory === normalizedCategory || blogCollection === normalizedCategory;
  });
  
  if (filteredBlogs.length === 0) {
    notFound();
  }
  
  const categoryName = category.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <Button variant="ghost" asChild>
            <Link href="/blog" className="inline-flex items-center text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b bg-muted/30 py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              {categoryName}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {categoryName} Articles
            </h1>
            <p className="text-xl text-muted-foreground">
              Explore {filteredBlogs.length} {filteredBlogs.length === 1 ? 'article' : 'articles'} about {categoryName.toLowerCase()} in AI architectural rendering and visualization.
            </p>
          </div>
        </div>
      </section>

      {/* Blog List */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {filteredBlogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No blog posts found in this category.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:gap-6 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredBlogs.map((blog: any) => (
                <BlogCard key={blog.slug} blog={blog} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Navigation */}
      {categories.length > 0 && (
        <section className="py-12 px-4 border-t bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => {
                const catSlug = cat.toLowerCase().replace(/\s+/g, '-');
                const isActive = catSlug === category;
                return (
                  <Link key={cat} href={`/blog/category/${catSlug}`}>
                    <Badge 
                      variant={isActive ? 'default' : 'secondary'} 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {cat}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

