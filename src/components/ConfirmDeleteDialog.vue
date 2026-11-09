<script setup lang="ts">
// Sicherheitsabfrage vor dem Löschen. Nennt den Titel der Aufgabe.
// Der Fokus startet auf "Abbrechen", damit Enter nicht versehentlich löscht.
import BaseDialog from './BaseDialog.vue'

defineProps<{
  open: boolean
  taskTitle: string
  busy: boolean
  error: string
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()

function onClose() {
  emit('cancel')
}
</script>

<template>
  <BaseDialog :open="open" title="Aufgabe löschen?" @close="onClose">
    <p class="confirm-text">
      Möchtest du die Aufgabe <strong class="confirm-title">„{{ taskTitle }}“</strong> endgültig
      löschen? Das lässt sich nicht rückgängig machen.
    </p>
    <p v-if="error" class="alert alert--error" role="alert">{{ error }}</p>
    <div class="confirm-actions">
      <button
        type="button"
        class="button button--secondary"
        data-autofocus
        :disabled="busy"
        @click="onClose"
      >
        Abbrechen
      </button>
      <button
        type="button"
        class="button button--danger"
        :disabled="busy"
        :aria-busy="busy"
        @click="emit('confirm')"
      >
        {{ busy ? 'Wird gelöscht …' : 'Endgültig löschen' }}
      </button>
    </div>
  </BaseDialog>
</template>

<style scoped>
.confirm-text {
  margin: 0 0 1.25rem;
  line-height: 1.55;
}

.confirm-title {
  overflow-wrap: anywhere;
}

.confirm-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
}

.alert {
  margin-bottom: 1rem;
}
</style>
