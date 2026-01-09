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
    className: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    iconClassName: 'text-blue-600 dark:text-blue-400',
    title: 'Note'
  },
  tip: {
    icon: Lightbulb,
    className: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
    iconClassName: 'text-green-600 dark:text-green-400',
    title: 'Tip'
  },
  important: {
    icon: AlertCircle,
    className: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
    iconClassName: 'text-purple-600 dark:text-purple-400',
    title: 'Important'
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    iconClassName: 'text-yellow-600 dark:text-yellow-400',
    title: 'Warning'
  },
  caution: {
    icon: AlertTriangle,
    className: 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400',
    iconClassName: 'text-orange-600 dark:text-orange-400',
    title: 'Caution'
  },
  info: {
    icon: Info,
    className: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400',
    iconClassName: 'text-zinc-600 dark:text-zinc-400',
    title: 'Info'
  },
  success: {
    icon: CheckCircle,
    className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    iconClassName: 'text-emerald-600 dark:text-emerald-400',
    title: 'Success'
  },
  danger: {
    icon: XCircle,
    className: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
    iconClassName: 'text-red-600 dark:text-red-400',
    title: 'Danger'
  }
}

export default function Callout({ type = 'note', title, children, className }: CalloutProps) {
  const config = calloutConfig[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'my-6 rounded-lg border p-4 text-sm',
        config.className,
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-2 font-medium mb-2">
        <Icon className={cn('h-4 w-4', config.iconClassName)} />
        <span>{title || config.title}</span>
      </div>
      <div className="text-muted-foreground prose-p:m-0">
        {children}
      </div>
    </div>
  )
}
