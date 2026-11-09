<script setup lang="ts">
// Liste aller Tasks. Lädt die Tasks beim Start, speichert das Abhaken (done) per PUT
// und bindet das Formular TaskForm ein, mit dem man Tasks bearbeitet oder neu anlegt.
import { ref, onMounted } from 'vue'
import TaskForm from './TaskForm.vue'
import { ApiError, fetchTasks, updateTask } from '@/api/tasks'
import type { Task } from '@/api/tasks'

// Alle Tasks, die gerade in der Liste stehen
const tasks = ref<Task[]>([])
// Fehlertext für die Anzeige über der Liste (leer = kein Fehler)
const error = ref('')
// Der Task, der gerade im Formular bearbeitet wird. null = Formular im Modus "Neuer Task".
const editingTask = ref<Task | null>(null)

// Macht aus einem Fehler einen lesbaren Text. ApiError enthält schon einen deutschen Text.
function toMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Unbekannter Fehler.'
}

// Lädt alle Tasks vom Backend neu. Bei Fehler erscheint die Meldung über der Liste.
async function loadTasks() {
  try {
    tasks.value = await fetchTasks()
    error.value = ''
  } catch (e) {
    error.value = toMessage(e)
  }
}

// Läuft, wenn die Checkbox eines Tasks geklickt wird. Speichert den neuen done-Wert per PUT.
// Schlägt das Speichern fehl, springt die Checkbox auf den alten Wert zurück.
async function onToggle(task: Task, event: Event) {
  // Die Checkbox, die das Event ausgelöst hat. Daran lesen wir den neuen Haken-Zustand ab.
  const checkbox = event.target as HTMLInputElement
  try {
    const updated = await updateTask(task.id, {
      name: task.name,
      // description kann im Backend null sein, PUT erwartet aber einen Text
      description: task.description ?? '',
      done: checkbox.checked,
    })
    // Den alten Task durch die Antwort des Backends ersetzen (über die id gefunden)
    tasks.value = tasks.value.map((t) => (t.id === updated.id ? updated : t))
    error.value = ''
  } catch (e) {
    // Haken zurücksetzen, weil die Änderung nicht gespeichert wurde
    checkbox.checked = task.done
    error.value = toMessage(e)
  }
}

// Öffnet das Formular im Bearbeiten-Modus mit diesem Task
function editTask(task: Task) {
  editingTask.value = task
}

// Läuft, wenn das Formular erfolgreich gespeichert hat. Schließt den Bearbeiten-Modus
// und lädt die Liste neu, damit die neuen Werte sichtbar sind.
async function onSaved() {
  editingTask.value = null
  await loadTasks()
}

// Beim Einbau der Komponente die Tasks laden
onMounted(loadTasks)
</script>

<template>
  <section>
    <h2>Meine Tasks</h2>
    <!-- Fehlermeldung, z. B. wenn das Backend nicht erreichbar ist -->
    <p v-if="error" class="list-error" role="alert">{{ error }}</p>
    <!-- :task bestimmt den Modus des Formulars: ohne Task "Neuer Task", mit Task "Bearbeiten" -->
    <TaskForm :task="editingTask" @saved="onSaved" @cancel="editingTask = null" />
    <ul>
      <li v-for="task in tasks" :key="task.id" :class="{ done: task.done }">
        <!-- :checked zeigt den gespeicherten Wert, @change speichert eine Änderung per PUT -->
        <input type="checkbox" :checked="task.done" @change="onToggle(task, $event)" />
        <strong>{{ task.name }}</strong>
        <button type="button" class="edit" @click="editTask(task)">Bearbeiten</button>
        <p class="description">{{ task.description }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

p {
  margin: 0.25rem 0 0 1.5rem;
  font-size: 0.9rem;
}

.done {
  text-decoration: line-through;
  opacity: 0.6;
}

.list-error {
  color: red;
}
</style>
