// Zustand der Aufgabenliste und alle Änderungen daran.
// Die View ruft nur diese Funktionen auf; nach jeder erfolgreichen Änderung wird die
// lokale Liste mit der Antwort des Backends aktualisiert (kein kompletter Neuladen nötig).
import { reactive, ref } from 'vue'
import * as api from '@/api/tasks'
import type { Task, TaskInput, TaskStatus } from '@/types/task'

export function useTasks() {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const loadError = ref('')
  // ids, für die gerade eine Anfrage läuft (Statuswechsel/Löschen) -> Buttons sperren
  const busyIds = reactive(new Set<number>())

  // Schutz gegen verspätete Antworten:
  // - loadSeq: nur die Antwort des zuletzt gestarteten Ladevorgangs zählt
  // - changeSeq: wurde seit dem Start des Ladens lokal etwas geändert, ist die
  //   Ladeantwort veraltet und darf die neueren Daten nicht überschreiben
  let loadSeq = 0
  let changeSeq = 0

  async function load(): Promise<void> {
    const seq = ++loadSeq
    const changesAtStart = changeSeq
    loading.value = true
    loadError.value = ''
    try {
      const result = await api.fetchTasks()
      if (seq === loadSeq && changesAtStart === changeSeq) {
        tasks.value = result
      }
    } catch (e) {
      if (seq === loadSeq) loadError.value = api.errorMessage(e)
    } finally {
      if (seq === loadSeq) loading.value = false
    }
  }

  function replace(updated: Task) {
    changeSeq++
    tasks.value = tasks.value.map((t) => (t.id === updated.id ? updated : t))
  }

  async function create(input: TaskInput): Promise<Task> {
    const created = await api.createTask(input)
    changeSeq++
    tasks.value = [created, ...tasks.value]
    return created
  }

  async function update(id: number, input: TaskInput): Promise<Task> {
    const updated = await api.updateTask(id, input)
    replace(updated)
    return updated
  }

  /** Gibt null zurück, wenn für diese Aufgabe schon eine Anfrage läuft (Doppelklick). */
  async function setStatus(task: Task, status: TaskStatus): Promise<Task | null> {
    if (busyIds.has(task.id)) return null
    busyIds.add(task.id)
    try {
      const updated = await api.setTaskStatus(task.id, status)
      replace(updated)
      return updated
    } finally {
      busyIds.delete(task.id)
    }
  }

  async function remove(task: Task): Promise<void> {
    if (busyIds.has(task.id)) return
    busyIds.add(task.id)
    try {
      await api.deleteTask(task.id)
      changeSeq++
      tasks.value = tasks.value.filter((t) => t.id !== task.id)
    } catch (e) {
      // Bereits gelöscht (z. B. in einem anderen Tab): lokal ebenfalls entfernen
      if (e instanceof api.ApiError && e.status === 404) {
        changeSeq++
        tasks.value = tasks.value.filter((t) => t.id !== task.id)
      }
      throw e
    } finally {
      busyIds.delete(task.id)
    }
  }

  return { tasks, loading, loadError, busyIds, load, create, update, setStatus, remove }
}
