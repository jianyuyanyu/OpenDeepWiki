import React from 'react'
import { AlertCircle, AlertTriangle, Info, Lightbulb, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CalloutType = 'note' | 'tip' | 'important' | 'warning' | 'caution' | 'info' | 'success' | 'danger'

interface CalloutProps {
  type?: CalloutType
  title?: string
  children: React.ReactNode
  className?: string
}

const calloutConfig: Record<CalloutType, {
  icon: React.ElementType
  className: string
  iconClassName: string
  title: string
}> = {
  note: {
    icon: Info,
    className: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    iconClassName: 'text-blue-600 dark:text-blue-400',
    title: '注意'
  },
  tip: {
    icon: Lightbulb,
    className: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    iconClassName: 'text-green-600 dark:text-green-400',
    title: '提示'
  },
  important: {
    icon: AlertCircle,
    className: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
    iconClassName: 'text-purple-600 dark:text-purple-400',
    title: '重要'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    iconClassName: 'text-yellow-600 dark:text-yellow-400',
    title: '警告'
  },
  caution: {
    icon: AlertTriangle,
    className: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    iconClassName: 'text-orange-600 dark:text-orange-400',
    title: '小心'
  },
  info: {
    icon: Info,
    className: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800',
    iconClassName: 'text-sky-600 dark:text-sky-400',
    title: '信息'
  },
  success: {
    icon: CheckCircle,
    className: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
    title: '成功'
  },
  danger: {
    icon: XCircle,
    className: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    iconClassName: 'text-red-600 dark:text-red-400',
    title: '危险'
  }
}

export default function Callout({ type = 'note', title, children, className }: CalloutProps) {
  const config = calloutConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'my-6 rounded-lg border-l-4 p-4 shadow-sm transition-all duration-200 hover:shadow-md',
        config.className,
        className
      )}
      role="alert"
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={cn('h-5 w-5', config.iconClassName)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn('text-sm font-semibold mb-1', config.iconClassName)}>
            {title || config.title}
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
