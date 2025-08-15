export const config = { runtime: 'nodejs18.x' }

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const { messages, model } = req.body || {}
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'messages required' })
      return
    }
    const apiKey = process.env.OPENAI_API_KEY || req.headers['x-openai-key']
    if (!apiKey) {
      res.status(200).json({ content: "I'm here. Let's take a small step. What would feel manageable right now?" })
      return
    }
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      }),
    })
    if (!resp.ok) {
      const text = await resp.text()
      res.status(500).json({ error: 'OpenAI request failed', detail: text })
      return
    }
    const data = await resp.json()
    const content = data?.choices?.[0]?.message?.content?.trim() ?? ''
    res.status(200).json({ content })
  } catch (e: any) {
    res.status(500).json({ error: 'Server error' })
  }
}