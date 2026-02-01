"use client"

import * as React from "react"
import { Send, Loader2, X, ImagePlus, Trash2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChatHistory, ChatMessage } from "@/hooks/use-chat-history"
import {
  streamChat,
  getAvailableModels,
  getChatConfig,
  toChatMessageDto,
  DocContext,
  ModelConfig,
  SSEEvent,
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
 * 对话面板属性
 */
export interface ChatPanelProps {
  /** 是否展开 */
  isOpen: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 文档上下文 */
  context: DocContext
  /** 应用ID（嵌入模式） */
  appId?: string
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

/**
 * 对话面板组件
 * 
 * 包含消息列表、输入框、发送按钮、模型选择器
 * 支持Markdown渲染、工具调用显示、错误处理和重试
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 11.1, 11.2, 11.3, 11.4
 */
export function ChatPanel({
  isOpen,
  onClose,
  context,
  appId,
}: ChatPanelProps) {
  const { messages, addMessage, updateMessage, clearHistory } = useChatHistory()
  const [input, setInput] = React.useState("")
  const [images, setImages] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [models, setModels] = React.useState<ModelConfig[]>([])
  const [selectedModelId, setSelectedModelId] = React.useState("")
  const [isEnabled, setIsEnabled] = React.useState(true)
  const [error, setError] = React.useState<ErrorState | null>(null)
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

  // 加载配置和模型列表
  React.useEffect(() => {
    if (!isOpen) return

    const loadConfig = async () => {
      try {
        const [config, modelList] = await Promise.all([
          getChatConfig(),
          getAvailableModels(),
        ])
        setIsEnabled(config.isEnabled)
        setModels(modelList)
        
        // 设置默认模型
        if (config.defaultModelId) {
          setSelectedModelId(config.defaultModelId)
        } else if (modelList.length > 0) {
          const enabledModel = modelList.find(m => m.isEnabled)
          if (enabledModel) {
            setSelectedModelId(enabledModel.id)
          }
        }
      } catch (err) {
        console.error("加载配置失败:", err)
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
      // 检查文件类型
      if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) {
        setError({
          message: "仅支持 PNG、JPG、GIF、WebP 格式的图片",
          retryable: false,
        })
        return
      }

      // 检查文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError({
          message: "图片大小不能超过 10MB",
          retryable: false,
        })
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        setImages(prev => [...prev, base64])
      }
      reader.readAsDataURL(file)
    })

    // 清空input以便重复选择同一文件
    e.target.value = ""
  }

  // 移除图片
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // 发送消息
  const handleSend = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput && images.length === 0) return
    if (!selectedModelId) {
      setError({
        message: "请先选择模型",
        code: ChatErrorCodes.MODEL_UNAVAILABLE,
        retryable: false,
      })
      return
    }

    setError(null)
    setIsLoading(true)

    // 创建新的AbortController
    abortControllerRef.current = new AbortController()

    // 添加用户消息
    const userMessageId = addMessage({
      role: "user",
      content: trimmedInput,
      images: images.length > 0 ? [...images] : undefined,
    })

    // 清空输入
    const savedInput = input
    const savedImages = [...images]
    setInput("")
    setImages([])

    // 准备请求
    const allMessages = [...messages, {
      id: userMessageId,
      role: "user" as const,
      content: trimmedInput,
      images: images.length > 0 ? [...images] : undefined,
      timestamp: Date.now(),
    }]

    // 添加AI消息占位
    const assistantMessageId = addMessage({
      role: "assistant",
      content: "",
    })

    // 保存请求信息以便重试
    setLastRequest({
      input: savedInput,
      images: savedImages,
      userMessageId,
      assistantMessageId,
    })

    let assistantContent = ""
    let currentToolCalls: ToolCall[] = []

    try {
      const stream = streamChat(
        {
          messages: allMessages.map(toChatMessageDto),
          modelId: selectedModelId,
          context,
          appId,
        },
        {
          signal: abortControllerRef.current.signal,
        }
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
            updateMessage(assistantMessageId, {
              content: assistantContent,
              toolCalls: currentToolCalls,
            })
            break

          case "tool_result":
            const toolResult = event.data as ToolResult
            // 添加工具结果消息
            addMessage({
              role: "tool",
              content: toolResult.result,
              toolResult,
            })
            break

          case "done":
            // 对话完成，清除重试信息
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
      setError({
        message: err instanceof Error ? err.message : "对话失败，请重试",
        retryable: true,
      })
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  // 重试发送
  const handleRetry = async () => {
    if (!lastRequest) return
    
    // 恢复输入状态
    setInput(lastRequest.input)
    setImages(lastRequest.images)
    setError(null)
    
    // 重新发送
    handleSend()
  }

  // 取消请求
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 点击面板外部关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const enabledModels = models.filter(m => m.isEnabled)
  const canSend = (input.trim() || images.length > 0) && selectedModelId && !isLoading

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={handleBackdropClick}
      />

      {/* 对话面板 */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full flex-col",
          "bg-background shadow-xl",
          "sm:w-[400px] md:w-[450px]",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">文档助手</h2>
            <ModelSelector
              models={models}
              selectedModelId={selectedModelId}
              onModelChange={setSelectedModelId}
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearHistory}
              title="清空对话"
              disabled={messages.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 消息列表 */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="flex flex-col">
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
                <div>
                  <p className="mb-2">👋 你好！我是文档助手</p>
                  <p className="text-sm">有什么关于文档的问题可以问我</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessageItem key={message.id} message={message} />
              ))
            )}

            {/* 加载指示器 */}
            {isLoading && (
              <div className="flex items-center gap-2 p-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">正在思考...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 错误提示 */}
        {error && (
          <div className="border-t border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <div className="flex items-center justify-between">
              <span>{error.message}</span>
              <div className="flex items-center gap-2">
                {error.retryable && lastRequest && (
                  <button
                    className="flex items-center gap-1 underline hover:no-underline"
                    onClick={handleRetry}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-3 w-3" />
                    重试
                  </button>
                )}
                <button
                  className="underline hover:no-underline"
                  onClick={() => setError(null)}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 图片预览 */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t px-4 py-2">
            {images.map((img, index) => (
              <div key={index} className="relative">
                <img
                  src={img}
                  alt={`预览 ${index + 1}`}
                  className="h-16 w-16 rounded-md object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 输入区域 */}
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            {/* 图片上传按钮 */}
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
            >
              <ImagePlus className="h-4 w-4" />
            </Button>

            {/* 输入框 */}
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息，按 Enter 发送..."
              className="min-h-[40px] max-h-[120px] resize-none"
              disabled={!isEnabled || enabledModels.length === 0 || isLoading}
              rows={1}
            />

            {/* 发送按钮 */}
            <Button
              onClick={handleSend}
              disabled={!canSend}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
