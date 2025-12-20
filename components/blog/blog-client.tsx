'use client';

import { useState, useMemo } from 'react';
import { BlogCard } from '@/components/blog/blog-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BlogClientProps {
  blogs: any[];
  categories: string[];
}

export function BlogClient({ blogs, categories }: BlogClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter blogs based on selected category
  const filteredBlogs = useMemo(() => {
    if (!selectedCategory) {
      return blogs;
    }

    const normalizedCategory = selectedCategory.toLowerCase();
    return blogs.filter((blog: any) => {
      const blogCategory = blog.category?.toLowerCase();
      const blogCollection = blog.collection?.toLowerCase();
      return blogCategory === normalizedCategory || blogCollection === normalizedCategory;
    });
  }, [blogs, selectedCategory]);

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      // If clicking the same category, deselect it (show all)
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  return (
    <>
      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              selectedCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            All Posts
          </button>
          {categories.map((category) => {
            const isActive = selectedCategory === category.toLowerCase();
            return (
              <button
                key={category}
                onClick={() => handleCategoryClick(category.toLowerCase())}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                {category}
              </button>
            );
          })}
        </div>
      )}

      {/* Blog List */}
      {filteredBlogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {selectedCategory 
              ? `No blog posts found in "${selectedCategory}" category.`
              : 'No blog posts yet. Check back soon!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:gap-6 lg:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBlogs.map((blog: any) => (
            <BlogCard 
              key={blog.slug} 
              blog={blog} 
              onCategoryClick={handleCategoryClick}
            />
          ))}
        </div>
      )}
    </>
  );
}

