<script setup lang="ts">
// Suche, Status- und Prioritätsfilter sowie Sortierung.
// Die Werte werden per v-model an die View gegeben; hier wird nichts gespeichert.
import type { TaskFilters } from '@/types/task'

const filters = defineModel<TaskFilters>({ required: true })

defineProps<{
  resultCount: number
  total: number
  filtersActive: boolean
}>()

const emit = defineEmits<{ reset: [] }>()

function update<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) {
  filters.value = { ...filters.value, [key]: value }
}
</script>

<template>
  <section class="toolbar" aria-label="Suchen, filtern und sortieren">
    <div class="toolbar__search">
      <label for="task-search" class="visually-hidden">Aufgaben durchsuchen</label>
      <svg
        class="toolbar__search-icon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
        <path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <input
        id="task-search"
        type="search"
        placeholder="Titel oder Beschreibung durchsuchen"
        :value="filters.query"
        @input="update('query', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <div class="toolbar__selects">
      <div class="select-field">
        <label for="filter-status">Status</label>
        <select
          id="filter-status"
          :value="filters.status"
          @change="
            update('status', ($event.target as HTMLSelectElement).value as TaskFilters['status'])
          "
        >
          <option value="ALL">Alle</option>
          <option value="OPEN">Offen</option>
          <option value="OVERDUE">Überfällig</option>
          <option value="DONE">Erledigt</option>
        </select>
      </div>
      <div class="select-field">
        <label for="filter-priority">Priorität</label>
        <select
          id="filter-priority"
          :value="filters.priority"
          @change="
            update(
              'priority',
              ($event.target as HTMLSelectElement).value as TaskFilters['priority'],
            )
          "
        >
          <option value="ALL">Alle</option>
          <option value="HIGH">Hoch</option>
          <option value="MEDIUM">Mittel</option>
          <option value="LOW">Niedrig</option>
        </select>
      </div>
      <div class="select-field">
        <label for="sort">Sortierung</label>
        <select
          id="sort"
          :value="filters.sort"
          @change="
            update('sort', ($event.target as HTMLSelectElement).value as TaskFilters['sort'])
          "
        >
          <option value="CREATED_DESC">Neueste zuerst</option>
          <option value="CREATED_ASC">Älteste zuerst</option>
          <option value="DUE_ASC">Fälligkeit (früheste zuerst)</option>
          <option value="PRIORITY_DESC">Priorität (hoch zuerst)</option>
        </select>
      </div>
    </div>

    <div class="toolbar__summary">
      <p class="toolbar__count" role="status" aria-live="polite" data-testid="result-count">
        {{
          resultCount === total
            ? `${total} ${total === 1 ? 'Aufgabe' : 'Aufgaben'}`
            : `${resultCount} von ${total} Aufgaben`
        }}
      </p>
      <button v-if="filtersActive" type="button" class="button button--link" @click="emit('reset')">
        Filter zurücksetzen
      </button>
    </div>
  </section>
</template>

<style scoped>
.toolbar {
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.toolbar__search {
  position: relative;
}

.toolbar__search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted);
  pointer-events: none;
}

.toolbar__search input {
  width: 100%;
  padding-left: 2.4rem;
}

.toolbar__selects {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.select-field {
  display: grid;
  gap: 0.3rem;
  min-width: 0;
}

.select-field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-muted);
}

.select-field select {
  width: 100%;
}

.toolbar__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 1.75rem;
}

.toolbar__count {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-muted);
}

@media (max-width: 640px) {
  .toolbar__selects {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
