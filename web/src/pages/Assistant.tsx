import { useState } from 'react'
import { chat, type AIMessage } from '../services/ai'

export function Assistant() {
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'system', content: 'You are a gentle, practical mental health companion. Be concise and supportive.' }
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  async function send() {
    const content = input.trim()
    if (!content || sending) return
    setInput('')
    const next = [...messages, { role: 'user', content }]
    setMessages(next)
    setSending(true)
    try {
      const reply = await chat(next)
      setMessages([...next, { role: 'assistant', content: reply }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Assistant</h2>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto p-2 rounded-md border border-neutral-200/40 dark:border-neutral-800">
        {messages.filter(m => m.role !== 'system').map((m, idx) => (
          <div key={idx} className={`max-w-[80%] p-2 rounded-md ${m.role === 'assistant' ? 'bg-neutral-100 dark:bg-neutral-800' : 'bg-blue-600/10 border border-blue-600/20 ml-auto'}`}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask for advice or share a thought" className="flex-1 p-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent" />
        <button onClick={send} disabled={sending} className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50">Send</button>
      </div>
      <p className="text-xs opacity-60">Add VITE_OPENAI_API_KEY in your env for live AI. Otherwise, a supportive stub reply is used.</p>
    </div>
  )
}