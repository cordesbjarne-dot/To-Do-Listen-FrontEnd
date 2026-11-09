import type { Task } from '@/types/task'

let nextId = 1

/** Erzeugt eine Test-Aufgabe; nur die angegebenen Felder weichen vom Standard ab. */
export function makeTask(overrides: Partial<Task> = {}): Task {
  const id = overrides.id ?? nextId++
  return {
    id,
    title: `Aufgabe ${id}`,
    description: null,
    status: 'OPEN',
    priority: 'MEDIUM',
    dueDate: null,
    createdAt: `2026-11-0${Math.min(id, 9)}T10:00:00Z`,
    updatedAt: `2026-11-0${Math.min(id, 9)}T10:00:00Z`,
    ...overrides,
  }
}

/** Antwort wie von fetch, für vi.spyOn(globalThis, 'fetch'). */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  })
}
