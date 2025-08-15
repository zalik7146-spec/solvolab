import OpenAI from 'openai'

export interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string }

export async function chat(messages: AIMessage[], opts?: { apiKey?: string; model?: string }): Promise<string> {
  const model = opts?.model ?? (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? 'gpt-4o-mini'
  // Use Vercel serverless proxy if available
  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model }),
    })
    if (resp.ok) {
      const data = await resp.json()
      if (data?.content) return data.content as string
    }
  } catch {}
  // Fallback stub locally
  return "I'm here. Let's take a small step. What would feel manageable right now?"
}