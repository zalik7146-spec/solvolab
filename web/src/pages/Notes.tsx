import { useState } from 'react'
import { useNotes } from '../state/store'

export function Notes() {
  const { notes, add, remove } = useNotes()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Notes</h2>
      <div className="space-y-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" className="w-full h-24 p-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent" />
        <button
          onClick={() => { if (title.trim()) { add(title.trim(), body.trim()); setTitle(''); setBody('') } }}
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
          disabled={!title.trim()}
        >Add</button>
      </div>

      <ul className="space-y-2">
        {notes.map((n) => (
          <li key={n.id} className="p-3 rounded-md border border-neutral-200/40 dark:border-neutral-800">
            <div className="font-semibold">{n.title}</div>
            <div className="text-sm opacity-80 whitespace-pre-wrap">{n.body}</div>
            <div className="text-xs opacity-60 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
            <button onClick={() => remove(n.id)} className="text-xs text-red-600 mt-2">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}