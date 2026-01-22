import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createSlugger } from "@/lib/markdown";

interface MarkdownRendererProps {
  content: string;
}

function getText(children: React.ReactNode): string {
  if (typeof children === "string") {
    return children;
  }

  if (Array.isArray(children)) {
    return children.map((child) => getText(child)).join("");
  }

  if (React.isValidElement(children)) {
    return getText(children.props.children);
  }

  return "";
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const slugger = createSlugger();

  return (
    <article className="space-y-4 text-sm leading-7 text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children, ...props }) => {
            const id = slugger(getText(children));
            return (
              <h1 id={id} className="scroll-mt-24 text-2xl font-semibold" {...props}>
                {children}
              </h1>
            );
          },
          h2: ({ children, ...props }) => {
            const id = slugger(getText(children));
            return (
              <h2 id={id} className="scroll-mt-24 text-xl font-semibold" {...props}>
                {children}
              </h2>
            );
          },
          h3: ({ children, ...props }) => {
            const id = slugger(getText(children));
            return (
              <h3 id={id} className="scroll-mt-24 text-lg font-semibold" {...props}>
                {children}
              </h3>
            );
          },
          p: ({ children, ...props }) => (
            <p className="text-sm leading-7 text-foreground" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc space-y-1 pl-5 text-sm" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal space-y-1 pl-5 text-sm" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-sm leading-7" {...props}>
              {children}
            </li>
          ),
          code: ({ children, ...props }) => (
            <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props}>
              {children}
            </code>
          ),
          pre: ({ children, ...props }) => (
            <pre className="overflow-x-auto rounded bg-muted p-3 text-xs" {...props}>
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
