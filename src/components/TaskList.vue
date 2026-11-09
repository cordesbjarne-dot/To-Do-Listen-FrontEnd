<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Task {
  id: number
  name: string
  description: string
  done: boolean
}

const tasks = ref<Task[]>([])
const editingId = ref<number | null>(null)
const name = ref('')
const description = ref('')
const done = ref(false)
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const baseUrl = (import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

function reset() {
  editingId.value = null
  name.value = ''
  description.value = ''
  done.value = false
}

function edit(task: Task) {
  editingId.value = task.id
  name.value = task.name
  description.value = task.description ?? ''
  done.value = task.done
  error.value = ''
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${baseUrl}/todos`)
    if (!response.ok) throw new Error()
    tasks.value = await response.json()
  } catch {
    error.value = 'Tasks konnten nicht geladen werden. Bitte prüfe die Backend-Verbindung.'
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!name.value.trim() || saving.value) return
  saving.value = true
  error.value = ''
  const id = editingId.value
  try {
    const response = await fetch(`${baseUrl}/todos${id === null ? '' : `/${id}`}`, {
      method: id === null ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value.trim(), description: description.value, done: done.value }),
    })
    if (!response.ok) throw new Error()
    const saved: Task = await response.json()
    if (id === null) tasks.value.push(saved)
    else tasks.value = tasks.value.map(task => task.id === id ? saved : task)
    reset()
  } catch {
    error.value = 'Speichern fehlgeschlagen. Deine Eingaben bleiben erhalten. Bitte versuche es erneut.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="tasks">
    <h1>Meine Tasks</h1>
    <p>Aufgaben festhalten, bearbeiten und erledigen.</p>

    <form @submit.prevent="save">
      <h2>{{ editingId === null ? 'Neue Aufgabe' : 'Aufgabe bearbeiten' }}</h2>
      <fieldset :disabled="saving">
        <label for="task-name">Name</label>
        <input id="task-name" v-model="name" required maxlength="255" placeholder="Was steht an?" />
        <label for="task-description">Beschreibung</label>
        <textarea id="task-description" v-model="description" maxlength="255" rows="3" placeholder="Weitere Details (optional)" />
        <label class="status"><input v-model="done" type="checkbox" /> Erledigt</label>
        <div class="actions">
          <button type="submit" :disabled="!name.trim()">{{ saving ? 'Wird gespeichert …' : editingId === null ? 'Task erstellen' : 'Änderungen speichern' }}</button>
          <button v-if="editingId !== null" type="button" class="secondary" @click="reset">Abbrechen</button>
        </div>
      </fieldset>
    </form>

    <p v-if="error" role="alert" class="error">{{ error }}</p>
    <p v-if="loading" role="status">Tasks werden geladen …</p>
    <template v-else>
      <div class="list-heading">
        <h2>Deine Aufgaben ({{ tasks.length }})</h2>
        <button class="secondary" :disabled="saving" @click="load">Aktualisieren</button>
      </div>
      <p v-if="!tasks.length">Noch keine Aufgaben geladen. Erstelle oben deinen ersten Task.</p>
      <ul>
        <li v-for="task in tasks" :key="task.id">
          <div>
            <strong :class="{ done: task.done }">{{ task.name }}</strong>
            <span class="badge">{{ task.done ? 'Erledigt' : 'Offen' }}</span>
            <p v-if="task.description" class="description">{{ task.description }}</p>
          </div>
          <button class="secondary" :disabled="saving" :aria-label="`${task.name} bearbeiten`" @click="edit(task)">Bearbeiten</button>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.tasks { width: 100%; max-width: 680px; margin: 0 auto; padding: 1rem; }
h1 { font-size: 2rem; font-weight: 700; }
h2 { font-size: 1.2rem; font-weight: 600; }
form { margin: 1.5rem 0; padding: 1.25rem; border: 1px solid var(--color-border); border-radius: 12px; }
fieldset { border: 0; padding: 0; margin-top: 1rem; min-width: 0; }
label { display: block; margin: .75rem 0 .3rem; }
input:not([type=checkbox]), textarea { width: 100%; padding: .7rem; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-background); color: var(--color-text); font: inherit; }
textarea { resize: vertical; }
.status, .actions, .list-heading { display: flex; align-items: center; gap: .75rem; }
.actions { margin-top: 1rem; flex-wrap: wrap; }
.list-heading { justify-content: space-between; }
button { padding: .6rem .9rem; border: 1px solid transparent; border-radius: 6px; background: #187653; color: white; font: inherit; cursor: pointer; }
button.secondary { background: var(--color-background); color: var(--color-text); border-color: var(--color-border); }
button:disabled { opacity: .55; cursor: not-allowed; }
ul { list-style: none; padding: 0; }
li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid var(--color-border); }
li > div { min-width: 0; overflow-wrap: anywhere; }
.badge { display: inline-block; font-size: .75rem; margin-left: .6rem; opacity: .75; }
.description { white-space: pre-wrap; margin-top: .3rem; }
.done { text-decoration: line-through; opacity: .65; }
.error { color: #c43b36; margin: 1rem 0; }
</style>
