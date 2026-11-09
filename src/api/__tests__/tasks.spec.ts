import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  createTask,
  deleteTask,
  fetchTasks,
  setTaskStatus,
  updateTask,
} from '@/api/tasks'
import { jsonResponse, makeTask } from '@/test/fixtures'

describe('API-Modul', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_BACKEND_BASE_URL', 'http://api.test/')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('nutzt die konfigurierte Backend-Adresse', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse([makeTask()]))
    const tasks = await fetchTasks()
    expect(tasks).toHaveLength(1)
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('http://api.test/todos')
  })

  it('schickt die richtigen Methoden und JSON-Bodies', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => jsonResponse(makeTask()))
    const input = {
      title: 'T',
      description: null,
      priority: 'HIGH' as const,
      dueDate: '2026-11-20',
    }

    await createTask(input)
    await updateTask(7, input)
    await setTaskStatus(7, 'DONE')

    const calls = fetchSpy.mock.calls.map(([url, init]) => [url, init?.method, init?.body])
    expect(calls).toEqual([
      ['http://api.test/todos', 'POST', JSON.stringify(input)],
      ['http://api.test/todos/7', 'PUT', JSON.stringify(input)],
      ['http://api.test/todos/7/status', 'PATCH', JSON.stringify({ status: 'DONE' })],
    ])
  })

  it('akzeptiert 204 ohne Body beim Löschen', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(null, 204))
    await expect(deleteTask(3)).resolves.toBeUndefined()
    expect(fetchSpy.mock.calls[0]?.[1]?.method).toBe('DELETE')
  })

  it('übernimmt Fehlertext und Feldfehler aus der Problem-Details-Antwort', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        {
          status: 400,
          detail: 'Die Eingaben sind ungültig.',
          errors: [{ field: 'title', message: 'Zu lang' }],
        },
        400,
      ),
    )
    const error = await createTask({
      title: 'x',
      description: null,
      priority: 'LOW',
      dueDate: null,
    }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(400)
    expect((error as ApiError).message).toBe('Die Eingaben sind ungültig.')
    expect((error as ApiError).fieldErrors).toEqual([{ field: 'title', message: 'Zu lang' }])
  })

  it('meldet Netzwerkfehler verständlich mit Status 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(fetchTasks()).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('nicht erreichbar'),
    })
  })

  it('zeigt bei Serverfehlern keinen internen Text', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ detail: 'NullPointerException in X' }, 500),
    )
    await expect(fetchTasks()).rejects.toMatchObject({
      status: 500,
      message: expect.stringContaining('Server'),
    })
  })
})
