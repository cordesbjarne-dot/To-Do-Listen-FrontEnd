// Komponententests für die Hauptseite. Das API-Modul wird ersetzt (vi.mock), damit die Tests
// ohne Backend laufen. Die echte Persistenz prüfen die Backend-Integrationstests und der E2E-Test.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import TasksView from '@/views/TasksView.vue'
import * as api from '@/api/tasks'
import { makeTask } from '@/test/fixtures'
import type { Task, TaskInput } from '@/types/task'

vi.mock('@/api/tasks', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/tasks')>()
  return {
    ...original,
    fetchTasks: vi.fn<typeof original.fetchTasks>(),
    createTask: vi.fn<typeof original.createTask>(),
    updateTask: vi.fn<typeof original.updateTask>(),
    setTaskStatus: vi.fn<typeof original.setTaskStatus>(),
    deleteTask: vi.fn<typeof original.deleteTask>(),
  }
})

const fetchTasks = vi.mocked(api.fetchTasks)
const createTask = vi.mocked(api.createTask)
const updateTask = vi.mocked(api.updateTask)
const setTaskStatus = vi.mocked(api.setTaskStatus)
const deleteTask = vi.mocked(api.deleteTask)

const TODAY = '2026-11-09'
let wrapper: VueWrapper | undefined

function sampleTasks(): Task[] {
  return [
    makeTask({
      id: 1,
      title: 'Statistik Übungsblatt',
      priority: 'HIGH',
      dueDate: '2026-11-11',
      createdAt: '2026-11-03T10:00:00Z',
    }),
    makeTask({
      id: 2,
      title: 'Datenbanken wiederholen',
      description: 'Joins und Normalformen',
      dueDate: '2026-11-05',
      createdAt: '2026-11-02T10:00:00Z',
    }),
    makeTask({
      id: 3,
      title: 'Klausur anmelden',
      status: 'DONE',
      priority: 'LOW',
      createdAt: '2026-11-01T10:00:00Z',
    }),
  ]
}

async function mountView(tasks: Task[] = sampleTasks()) {
  fetchTasks.mockResolvedValue(tasks)
  wrapper = mount(TasksView, { attachTo: document.body })
  await flushPromises()
  return wrapper
}

function titles(w: VueWrapper): string[] {
  return w.findAll('.task__title').map((el) => el.text())
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 9, 12, 0)) // 09.11.2026 lokal
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('Übersicht (UC-02)', () => {
  it('zeigt Aufgaben mit Titel, Status, Priorität und Fälligkeit als Text', async () => {
    const w = await mountView()
    expect(titles(w)).toEqual([
      'Statistik Übungsblatt',
      'Datenbanken wiederholen',
      'Klausur anmelden',
    ])

    const overdue = w.get('[data-testid="task-2"]')
    expect(overdue.text()).toContain('Offen')
    expect(overdue.text()).toContain('Mittel')
    expect(overdue.text()).toContain('Überfällig seit 05.11.2026')
    expect(overdue.text()).toContain('Joins und Normalformen')
    expect(w.get('[data-testid="task-3"]').text()).toContain('Erledigt')
  })

  it('zeigt Kennzahlen über die gesamte Liste', async () => {
    const w = await mountView()
    const values = w.findAll('.stat dd').map((el) => el.text())
    expect(values).toEqual(['3', '2', '1', '1'])
    expect(TODAY).toBe('2026-11-09')
  })

  it('zeigt eine Ladeanzeige und danach einen hilfreichen Leerzustand', async () => {
    const pending = deferred<Task[]>()
    fetchTasks.mockReturnValue(pending.promise)
    wrapper = mount(TasksView, { attachTo: document.body })
    await flushPromises()
    expect(wrapper.text()).toContain('Aufgaben werden geladen')

    pending.resolve([])
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Noch keine Aufgaben')
  })

  it('zeigt einen verständlichen Netzwerkfehler mit "Erneut versuchen"', async () => {
    fetchTasks.mockRejectedValueOnce(new api.ApiError(0, 'Der Server ist nicht erreichbar.'))
    wrapper = mount(TasksView, { attachTo: document.body })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Der Server ist nicht erreichbar.')

    fetchTasks.mockResolvedValueOnce(sampleTasks())
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Erneut versuchen')!
      .trigger('click')
    await flushPromises()
    expect(titles(wrapper)).toHaveLength(3)
  })
})

