"use client"

import * as React from "react"
import { MessageCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * 增强版悬浮球组件属性
 */
export interface FloatingBallEnhancedProps {
  /** 是否启用 */
  enabled: boolean
  /** 自定义图标URL */
  iconUrl?: string
  /** 当前是否展开 */
  isOpen: boolean
  /** 切换展开/收起回调 */
  onToggle: () => void
  /** 是否显示脉冲动画（吸引注意） */
  showPulse?: boolean
  /** 未读消息数 */
  unreadCount?: number
  /** 自定义类名 */
  className?: string
  /** 位置 */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

const positionClasses = {
  "bottom-right": "right-6 bottom-6",
  "bottom-left": "left-6 bottom-6",
  "top-right": "right-6 top-6",
  "top-left": "left-6 top-6",
}

/**
 * 增强版悬浮球组件
 * 
 * 使用系统主题变量，支持亮色/暗色模式
 * 特性：弹性动画、涟漪效果、脉冲提示、未读徽章
 */
export function FloatingBallEnhanced({
  enabled,
  iconUrl,
  isOpen,
  onToggle,
  showPulse = false,
  unreadCount = 0,
  className,
  position = "bottom-right",
}: FloatingBallEnhancedProps) {
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [ripples, setRipples] = React.useState<{ id: number; x: number; y: number }[]>([])
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  if (!enabled) {
    return null
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()
      setRipples(prev => [...prev, { id, x, y }])
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id))
      }, 600)
    }

    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)
    onToggle()
  }

  return (
    <div className={cn("fixed z-[9999]", positionClasses[position], className)}>
      {/* 脉冲动画 */}
      {showPulse && !isOpen && (
        <>
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
        </>
      )}

      {/* 主按钮 - 使用系统主题 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className={cn(
          // 基础样式
          "relative flex items-center justify-center overflow-hidden",
          "w-14 h-14 rounded-full",
          // 使用系统主题色
          "bg-primary text-primary-foreground",
          // 阴影
          "shadow-lg",
          // 过渡动画
          "transition-all duration-300 ease-out",
          // hover效果
          "hover:shadow-xl hover:scale-110",
          // 点击效果
          "active:scale-95",
          // 弹性动画
          isAnimating && "scale-110",
          // 展开状态 - 使用 destructive 色
          isOpen && "bg-destructive text-white",
          // 焦点样式 - 使用系统 ring
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        aria-label={isOpen ? "关闭对话助手" : "打开对话助手"}
        aria-expanded={isOpen}
      >
        {/* 涟漪效果 */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-primary-foreground/30 pointer-events-none animate-[ripple_0.6s_ease-out_forwards]"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}

        {/* 图标 - 带旋转过渡 */}
        <div
          className={cn(
            "relative transition-transform duration-300 ease-out",
            isOpen ? "rotate-90 scale-110" : "rotate-0 scale-100"
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : iconUrl ? (
            <img
              src={iconUrl}
              alt="对话助手"
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </div>

        {/* 未读徽章 */}
        {!isOpen && unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1",
              "min-w-5 h-5 px-1.5",
              "flex items-center justify-center",
              "rounded-full bg-destructive text-destructive-foreground",
              "text-xs font-bold",
              "animate-bounce",
            )}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 涟漪动画 keyframes */}
      <style jsx>{`
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 0.5;
          }
          100% {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
