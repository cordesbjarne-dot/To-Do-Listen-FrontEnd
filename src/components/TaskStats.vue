<script setup lang="ts">
// Kompakte Kennzahlen über die gesamte geladene Liste (nicht über die Filtertreffer).
import type { TaskStats } from '@/utils/taskView'

defineProps<{ stats: TaskStats }>()
</script>

<template>
  <section aria-label="Kennzahlen" class="stats">
    <dl class="stats__grid">
      <div class="stat">
        <dt>Alle</dt>
        <dd>{{ stats.total }}</dd>
      </div>
      <div class="stat">
        <dt>Offen</dt>
        <dd>{{ stats.open }}</dd>
      </div>
      <div class="stat stat--done">
        <dt>Erledigt</dt>
        <dd>{{ stats.done }}</dd>
      </div>
      <div class="stat" :class="{ 'stat--alert': stats.overdue > 0 }">
        <dt>Überfällig</dt>
        <dd>{{ stats.overdue }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.stats__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.stat {
  padding: 0.85rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.stat dt {
  font-size: 0.85rem;
  color: var(--color-muted);
  font-weight: 500;
}

.stat dd {
  margin: 0.15rem 0 0;
  font-size: 1.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.stat--done dd {
  color: var(--color-accent);
}

.stat--alert {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
}

.stat--alert dd {
  color: var(--color-danger);
}

@media (max-width: 560px) {
  .stats__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
