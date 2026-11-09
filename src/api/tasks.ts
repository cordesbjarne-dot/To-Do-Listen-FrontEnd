// Alle Aufrufe ans Backend an einer Stelle. Komponenten importieren nur diese Funktionen
// und müssen weder URLs noch HTTP-Details kennen.
import type { Task, TaskInput, TaskStatus } from '@/types/task'

/** Ein Feldfehler aus der Backend-Antwort, z. B. { field: 'title', message: '…' } */
export interface FieldError {
  field: string
  message: string
}

/**
 * Fehler, den alle Funktionen dieses Moduls werfen.
 * status 0 bedeutet: Backend nicht erreichbar (Netzwerkfehler).
 */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldError[]

  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// Adresse aus der Umgebungsvariable VITE_BACKEND_BASE_URL (.env.development bzw. Render).
// Wird bei jedem Aufruf gelesen, damit Tests sie per vi.stubEnv ändern können.
function url(path: string): string {
  const base = (import.meta.env.VITE_BACKEND_BASE_URL ?? '').replace(/\/$/, '')
  return `${base}${path}`
}

function fallbackMessage(status: number): string {
  if (status === 400) return 'Die Eingaben sind ungültig.'
  if (status === 404)
    return 'Die Aufgabe wurde nicht gefunden. Vielleicht wurde sie bereits gelöscht.'
  if (status >= 500) return 'Der Server hat einen Fehler gemeldet. Bitte versuche es später erneut.'
  return `Die Anfrage ist fehlgeschlagen (Status ${status}).`
}

// Liest die Fehlerantwort des Backends (Problem Details: detail + errors).
async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as { detail?: unknown; errors?: unknown }
    const fieldErrors = Array.isArray(body.errors) ? (body.errors as FieldError[]) : []
    // Bei 5xx zeigen wir bewusst keinen Servertext an
    const message =
      response.status < 500 && typeof body.detail === 'string'
        ? body.detail
        : fallbackMessage(response.status)
    return new ApiError(response.status, message, fieldErrors)
  } catch {
    return new ApiError(response.status, fallbackMessage(response.status))
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url(path), {
      ...init,
      headers: init.body ? { 'Content-Type': 'application/json' } : undefined,
    })
  } catch {
    throw new ApiError(
      0,
      'Der Server ist nicht erreichbar. Prüfe deine Verbindung oder versuche es gleich noch einmal.',
    )
  }
  if (!response.ok) {
    throw await toApiError(response)
  }
  // 204 No Content (Löschen) hat keinen Body
  return (response.status === 204 ? undefined : await response.json()) as T
}

export function fetchTasks(): Promise<Task[]> {
  return request<Task[]>('/todos')
}

export function createTask(input: TaskInput): Promise<Task> {
  return request<Task>('/todos', { method: 'POST', body: JSON.stringify(input) })
}

export function updateTask(id: number, input: TaskInput): Promise<Task> {
  return request<Task>(`/todos/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function setTaskStatus(id: number, status: TaskStatus): Promise<Task> {
  return request<Task>(`/todos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

export function deleteTask(id: number): Promise<void> {
  return request<void>(`/todos/${id}`, { method: 'DELETE' })
}

/** Macht aus einem beliebigen Fehler einen anzeigbaren deutschen Text. */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Unerwarteter Fehler. Bitte lade die Seite neu.'
}
