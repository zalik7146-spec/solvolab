import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { Diary } from './pages/Diary'
import { Notes } from './pages/Notes'
import { Plan } from './pages/Plan'
import { Focus } from './pages/Focus'
import { Assistant } from './pages/Assistant'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto p-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/focus" element={<Focus />} />
            <Route path="/assistant" element={<Assistant />} />
          </Routes>
        </main>
        <nav className="sticky bottom-0 w-full border-t border-neutral-200/20 bg-white/70 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/50 supports-[backdrop-filter]:dark:bg-neutral-900/50">
          <div className="container mx-auto grid grid-cols-6">
            {[
              { to: '/', label: 'Home' },
              { to: '/diary', label: 'Diary' },
              { to: '/notes', label: 'Notes' },
              { to: '/plan', label: 'Plan' },
              { to: '/focus', label: 'Focus' },
              { to: '/assistant', label: 'AI' },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  'text-center py-3 text-sm font-medium ' +
                  (isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-neutral-600 dark:text-neutral-300')
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </BrowserRouter>
  )
}