describe('Erstellen (UC-01) und Validierung', () => {
  async function openCreate(w: VueWrapper) {
    await w.get('#new-task-button').trigger('click')
    await flushPromises()
    return w.get('form.task-form')
  }

  it('verhindert das Absenden ohne Titel und zeigt eine Fehlermeldung am Feld', async () => {
    const w = await mountView()
    const form = await openCreate(w)
    await form.get('#task-title').setValue('    ')
    await form.trigger('submit')
    await flushPromises()

    expect(createTask).not.toHaveBeenCalled()
    expect(form.get('#task-title-error').text()).toBe('Bitte gib einen Titel ein.')
    expect(form.get('#task-title').attributes('aria-invalid')).toBe('true')
    expect(document.activeElement?.id).toBe('task-title')
  })

  it('verhindert zu lange Titel und Beschreibungen', async () => {
    const w = await mountView()
    const form = await openCreate(w)
    await form.get('#task-title').setValue('a'.repeat(121))
    await form.get('#task-description').setValue('b'.repeat(2001))
    await form.trigger('submit')
    await flushPromises()

    expect(createTask).not.toHaveBeenCalled()
    expect(form.get('#task-title-error').text()).toContain('höchstens 120 Zeichen')
    expect(form.get('#task-description-error').text()).toContain('höchstens 2000 Zeichen')
  })

  it('legt eine Aufgabe an, zeigt sie sofort und meldet den Erfolg', async () => {
    const w = await mountView()
    createTask.mockImplementation(async (input: TaskInput) =>
      makeTask({ id: 50, ...input, createdAt: '2026-11-09T11:00:00Z' }),
    )
    const form = await openCreate(w)
    await form.get('#task-title').setValue('  Referat vorbereiten  ')
    await form.get('#task-description').setValue('Folien 1-10')
    await form.get('#task-priority').setValue('HIGH')
    await form.get('#task-due').setValue('2026-11-20')
    await form.trigger('submit')
    await flushPromises()

    expect(createTask).toHaveBeenCalledWith({
      title: 'Referat vorbereiten',
      description: 'Folien 1-10',
      priority: 'HIGH',
      dueDate: '2026-11-20',
    })
    expect(titles(w)[0]).toBe('Referat vorbereiten')
    expect(w.find('dialog[open]').exists()).toBe(false)
    expect(w.text()).toContain('Aufgabe „Referat vorbereiten“ angelegt.')
    expect(w.findAll('.stat dd')[0]?.text()).toBe('4')
  })

  it('sendet beim Doppelklick nur eine Anfrage', async () => {
    const w = await mountView()
    const pending = deferred<Task>()
    createTask.mockReturnValue(pending.promise)
    const form = await openCreate(w)
    await form.get('#task-title').setValue('Einmal')
    await form.trigger('submit')
    await form.trigger('submit')
    expect(createTask).toHaveBeenCalledTimes(1)
    expect(form.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    pending.resolve(makeTask({ id: 60, title: 'Einmal' }))
    await flushPromises()
  })

  it('behält alle Eingaben, wenn das Speichern fehlschlägt', async () => {
    const w = await mountView()
    createTask.mockRejectedValue(
      new api.ApiError(400, 'Die Eingaben sind ungültig.', [
        { field: 'title', message: 'Titel vom Server abgelehnt.' },
      ]),
    )
    const form = await openCreate(w)
    await form.get('#task-title').setValue('Mein Titel')
    await form.get('#task-description').setValue('Wichtige Notizen')
    await form.get('#task-priority').setValue('LOW')
    await form.trigger('submit')
    await flushPromises()

    expect(w.find('dialog[open]').exists()).toBe(true)
    expect(form.get('[role="alert"]').text()).toContain('Speichern fehlgeschlagen')
    expect(form.get('#task-title-error').text()).toBe('Titel vom Server abgelehnt.')
    expect((form.get('#task-title').element as HTMLInputElement).value).toBe('Mein Titel')
    expect((form.get('#task-description').element as HTMLTextAreaElement).value).toBe(
      'Wichtige Notizen',
    )
    expect((form.get('#task-priority').element as HTMLSelectElement).value).toBe('LOW')
    expect(titles(w)).toHaveLength(3)
  })
})

describe('Bearbeiten (UC-03)', () => {
  it('füllt das Formular mit der Aufgabe und speichert die Änderungen', async () => {
    const w = await mountView()
    updateTask.mockImplementation(async (id: number, input: TaskInput) =>
      makeTask({ ...sampleTasks()[1], id, ...input }),
    )
    await w
      .get('[data-testid="task-2"]')
      .findAll('button')
      .find((b) => b.text() === 'Bearbeiten')!
      .trigger('click')
    await flushPromises()

    const form = w.get('form.task-form')
    expect(w.get('dialog[open] h2').text()).toBe('Aufgabe bearbeiten')
    expect((form.get('#task-title').element as HTMLInputElement).value).toBe(
      'Datenbanken wiederholen',
    )
    expect((form.get('#task-due').element as HTMLInputElement).value).toBe('2026-11-05')

    await form.get('#task-title').setValue('Datenbanken Kapitel 3')
    await form.get('#task-due').setValue('')
    await form.trigger('submit')
    await flushPromises()

    expect(updateTask).toHaveBeenCalledWith(2, {
      title: 'Datenbanken Kapitel 3',
      description: 'Joins und Normalformen',
      priority: 'MEDIUM',
      dueDate: null,
    })
    expect(w.get('[data-testid="task-2"]').text()).toContain('Datenbanken Kapitel 3')
    expect(w.get('[data-testid="task-2"]').text()).not.toContain('Überfällig')
    expect(w.text()).toContain('Änderungen an „Datenbanken Kapitel 3“ gespeichert.')
  })

  it('schließt den Dialog mit Escape (cancel-Event) ohne zu speichern', async () => {
    const w = await mountView()
    await w.get('#new-task-button').trigger('click')
    await flushPromises()
    await w.get('dialog').trigger('cancel')
    await flushPromises()
    expect(w.find('dialog[open]').exists()).toBe(false)
    expect(createTask).not.toHaveBeenCalled()
    expect(document.activeElement?.id).toBe('new-task-button')
  })
})

describe('Statuswechsel (UC-04)', () => {
  it('markiert eine Aufgabe als erledigt und öffnet sie wieder', async () => {
    const w = await mountView()
    setTaskStatus.mockImplementation(async (id, status) =>
      makeTask({ ...sampleTasks()[0], id, status }),
    )

    await w.get('#task-done-1').trigger('change')
    await flushPromises()
    expect(setTaskStatus).toHaveBeenLastCalledWith(1, 'DONE')
    expect(w.get('[data-testid="task-1"]').text()).toContain('Erledigt')
    expect((w.get('#task-done-1').element as HTMLInputElement).checked).toBe(true)

    await w.get('#task-done-1').trigger('change')
    await flushPromises()
    expect(setTaskStatus).toHaveBeenLastCalledWith(1, 'OPEN')
    expect(w.get('[data-testid="task-1"]').text()).toContain('Offen')
  })

  it('zeigt einen Fehler und behält den alten Status, wenn der Wechsel fehlschlägt', async () => {
    const w = await mountView()
    setTaskStatus.mockRejectedValue(new api.ApiError(0, 'Der Server ist nicht erreichbar.'))
    const checkbox = w.get('#task-done-1')
    ;(checkbox.element as HTMLInputElement).checked = true // Browser setzt den Haken beim Klick
    await checkbox.trigger('change')
    await flushPromises()

    expect(w.get('[role="alert"]').text()).toContain('Status konnte nicht geändert werden')
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    expect(w.get('[data-testid="task-1"]').text()).toContain('Offen')
  })
})

describe('Löschen (UC-05)', () => {
  async function askDelete(w: VueWrapper, id: number) {
    await w
      .get(`[data-testid="task-${id}"]`)
      .findAll('button')
      .find((b) => b.text() === 'Löschen')!
      .trigger('click')
    await flushPromises()
  }

  it('nennt den Titel in der Bestätigung und löscht erst nach Bestätigung', async () => {
    const w = await mountView()
    deleteTask.mockResolvedValue(undefined)
    await askDelete(w, 2)

    const dialog = w.get('dialog[open]')
    expect(dialog.text()).toContain('„Datenbanken wiederholen“')
    expect(deleteTask).not.toHaveBeenCalled()
    expect(document.activeElement?.textContent?.trim()).toBe('Abbrechen')

    await dialog
      .findAll('button')
      .find((b) => b.text() === 'Endgültig löschen')!
      .trigger('click')
    await flushPromises()
    expect(deleteTask).toHaveBeenCalledWith(2)
    expect(titles(w)).toEqual(['Statistik Übungsblatt', 'Klausur anmelden'])
    expect(w.text()).toContain('Aufgabe „Datenbanken wiederholen“ gelöscht.')
  })

  it('bricht das Löschen ab, ohne etwas zu ändern', async () => {
    const w = await mountView()
    await askDelete(w, 2)
    await w
      .get('dialog[open]')
      .findAll('button')
      .find((b) => b.text() === 'Abbrechen')!
      .trigger('click')
    await flushPromises()
    expect(deleteTask).not.toHaveBeenCalled()
    expect(w.find('dialog[open]').exists()).toBe(false)
    expect(titles(w)).toHaveLength(3)
  })

  it('zeigt einen Fehler im Dialog, wenn das Löschen fehlschlägt', async () => {
    const w = await mountView()
    deleteTask.mockRejectedValue(new api.ApiError(500, 'Der Server hat einen Fehler gemeldet.'))
    await askDelete(w, 1)
    await w
      .get('dialog[open]')
      .findAll('button')
      .find((b) => b.text() === 'Endgültig löschen')!
      .trigger('click')
    await flushPromises()
    expect(w.get('dialog[open] [role="alert"]').text()).toContain('Löschen fehlgeschlagen')
    expect(titles(w)).toHaveLength(3)
  })
})

describe('Suche, Filter und Sortierung (UC-06, UC-07)', () => {
  it('kombiniert Suche mit Status- und Prioritätsfilter und zeigt die Trefferzahl', async () => {
    const w = await mountView([
      ...sampleTasks(),
      makeTask({
        id: 4,
        title: 'Statistik Tutorium',
        priority: 'LOW',
        createdAt: '2026-11-04T10:00:00Z',
      }),
    ])
    await w.get('#task-search').setValue('STATISTIK')
    expect(titles(w)).toEqual(['Statistik Tutorium', 'Statistik Übungsblatt'])
    expect(w.get('[data-testid="result-count"]').text()).toBe('2 von 4 Aufgaben')

    await w.get('#filter-priority').setValue('HIGH')
    expect(titles(w)).toEqual(['Statistik Übungsblatt'])

    await w.get('#filter-status').setValue('DONE')
    expect(w.find('[data-testid="no-results"]').exists()).toBe(true)
    // Kennzahlen beziehen sich weiter auf alle Aufgaben
    expect(w.findAll('.stat dd')[0]?.text()).toBe('4')

    await w.get('[data-testid="no-results"] button').trigger('click')
    expect(titles(w)).toHaveLength(4)
    expect((w.get('#task-search').element as HTMLInputElement).value).toBe('')
  })

  it('filtert überfällige Aufgaben', async () => {
    const w = await mountView()
    await w.get('#filter-status').setValue('OVERDUE')
    expect(titles(w)).toEqual(['Datenbanken wiederholen'])
  })

  it('sortiert nach Fälligkeit (ohne Termin am Ende) und nach Priorität', async () => {
    const w = await mountView()
    await w.get('#sort').setValue('DUE_ASC')
    expect(titles(w)).toEqual([
      'Datenbanken wiederholen',
      'Statistik Übungsblatt',
      'Klausur anmelden',
    ])

    await w.get('#sort').setValue('PRIORITY_DESC')
    expect(titles(w)).toEqual([
      'Statistik Übungsblatt',
      'Datenbanken wiederholen',
      'Klausur anmelden',
    ])

    await w.get('#sort').setValue('CREATED_ASC')
    expect(titles(w)).toEqual([
      'Klausur anmelden',
      'Datenbanken wiederholen',
      'Statistik Übungsblatt',
    ])
  })
})
