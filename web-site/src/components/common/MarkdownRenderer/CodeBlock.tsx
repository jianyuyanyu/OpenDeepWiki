import React, { useState } from 'react'
import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
  title?: string
  language?: string
  showLineNumbers?: boolean
}

// 语言图标映射（可以后续扩展使用实际图标）
const languageLabels: Record<string, string> = {
  javascript: 'JS',
  typescript: 'TS',
  jsx: 'JSX',
  tsx: 'TSX',
  python: 'PY',
  java: 'JAVA',
  csharp: 'C#',
  go: 'GO',
  rust: 'RUST',
  cpp: 'C++',
  c: 'C',
  php: 'PHP',
  ruby: 'RUBY',
  swift: 'SWIFT',
  kotlin: 'KT',
  bash: 'BASH',
  shell: 'SHELL',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  yaml: 'YAML',
  xml: 'XML',
  markdown: 'MD',
  dockerfile: 'DOCKER',
}

export default function CodeBlock({
  children,
  className,
  title,
  language,
  showLineNumbers = false
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // 提取代码内容
  const getCodeContent = (): string => {
    const codeElement = children as any
    if (codeElement?.props?.children) {
      if (typeof codeElement.props.children === 'string') {
        return codeElement.props.children
      } else if (Array.isArray(codeElement.props.children)) {
        return codeElement.props.children.join('')
      }
    }
    return String(children)
  }

  const handleCopy = async () => {
    const code = getCodeContent()
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const languageLabel = language ? languageLabels[language.toLowerCase()] || language.toUpperCase() : 'CODE'

  return (
    <div className="group relative my-4 rounded-lg border border-border/50 bg-muted/30 shadow-sm hover:shadow-md transition-all duration-200">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/40">
        <div className="flex items-center gap-3">
          {/* 语言标签 */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-md bg-primary/10 text-primary border border-primary/20">
              {languageLabel}
            </span>
            {title && (
              <span className="text-xs font-medium text-muted-foreground">
                {title}
              </span>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            title={collapsed ? '展开代码' : '折叠代码'}
            aria-label={collapsed ? '展开代码' : '折叠代码'}
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
            title={copied ? '已复制' : '复制代码'}
            aria-label={copied ? '已复制' : '复制代码'}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* 代码内容 */}
      {!collapsed && (
        <div className="relative">
          <pre
            className={cn(
              'overflow-x-auto p-4 text-sm leading-relaxed',
              'bg-muted/20 dark:bg-muted/40',
              showLineNumbers && 'pl-12',
              className
            )}
          >
            {children}
          </pre>
        </div>
      )}
    </div>
  )
}
