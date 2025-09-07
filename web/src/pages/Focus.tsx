import { useEffect, useRef, useState } from 'react'

export function Focus() {
  const [minutes, setMinutes] = useState(25)
  const [remaining, setRemaining] = useState(minutes * 60)
  const [running, setRunning] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => { if (!running) setRemaining(minutes * 60) }, [minutes])

  useEffect(() => {
    if (running) {
      timerRef.current = window.setInterval(() => {
        setRemaining((s) => {
          if (s <= 1) { clear(); return 0 }
          return s - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [running])

  function clear() {
    setRunning(false)
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  const m = Math.floor(remaining / 60).toString().padStart(2, '0')
  const s = (remaining % 60).toString().padStart(2, '0')

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Focus</h2>
      <div className="text-6xl font-bold tabular-nums">{m}:{s}</div>
      <div className="flex gap-2">
        <button onClick={() => setRunning(true)} className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50" disabled={running}>Start</button>
        <button onClick={() => setRunning(false)} className="px-4 py-2 rounded-md border">Pause</button>
        <button onClick={() => { clear(); setRemaining(minutes * 60) }} className="px-4 py-2 rounded-md border">Reset</button>
      </div>
      <label className="block">Duration: {minutes} min</label>
      <input type="range" min={1} max={120} value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value))} />
    </div>
  )
}