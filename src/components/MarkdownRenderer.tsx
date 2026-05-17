'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Shared markdown renderer for all AI-generated output.
 * Uses react-markdown with Tailwind Typography prose classes
 * for consistent, properly rendered markdown across the app.
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none break-words [overflow-wrap:break-word] overflow-x-auto ${className}`}>
      <ReactMarkdown
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg font-bold mt-5 mb-3 text-emerald-700 dark:text-emerald-400 border-b border-border pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold mt-4 mb-2 text-emerald-700 dark:text-emerald-400">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-3 mb-1.5 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mt-2 mb-1 text-muted-foreground">
              {children}
            </h4>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="text-sm leading-relaxed my-1.5">{children}</p>
          ),
          // Bold
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          // Italic
          em: ({ children }) => (
            <em className="italic text-muted-foreground">{children}</em>
          ),
          // Unordered lists
          ul: ({ children }) => (
            <ul className="text-sm my-1.5 ml-4 list-disc space-y-0.5">{children}</ul>
          ),
          // Ordered lists
          ol: ({ children }) => (
            <ol className="text-sm my-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>
          ),
          // List items
          li: ({ children }) => (
            <li className="text-sm leading-relaxed pl-1">{children}</li>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-border">
              <table className="text-xs w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-xs border-b border-border whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs border-b border-border/50">{children}</td>
          ),
          // Code blocks
          pre: ({ children }) => (
            <pre className="text-xs bg-muted/80 border border-border rounded-lg p-3 my-2 overflow-x-auto">
              {children}
            </pre>
          ),
          // Inline code
          code: ({ children }) => (
            <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded font-mono text-emerald-600 dark:text-emerald-400">
              {children}
            </code>
          ),
          // Horizontal rules
          hr: () => (
            <hr className="my-4 border-border" />
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-emerald-500/30 pl-4 my-3 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
