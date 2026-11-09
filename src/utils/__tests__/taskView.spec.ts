import { describe, expect, it } from 'vitest'
import {
  computeStats,
  dueLabel,
  filterTasks,
  isOverdue,
  sortTasks,
  todayIso,
} from '@/utils/taskView'
import { makeTask } from '@/test/fixtures'
import type { TaskFilters } from '@/types/task'

const TODAY = '2026-11-09'
const ALL: TaskFilters = { query: '', status: 'ALL', priority: 'ALL', sort: 'CREATED_DESC' }

describe('isOverdue', () => {
  it('ist nur für offene Aufgaben mit Termin vor heute wahr', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-11-08' }), TODAY)).toBe(true)
    expect(isOverdue(makeTask({ dueDate: TODAY }), TODAY)).toBe(false) // heute fällig
    expect(isOverdue(makeTask({ dueDate: '2026-11-10' }), TODAY)).toBe(false)
    expect(isOverdue(makeTask({ dueDate: null }), TODAY)).toBe(false)
    expect(isOverdue(makeTask({ dueDate: '2026-11-01', status: 'DONE' }), TODAY)).toBe(false)
  })

  it('todayIso nutzt das lokale Kalenderdatum', () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('filterTasks', () => {
  const tasks = [
    makeTask({ id: 1, title: 'Statistik Übungsblatt', priority: 'HIGH' }),
    makeTask({
      id: 2,
      title: 'Einkaufen',
      description: 'Notizblock für STATISTIK',
      priority: 'LOW',
    }),
    makeTask({ id: 3, title: 'Statistik Klausur', status: 'DONE', priority: 'HIGH' }),
    makeTask({ id: 4, title: 'Bibliothek', dueDate: '2026-11-01', priority: 'HIGH' }),
  ]

  it('sucht in Titel und Beschreibung ohne Groß-/Kleinschreibung', () => {
    const ids = filterTasks(tasks, { ...ALL, query: '  statistik ' }, TODAY).map((t) => t.id)
    expect(ids).toEqual([1, 2, 3])
  })

  it('kombiniert Suche, Status und Priorität', () => {
    const ids = filterTasks(
      tasks,
      { ...ALL, query: 'statistik', status: 'OPEN', priority: 'HIGH' },
      TODAY,
    )
    expect(ids.map((t) => t.id)).toEqual([1])
  })

  it('filtert überfällige Aufgaben', () => {
    expect(filterTasks(tasks, { ...ALL, status: 'OVERDUE' }, TODAY).map((t) => t.id)).toEqual([4])
  })

  it('verändert die Originalliste nicht', () => {
    const before = JSON.stringify(tasks)
    filterTasks(tasks, { ...ALL, status: 'DONE' }, TODAY)
    sortTasks(tasks, 'PRIORITY_DESC')
    expect(JSON.stringify(tasks)).toBe(before)
  })
})

describe('sortTasks', () => {
  const a = makeTask({
    id: 1,
    createdAt: '2026-11-01T10:00:00Z',
    dueDate: '2026-11-20',
    priority: 'LOW',
  })
  const b = makeTask({ id: 2, createdAt: '2026-11-02T10:00:00Z', dueDate: null, priority: 'HIGH' })
  const c = makeTask({
    id: 3,
    createdAt: '2026-11-03T10:00:00Z',
    dueDate: '2026-11-10',
    priority: 'MEDIUM',
  })
  const d = makeTask({
    id: 4,
    createdAt: '2026-11-03T10:00:00Z',
    dueDate: '2026-11-10',
    priority: 'MEDIUM',
  })

  it('sortiert nach Erstellungsdatum mit stabiler Reihenfolge über die id', () => {
    expect(sortTasks([a, b, c, d], 'CREATED_DESC').map((t) => t.id)).toEqual([4, 3, 2, 1])
    expect(sortTasks([d, c, b, a], 'CREATED_ASC').map((t) => t.id)).toEqual([1, 2, 3, 4])
  })

  it('sortiert nach Fälligkeit, Aufgaben ohne Termin am Ende', () => {
    expect(sortTasks([b, a, c, d], 'DUE_ASC').map((t) => t.id)).toEqual([4, 3, 1, 2])
  })

  it('sortiert nach Priorität (hoch zuerst), dann nach Fälligkeit', () => {
    expect(sortTasks([a, c, b, d], 'PRIORITY_DESC').map((t) => t.id)).toEqual([2, 4, 3, 1])
  })
})

describe('computeStats und dueLabel', () => {
  it('zählt alle, offene, erledigte und überfällige Aufgaben', () => {
    const tasks = [
      makeTask({ status: 'OPEN', dueDate: '2026-11-01' }),
      makeTask({ status: 'OPEN', dueDate: TODAY }),
      makeTask({ status: 'DONE', dueDate: '2026-11-01' }),
    ]
    expect(computeStats(tasks, TODAY)).toEqual({ total: 3, open: 2, done: 1, overdue: 1 })
  })

  it('beschreibt die Fälligkeit verständlich', () => {
    expect(dueLabel(makeTask({ dueDate: '2026-11-08' }), TODAY)).toBe('Überfällig seit 08.11.2026')
    expect(dueLabel(makeTask({ dueDate: TODAY }), TODAY)).toBe('Heute fällig')
    expect(dueLabel(makeTask({ dueDate: '2026-12-24' }), TODAY)).toBe('Fällig am 24.12.2026')
    expect(dueLabel(makeTask({ dueDate: null }), TODAY)).toBeNull()
  })
})
