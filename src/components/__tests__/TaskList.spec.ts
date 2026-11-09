import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import TaskList from '../TaskList.vue'
import TaskForm from '../TaskForm.vue'
import { ApiError, fetchTasks, updateTask } from '@/api/tasks'

vi.mock('@/api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/tasks')>()
  return {
    ...actual,
    fetchTasks: vi.fn<typeof actual.fetchTasks>(),
    createTask: vi.fn<typeof actual.createTask>(),
    updateTask: vi.fn<typeof actual.updateTask>(),
  }
})

const a = { id: 1, name: 'A', description: null, done: false }
const b = { id: 2, name: 'B', description: 'bb', done: true }

async function mountList() {
  const wrapper = mount(TaskList)
  await flushPromises()
  return wrapper
}

describe('TaskList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loadsAndRendersTasks', async () => {
    vi.mocked(fetchTasks).mockResolvedValue([a, b])
    const wrapper = await mountList()

    const items = wrapper.findAll('ul li')
    expect(items).toHaveLength(2)
    expect(items[0]!.text()).toContain('A')
    expect(items[1]!.text()).toContain('B')
    expect((items[0]!.get('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(
      false,
    )
    expect((items[1]!.get('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
    expect(items[0]!.classes()).not.toContain('done')
    expect(items[1]!.classes()).toContain('done')
  })

  it('loadError_showsMessage', async () => {
    vi.mocked(fetchTasks).mockRejectedValue(
      new ApiError(0, 'Backend nicht erreichbar. Bitte später erneut versuchen.'),
    )
    const wrapper = await mountList()

    expect(wrapper.get('.list-error').text()).toBe(
      'Backend nicht erreichbar. Bitte später erneut versuchen.',
    )
    expect(wrapper.findAll('ul li')).toHaveLength(0)
  })

  it('toggleDone_callsUpdateTask', async () => {
    vi.mocked(fetchTasks).mockResolvedValue([a])
    vi.mocked(updateTask).mockResolvedValue({ ...a, done: true })
    const wrapper = await mountList()

    await wrapper.get('ul li input[type="checkbox"]').setValue(true)
    await flushPromises()

    expect(updateTask).toHaveBeenCalledWith(1, { name: 'A', description: '', done: true })
    expect(wrapper.get('ul li').classes()).toContain('done')
  })

  it('toggleDone_error_revertsAndShowsMessage', async () => {
    vi.mocked(fetchTasks).mockResolvedValue([a])
    vi.mocked(updateTask).mockRejectedValue(new ApiError(404, 'Task wurde nicht gefunden.'))
    const wrapper = await mountList()

    const checkbox = wrapper.get('ul li input[type="checkbox"]')
    await checkbox.setValue(true)
    await flushPromises()

    expect(wrapper.get('.list-error').text()).toBe('Task wurde nicht gefunden.')
    expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.get('ul li').classes()).not.toContain('done')
  })

  it('editButton_fillsForm', async () => {
    vi.mocked(fetchTasks).mockResolvedValue([b])
    const wrapper = await mountList()

    await wrapper.get('.edit').trigger('click')

    expect((wrapper.get('#task-name').element as HTMLInputElement).value).toBe('B')
    expect((wrapper.get('#task-description').element as HTMLTextAreaElement).value).toBe('bb')
    expect(wrapper.get('h3').text()).toBe('Task bearbeiten')
  })

  it('cancel_returnsToCreateMode', async () => {
    vi.mocked(fetchTasks).mockResolvedValue([b])
    const wrapper = await mountList()

    await wrapper.get('.edit').trigger('click')
    await wrapper.get('.cancel').trigger('click')

    expect(wrapper.get('h3').text()).toBe('Neuer Task')
    expect((wrapper.get('#task-name').element as HTMLInputElement).value).toBe('')
  })

  it('afterSave_reloadsListAndResetsForm', async () => {
    vi.mocked(fetchTasks).mockResolvedValue([a])
    const wrapper = await mountList()

    await wrapper.get('.edit').trigger('click')
    wrapper.findComponent(TaskForm).vm.$emit('saved', a)
    await flushPromises()

    expect(fetchTasks).toHaveBeenCalledTimes(2)
    expect(wrapper.get('h3').text()).toBe('Neuer Task')
  })
})
