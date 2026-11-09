// API-Modul für alle Aufrufe ans Backend (Tasks laden, erstellen, ändern).
// Hier liegen auch die Typen und die einheitliche Fehlerbehandlung.

// Entspricht der Klasse Task.java im Backend
export interface Task {
  id: number
  name: string
  description: string | null
  done: boolean
}

// Daten, die wir beim Erstellen/Bearbeiten an das Backend schicken (ohne id)
export interface TaskInput {
  name: string
  description: string
  done: boolean
}

// Fehler, den alle Funktionen dieses Moduls werfen.
// status = HTTP-Statuscode, 0 bedeutet: Backend war gar nicht erreichbar.
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Baut die volle URL, z. B. http://localhost:8080/todos.
// Die Env-Variable wird bei jedem Aufruf neu gelesen, damit Tests sie ändern können.
function url(path: string): string {
  return `${import.meta.env.VITE_BACKEND_BASE_URL}${path}`
}

// Übersetzt einen HTTP-Statuscode in einen lesbaren deutschen Text.
function messageFor(status: number): string {
  if (status === 400) return 'Ungültige Eingabe: Der Name darf nicht leer sein.'
  if (status === 404) return 'Task wurde nicht gefunden.'
  return `Serverfehler (Status ${status}).`
}

// Schickt eine Anfrage ans Backend und gibt das JSON zurück.
// Wirft einen ApiError, wenn die Anfrage fehlschlägt (Netzwerk oder HTTP-Fehler).
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    // Ohne init nur die URL übergeben, mit init die URL und die Optionen (Methode, Body).
    response = init ? await fetch(url(path), init) : await fetch(url(path))
  } catch {
    // fetch wirft nur, wenn gar keine Verbindung zustande kommt (z. B. Backend aus).
    throw new ApiError(0, 'Backend nicht erreichbar. Bitte später erneut versuchen.')
  }
  // fetch wirft bei 400/404/500 NICHT, deshalb prüfen wir response.ok selbst.
  if (!response.ok) {
    throw new ApiError(response.status, messageFor(response.status))
  }
  return (await response.json()) as T
}

// Baut die Optionen für eine Anfrage mit JSON-Body (POST oder PUT).
function jsonInit(method: 'POST' | 'PUT', input: TaskInput): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }
}

// Lädt alle Tasks (GET /todos).
export function fetchTasks(): Promise<Task[]> {
  return request<Task[]>('/todos')
}

// Erstellt einen neuen Task (POST /todos). Das Backend antwortet mit 201 und dem Task inkl. id.
export function createTask(input: TaskInput): Promise<Task> {
  return request<Task>('/todos', jsonInit('POST', input))
}

// Ändert einen bestehenden Task (PUT /todos/{id}). Die id steht im Pfad, nicht im Body.
export function updateTask(id: number, input: TaskInput): Promise<Task> {
  return request<Task>(`/todos/${id}`, jsonInit('PUT', input))
}
