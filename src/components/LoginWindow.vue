<script setup lang="ts">
defineProps<{ opacity: number; ready: boolean }>()
</script>
<template>
  <div class="login-window" :style="{ opacity }" :inert="!ready" :aria-hidden="!ready">
    <slot />
  </div>
</template>
<style scoped>
.login-window {
  width: min(100%, var(--login-width, 26rem));
  margin-inline: auto;
  padding: var(--login-padding, 1rem);
  border: 3px solid #bfbfbf;
  border-radius: 0.25rem;
  background: #f0f0f0;
}
.login-window[inert] {
  pointer-events: none;
}
.login-window :deep(.account) {
  margin: 0;
  padding: 0;
  width: 100%;
}
</style>
