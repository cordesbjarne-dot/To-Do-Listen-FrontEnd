<script setup lang="ts">
// Eine Aufgabe in der Liste: Statusumschalter, Titel, Priorität, Fälligkeit und Aktionen.
// Status und Priorität stehen immer auch als Text da, nicht nur als Farbe.
import { computed, ref, watch } from 'vue'
import { PRIORITY_LABELS, STATUS_LABELS, type Task } from '@/types/task'
import { dueLabel, isOverdue } from '@/utils/taskView'

const props = defineProps<{
  task: Task
  today: string
  busy: boolean
}>()

const emit = defineEmits<{
  toggle: [task: Task]
  edit: [task: Task]
  delete: [task: Task]
}>()

const done = computed(() => props.task.status === 'DONE')
const overdue = computed(() => isOverdue(props.task, props.today))
const due = computed(() => dueLabel(props.task, props.today))
const isToday = computed(() => props.task.status === 'OPEN' && props.task.dueDate === props.today)

// Lange Beschreibungen werden gekürzt und lassen sich aufklappen
const LONG_DESCRIPTION = 220
const expanded = ref(false)
const isLong = computed(() => (props.task.description?.length ?? 0) > LONG_DESCRIPTION)
const checkboxId = computed(() => `task-done-${props.task.id}`)

// Der Haken folgt dem Klick sofort; während der Anfrage ist die Checkbox gesperrt (busy).
// Ist die Anfrage beendet, wird der Haken mit dem gespeicherten Status abgeglichen.
// Schlägt der Wechsel fehl, springt er so auf den alten Stand zurück.
const checkbox = ref<HTMLInputElement | null>(null)
watch(
  () => props.busy,
  (busy) => {
    if (!busy && checkbox.value) checkbox.value.checked = done.value
  },
)
</script>

<template>
  <li
    class="task"
    :class="{ 'task--done': done, 'task--overdue': overdue }"
    :data-testid="`task-${task.id}`"
  >
    <div class="task__check">
      <input
        :id="checkboxId"
        ref="checkbox"
        type="checkbox"
        class="checkbox"
        :checked="done"
        :disabled="busy"
        @change="emit('toggle', task)"
      />
      <label :for="checkboxId" class="visually-hidden">
        {{ done ? `„${task.title}“ wieder öffnen` : `„${task.title}“ als erledigt markieren` }}
      </label>
    </div>

    <div class="task__body">
      <h3 class="task__title">{{ task.title }}</h3>
      <p
        v-if="task.description"
        class="task__description"
        :class="{ 'is-clamped': isLong && !expanded }"
      >
        {{ task.description }}
      </p>
      <button
        v-if="isLong"
        type="button"
        class="button button--link task__more"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Weniger anzeigen' : 'Mehr anzeigen' }}
      </button>

      <ul class="task__meta" aria-label="Eigenschaften">
        <li class="badge" :class="`badge--status-${task.status.toLowerCase()}`">
          <span class="visually-hidden">Status: </span>{{ STATUS_LABELS[task.status] }}
        </li>
        <li class="badge" :class="`badge--priority-${task.priority.toLowerCase()}`">
          <span class="visually-hidden">Priorität: </span>
          <span aria-hidden="true" class="badge__dot"></span>{{ PRIORITY_LABELS[task.priority] }}
        </li>
        <li v-if="due" class="due" :class="{ 'due--overdue': overdue, 'due--today': isToday }">
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <rect
              x="3"
              y="5"
              width="18"
              height="16"
              rx="2"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M3 10h18M8 3v4M16 3v4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          {{ due }}
        </li>
      </ul>
    </div>

    <div class="task__actions">
      <button
        type="button"
        class="button button--secondary button--small"
        :disabled="busy"
        :aria-label="`„${task.title}“ bearbeiten`"
        @click="emit('edit', task)"
      >
        Bearbeiten
      </button>
      <button
        type="button"
        class="button button--ghost-danger button--small"
        :disabled="busy"
        :aria-label="`„${task.title}“ löschen`"
        @click="emit('delete', task)"
      >
        Löschen
      </button>
    </div>
  </li>
</template>

<style scoped>
.task {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: start;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid transparent;
  border-radius: var(--radius-md);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.task:hover {
  box-shadow: var(--shadow-sm);
}

.task--overdue {
  border-left-color: var(--color-danger);
}

.task__check {
  padding-top: 0.1rem;
}

.task__body {
  min-width: 0;
}

.task__title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.task--done .task__title {
  text-decoration: line-through;
  text-decoration-color: var(--color-muted);
  color: var(--color-muted);
}

.task__description {
  margin: 0.3rem 0 0;
  color: var(--color-text-soft);
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.task__description.is-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task__more {
  margin-top: 0.2rem;
}

.task__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0.6rem 0 0;
  padding: 0;
  list-style: none;
}

.due {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--color-muted);
}

.due--today {
  color: var(--color-warning-text);
  font-weight: 600;
}

.due--overdue {
  color: var(--color-danger);
  font-weight: 600;
}

.task__actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 640px) {
  .task {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .task__actions {
    grid-column: 2;
  }
}
</style>
