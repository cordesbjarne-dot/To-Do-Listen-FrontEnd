// The deployment may reverse-proxy both API paths on the frontend origin.
const base = (
  import.meta.env.VITE_BACKEND_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8080' : '')
).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function send(path: string, options: RequestInit) {
  try {
    return await fetch(base + path, { ...options, credentials: 'include', cache: 'no-store' })
  } catch {
    throw new Error('Verbindung fehlgeschlagen. Bitte versuche es erneut.')
  }
}

export async function request<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (method !== 'GET') {
    const csrf = await send('/auth/csrf', {})
    if (!csrf.ok) throw new Error('Sitzung konnte nicht geladen werden.')
    headers['X-CSRF-TOKEN'] = (await csrf.json()).token
  }
  if (data !== undefined) headers['Content-Type'] = 'application/json'
  const res = await send(path, { method, headers, body: JSON.stringify(data) })
  if (!res.ok) {
    if (
      (res.status === 401 || res.status === 403) &&
      (path.startsWith('/todos') || path === '/auth/profile')
    )
      window.dispatchEvent(new Event('session-ended'))
    const detail = await res.json().catch(() => ({}))
    throw new ApiError(
      res.status,
      detail.message ||
        (res.status === 400
          ? 'Bitte überprüfe deine Eingaben.'
          : 'Anfrage fehlgeschlagen. Bitte versuche es erneut.'),
    )
  }
  return res.status === 204 || res.status === 202 ? (undefined as T) : res.json()
}
