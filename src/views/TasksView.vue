<script setup lang="ts">
// Hauptseite: verbindet Datenzustand (useTasks), Filter und die Komponenten.
// Die Komponenten selbst sprechen nicht mit dem Backend.
import { computed, onMounted, ref } from 'vue'
import TaskStats from '@/components/TaskStats.vue'
import TaskToolbar from '@/components/TaskToolbar.vue'
import TaskList from '@/components/TaskList.vue'
import TaskFormDialog from '@/components/TaskFormDialog.vue'
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog.vue'
import ToastRegion from '@/components/ToastRegion.vue'
import { useTasks } from '@/composables/useTasks'
import { useToasts } from '@/composables/useToasts'
import { errorMessage } from '@/api/tasks'
import type { Task, TaskFilters, TaskInput } from '@/types/task'
import { computeStats, filterTasks, sortTasks, todayIso } from '@/utils/taskView'

const { tasks, loading, loadError, busyIds, load, create, update, setStatus, remove } = useTasks()
const { toasts, show: showToast, dismiss } = useToasts()

const DEFAULT_FILTERS: TaskFilters = {
  query: '',
  status: 'ALL',
  priority: 'ALL',
  sort: 'CREATED_DESC',
}
const filters = ref<TaskFilters>({ ...DEFAULT_FILTERS })
const today = ref(todayIso())
const actionError = ref('')

const stats = computed(() => computeStats(tasks.value, today.value))
const visibleTasks = computed(() =>
  sortTasks(filterTasks(tasks.value, filters.value, today.value), filters.value.sort),
)
const filtersActive = computed(
  () =>
    filters.value.query.trim() !== '' ||
    filters.value.status !== 'ALL' ||
    filters.value.priority !== 'ALL',
)

function resetFilters() {
  filters.value = { ...DEFAULT_FILTERS, sort: filters.value.sort }
}

// ---------- Formular (Erstellen / Bearbeiten) ----------
const formOpen = ref(false)
const editing = ref<Task | null>(null)

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(task: Task) {
  editing.value = task
  formOpen.value = true
}

async function submitForm(input: TaskInput) {
  if (editing.value) {
    const saved = await update(editing.value.id, input)
    showToast(`Änderungen an „${saved.title}“ gespeichert.`)
  } else {
    const saved = await create(input)
    showToast(`Aufgabe „${saved.title}“ angelegt.`)
  }
  formOpen.value = false
}

// ---------- Statuswechsel ----------
async function toggle(task: Task) {
  actionError.value = ''
  try {
    const updated = await setStatus(task, task.status === 'DONE' ? 'OPEN' : 'DONE')
    if (updated) {
      showToast(
        updated.status === 'DONE'
          ? `„${updated.title}“ erledigt.`
          : `„${updated.title}“ wieder geöffnet.`,
      )
    }
  } catch (e) {
    actionError.value = `Status konnte nicht geändert werden: ${errorMessage(e)}`
  }
}

// ---------- Löschen ----------
const deleting = ref<Task | null>(null)
const deleteBusy = ref(false)
const deleteError = ref('')

function askDelete(task: Task) {
  deleteError.value = ''
  deleting.value = task
}

function cancelDelete() {
  if (!deleteBusy.value) deleting.value = null
}

async function confirmDelete() {
  const task = deleting.value
  if (!task || deleteBusy.value) return
  deleteBusy.value = true
  deleteError.value = ''
  try {
    await remove(task)
    deleting.value = null
    showToast(`Aufgabe „${task.title}“ gelöscht.`)
  } catch (e) {
    deleteError.value = `Löschen fehlgeschlagen: ${errorMessage(e)}`
  } finally {
    deleteBusy.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div class="page-header__inner">
        <div class="brand">
          <svg viewBox="0 0 32 32" width="36" height="36" aria-hidden="true" class="brand__logo">
            <rect width="32" height="32" rx="8" fill="currentColor" />
            <path
              d="M9 16.5l4.5 4.5L23 11.5"
              fill="none"
              stroke="#fff"
              stroke-width="3"
              stroke-linecap="round"
            />
          </svg>
          <div>
            <h1 class="brand__name">Studienaufgaben</h1>
            <p class="brand__tagline">
              Abgaben, Lernziele und Termine für dein Semester an einem Ort.
            </p>
          </div>
        </div>
        <button
          id="new-task-button"
          type="button"
          class="button button--primary"
          @click="openCreate"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
          Neue Aufgabe
        </button>
      </div>
    </header>

    <main class="page-main" aria-labelledby="task-list-heading">
      <TaskStats :stats="stats" />

      <TaskToolbar
        v-model="filters"
        :result-count="visibleTasks.length"
        :total="tasks.length"
        :filters-active="filtersActive"
        @reset="resetFilters"
      />

      <section class="list-section">
        <h2 id="task-list-heading" class="visually-hidden" tabindex="-1">Aufgabenliste</h2>

        <p v-if="actionError" class="alert alert--error" role="alert">{{ actionError }}</p>

        <div v-if="loading && tasks.length === 0" class="loading" role="status">
          <span class="spinner" aria-hidden="true"></span>
          Aufgaben werden geladen …
        </div>

        <div v-else-if="loadError" class="alert alert--error load-error" role="alert">
          <div>
            <strong>Die Aufgaben konnten nicht geladen werden.</strong>
            <p>{{ loadError }}</p>
          </div>
          <button type="button" class="button button--secondary" :disabled="loading" @click="load">
            Erneut versuchen
          </button>
        </div>

        <TaskList
          v-else
          :tasks="visibleTasks"
          :total-count="tasks.length"
          :today="today"
          :busy-ids="busyIds"
          @toggle="toggle"
          @edit="openEdit"
          @delete="askDelete"
          @create="openCreate"
          @reset-filters="resetFilters"
        />
      </section>
    </main>

    <TaskFormDialog
      :open="formOpen"
      :task="editing"
      :submit="submitForm"
      @close="formOpen = false"
    />
    <ConfirmDeleteDialog
      :open="deleting !== null"
      :task-title="deleting?.title ?? ''"
      :busy="deleteBusy"
      :error="deleteError"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
    <ToastRegion :toasts="toasts" @dismiss="dismiss" />
  </div>
</template>

<style scoped>
.page-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.page-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 1.5rem;
  flex-wrap: wrap;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 1.25rem 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.brand__logo {
  flex-shrink: 0;
  color: var(--color-accent);
}

.brand__name {
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.brand__tagline {
  margin: 0.15rem 0 0;
  color: var(--color-muted);
  font-size: 0.95rem;
}

.page-main {
  display: grid;
  gap: 1rem;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 1.25rem 1rem 4rem;
}

.list-section {
  display: grid;
  gap: 0.75rem;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 2.5rem 1rem;
  color: var(--color-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.load-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
}

.load-error p {
  margin: 0.2rem 0 0;
}

@media (max-width: 560px) {
  #new-task-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
