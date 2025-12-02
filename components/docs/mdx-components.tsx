'use client';

import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from '@/components/docs/code-block';
import { useMDXComponent } from 'next-contentlayer2/hooks';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    h1: ({ children }) => <h1 className="text-4xl font-bold tracking-tight mt-8 mb-4">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-semibold tracking-tight mt-8 mb-4 scroll-mt-20">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-semibold tracking-tight mt-6 mb-3 scroll-mt-20">{children}</h3>,
    h4: ({ children }) => <h4 className="text-xl font-semibold tracking-tight mt-4 mb-2">{children}</h4>,
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
export function Mdx({ code }: { code: string }) {
  const Component = useMDXComponent(code);
  return <Component components={useMDXComponents({})} />;
}

