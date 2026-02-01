"use client"

import * as React from "react"
import { FloatingBallEnhanced } from "./floating-ball-enhanced"
import { ChatPanelEnhanced } from "./chat-panel-enhanced"
import { getChatConfig, DocContext, CatalogItem } from "@/lib/chat-api"

/**
 * 增强版对话助手属性
 */
export interface ChatAssistantEnhancedProps {
  /** 文档上下文 */
  context: DocContext
  /** 应用ID（嵌入模式） */
  appId?: string
  /** 自定义图标URL */
  iconUrl?: string
  /** 悬浮球位置 */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  /** 面板模式 */
  panelMode?: "sidebar" | "popup" | "fullscreen"
  /** 是否显示脉冲动画 */
  showPulse?: boolean
}

/**
 * 增强版对话助手组件
 * 
 * 特性：
 * - 弹性展开/收起动画
 * - 多种面板模式
 * - 脉冲提示动画
 * - 未读消息徽章
 * - 平滑过渡效果
 */
export function ChatAssistantEnhanced({
  context,
  appId,
  iconUrl,
  position = "bottom-right",
  panelMode = "popup",
  showPulse = true,
}: ChatAssistantEnhancedProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isEnabled, setIsEnabled] = React.useState(true) // 默认启用
  const [isLoading, setIsLoading] = React.useState(false) // 不等待加载
  const [hasInteracted, setHasInteracted] = React.useState(false)

  // 加载配置检查是否启用（后台静默检查，不阻塞渲染）
  React.useEffect(() => {
    const checkEnabled = async () => {
      try {
        const config = await getChatConfig()
        console.log("[ChatAssistant] 配置加载成功:", config)
        setIsEnabled(config.isEnabled)
      } catch (err) {
        console.error("[ChatAssistant] 加载对话助手配置失败:", err)
        // 加载失败保持启用状态
      }
    }

    checkEnabled()
  }, [])

  const handleToggle = React.useCallback(() => {
    setIsOpen(prev => !prev)
    if (!hasInteracted) {
      setHasInteracted(true)
    }
  }, [hasInteracted])

  const handleClose = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  // 不再等待加载，直接渲染

  // 根据悬浮球位置确定面板位置
  const panelPosition = position.includes("right") ? "bottom-right" : "bottom-left"

  return (
    <>
      <FloatingBallEnhanced
        enabled={isEnabled}
        iconUrl={iconUrl}
        isOpen={isOpen}
        onToggle={handleToggle}
        position={position}
        showPulse={showPulse && !hasInteracted}
      />
      <ChatPanelEnhanced
        isOpen={isOpen}
        onClose={handleClose}
        context={context}
        appId={appId}
        mode={panelMode}
        position={panelPosition}
      />
    </>
  )
}

/**
 * 从RepoTreeNode构建CatalogItem
 */
export interface RepoTreeNode {
  title: string
  slug: string
  children?: RepoTreeNode[]
}

export function buildCatalogMenuEnhanced(nodes: RepoTreeNode[]): CatalogItem[] {
  return nodes.map(node => ({
    title: node.title,
    path: node.slug,
    children: node.children ? buildCatalogMenuEnhanced(node.children) : undefined,
  }))
}
