// Reine Funktionen für Suche, Filter, Sortierung und Kennzahlen.
// Sie verändern nie die übergebene Liste, sondern liefern immer eine neue.
// Dadurch bleiben die gespeicherten Aufgaben unberührt und die Funktionen sind leicht testbar.
import type { Task, TaskFilters, TaskPriority } from '@/types/task'

/** Heutiges lokales Kalenderdatum als JJJJ-MM-TT (nicht UTC!). */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Überfällig = offen und Termin liegt vor heute. Heute fällig ist nicht überfällig.
 * ISO-Daten (JJJJ-MM-TT) lassen sich direkt als Text vergleichen.
 */
export function isOverdue(task: Task, today: string): boolean {
  return task.status === 'OPEN' && task.dueDate !== null && task.dueDate < today
}

export function matchesQuery(task: Task, query: string): boolean {
  const q = query.trim().toLocaleLowerCase('de')
  if (q === '') return true
  return (
    task.title.toLocaleLowerCase('de').includes(q) ||
    (task.description ?? '').toLocaleLowerCase('de').includes(q)
  )
}

export function filterTasks(tasks: readonly Task[], filters: TaskFilters, today: string): Task[] {
  return tasks.filter((task) => {
    if (!matchesQuery(task, filters.query)) return false
    if (filters.priority !== 'ALL' && task.priority !== filters.priority) return false
    switch (filters.status) {
      case 'OPEN':
        return task.status === 'OPEN'
      case 'DONE':
        return task.status === 'DONE'
      case 'OVERDUE':
        return isOverdue(task, today)
      default:
        return true
    }
  })
}

const PRIORITY_RANK: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

// Neueste zuerst; bei gleichem Zeitpunkt entscheidet die höhere id (stabile Reihenfolge)
function byCreatedDesc(a: Task, b: Task): number {
  return b.createdAt.localeCompare(a.createdAt) || b.id - a.id
}

// Aufgaben ohne Termin kommen ans Ende
function byDueAsc(a: Task, b: Task): number {
  if (a.dueDate === b.dueDate) return 0
  if (a.dueDate === null) return 1
  if (b.dueDate === null) return -1
  return a.dueDate.localeCompare(b.dueDate)
}

function byPriority(a: Task, b: Task): number {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
}

export function sortTasks(tasks: readonly Task[], sort: TaskFilters['sort']): Task[] {
  const copy = [...tasks]
  switch (sort) {
    case 'CREATED_ASC':
      return copy.sort((a, b) => -byCreatedDesc(a, b))
    case 'DUE_ASC':
      return copy.sort((a, b) => byDueAsc(a, b) || byPriority(a, b) || byCreatedDesc(a, b))
    case 'PRIORITY_DESC':
      return copy.sort((a, b) => byPriority(a, b) || byDueAsc(a, b) || byCreatedDesc(a, b))
    default:
      return copy.sort(byCreatedDesc)
  }
}

export interface TaskStats {
  total: number
  open: number
  done: number
  overdue: number
}

/** Kennzahlen über die gesamte geladene Liste (unabhängig von Suche und Filter). */
export function computeStats(tasks: readonly Task[], today: string): TaskStats {
  return {
    total: tasks.length,
    open: tasks.filter((t) => t.status === 'OPEN').length,
    done: tasks.filter((t) => t.status === 'DONE').length,
    overdue: tasks.filter((t) => isOverdue(t, today)).length,
  }
}

/** 2026-11-09 -> 09.11.2026 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/** Text für die Fälligkeit, z. B. "Heute fällig" oder "Überfällig seit 08.11.2026". */
export function dueLabel(task: Task, today: string): string | null {
  if (task.dueDate === null) return null
  if (isOverdue(task, today)) return `Überfällig seit ${formatDate(task.dueDate)}`
  if (task.dueDate === today) return 'Heute fällig'
  return `Fällig am ${formatDate(task.dueDate)}`
}
