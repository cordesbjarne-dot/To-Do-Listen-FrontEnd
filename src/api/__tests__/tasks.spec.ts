import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiError, createTask, fetchTasks, updateTask } from '../tasks'

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response
}

describe('tasks api', () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>
  const input = { name: 'Neu', description: 'd', done: false }

  beforeEach(() => {
    vi.stubEnv('VITE_BACKEND_BASE_URL', 'http://api.test')
    fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('fetchTasks_callsGetTodos_returnsList', async () => {
    const list = [{ id: 1, name: 'A', description: null, done: false }]
    fetchMock.mockResolvedValue(jsonResponse(200, list))

    const result = await fetchTasks()

    expect(result).toEqual(list)
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/todos')
  })

  it('createTask_postsJson', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: 5, ...input }))

    const result = await createTask(input)

    expect(result.id).toBe(5)
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  })

  it('updateTask_putsJson', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 5, ...input }))

    await updateTask(5, input)

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/todos/5', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  })

  it('error400_throwsApiError', async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, {}))

    const promise = createTask(input)

    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(promise).rejects.toMatchObject({
      status: 400,
      message: 'Ungültige Eingabe: Der Name darf nicht leer sein.',
    })
  })

  it('error404_throwsApiError', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, {}))

    await expect(updateTask(99, input)).rejects.toMatchObject({
      status: 404,
      message: 'Task wurde nicht gefunden.',
    })
  })

  it('error500_throwsApiError', async () => {
    fetchMock.mockResolvedValue(jsonResponse(500, {}))

    await expect(fetchTasks()).rejects.toMatchObject({
      status: 500,
      message: 'Serverfehler (Status 500).',
    })
  })

  it('networkError_throwsApiErrorWithStatus0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const promise = fetchTasks()

    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(promise).rejects.toMatchObject({
      status: 0,
      message: 'Backend nicht erreichbar. Bitte später erneut versuchen.',
    })
  })
})
