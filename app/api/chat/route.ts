import { createAgentUIStreamResponse, type UIMessage } from "ai"
import { tutorAgent } from "@/lib/ai/tutor-agent"
import { auth } from "@clerk/nextjs/server"

export async function POST(request: Request) {
  try {
    const { has, userId } = await auth()

    if (!userId) {
      return new Response("Unauthorized", { status: 401 })
    }

    if (!has?.({ plan: "ultra" })) {
      return new Response("Ultra membership required", { status: 403 })
    }

    const { messages }: { messages: UIMessage[] } = await request.json()

    return createAgentUIStreamResponse({
      agent: tutorAgent,
      messages
    })
  } catch (error) {
    // Log the error server-side for debugging and return a 500 to the client
    console.error("/api/chat error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}