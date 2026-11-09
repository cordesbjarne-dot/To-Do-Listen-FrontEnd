<script setup lang="ts">
// Formular zum Erstellen (task = null) und Bearbeiten (task gesetzt) einer Aufgabe.
// Das Formular prüft die Eingaben selbst und ruft dann "submit" auf. Schlägt das Speichern
// fehl, bleibt der Dialog offen und alle Eingaben bleiben erhalten.
import { computed, nextTick, reactive, ref, watch } from 'vue'
import BaseDialog from './BaseDialog.vue'
import { ApiError, errorMessage } from '@/api/tasks'
import {
  DESCRIPTION_MAX,
  PRIORITY_LABELS,
  TITLE_MAX,
  type Task,
  type TaskInput,
  type TaskPriority,
} from '@/types/task'

const props = defineProps<{
  open: boolean
  task: Task | null
  /** Speichert die Eingabe; wirft bei Fehlern (z. B. ApiError) */
  submit: (input: TaskInput) => Promise<void>
}>()

const emit = defineEmits<{ close: [] }>()

const form = reactive({
  title: '',
  description: '',
  priority: 'MEDIUM' as TaskPriority,
  dueDate: '',
})
const errors = reactive<{ title: string; description: string; dueDate: string }>({
  title: '',
  description: '',
  dueDate: '',
})
const formError = ref('')
const saving = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)
const descriptionInput = ref<HTMLTextAreaElement | null>(null)

const isEdit = computed(() => props.task !== null)
const priorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW']

function clearErrors() {
  errors.title = ''
  errors.description = ''
  errors.dueDate = ''
  formError.value = ''
}

// Beim Öffnen die Felder füllen (Bearbeiten) bzw. leeren (Neu)
watch(
  () => props.open,
  (open) => {
    if (!open) return
    const t = props.task
    form.title = t?.title ?? ''
    form.description = t?.description ?? ''
    form.priority = t?.priority ?? 'MEDIUM'
    form.dueDate = t?.dueDate ?? ''
    clearErrors()
  },
  { immediate: true },
)

function validate(): boolean {
  clearErrors()
  const title = form.title.trim()
  if (title === '') errors.title = 'Bitte gib einen Titel ein.'
  else if (title.length > TITLE_MAX)
    errors.title = `Der Titel darf höchstens ${TITLE_MAX} Zeichen lang sein.`
  if (form.description.length > DESCRIPTION_MAX)
    errors.description = `Die Beschreibung darf höchstens ${DESCRIPTION_MAX} Zeichen lang sein.`
  return !errors.title && !errors.description
}

async function focusFirstError() {
  await nextTick()
  if (errors.title) titleInput.value?.focus()
  else if (errors.description) descriptionInput.value?.focus()
}

async function onSubmit() {
  if (saving.value) return // Doppeltes Absenden verhindern
  if (!validate()) {
    await focusFirstError()
    return
  }
  saving.value = true
  try {
    await props.submit({
      title: form.title.trim(),
      description: form.description.trim() === '' ? null : form.description,
      priority: form.priority,
      dueDate: form.dueDate === '' ? null : form.dueDate,
    })
  } catch (e) {
    // Feldfehler vom Server an die passenden Felder hängen
    if (e instanceof ApiError) {
      for (const fe of e.fieldErrors) {
        if (fe.field === 'title' || fe.field === 'description' || fe.field === 'dueDate') {
          errors[fe.field] = fe.message
        }
      }
    }
    formError.value = `Speichern fehlgeschlagen: ${errorMessage(e)} Deine Eingaben bleiben erhalten.`
    await focusFirstError()
  } finally {
    saving.value = false
  }
}

function onClose() {
  if (!saving.value) emit('close')
}
</script>

<template>
  <BaseDialog :open="open" :title="isEdit ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'" @close="onClose">
    <form class="task-form" novalidate @submit.prevent="onSubmit">
      <div class="field">
        <label for="task-title">Titel <span class="required" aria-hidden="true">*</span></label>
        <input
          id="task-title"
          ref="titleInput"
          v-model="form.title"
          type="text"
          data-autofocus
          required
          autocomplete="off"
          :aria-invalid="errors.title ? 'true' : 'false'"
          :aria-describedby="errors.title ? 'task-title-error task-title-hint' : 'task-title-hint'"
        />
        <div class="field__meta">
          <p v-if="errors.title" id="task-title-error" class="field__error">{{ errors.title }}</p>
          <p
            id="task-title-hint"
            class="field__hint"
            :class="{ 'is-over': form.title.trim().length > TITLE_MAX }"
          >
            {{ form.title.trim().length }}/{{ TITLE_MAX }}
          </p>
        </div>
      </div>

      <div class="field">
        <label for="task-description">Beschreibung <span class="optional">(optional)</span></label>
        <textarea
          id="task-description"
          ref="descriptionInput"
          v-model="form.description"
          rows="4"
          :aria-invalid="errors.description ? 'true' : 'false'"
          :aria-describedby="
            errors.description
              ? 'task-description-error task-description-hint'
              : 'task-description-hint'
          "
        ></textarea>
        <div class="field__meta">
          <p v-if="errors.description" id="task-description-error" class="field__error">
            {{ errors.description }}
          </p>
          <p
            id="task-description-hint"
            class="field__hint"
            :class="{ 'is-over': form.description.length > DESCRIPTION_MAX }"
          >
            {{ form.description.length }}/{{ DESCRIPTION_MAX }}
          </p>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="task-priority">Priorität</label>
          <select id="task-priority" v-model="form.priority">
            <option v-for="p in priorities" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</option>
          </select>
        </div>
        <div class="field">
          <label for="task-due">Fällig am <span class="optional">(optional)</span></label>
          <input
            id="task-due"
            v-model="form.dueDate"
            type="date"
            :aria-invalid="errors.dueDate ? 'true' : 'false'"
            :aria-describedby="errors.dueDate ? 'task-due-error' : undefined"
          />
          <p v-if="errors.dueDate" id="task-due-error" class="field__error">{{ errors.dueDate }}</p>
        </div>
      </div>

      <p v-if="formError" class="alert alert--error" role="alert">{{ formError }}</p>

      <div class="form-actions">
        <button type="button" class="button button--secondary" :disabled="saving" @click="onClose">
          Abbrechen
        </button>
        <button type="submit" class="button button--primary" :disabled="saving" :aria-busy="saving">
          {{ saving ? 'Wird gespeichert …' : isEdit ? 'Änderungen speichern' : 'Aufgabe anlegen' }}
        </button>
      </div>
    </form>
  </BaseDialog>
</template>

<style scoped>
.task-form {
  display: grid;
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.field label {
  font-weight: 600;
  font-size: 0.95rem;
}

.required {
  color: var(--color-danger);
}

.optional {
  font-weight: 400;
  color: var(--color-muted);
}

.field-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.field__meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.field__hint {
  margin: 0 0 0 auto;
  font-size: 0.8rem;
  color: var(--color-muted);
  font-variant-numeric: tabular-nums;
}

.field__hint.is-over {
  color: var(--color-danger);
  font-weight: 600;
}

.field__error {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-danger);
  font-weight: 500;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.25rem;
}
</style>
