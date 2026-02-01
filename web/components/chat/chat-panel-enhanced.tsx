"use client"

import * as React from "react"
import { Send, Loader2, X, ImagePlus, Trash2, RefreshCw, Minimize2, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChatHistory } from "@/hooks/use-chat-history"
import {
  streamChat,
  getAvailableModels,
  getChatConfig,
  toChatMessageDto,
  DocContext,
  ModelConfig,
  ToolCall,
  ToolResult,
  ErrorInfo,
  ChatErrorCodes,
  getErrorMessage,
  isRetryableError,
} from "@/lib/chat-api"
import { ModelSelector } from "./model-selector"
import { ChatMessageItem } from "./chat-message"

/**
 * 增强版对话面板属性
 */
export interface ChatPanelEnhancedProps {
  /** 是否展开 */
  isOpen: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 文档上下文 */
  context: DocContext
  /** 应用ID（嵌入模式） */
  appId?: string
  /** 面板模式 */
  mode?: "sidebar" | "popup" | "fullscreen"
  /** 位置（popup模式） */
  position?: "bottom-right" | "bottom-left" | "center"
}

/**
 * 错误状态
 */
interface ErrorState {
  message: string
  code?: string
  retryable: boolean
  retryAfterMs?: number
}

const positionClasses = {
  "bottom-right": "right-6 bottom-24",
  "bottom-left": "left-6 bottom-24",
  "center": "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
}

/**
 * 增强版对话面板组件
 * 
 * 特性：
 * - 多种展示模式（侧边栏/弹窗/全屏）
 * - 弹性展开动画
 * - 气泡弹出效果
 * - 平滑过渡
 */
