import { notFound } from "next/navigation"
import { getChatShare } from "@/lib/chat-api"
import { ShareConversation } from "./share-conversation"

export const dynamic = "force-dynamic"

interface SharePageProps {
  params: { shareId: string }
}

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = params

  try {
    const share = await getChatShare(shareId)
    return <ShareConversation share={share} />
  } catch (error) {
    console.error("Failed to load share", error)
    notFound()
  }
}
