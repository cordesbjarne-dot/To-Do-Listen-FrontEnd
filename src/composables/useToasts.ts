// Kurze Erfolgsmeldungen ("Aufgabe wurde gespeichert."), die nach einigen Sekunden verschwinden.
import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
}

export function useToasts(durationMs = 4000) {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function show(message: string) {
    const id = nextId++
    // Höchstens drei Meldungen gleichzeitig
    toasts.value = [...toasts.value.slice(-2), { id, message }]
    setTimeout(() => dismiss(id), durationMs)
  }

  return { toasts, show, dismiss }
}
