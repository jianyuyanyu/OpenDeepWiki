"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
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
    const props = children.props as { children?: React.ReactNode };
    return getText(props.children);
  }

  return "";
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const slugger = createSlugger();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const codeString = String(children).replace(/\n$/, "");
            
            // Check if this is a code block (has language) or inline code
            const isCodeBlock = match || codeString.includes("\n");
            
            if (isCodeBlock) {
              return (
                <SyntaxHighlighter
                  style={isDark ? oneDark : oneLight}
                  language={language || "text"}
                  PreTag="div"
                  className="rounded-md text-xs !my-4"
                  showLineNumbers={codeString.split("\n").length > 3}
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.375rem",
                    fontSize: "0.75rem",
                  }}
                  // eslint-disable-next-line react/no-children-prop
                  children={codeString}
                />
              );
            }
            
            return (
              <code className="rounded bg-muted px-1 py-0.5 text-xs" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => {
            // The pre tag is handled by the code component for syntax highlighting
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
