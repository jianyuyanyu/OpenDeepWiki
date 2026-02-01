"use client"

import * as React from "react"
import { User, Bot, Wrench, ChevronDown, ChevronRight, Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatMessage as ChatMessageType, ToolCall, ToolResult } from "@/hooks/use-chat-history"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/**
 * 消息组件属性
 */
export interface ChatMessageProps {
  message: ChatMessageType
}

/**
 * 工具调用显示组件
 */
function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  return (
    <div className="mt-2 rounded-md border border-border bg-muted/50 p-2 text-sm">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-1 text-left text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Wrench className="h-4 w-4" />
        <span className="font-medium">{toolCall.name}</span>
      </button>
      {isExpanded && (
        <pre className="mt-2 overflow-auto rounded bg-background p-2 text-xs">
          {JSON.stringify(toolCall.arguments, null, 2)}
        </pre>
      )}
    </div>
  )
}

/**
 * 工具结果显示组件
 */
function ToolResultDisplay({ toolResult }: { toolResult: ToolResult }) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  return (
    <div
      className={cn(
        "mt-2 rounded-md border p-2 text-sm",
        toolResult.isError
          ? "border-destructive/50 bg-destructive/10"
          : "border-border bg-muted/50"
      )}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-1 text-left text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span className="font-medium">
          {toolResult.isError ? "工具执行失败" : "工具执行结果"}
        </span>
      </button>
      {isExpanded && (
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-background p-2 text-xs whitespace-pre-wrap">
          {toolResult.result}
        </pre>
      )}
    </div>
  )
}

/**
 * 聊天消息组件
 * 
 * 支持显示用户消息、AI回复、工具调用信息
 * 
 * Requirements: 2.3, 2.4, 2.5, 2.6
 */
export function ChatMessageItem({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isTool = message.role === "tool"

  return (
    <div
      className={cn(
        "flex gap-3 p-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : isTool
            ? "bg-amber-500 text-white"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : isTool ? (
          <Wrench className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* 消息内容 */}
      <div
        className={cn(
          "flex max-w-[80%] flex-col",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* 图片预览 */}
        {message.images && message.images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {message.images.map((img, index) => (
              <img
                key={index}
                src={img.startsWith("data:") ? img : `data:image/png;base64,${img}`}
                alt={`上传图片 ${index + 1}`}
                className="max-h-32 max-w-32 rounded-md object-cover"
              />
            ))}
          </div>
        )}

        {/* 文本内容 */}
        {message.content && (
          <div
            className={cn(
              "rounded-lg px-3 py-2",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* 工具调用 */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-1 w-full">
            {message.toolCalls.map((toolCall) => (
              <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* 工具结果 */}
        {message.toolResult && (
          <div className="mt-1 w-full">
            <ToolResultDisplay toolResult={message.toolResult} />
          </div>
        )}

        {/* 时间戳和Token统计 */}
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          {message.tokenUsage && (
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {message.tokenUsage.inputTokens + message.tokenUsage.outputTokens} tokens
              <span className="text-muted-foreground/70">
                (输入: {message.tokenUsage.inputTokens}, 输出: {message.tokenUsage.outputTokens})
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
