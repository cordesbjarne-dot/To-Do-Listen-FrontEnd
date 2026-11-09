<script setup lang="ts">
// Modaler Dialog auf Basis des nativen <dialog>-Elements.
// Der Browser übernimmt dabei: Fokus bleibt im Dialog, Hintergrund ist nicht bedienbar,
// Escape löst das Event "cancel" aus. Wir ergänzen: Fokus beim Öffnen setzen und
// beim Schließen zum auslösenden Element zurückgeben.
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    /** CSS-Selektor für den Fokus, falls das auslösende Element nicht mehr existiert */
    fallbackFocus?: string
  }>(),
  { fallbackFocus: '#new-task-button' },
)

const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLDialogElement | null>(null)
const titleId = useId()
let returnFocusTo: HTMLElement | null = null

function focusFirst() {
  const el = dialog.value
  if (!el) return
  const target =
    el.querySelector<HTMLElement>('[data-autofocus]') ??
    el.querySelector<HTMLElement>('input, select, textarea, button')
  target?.focus()
}

function restoreFocus() {
  const target =
    // body zählt nicht: Safari fokussiert Buttons beim Klick nicht, dann wäre der Fokus "verloren"
    returnFocusTo && returnFocusTo.isConnected && returnFocusTo !== document.body
      ? returnFocusTo
      : document.querySelector<HTMLElement>(props.fallbackFocus)
  target?.focus()
  returnFocusTo = null
}

watch(
  () => props.open,
  async (open) => {
    await nextTick()
    const el = dialog.value
    if (!el) return
    if (open && !el.open) {
      returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
      el.showModal()
      focusFirst()
    } else if (!open && el.open) {
      el.close()
      // Erst nach dem Neuzeichnen, damit z. B. ein gelöschtes Element schon entfernt ist
      await nextTick()
      restoreFocus()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (dialog.value?.open) dialog.value.close()
})

// Escape: Schließen nicht dem Browser überlassen, sondern der Eltern-Komponente melden
function onCancel(event: Event) {
  event.preventDefault()
  emit('close')
}
</script>

<template>
  <dialog ref="dialog" class="dialog" :aria-labelledby="titleId" @cancel="onCancel">
    <div class="dialog__panel">
      <header class="dialog__header">
        <h2 :id="titleId" class="dialog__title">{{ title }}</h2>
        <button
          type="button"
          class="icon-button"
          aria-label="Dialog schließen"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </header>
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.dialog {
  width: min(560px, calc(100vw - 2rem));
  max-height: calc(100dvh - 2rem);
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-lg);
}

.dialog::backdrop {
  background: rgb(15 31 33 / 45%);
}

.dialog__panel {
  padding: 1.25rem 1.25rem 1.5rem;
}

.dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dialog__title {
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
</style>
