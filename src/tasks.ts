import { request } from './http'
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
export const api = {
  list: () => request<Task[]>('/todos'),
  save: (data: Draft, id?: number) =>
    id == null ? request<Task>('/todos', 'POST', data) : request<Task>('/todos/' + id, 'PUT', data),
  remove: (id: number) => request<void>('/todos/' + id, 'DELETE'),
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
