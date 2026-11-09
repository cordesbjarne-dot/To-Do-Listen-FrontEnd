export const priorities = ['niedrig', 'mittel', 'hoch'] as const
export type Priority = (typeof priorities)[number]
export type Status = 'offen' | 'erledigt'
export interface Draft {
  name: string
  description: string
  priority: Priority
  status: Status
  dueDate: string | null
}
export interface Task extends Draft {
  id: number
  createdAt: string
  updatedAt: string
}
export const blank = (): Draft => ({
  name: '',
  description: '',
  priority: 'mittel',
  status: 'offen',
  dueDate: null,
})
const endpoint =
  (import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080').replace(/\/$/, '') + '/todos'
async function request<T>(method: string, id?: number, data?: Draft): Promise<T> {
  const response = await fetch(endpoint + (id == null ? '' : '/' + id), {
    method,
    ...(data && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
      }),
    }),
  }).catch(() => {
    throw new Error('Verbindung fehlgeschlagen. Bitte versuche es erneut.')
  })
  if (!response.ok)
    throw new Error(
      (await response.json().catch(() => ({}))).message || 'Die Anfrage ist fehlgeschlagen.',
    )
  return response.status === 204 ? (undefined as T) : response.json()
}
export const api = {
  list: () => request<Task[]>('GET'),
  save: (data: Draft, id?: number) => request<Task>(id == null ? 'POST' : 'PUT', id, data),
  remove: (id: number) => request<void>('DELETE', id),
}
export function localDay(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}
export function overdue(t: Task, today: string) {
  return t.status === 'offen' && !!t.dueDate && t.dueDate < today
}
export function select(
  tasks: Task[],
  query: string,
  status: string,
  priority: string,
  sort: string,
) {
  const q = query.trim().toLocaleLowerCase('de')
  return tasks
    .filter(
      (t) =>
        (!status || t.status === status) &&
        (!priority || t.priority === priority) &&
        (t.name + ' ' + (t.description ?? '')).toLocaleLowerCase('de').includes(q),
    )
    .sort((a, b) => {
      if (sort === 'frist')
        return (a.dueDate || '99999').localeCompare(b.dueDate || '99999') || a.id - b.id
      if (sort === 'priorität')
        return priorities.indexOf(b.priority) - priorities.indexOf(a.priority) || a.id - b.id
      return Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id - b.id
    })
}