export function ChatPanelEnhanced({
  isOpen,
  onClose,
  context,
  appId,
  mode = "popup",
  position = "bottom-right",
}: ChatPanelEnhancedProps) {
  const { messages, addMessage, updateMessage, clearHistory } = useChatHistory()
  const [input, setInput] = React.useState("")
  const [images, setImages] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [models, setModels] = React.useState<ModelConfig[]>([])
  const [selectedModelId, setSelectedModelId] = React.useState("")
  const [isEnabled, setIsEnabled] = React.useState(true)
  const [error, setError] = React.useState<ErrorState | null>(null)
  const [currentMode, setCurrentMode] = React.useState(mode)
  const [isAnimatingIn, setIsAnimatingIn] = React.useState(false)
  const [lastRequest, setLastRequest] = React.useState<{
    input: string
    images: string[]
    userMessageId: string
    assistantMessageId: string
  } | null>(null)
  
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  // 展开动画
  React.useEffect(() => {
    if (isOpen) {
      setIsAnimatingIn(true)
      const timer = setTimeout(() => setIsAnimatingIn(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // 加载配置和模型列表
  React.useEffect(() => {
    if (!isOpen) return

    const loadConfig = async () => {
      console.log("[ChatPanel] 开始加载配置和模型...")
      try {
        const [config, modelList] = await Promise.all([
          getChatConfig(),
          getAvailableModels(),
        ])
        
        console.log("[ChatPanel] 配置:", config)
        console.log("[ChatPanel] 模型列表:", modelList)
        
        setIsEnabled(config.isEnabled)
        setModels(modelList)
        
        if (config.defaultModelId) {
          setSelectedModelId(config.defaultModelId)
        } else if (modelList.length > 0) {
          const enabledModel = modelList.find(m => m.isEnabled)
          console.log("[ChatPanel] 找到启用的模型:", enabledModel)
          if (enabledModel) {
            setSelectedModelId(enabledModel.id)
          } else if (modelList.length > 0) {
            // 如果没有 isEnabled 字段，直接用第一个
            setSelectedModelId(modelList[0].id)
          }
        }
      } catch (err) {
        console.error("[ChatPanel] 加载配置失败:", err)
        setError({
          message: "加载配置失败，请刷新重试",
          code: ChatErrorCodes.CONFIG_MISSING,
          retryable: true,
        })
      }
    }

    loadConfig()
  }, [isOpen])

  // 组件卸载时取消请求
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // 滚动到底部
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) {
        setError({ message: "仅支持 PNG、JPG、GIF、WebP 格式的图片", retryable: false })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError({ message: "图片大小不能超过 10MB", retryable: false })
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        setImages(prev => [...prev, base64])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ""
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // 发送消息
  const handleSend = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput && images.length === 0) return
    if (!selectedModelId) {
      setError({ message: "请先选择模型", code: ChatErrorCodes.MODEL_UNAVAILABLE, retryable: false })
      return
    }

    setError(null)
    setIsLoading(true)
    abortControllerRef.current = new AbortController()

    const userMessageId = addMessage({
      role: "user",
      content: trimmedInput,
      images: images.length > 0 ? [...images] : undefined,
    })

    const savedInput = input
    const savedImages = [...images]
    setInput("")
    setImages([])

    const allMessages = [...messages, {
      id: userMessageId,
      role: "user" as const,
      content: trimmedInput,
      images: images.length > 0 ? [...images] : undefined,
      timestamp: Date.now(),
    }]

    const assistantMessageId = addMessage({ role: "assistant", content: "" })

    setLastRequest({ input: savedInput, images: savedImages, userMessageId, assistantMessageId })

    let assistantContent = ""
    let currentToolCalls: ToolCall[] = []

    try {
      const stream = streamChat(
        { messages: allMessages.map(toChatMessageDto), modelId: selectedModelId, context, appId },
        { signal: abortControllerRef.current.signal }
      )

      for await (const event of stream) {
        switch (event.type) {
          case "content":
            assistantContent += event.data as string
            updateMessage(assistantMessageId, { content: assistantContent })
            break
          case "tool_call":
            const toolCall = event.data as ToolCall
            currentToolCalls = [...currentToolCalls, toolCall]
            updateMessage(assistantMessageId, { content: assistantContent, toolCalls: currentToolCalls })
            break
          case "tool_result":
            const toolResult = event.data as ToolResult
            addMessage({ role: "tool", content: toolResult.result, toolResult })
            break
          case "done":
            // 更新 token 统计
            const doneInfo = event.data as { inputTokens?: number; outputTokens?: number }
            if (doneInfo.inputTokens !== undefined || doneInfo.outputTokens !== undefined) {
              updateMessage(assistantMessageId, {
                content: assistantContent,
                tokenUsage: {
                  inputTokens: doneInfo.inputTokens || 0,
                  outputTokens: doneInfo.outputTokens || 0,
                },
              })
            }
            setLastRequest(null)
            break
          case "error":
            const errorInfo = event.data as ErrorInfo
            setError({
              message: errorInfo.message || getErrorMessage(errorInfo.code),
              code: errorInfo.code,
              retryable: errorInfo.retryable ?? isRetryableError(errorInfo.code),
              retryAfterMs: errorInfo.retryAfterMs,
            })
            break
        }
      }
    } catch (err) {
      console.error("对话失败:", err)
      setError({ message: err instanceof Error ? err.message : "对话失败，请重试", retryable: true })
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleRetry = async () => {
    if (!lastRequest) return
    setInput(lastRequest.input)
    setImages(lastRequest.images)
    setError(null)
    handleSend()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const toggleMode = () => {
    setCurrentMode(prev => prev === "popup" ? "fullscreen" : "popup")
  }

  if (!isOpen) return null

  // 过滤启用的模型，如果没有 isEnabled 字段则默认为启用
  const enabledModels = models.filter(m => m.isEnabled !== false)
  const canSend = (input.trim() || images.length > 0) && selectedModelId && !isLoading

  // 根据模式确定面板样式
  const panelClasses = cn(
    "fixed z-50 flex flex-col bg-background border shadow-2xl",
    // 动画
    "transition-all duration-300 ease-out",
    isAnimatingIn && "animate-panel-in",
    // 模式样式
    currentMode === "popup" && cn(
      "w-[380px] h-[520px] rounded-2xl",
      positionClasses[position],
      // 弹出动画起点
      !isAnimatingIn && "opacity-100 scale-100",
    ),
    currentMode === "sidebar" && cn(
      "right-0 top-0 h-full w-full sm:w-[400px] md:w-[450px] rounded-none",
      !isAnimatingIn && "translate-x-0",
    ),
    currentMode === "fullscreen" && cn(
      "inset-4 rounded-2xl",
      !isAnimatingIn && "opacity-100 scale-100",
    ),
  )

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-300",
          currentMode === "popup" ? "bg-black/10" : "bg-black/30",
          isAnimatingIn ? "opacity-0" : "opacity-100",
        )}
        onClick={handleBackdropClick}
      />

      {/* 对话面板 */}
      <div className={panelClasses}>
        {/* 头部 */}
        <div className="flex items-center justify-between border-b px-4 py-3 rounded-t-2xl bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="font-semibold">文档助手</h2>
            </div>
            <ModelSelector
              models={models}
              selectedModelId={selectedModelId}
              onModelChange={setSelectedModelId}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={clearHistory} title="清空对话" disabled={messages.length === 0}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleMode} title={currentMode === "popup" ? "全屏" : "小窗"}>
              {currentMode === "popup" ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 消息列表 */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="flex flex-col p-2">
            {!isEnabled ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
                对话助手功能已禁用
              </div>
            ) : enabledModels.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
                暂无可用模型，请联系管理员配置
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
                <div className="space-y-2">
                  <div className="text-4xl">👋</div>
                  <p className="font-medium">你好！我是文档助手</p>
                  <p className="text-sm opacity-70">有什么关于文档的问题可以问我</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={cn(
                    "animate-message-in",
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ChatMessageItem message={message} />
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-2 p-4 text-muted-foreground animate-pulse">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm">正在思考...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 错误提示 */}
        {error && (
          <div className="border-t border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive animate-shake">
            <div className="flex items-center justify-between">
              <span>{error.message}</span>
              <div className="flex items-center gap-2">
                {error.retryable && lastRequest && (
                  <button className="flex items-center gap-1 underline hover:no-underline" onClick={handleRetry} disabled={isLoading}>
                    <RefreshCw className="h-3 w-3" />
                    重试
                  </button>
                )}
                <button className="underline hover:no-underline" onClick={() => setError(null)}>关闭</button>
              </div>
            </div>
          </div>
        )}

        {/* 图片预览 */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t px-4 py-2">
            {images.map((img, index) => (
              <div key={index} className="relative group animate-scale-in">
                <img src={img} alt={`预览 ${index + 1}`} className="h-16 w-16 rounded-lg object-cover border" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 输入区域 */}
        <div className="border-t p-3 rounded-b-2xl bg-gradient-to-r from-transparent to-primary/5">
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isEnabled || enabledModels.length === 0}
              title="上传图片"
              className="shrink-0"
            >
              <ImagePlus className="h-4 w-4" />
            </Button>

            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，按 Enter 发送..."
              className="min-h-[40px] max-h-[120px] resize-none rounded-xl"
              disabled={!isEnabled || enabledModels.length === 0 || isLoading}
              rows={1}
            />

            <Button
              onClick={handleSend}
              disabled={!canSend}
              size="icon"
              className={cn(
                "shrink-0 rounded-xl transition-all duration-200",
                canSend && "hover:scale-105 active:scale-95"
              )}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* 自定义动画样式 */}
        <style jsx>{`
          @keyframes panel-in {
            0% {
              opacity: 0;
              transform: scale(0.9) translateY(10px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          
          @keyframes message-in {
            0% {
              opacity: 0;
              transform: translateY(10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes scale-in {
            0% {
              opacity: 0;
              transform: scale(0.8);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          .animate-panel-in {
            animation: panel-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          
          .animate-message-in {
            animation: message-in 0.3s ease-out forwards;
          }
          
          .animate-scale-in {
            animation: scale-in 0.2s ease-out forwards;
          }
          
          .animate-shake {
            animation: shake 0.3s ease-out;
          }
        `}</style>
      </div>
    </>
  )
}
