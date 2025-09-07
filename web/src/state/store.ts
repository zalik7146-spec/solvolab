import { create } from 'zustand'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
function save<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export interface DiaryEntry {
  id: string
  date: string
  mood: string
  text: string
}
export interface NoteItem {
  id: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
}
export interface TaskItem {
  id: string
  title: string
  notes?: string
  dueDate?: string
  status: 'pending' | 'done'
  createdAt: string
  updatedAt: string
}

export const useDiary = create<{ entries: DiaryEntry[]; add: (mood: string, text: string) => void; remove: (id: string) => void }>((set, get) => ({
  entries: load('pp.diary', [] as DiaryEntry[]),
  add: (mood, text) => set(({ entries }) => {
    const next = [{ id: crypto.randomUUID(), date: new Date().toISOString(), mood, text }, ...entries]
    save('pp.diary', next)
    return { entries: next }
  }),
  remove: (id) => set(({ entries }) => {
    const next = entries.filter(e => e.id !== id)
    save('pp.diary', next)
    return { entries: next }
  })
}))

export const useNotes = create<{ notes: NoteItem[]; add: (title: string, body: string) => void; remove: (id: string) => void }>((set) => ({
  notes: load('pp.notes', [] as NoteItem[]),
  add: (title, body) => set((state) => {
    const now = new Date().toISOString()
    const note = { id: crypto.randomUUID(), title, body, createdAt: now, updatedAt: now }
    const next = [note, ...state.notes]
    save('pp.notes', next)
    return { notes: next }
  }),
  remove: (id) => set((state) => {
    const next = state.notes.filter((n) => n.id !== id)
    save('pp.notes', next)
    return { notes: next }
  })
}))

export const useTasks = create<{ tasks: TaskItem[]; add: (title: string, due?: string) => void; toggle: (id: string) => void; remove: (id: string) => void }>((set) => ({
  tasks: load('pp.tasks', [] as TaskItem[]),
  add: (title, due) => set((state) => {
    const now = new Date().toISOString()
    const task: TaskItem = { id: crypto.randomUUID(), title, dueDate: due, status: 'pending', createdAt: now, updatedAt: now }
    const next = [task, ...state.tasks]
    save('pp.tasks', next)
    return { tasks: next }
  }),
  toggle: (id) => set((state) => {
    const next = state.tasks.map((t) => t.id === id ? { ...t, status: t.status === 'pending' ? 'done' : 'pending', updatedAt: new Date().toISOString() } : t)
    save('pp.tasks', next)
    return { tasks: next }
  }),
  remove: (id) => set((state) => {
    const next = state.tasks.filter((t) => t.id !== id)
    save('pp.tasks', next)
    return { tasks: next }
  }),
}))