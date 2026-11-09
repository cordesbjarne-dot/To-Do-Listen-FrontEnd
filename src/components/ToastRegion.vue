<script setup lang="ts">
// Bereich für Erfolgsmeldungen. aria-live sorgt dafür, dass Screenreader sie vorlesen.
import type { Toast } from '@/composables/useToasts'

defineProps<{ toasts: Toast[] }>()
const emit = defineEmits<{ dismiss: [id: number] }>()
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <div v-for="toast in toasts" :key="toast.id" class="toast">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" class="toast__icon">
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        />
      </svg>
      <span class="toast__text">{{ toast.message }}</span>
      <button
        type="button"
        class="icon-button icon-button--small"
        aria-label="Meldung schließen"
        @click="emit('dismiss', toast.id)"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 20;
  display: grid;
  gap: 0.5rem;
  width: min(380px, calc(100vw - 2rem));
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 0.75rem 0.7rem 0.9rem;
  background: var(--color-toast);
  color: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  animation: toast-in 0.18s ease-out;
}

.toast__icon {
  flex-shrink: 0;
  color: #7ee0c9;
}

.toast__text {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 0.95rem;
}

.toast .icon-button {
  color: #d7e4e3;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .toast {
    animation: none;
  }
}
</style>
