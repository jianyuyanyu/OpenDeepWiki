import React, { useState, useEffect } from 'react'
import { Check, Copy } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
  title?: string
  language?: string
  showLineNumbers?: boolean
}

const languageLabels: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  jsx: 'React',
  tsx: 'React',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
  go: 'Go',
  rust: 'Rust',
  cpp: 'C++',
  c: 'C',
  php: 'PHP',
  ruby: 'Ruby',
  swift: 'Swift',
  kotlin: 'Kotlin',
  bash: 'Bash',
  shell: 'Shell',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  yaml: 'YAML',
  xml: 'XML',
  markdown: 'Markdown',
  dockerfile: 'Dockerfile',
}

export default function CodeBlock({
  children,
  className,
  title,
  language,
  showLineNumbers = false
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch for syntax highlighter
  useEffect(() => {
    setMounted(true)
  }, [])

  // Extract code content
  const getCodeContent = (): string => {
    const codeElement = children as any
    if (codeElement?.props?.children) {
      if (typeof codeElement.props.children === 'string') {
        return codeElement.props.children
      } else if (Array.isArray(codeElement.props.children)) {
        return codeElement.props.children.join('')
      }
    }
    return String(children).replace(/\n$/, '')
  }

  const codeContent = getCodeContent()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lang = language ? languageLabels[language.toLowerCase()] || language : 'Text'

  // Custom style overrides for the syntax highlighter to match our theme
  const customStyle = {
    margin: 0,
    padding: '1rem',
    background: 'transparent',
    fontSize: '0.875rem',
    lineHeight: '1.5',
  }

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-border bg-muted/40 group relative">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground select-none">
          {title || lang}
        </span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-background/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
          title="Copy code"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
      <div className="relative overflow-x-auto bg-[#282c34]"> {/* OneDark background color */}
        {mounted ? (
          <SyntaxHighlighter
            language={language?.toLowerCase() || 'text'}
            style={oneDark}
            showLineNumbers={showLineNumbers}
            customStyle={customStyle}
            codeTagProps={{
              className: "font-mono"
            }}
          >
            {codeContent}
          </SyntaxHighlighter>
        ) : (
          <pre className={cn('p-4 text-[13px] leading-6 font-mono bg-transparent text-white', className)}>
            {codeContent}
          </pre>
        )}
      </div>
    </div>
  )
}
