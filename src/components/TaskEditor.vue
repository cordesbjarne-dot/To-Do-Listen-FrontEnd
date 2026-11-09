<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { blank, priorities, type Draft, type Task } from '../tasks'
const props = defineProps<{ task: Task | null; busy: boolean; error: string }>()
const emit = defineEmits<{ save: [Draft]; close: [] }>()
const draft = ref<Draft>(
  props.task
    ? {
        ...blank(),
        name: props.task.name,
        description: props.task.description || '',
        priority: props.task.priority,
        status: props.task.status,
        dueDate: props.task.dueDate,
      }
    : blank(),
)
const dialog = ref<HTMLDialogElement>()
const invalid = ref('')
onMounted(() => dialog.value?.showModal())
function submit() {
  if (!draft.value.name.trim()) {
    invalid.value = 'Bitte gib einen Titel ein.'
    return
  }
  emit('save', {
    ...draft.value,
    name: draft.value.name.trim(),
    dueDate: draft.value.dueDate || null,
  })
}
</script>
<template>
  <dialog ref="dialog" aria-labelledby="editor-title" @cancel.prevent="!busy && emit('close')">
    <form @submit.prevent="submit">
      <h2 id="editor-title">{{ task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe' }}</h2>
      <fieldset :disabled="busy">
        <label>Titel<input v-model="draft.name" autofocus required maxlength="120" /></label>
        <label
          >Beschreibung<textarea v-model="draft.description" rows="4" maxlength="2000" />
        </label>
        <div class="pair">
          <label
            >Priorität<select v-model="draft.priority">
              <option v-for="p in priorities" :key="p">{{ p }}</option>
            </select></label
          >
          <label>Fälligkeit<input v-model="draft.dueDate" type="date" /></label>
        </div>
        <label
          >Status<select v-model="draft.status">
            <option>offen</option>
            <option>erledigt</option>
          </select></label
        >
        <p v-if="invalid || error" role="alert">{{ error || invalid }}</p>
        <footer>
          <button type="button" @click="emit('close')">Abbrechen</button
          ><button class="primary">Speichern</button>
        </footer>
      </fieldset>
    </form>
  </dialog>
</template>
