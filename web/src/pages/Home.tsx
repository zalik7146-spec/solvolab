import { Link } from 'react-router-dom'
import { moodList, useTheme, moodColor } from '../state/theme'

export function Home() {
  const { mood, setMood } = useTheme()
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PowerPlace (Web)</h1>
      </header>
      <section className={`p-4 rounded-xl bg-gradient-to-br ${moodColor(mood)}`}>
        <p className="text-sm opacity-80">Mood</p>
        <div className="mt-2 flex gap-2 flex-wrap">
          {moodList.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-3 py-1.5 rounded-full text-sm border ${m === mood ? 'border-current' : 'border-transparent bg-black/5 dark:bg-white/5'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <QuickLink to="/diary" title="Diary" subtitle="Capture a thought" />
        <QuickLink to="/notes" title="Notes" subtitle="Save ideas" />
        <QuickLink to="/plan" title="Plan" subtitle="Add a task" />
        <QuickLink to="/focus" title="Focus" subtitle="Start a timer" />
        <QuickLink to="/assistant" title="AI" subtitle="Talk to a coach" />
      </section>
    </div>
  )
}

function QuickLink({ to, title, subtitle }: { to: string; title: string; subtitle: string }) {
  return (
    <Link to={to} className="block p-4 rounded-xl border border-neutral-200/40 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
      <div className="font-semibold">{title}</div>
      <div className="text-sm opacity-70">{subtitle}</div>
    </Link>
  )
}