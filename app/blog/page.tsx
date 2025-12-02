import { Metadata } from 'next';
import Link from 'next/link';
import { BlogCard } from '@/components/blog/blog-card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Blog | Renderiq - AI Architectural Rendering Insights',
  description: 'Learn about AI rendering tools, architectural visualization, and best practices for architects and designers.',
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b bg-muted/30 py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Renderiq Blog
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
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
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          {blogs.length === 0 ? (
            <div className="text-center py-20">
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
  );
}

