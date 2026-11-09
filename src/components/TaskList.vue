<script setup lang="ts">
// Liste der (bereits gefilterten und sortierten) Aufgaben inklusive der beiden Leerzustände:
// 1. Es gibt überhaupt keine Aufgaben  2. Suche/Filter liefern keine Treffer.
import TaskItem from './TaskItem.vue'
import type { Task } from '@/types/task'

defineProps<{
  tasks: Task[]
  totalCount: number
  today: string
  busyIds: ReadonlySet<number>
}>()

const emit = defineEmits<{
  toggle: [task: Task]
  edit: [task: Task]
  delete: [task: Task]
  create: []
  resetFilters: []
}>()
</script>

<template>
  <div v-if="totalCount === 0" class="empty" data-testid="empty-state">
    <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" class="empty__icon">
      <rect
        x="8"
        y="6"
        width="32"
        height="38"
        rx="4"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      />
      <path
        d="M16 18h16M16 26h16M16 34h9"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      />
    </svg>
    <h3>Noch keine Aufgaben</h3>
    <p>Lege deine erste Aufgabe an, zum Beispiel eine Abgabe oder ein Lernziel für diese Woche.</p>
    <button type="button" class="button button--primary" @click="emit('create')">
      Erste Aufgabe anlegen
    </button>
  </div>

  <div v-else-if="tasks.length === 0" class="empty" data-testid="no-results">
    <h3>Keine passenden Aufgaben</h3>
    <p>
      Für deine Suche und Filter gibt es keine Treffer. Passe die Auswahl an oder setze sie zurück.
    </p>
    <button type="button" class="button button--secondary" @click="emit('resetFilters')">
      Filter zurücksetzen
    </button>
  </div>

  <ul v-else class="task-list">
    <TaskItem
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      :today="today"
      :busy="busyIds.has(task.id)"
      @toggle="emit('toggle', $event)"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
    />
  </ul>
</template>

<style scoped>
.task-list {
  display: grid;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.empty {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1.25rem;
  text-align: center;
  background: var(--color-surface);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
}

.empty__icon {
  color: var(--color-accent);
}

.empty h3 {
  margin: 0.25rem 0 0;
  font-size: 1.1rem;
}

.empty p {
  margin: 0 0 0.5rem;
  max-width: 42ch;
  color: var(--color-muted);
  line-height: 1.5;
}
</style>
