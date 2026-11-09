import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TaskForm from '../TaskForm.vue'
import { ApiError, createTask, updateTask } from '@/api/tasks'

vi.mock('@/api/tasks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/tasks')>()
  return { ...actual, createTask: vi.fn(), updateTask: vi.fn() }
})

const editTask = { id: 3, name: 'Lernen', description: 'Kap 3', done: true }

function mountForm(task: typeof editTask | { id: number; name: string; description: string | null; done: boolean } | null) {
  return mount(TaskForm, { props: { task } })
}

describe('TaskForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('createMode_showsEmptyFields', () => {
    const wrapper = mountForm(null)
    expect((wrapper.get('#task-name').element as HTMLInputElement).value).toBe('')
    expect(wrapper.get('h3').text()).toBe('Neuer Task')
    expect(wrapper.get('button[type="submit"]').text()).toBe('Erstellen')
    expect(wrapper.find('.cancel').exists()).toBe(false)
  })

  it('editMode_fillsFields', () => {
    const wrapper = mountForm(editTask)
    expect((wrapper.get('#task-name').element as HTMLInputElement).value).toBe('Lernen')
    expect((wrapper.get('#task-description').element as HTMLTextAreaElement).value).toBe('Kap 3')
    expect((wrapper.get('#task-done').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.get('h3').text()).toBe('Task bearbeiten')
    expect(wrapper.get('button[type="submit"]').text()).toBe('Speichern')
  })

  it('editMode_nullDescription_showsEmpty', () => {
    const wrapper = mountForm({ ...editTask, description: null })
    expect((wrapper.get('#task-description').element as HTMLTextAreaElement).value).toBe('')
  })

  it('switchingTask_refillsFields', async () => {
    const wrapper = mountForm(editTask)
    await wrapper.setProps({ task: { id: 4, name: 'Sport', description: '', done: false } })
    expect((wrapper.get('#task-name').element as HTMLInputElement).value).toBe('Sport')
    expect((wrapper.get('#task-done').element as HTMLInputElement).checked).toBe(false)
  })

  it('submitCreate_callsCreateTaskAndEmitsSaved', async () => {
    const created = { id: 9, name: 'Neu', description: 'd', done: false }
    vi.mocked(createTask).mockResolvedValue(created)
    const wrapper = mountForm(null)
    await wrapper.get('#task-name').setValue('Neu')
    await wrapper.get('#task-description').setValue('d')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(createTask).toHaveBeenCalledWith({ name: 'Neu', description: 'd', done: false })
    expect(wrapper.emitted('saved')![0]).toEqual([created])
    expect((wrapper.get('#task-name').element as HTMLInputElement).value).toBe('')
  })

  it('submitCreate_trimsName', async () => {
    vi.mocked(createTask).mockResolvedValue({ id: 9, name: 'Neu', description: '', done: false })
    const wrapper = mountForm(null)
    await wrapper.get('#task-name').setValue('  Neu  ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(createTask).toHaveBeenCalledWith(expect.objectContaining({ name: 'Neu' }))
  })

  it('submitEdit_callsUpdateTask', async () => {
    const updated = { ...editTask, name: 'Lernen 2' }
    vi.mocked(updateTask).mockResolvedValue(updated)
    const wrapper = mountForm(editTask)
    await wrapper.get('#task-name').setValue('Lernen 2')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(updateTask).toHaveBeenCalledWith(3, { name: 'Lernen 2', description: 'Kap 3', done: true })
    expect(wrapper.emitted('saved')![0]).toEqual([updated])
    expect(createTask).not.toHaveBeenCalled()
  })

  it('emptyName_showsErrorWithoutApiCall', async () => {
    const wrapper = mountForm(null)
    await wrapper.get('#task-name').setValue('   ')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.error').text()).toBe('Der Name darf nicht leer sein.')
    expect(createTask).not.toHaveBeenCalled()
    expect(wrapper.emitted('saved')).toBeUndefined()
  })

  it('backend400_showsApiErrorMessage', async () => {
    const msg = 'Ungültige Eingabe: Der Name darf nicht leer sein.'
    vi.mocked(createTask).mockRejectedValue(new ApiError(400, msg))
    const wrapper = mountForm(null)
    await wrapper.get('#task-name').setValue('Neu')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.error').text()).toBe(msg)
    expect(wrapper.emitted('saved')).toBeUndefined()
  })

  it('networkError_showsMessage', async () => {
    const msg = 'Backend nicht erreichbar. Bitte später erneut versuchen.'
    vi.mocked(createTask).mockRejectedValue(new ApiError(0, msg))
    const wrapper = mountForm(null)
    await wrapper.get('#task-name').setValue('Neu')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('.error').text()).toBe(msg)
  })

  it('submitButtonDisabledWhileSaving', async () => {
    vi.mocked(createTask).mockReturnValue(new Promise(() => {}))
    const wrapper = mountForm(null)
    await wrapper.get('#task-name').setValue('Neu')
    await wrapper.get('form').trigger('submit')
    await nextTick()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    expect(createTask).toHaveBeenCalledTimes(1)
  })

  it('cancel_emitsCancel', async () => {
    const wrapper = mountForm(editTask)
    await wrapper.get('.cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})
