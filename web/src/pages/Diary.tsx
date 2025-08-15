import { useState } from 'react'
import { useDiary } from '../state/store'
import { useTheme } from '../state/theme'

export function Diary() {
  const { entries, add, remove } = useDiary()
  const [text, setText] = useState('')
  const { mood } = useTheme()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Diary</h2>
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full h-32 p-3 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent"
        />
        <button
          onClick={() => { if (text.trim()) { add(mood, text.trim()); setText('') } }}
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
          disabled={!text.trim()}
        >
          Save
        </button>
      </div>

      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="p-3 rounded-md border border-neutral-200/40 dark:border-neutral-800">
            <div className="text-xs opacity-70">
              {new Date(e.date).toLocaleString()} • {e.mood}
            </div>
            <div className="mt-1 whitespace-pre-wrap">{e.text}</div>
            <div className="mt-2">
              <button onClick={() => remove(e.id)} className="text-xs text-red-600">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}