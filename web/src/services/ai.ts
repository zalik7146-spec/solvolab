import OpenAI from 'openai'

export interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string }

export async function chat(messages: AIMessage[], opts?: { apiKey?: string; model?: string }): Promise<string> {
  const key = opts?.apiKey ?? (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)
  const model = opts?.model ?? (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? 'gpt-4o-mini'
  if (!key) {
    return "I'm here. Let's take a small step. What would feel manageable right now?"
  }
  const client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true })
  const res = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.7,
  })
  return res.choices?.[0]?.message?.content?.trim() ?? ''
}