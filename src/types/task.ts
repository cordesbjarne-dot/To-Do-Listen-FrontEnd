// Gemeinsame Typen für Aufgaben. Sie entsprechen TaskResponse/TaskRequest im Backend.

export type TaskStatus = 'OPEN' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  /** Kalenderdatum im Format JJJJ-MM-TT oder null */
  dueDate: string | null
  /** ISO-Zeitstempel, vom Backend gesetzt */
  createdAt: string
  updatedAt: string
}

/** Daten für Erstellen (POST) und Bearbeiten (PUT). id und Zeitstempel setzt das Backend. */
export interface TaskInput {
  title: string
  description: string | null
  priority: TaskPriority
  dueDate: string | null
}

export type StatusFilter = 'ALL' | 'OPEN' | 'OVERDUE' | 'DONE'
export type PriorityFilter = 'ALL' | TaskPriority
export type SortKey = 'CREATED_DESC' | 'CREATED_ASC' | 'DUE_ASC' | 'PRIORITY_DESC'

export interface TaskFilters {
  query: string
  status: StatusFilter
  priority: PriorityFilter
  sort: SortKey
}

export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 2000

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  HIGH: 'Hoch',
  MEDIUM: 'Mittel',
  LOW: 'Niedrig',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  OPEN: 'Offen',
  DONE: 'Erledigt',
}
