import { notFound } from 'next/navigation';
import { DocsLayout } from '@/components/docs/docs-layout';
import { Mdx } from '@/components/docs/mdx-components';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, BookOpen } from 'lucide-react';
import { TableOfContents } from '@/components/docs/table-of-contents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Force dynamic rendering for docs
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DocPageProps {
  params: Promise<{ slug?: string[] }>;
}

// Helper to get allDocs - read JSON files directly
function getAllDocs(): any[] {
  try {
    const path = require('path');
    const fs = require('fs');
    const docDir = path.join(process.cwd(), '.contentlayer', 'generated', 'Doc');
    
    // Check if directory exists
    if (!fs.existsSync(docDir)) {
      console.warn('⚠️ Generated docs directory not found at:', docDir);
      return [];
    }
    
    // Read all JSON files from the Doc directory (exclude _index.json)
    const jsonFiles = fs.readdirSync(docDir).filter((file: string) => 
      file.endsWith('.json') && file !== '_index.json'
    );
    
    if (jsonFiles.length === 0) {
      console.warn('⚠️ No JSON files found in generated docs directory');
      return [];
    }
    
    // Load all doc JSON files
    const docs = jsonFiles.map((file: string) => {
      const filePath = path.join(docDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return content;
    });
    
    console.log(`✅ Loaded ${docs.length} docs from JSON files. Slugs:`, docs.map((d: any) => d.slug || d._raw?.flattenedPath || 'unknown'));
    return docs;
  } catch (error: any) {
    console.error('❌ Error loading docs:', error?.message || error);
    return [];
  }
}

function getDocFromParams(slug: string[] | undefined, docs: any[]) {
  const slugString = slug?.join('/') || '';
  
  // If no slug, show docs home page
  if (!slugString) {
    return null; // Signal to show home page
  }
  
  if (docs.length === 0) {
    console.warn('⚠️ No docs available');
    return null;
  }
  
  // Try to find doc by slug
  let doc = docs.find((doc) => doc.slug === slugString);
  
  // If not found, try finding by _raw.flattenedPath
  if (!doc) {
    doc = docs.find((doc) => doc._raw?.flattenedPath === slugString);
  }
  
  if (!doc) {
    console.warn(`❌ Doc not found for slug: "${slugString}". Available slugs:`, docs.map((d: any) => d.slug || d._raw?.flattenedPath || 'unknown'));
    return null;
  }

  return doc;
}

export async function generateStaticParams() {
  try {
    const docs = getAllDocs();
    return docs.map((doc) => ({
      slug: doc.slug.split('/'),
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const docs = getAllDocs();
  const doc = getDocFromParams(slug, docs);

  if (!doc) {
    return {};
  }

  return {
    title: doc.title,
    description: doc.description,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  try {
    const { slug } = await params;
    const docs = getAllDocs();
    
    console.log('📄 DocPage - slug:', slug, 'docs count:', docs.length);
    
    // If no slug, show docs home page
    if (!slug || slug.length === 0) {
      console.log('📄 Showing docs home page');
      return await DocsHomePage();
    }

    const doc = getDocFromParams(slug, docs);

    if (!doc) {
      console.error(`❌ Document not found for slug: ${slug?.join('/')}. Available slugs:`, docs.map(d => d.slug));
      notFound();
    }

  // Get navigation for prev/next
  const sortedDocs = docs.sort((a, b) => (a.order || 0) - (b.order || 0));
  const currentIndex = sortedDocs.findIndex((d) => d.slug === doc.slug);
  const prevDoc = currentIndex > 0 ? sortedDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < sortedDocs.length - 1 ? sortedDocs[currentIndex + 1] : null;

  return (
    <DocsLayout>
      <div className="flex gap-8">
        <article className="prose prose-slate dark:prose-invert max-w-none flex-1">
          {/* Breadcrumbs */}
          <nav className="mb-8 flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/docs" className="hover:text-foreground">
              Docs
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{doc.title}</span>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">{doc.title}</h1>
            {doc.description && (
              <p className="mt-2 text-lg text-muted-foreground">{doc.description}</p>
            )}
          </header>

          {/* Content */}
          <div className="docs-content">
            <Mdx code={doc.body.code} />
          </div>

          {/* Footer Navigation */}
          <div className="mt-16 flex items-center justify-between border-t pt-8">
            {prevDoc ? (
              <Link
                href={prevDoc.url}
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                <div>
                  <div className="text-xs uppercase">Previous</div>
                  <div className="font-medium">{prevDoc.title}</div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextDoc && (
              <Link
                href={nextDoc.url}
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <div className="text-right">
                  <div className="text-xs uppercase">Next</div>
                  <div className="font-medium">{nextDoc.title}</div>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </article>
        <aside className="hidden xl:block w-64 flex-shrink-0">
          <TableOfContents />
        </aside>
      </div>
    </DocsLayout>
  );
  } catch (error) {
    console.error('❌ Error in DocPage:', error);
    return (
      <DocsLayout>
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Error Loading Documentation</h1>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'An error occurred while loading the documentation.'}
            </p>
          </div>
        </div>
      </DocsLayout>
    );
  }
}

// Docs home page component
async function DocsHomePage() {
  try {
    const docs = getAllDocs();
    const sortedDocs = docs.sort((a, b) => (a.order || 0) - (b.order || 0));
    const categories = sortedDocs.reduce((acc, doc) => {
      const category = doc.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    }, {} as Record<string, any[]>);

  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Hero */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about using Renderiq to create amazing architectural visualizations.
          </p>
        </div>

        {/* Quick Start */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>New to Renderiq? Start here.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs/getting-started" className="text-primary hover:underline">
                    Getting Started →
                  </Link>
                </li>
                <li>
                  <Link href="/docs/making-your-account" className="text-primary hover:underline">
                    Making Your Account →
                  </Link>
                </li>
                <li>
                  <Link href="/docs/around-the-app" className="text-primary hover:underline">
                    Around the App →
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Popular documentation pages.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs/creating-your-first-project" className="text-primary hover:underline">
                    Creating Your First Project →
                  </Link>
                </li>
                <li>
                  <Link href="/docs/unified-chat-interface" className="text-primary hover:underline">
                    Unified Chat Interface →
                  </Link>
                </li>
                <li>
                  <Link href="/docs/prompt-engineering" className="text-primary hover:underline">
                    Prompt Engineering →
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* All Docs by Category */}
        <div className="space-y-8">
          {Object.entries(categories).map(([category, docs]) => (
            <div key={category}>
              <h2 className="mb-4 text-2xl font-semibold">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(docs as any[]).map((doc) => (
                  <Link key={doc.slug} href={doc.url}>
                    <Card className="h-full transition-colors hover:bg-muted">
                      <CardHeader>
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        {doc.description && (
                          <CardDescription>{doc.description}</CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DocsLayout>
  );
  } catch {
    return (
      <DocsLayout>
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8" />
              <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Documentation is loading...
            </p>
          </div>
        </div>
      </DocsLayout>
    );
  }
}

