"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Share2, Copy, Check, Clock, ShieldAlert, Globe2 } from "lucide-react"
import { ChatShareResponse, ChatShareMessage } from "@/lib/chat-api"
import { ChatMessageItem } from "@/components/chat"
import type { ChatMessage } from "@/hooks/use-chat-history"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ShareConversationProps {
  share: ChatShareResponse
}

function mapShareMessage(message: ChatShareMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    thinking: message.thinking,
    contentBlocks: message.contentBlocks,
    images: message.images,
    quotedText: message.quotedText,
    toolCalls: message.toolCalls,
    toolResult: message.toolResult,
    tokenUsage: message.tokenUsage,
    timestamp: message.timestamp,
  }
}

export function ShareConversation({ share }: ShareConversationProps) {
  const router = useRouter()
  const [copied, setCopied] = React.useState(false)
  const shareUrl = React.useMemo(() => {
    if (typeof window === "undefined") return `https://opendeepwiki.com/share/${share.shareId}`
    return `${window.location.origin}/share/${share.shareId}`
  }, [share.shareId])

  const messages = React.useMemo(() => share.messages.map(mapShareMessage), [share.messages])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-8 md:px-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/80 p-6 text-white shadow-2xl">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <Share2 className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold leading-tight text-white/95">
                {share.title || "AI 对话分享"}
              </h1>
              {share.description && (
                <p className="mt-1 text-sm text-white/70 line-clamp-3">
                  {share.description}
                </p>
              )}
            </div>
            <Button variant="secondary" className="gap-2" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  复制链接
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              创建于 {new Date(share.createdAt).toLocaleString()}
            </div>
            {share.expiresAt && (
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                有效期至 {new Date(share.expiresAt).toLocaleString()}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4" />
              模型：{share.modelId}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 rounded-3xl border border-white/5 bg-white/5 p-6 text-white md:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-white/70">仓库 / 分支</p>
            <p className="font-medium">
              {share.context.owner}/{share.context.repo} · {share.context.branch}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/70">所在文档</p>
            <p className="font-medium break-words">{share.context.currentDocPath}</p>
          </div>
          {share.context.catalogMenu?.length > 0 && (
            <div>
              <p className="text-sm text-white/70">目录提要</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-white/80">
                {share.context.catalogMenu.slice(0, 4).map(item => (
                  <li key={item.path}>{item.title}</li>
                ))}
                {share.context.catalogMenu.length > 4 && (
                  <li className="text-white/60">…等 {share.context.catalogMenu.length - 4} 条</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-black/30 p-4 backdrop-blur">
          <p className="text-sm text-white/70">分享链接</p>
          <p className="mt-1 break-all text-sm text-white/90">{shareUrl}</p>
          <Button variant="secondary" className="mt-3 w-full" onClick={handleCopy}>
            {copied ? "已复制" : "复制链接"}
          </Button>
          <Button variant="ghost" className="mt-2 w-full text-white/80" onClick={() => router.push('/') }>
            返回首页
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-black/30 p-0 backdrop-blur">
        <div className="border-b border-white/5 px-6 py-4 text-sm uppercase tracking-[0.2em] text-white/60">
          对话内容
        </div>
        <ScrollArea className="max-h-[70vh] w-full">
          {messages.length === 0 ? (
            <div className="p-6 text-center text-white/70">该分享暂无消息</div>
          ) : (
            <div className="divide-y divide-white/5">
              {messages.map((message) => (
                <div key={message.id} className="px-6 py-4">
                  <ChatMessageItem message={message} />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
