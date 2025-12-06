'use client';

import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import Link from 'next/link';
import { useMDXComponents as useMDXComponentsBase } from '@mdx-js/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/components/docs/code-block';
import { HeadingWithCopy } from '@/components/blog/heading-with-copy';
import { useMemo } from 'react';
import * as React from 'react';
import * as runtime from 'react/jsx-runtime';

// Helper to extract text from React nodes for ID generation
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node) && typeof node.props === 'object' && node.props !== null && 'children' in node.props && node.props.children) {
    return extractText(node.props.children as React.ReactNode);
  }
  return '';
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  const generateId = (children: React.ReactNode): string => {
    const text = extractText(children);
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50) || `heading-${Math.random().toString(36).substr(2, 9)}`;
  };

  return {
    ...components,
    h1: ({ children, id }: { children: React.ReactNode; id?: string }) => {
      const headingId = id || generateId(children);
      return <HeadingWithCopy id={headingId} level={1}>{children}</HeadingWithCopy>;
    },
    h2: ({ children, id }: { children: React.ReactNode; id?: string }) => {
      const headingId = id || generateId(children);
      return <HeadingWithCopy id={headingId} level={2}>{children}</HeadingWithCopy>;
    },
    h3: ({ children, id }: { children: React.ReactNode; id?: string }) => {
      const headingId = id || generateId(children);
      return <HeadingWithCopy id={headingId} level={3}>{children}</HeadingWithCopy>;
    },
    h4: ({ children, id }: { children: React.ReactNode; id?: string }) => {
      const headingId = id || generateId(children);
      return <HeadingWithCopy id={headingId} level={4}>{children}</HeadingWithCopy>;
    },
    p: ({ children }) => <p className="leading-7 mb-4">{children}</p>,
    a: ({ href, children }) => (
      <Link href={href || '#'} className="text-primary hover:underline underline-offset-4">
        {children}
      </Link>
    ),
    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
    li: ({ children }) => <li className="leading-7">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
    code: ({ children, className }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            {children}
          </code>
        );
      }
      return <CodeBlock code={String(children)} language={className?.replace('language-', '') || 'text'} />;
    },
    pre: ({ children }) => <>{children}</>,
    hr: () => <hr className="my-8 border-border" />,
    table: ({ children }) => (
      <div className="my-6 w-full overflow-y-auto">
        <table className="w-full border-collapse border border-border">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
    th: ({ children }) => (
      <th className="border border-border px-4 py-2 text-left font-semibold">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-4 py-2">
        {children}
      </td>
    ),
    img: (props) => (
      <Image
        {...props}
        alt={props.alt || ''}
        className="rounded-lg my-6"
        width={800}
        height={600}
      />
    ),
  };
}

// Client component for MDX content
// contentlayer2 provides compiled MDX code as a string that can be evaluated
export function Mdx({ code }: { code: string }) {
  const components = useMDXComponentsBase(useMDXComponents({}));
  
  const Component = useMemo(() => {
    try {
      // contentlayer2 generates code that expects _jsx_runtime to be available
      // The code is a self-executing function that returns a Component
      // We need to provide the JSX runtime and evaluate the code
      const _jsx_runtime = runtime;
      const fn = new Function('_jsx_runtime', code);
      const result = fn(_jsx_runtime);
      // The code returns an object with a default export
      return result?.default || result || (() => <div>Unable to render content</div>);
    } catch (error) {
      console.error('Error evaluating MDX code:', error);
      return () => <div>Error rendering content</div>;
    }
  }, [code]);

  if (!Component) {
    return <div>Unable to render content</div>;
  }

  return <Component components={components} />;
}

