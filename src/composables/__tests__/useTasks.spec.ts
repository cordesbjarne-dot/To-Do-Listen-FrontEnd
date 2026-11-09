import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTasks } from '@/composables/useTasks'
import * as api from '@/api/tasks'
import { makeTask } from '@/test/fixtures'
import type { Task } from '@/types/task'

vi.mock('@/api/tasks', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/tasks')>()
  return {
    ...original,
    fetchTasks: vi.fn<typeof original.fetchTasks>(),
    setTaskStatus: vi.fn<typeof original.setTaskStatus>(),
    deleteTask: vi.fn<typeof original.deleteTask>(),
  }
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => (resolve = res))
  return { promise, resolve }
}

afterEach(() => vi.clearAllMocks())

describe('useTasks: verspätete Antworten', () => {
  it('eine ältere Ladeantwort überschreibt keine neuere', async () => {
    const slow = deferred<Task[]>()
    vi.mocked(api.fetchTasks)
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce([makeTask({ id: 2, title: 'Neu' })])
    const { tasks, load, loading } = useTasks()

    const first = load()
    await load()
    slow.resolve([makeTask({ id: 1, title: 'Alt' })])
    await first

    expect(tasks.value.map((t) => t.title)).toEqual(['Neu'])
    expect(loading.value).toBe(false)
  })

  it('eine Ladeantwort, die vor einer Änderung gestartet wurde, überschreibt die Änderung nicht', async () => {
    const original = makeTask({ id: 1, status: 'OPEN' })
    vi.mocked(api.fetchTasks).mockResolvedValueOnce([original])
    const { tasks, load, setStatus } = useTasks()
    await load()

    const slow = deferred<Task[]>()
    vi.mocked(api.fetchTasks).mockReturnValueOnce(slow.promise)
    vi.mocked(api.setTaskStatus).mockResolvedValue({ ...original, status: 'DONE' })
    const reload = load()
    await setStatus(original, 'DONE')
    slow.resolve([original]) // veralteter Stand vom Server, vor der Änderung gelesen
    await reload

    expect(tasks.value[0]?.status).toBe('DONE')
  })

  it('sperrt parallele Statuswechsel für dieselbe Aufgabe', async () => {
    const task = makeTask({ id: 1 })
    const pending = deferred<Task>()
    vi.mocked(api.setTaskStatus).mockReturnValue(pending.promise)
    const { setStatus, busyIds } = useTasks()

    const first = setStatus(task, 'DONE')
    expect(busyIds.has(1)).toBe(true)
    await expect(setStatus(task, 'DONE')).resolves.toBeNull()
    expect(api.setTaskStatus).toHaveBeenCalledTimes(1)
    pending.resolve({ ...task, status: 'DONE' })
    await first
    expect(busyIds.has(1)).toBe(false)
  })
})
