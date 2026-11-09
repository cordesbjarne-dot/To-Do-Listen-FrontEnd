<script setup lang="ts">
// Formular zum Erstellen (task = null) oder Bearbeiten (task = ein bestehender Task) eines Tasks.
// Der Eltern-Komponente wird über das Event "saved" der gespeicherte Task gemeldet,
// über "cancel" der Wunsch, das Bearbeiten abzubrechen.
import { ref, watch } from 'vue'
import { ApiError, createTask, updateTask } from '@/api/tasks'
import type { Task, TaskInput } from '@/api/tasks'

// Eingabe: der Task zum Bearbeiten, oder null für "neuer Task"
const props = defineProps<{
  task: Task | null
}>()

// Ausgaben: "saved" nach erfolgreichem Speichern, "cancel" beim Abbrechen
const emit = defineEmits<{
  saved: [task: Task]
  cancel: []
}>()

// Werte, die der Nutzer im Formular sieht und ändert
const name = ref('')
const description = ref('')
const done = ref(false)
// Fehlertext für die Anzeige im Formular (leer = kein Fehler)
const error = ref('')
// true, solange gerade gespeichert wird (sperrt den Button gegen Doppelklicks)
const saving = ref(false)

// Füllt die Felder mit den Werten des Tasks. Ohne Task (null) bleiben sie leer.
function fillFields(task: Task | null) {
  name.value = task?.name ?? ''
  // description kann im Backend null sein, im Formular brauchen wir einen Text
  description.value = task?.description ?? ''
  done.value = task?.done ?? false
  error.value = ''
}

// Leert die Felder nach dem Erstellen, damit man direkt den nächsten Task eingeben kann.
function resetFields() {
  fillFields(null)
}

// Läuft sofort beim Einbau und jedes Mal, wenn ein anderer Task übergeben wird.
watch(
  () => props.task,
  (task) => fillFields(task),
  { immediate: true },
)

// Prüft die Eingabe und speichert: neuer Task per POST, vorhandener per PUT.
async function submit() {
  // Ein zweites Absenden während des Speicherns wird ignoriert (Schutz vor Doppelklick)
  if (saving.value) return
  error.value = ''

  // Leerer oder nur aus Leerzeichen bestehender Name wird schon hier abgefangen
  if (name.value.trim() === '') {
    error.value = 'Der Name darf nicht leer sein.'
    return
  }

  saving.value = true
  // trim() entfernt Leerzeichen am Anfang und Ende, bevor wir den Namen schicken
  const input: TaskInput = {
    name: name.value.trim(),
    description: description.value,
    done: done.value,
  }

  try {
    // Mit Task: bestehenden Task ändern. Ohne Task: neuen Task anlegen.
    const saved = props.task ? await updateTask(props.task.id, input) : await createTask(input)
    emit('saved', saved)
    // Nach dem Erstellen Formular leeren; beim Bearbeiten bleibt die Eingabe stehen
    if (!props.task) resetFields()
  } catch (e) {
    // ApiError enthält schon einen lesbaren Text, alles andere ist unerwartet
    error.value = e instanceof ApiError ? e.message : 'Unbekannter Fehler.'
  } finally {
    // Wird immer ausgeführt, egal ob Erfolg oder Fehler, damit der Button wieder frei ist
    saving.value = false
  }
}
</script>

<template>
  <!-- @submit.prevent: Das Absenden löst keinen Seiten-Neuladen aus, sondern ruft submit() auf -->
  <form @submit.prevent="submit">
    <h3>{{ task ? 'Task bearbeiten' : 'Neuer Task' }}</h3>

    <div>
      <label for="task-name">Name</label>
      <input id="task-name" type="text" v-model="name" maxlength="255" />
    </div>

    <div>
      <label for="task-description">Beschreibung</label>
      <textarea id="task-description" v-model="description" maxlength="255"></textarea>
    </div>

    <div>
      <input id="task-done" type="checkbox" v-model="done" />
      <label for="task-done">Erledigt</label>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div>
      <button type="submit" :disabled="saving">{{ task ? 'Speichern' : 'Erstellen' }}</button>
      <!-- Abbrechen gibt es nur beim Bearbeiten, beim Erstellen gibt es nichts abzubrechen -->
      <button v-if="task" type="button" class="cancel" @click="emit('cancel')">Abbrechen</button>
    </div>
  </form>
</template>

<style scoped>
div {
  margin-bottom: 0.5rem;
}

.error {
  color: red;
}
</style>
