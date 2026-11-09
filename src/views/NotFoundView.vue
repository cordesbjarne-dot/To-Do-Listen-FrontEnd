<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="not-found">
    <h1 id="task-list-heading" tabindex="-1">Seite nicht gefunden</h1>
    <p>Diese Adresse gibt es in der Anwendung nicht.</p>
    <RouterLink class="button button--primary" to="/">Zur Aufgabenliste</RouterLink>
  </main>
</template>

<style scoped>
.not-found {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  max-width: 32rem;
  margin: 15vh auto 0;
  padding: 0 1rem;
  text-align: center;
}

.not-found h1 {
  margin: 0;
}

.not-found p {
  margin: 0 0 0.5rem;
  color: var(--color-muted);
}
</style>
