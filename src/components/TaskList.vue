<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Entspricht der Klasse Task.java im Backend
interface Task {
  name: string
  description: string
  done: boolean
}

const tasks = ref<Task[]>([])

onMounted(async () => {
  // 1. Anfrage an das Backend schicken
  const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/todos`)
  // 2. JSON aus der Response holen
  const data: Task[] = await response.json()
  // 3. Ergebnis in tasks speichern
  tasks.value = data
})
</script>

<template>
  <section>
    <h2>Meine Tasks</h2>
    <ul>
      <li v-for="task in tasks" :key="task.name" :class="{ done: task.done }">
        <input type="checkbox" v-model="task.done" />
        <strong>{{ task.name }}</strong>
        <p>{{ task.description }}</p>
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
</style>
