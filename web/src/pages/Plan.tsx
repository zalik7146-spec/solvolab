import { useState } from 'react'
import { useTasks } from '../state/store'

export function Plan() {
  const { tasks, add, toggle, remove } = useTasks()
  const [text, setText] = useState('')

  function quickAdd() {
    const t = text.trim()
    if (!t) return
    // naive heuristic: detect "tomorrow"
    const lower = t.toLowerCase()
    const due = lower.includes('tomorrow') ? new Date(Date.now() + 24*60*60*1000).toISOString() : undefined
    add(t, due)
    setText('')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Plan</h2>
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Quick add task (e.g., Email Sam tomorrow)" className="flex-1 p-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent" />
        <button onClick={quickAdd} disabled={!text.trim()} className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50">Add</button>
      </div>

      <ul className="divide-y divide-neutral-200/40 dark:divide-neutral-800">
        {tasks.map((t) => (
          <li key={t.id} className="py-3 flex items-start gap-3">
            <button onClick={() => toggle(t.id)} className="mt-1">
              <span className={`inline-block w-5 h-5 rounded-full border ${t.status === 'done' ? 'bg-green-500 border-green-500' : 'border-neutral-400'}`}></span>
            </button>
            <div className="flex-1">
              <div className={`font-medium ${t.status === 'done' ? 'line-through opacity-60' : ''}`}>{t.title}</div>
              {t.dueDate && (
                <div className="text-xs opacity-60">Due {new Date(t.dueDate).toLocaleDateString()}</div>
              )}
              <button onClick={() => remove(t.id)} className="text-xs text-red-600 mt-1">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}