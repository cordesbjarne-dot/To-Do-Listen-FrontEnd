import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TaskEditor from '../TaskEditor.vue'
import TaskList from '../TaskList.vue'
import { blank, select, overdue, api, type Task } from '../../tasks'
const sample = (id: number, name: string, extra: Partial<Task> = {}): Task => ({
  ...blank(),
  id,
  name,
  createdAt: '2026-04-01',
  updatedAt: '2026-04-01',
  ...extra,
})
afterEach(() => vi.restoreAllMocks())
describe('Studienplaner', () => {
  it('kombiniert Filter, durchsucht Beschreibungen und sortiert stabil ohne Mutation', () => {
    const rows = [
      sample(3, 'Seminar', { dueDate: null }),
      sample(2, 'B', { description: 'SEMINAR', priority: 'hoch', dueDate: '2025-02-01' }),
      sample(1, 'A', { dueDate: '2025-02-01', status: 'erledigt' }),
    ]
    expect(select(rows, 'semi', 'offen', 'hoch', 'neu').map((t) => t.id)).toEqual([2])
    expect(select(rows, '', '', '', 'frist').map((t) => t.id)).toEqual([1, 2, 3])
    expect(select(rows, '', '', '', 'priorität')[0]?.id).toBe(2)
    expect(rows[0]?.id).toBe(3)
    expect(overdue(rows[1]!, '2025-02-01')).toBe(false)
    expect(overdue(rows[1]!, '2025-02-02')).toBe(true)
    expect(overdue(rows[2]!, '2025-02-02')).toBe(false)
  })
  it('lehnt reine Leerzeichen ab', async () => {
    HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
    const wrapper = mount(TaskEditor, { props: { task: null, busy: false, error: '' } })
    await wrapper.get('input').setValue('   ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('save')).toBeUndefined()
    expect(wrapper.get('[role=alert]').text()).toContain('Titel')
  })
  it('zeigt gespeicherte Aufgaben und erhält Eingaben bei Speicherfehler', async () => {
    HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
    vi.spyOn(api, 'list').mockResolvedValue([sample(1, 'Kolloquium')])
    vi.spyOn(api, 'save').mockRejectedValue(new Error('Verbindung fehlgeschlagen'))
    const wrapper = mount(TaskList)
    await flushPromises()
    expect(wrapper.get('article').text()).toContain('Kolloquium')
    await wrapper.get('.primary').trigger('click')
    await wrapper.get('dialog input').setValue('Referat')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('dialog [role=alert]').text()).toContain('Verbindung')
    expect((wrapper.get('dialog input').element as HTMLInputElement).value).toBe('Referat')
    wrapper.unmount()
  })
})
