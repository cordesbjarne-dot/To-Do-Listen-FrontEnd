<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { api, localDay, overdue, priorities, select, type Draft, type Task } from '../tasks'
import TaskEditor from './TaskEditor.vue'
const tasks = ref<Task[]>([]),
  query = ref(''),
  status = ref(''),
  priority = ref(''),
  sort = ref('neu')
const loading = ref(false),
  busy = ref(false),
  failed = ref(false),
  error = ref(''),
  notice = ref('')
const editor = ref(false),
  current = ref<Task | null>(null),
  deleting = ref<Task | null>(null)
const confirmDialog = ref<HTMLDialogElement>(),
  newButton = ref<HTMLButtonElement>()
let trigger: HTMLElement | null = null
const today = ref(localDay())
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  void load()
  timer = setInterval(() => (today.value = localDay()), 30000)
})
onUnmounted(() => clearInterval(timer))
const visible = computed(() =>
  select(tasks.value, query.value, status.value, priority.value, sort.value),
)
const counts = computed(() => [
  tasks.value.length,
  tasks.value.filter((t) => t.status === 'offen').length,
  tasks.value.filter((t) => t.status === 'erledigt').length,
  tasks.value.filter((t) => overdue(t, today.value)).length,
])
async function load() {
  if (loading.value || busy.value) return
  loading.value = true
  failed.value = false
  error.value = ''
  try {
    tasks.value = await api.list()
  } catch (e) {
    failed.value = true
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
function clearFilters() {
  query.value = ''
  status.value = ''
  priority.value = ''
}
function remember() {
  trigger = document.activeElement as HTMLElement
  error.value = ''
  notice.value = ''
}
function edit(task: Task | null) {
  remember()
  current.value = task
  editor.value = true
}
async function confirm(task: Task) {
  remember()
  deleting.value = task
  await nextTick()
  confirmDialog.value?.showModal()
}
async function close() {
  editor.value = false
  deleting.value = null
  error.value = ''
  await nextTick()
  ;(trigger?.isConnected ? trigger : newButton.value)?.focus()
}
async function mutate(action: () => Promise<void>, message: string) {
  if (busy.value || loading.value) return
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await action()
    notice.value = message
    if (editor.value || deleting.value) await close()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
function save(draft: Draft, id?: number) {
  return mutate(async () => {
    const saved = await api.save(draft, id)
    tasks.value =
      id == null ? [...tasks.value, saved] : tasks.value.map((t) => (t.id === id ? saved : t))
  }, 'Aufgabe gespeichert.')
}
function remove(task: Task) {
  return mutate(async () => {
    await api.remove(task.id)
    tasks.value = tasks.value.filter((t) => t.id !== task.id)
  }, 'Aufgabe gelöscht.')
}
function dateText(s: string) {
  return s.split('-').reverse().join('.')
}
</script>
<template>
  <main>
    <header>
      <div>
        <h1>Studienplaner</h1>
        <p>Die gemeinsame Aufgabenliste für dein Studium.</p>
      </div>
      <button ref="newButton" class="primary" :disabled="busy || loading" @click="edit(null)">
        ＋ Neue Aufgabe
      </button>
    </header>
    <section aria-label="Kennzahlen" class="metrics">
      <div v-for="(label, i) in ['Alle Aufgaben', 'Offen', 'Erledigt', 'Überfällig']" :key="label">
        <span>{{ label }}</span
        ><strong>{{ loading || failed ? '–' : counts[i] }}</strong>
      </div>
    </section>
    <section class="board">
      <h2>Aufgabenübersicht</h2>
      <div class="tools">
        <label
          >Suche<input type="search" v-model="query" placeholder="Titel oder Beschreibung"
        /></label>
        <label
          >Status<select aria-label="Status" v-model="status">
            <option value="">Alle Status</option>
            <option>offen</option>
            <option>erledigt</option>
          </select></label
        >
        <label
          >Priorität<select aria-label="Priorität" v-model="priority">
            <option value="">Alle Prioritäten</option>
            <option v-for="p in priorities" :key="p">{{ p }}</option>
          </select></label
        >
        <label
          >Sortierung<select aria-label="Sortierung" v-model="sort">
            <option value="neu">Neueste zuerst</option>
            <option value="frist">Früheste Fälligkeit</option>
            <option value="priorität">Höchste Priorität</option>
          </select></label
        >
      </div>
      <p role="status">{{ notice }}</p>
      <p v-if="error && !editor && !deleting" role="alert">{{ error }}</p>
      <p v-if="loading">Aufgaben werden geladen …</p>
      <button v-else-if="failed" @click="load">Erneut laden</button>
      <template v-else
        ><p class="hits">{{ visible.length }} Treffer</p>
        <p v-if="!tasks.length">Deine Liste ist leer. Lege oben deine erste Aufgabe an.</p>
        <p v-else-if="!visible.length">
          Keine passenden Aufgaben.
          <button
            @click="clearFilters"
          >
            Filter zurücksetzen
          </button>
        </p>
        <article v-for="t in visible" :key="t.id">
          <div class="itemhead">
            <h3>{{ t.name }}</h3>
            <span class="pill" :class="t.priority">Priorität {{ t.priority }}</span>
          </div>
          <p v-if="t.description" class="description">{{ t.description }}</p>
          <div class="meta">
            <b>{{ t.status }}</b
            ><span :class="{ late: overdue(t, today) }">{{
              t.dueDate
                ? (overdue(t, today) ? 'Überfällig · ' : 'Fällig · ') + dateText(t.dueDate)
                : 'Ohne Termin'
            }}</span>
          </div>
          <div class="actions">
            <button
              :disabled="busy"
              @click="save({ ...t, status: t.status === 'offen' ? 'erledigt' : 'offen' }, t.id)"
            >
              {{ t.status === 'offen' ? 'Abschließen' : 'Wieder öffnen' }}</button
            ><button :disabled="busy" @click="edit(t)">Bearbeiten</button
            ><button :disabled="busy" @click="confirm(t)">Löschen</button>
          </div>
        </article></template
      >
    </section>
    <TaskEditor
      v-if="editor"
      :task="current"
      :busy="busy"
      :error="error"
      @save="save($event, current?.id)"
      @close="close"
    />
    <dialog
      v-if="deleting"
      ref="confirmDialog"
      aria-labelledby="delete-title"
      @cancel.prevent="!busy && close()"
    >
      <h2 id="delete-title">Aufgabe löschen?</h2>
      <p>„{{ deleting.name }}“ endgültig löschen?</p>
      <p v-if="error" role="alert">{{ error }}</p>
      <footer>
        <button autofocus :disabled="busy" @click="close">Abbrechen</button
        ><button class="danger" :disabled="busy" @click="remove(deleting)">
          Endgültig löschen
        </button>
      </footer>
    </dialog>
  </main>
</template>
