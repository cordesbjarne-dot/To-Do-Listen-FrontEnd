<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import torso from '../assets/just-todo/torso.png'
import left from '../assets/just-todo/left.png'
import right from '../assets/just-todo/right.png'
import LoginWindow from './LoginWindow.vue'
import lettering from '../assets/just-todo/letter.svg'

const panel = ref<HTMLElement>()
const section = ref<HTMLElement>()
const stage = ref<HTMLElement>()
const progress = ref(0)
const reduced = ref(false)
const clamp = (v: number) => Math.max(0, Math.min(1, v))
// Invert the x coordinate of Figma's cubic-bezier(.5,0,.5,1).
function ease(x: number) {
  if (x <= 0 || x >= 1) return clamp(x)
  let lo = 0,
    hi = 1
  for (let i = 0; i < 18; i++) {
    const t = (lo + hi) / 2
    if (1.5 * t - 1.5 * t * t + t * t * t < x) lo = t
    else hi = t
  }
  const t = (lo + hi) / 2
  return t * t * (3 - 2 * t)
}
const viewport = ref({ width: 1243, height: 699 })
const camera = computed(() => {
  const ratio = viewport.value.width / Math.max(viewport.value.height, 1)
  // The guide moves vertically; the real viewport determines the visible extent.
  const width = Math.max(760, 699 * ratio)
  const height = width / ratio
  const centerY = 525.5 + 524 * clamp(progress.value / 0.89975)
  return [1033.5 - width / 2, centerY - height / 2, width, height].join(' ')
})
const fade = computed(() => ease((progress.value - 0.89998) / 0.10002))
const letteringOpacity = computed(() => ease((progress.value - 0.91913) / 0.08087))
let frame = 0
let observer: ResizeObserver | undefined
let media: MediaQueryList | undefined
function measure() {
  frame = 0
  reduced.value = media?.matches ?? false
  if (section.value && stage.value) {
    viewport.value = { width: stage.value.clientWidth, height: stage.value.clientHeight }
    const distance = section.value.offsetHeight - stage.value.offsetHeight
    progress.value = reduced.value
      ? 1
      : clamp(-section.value.getBoundingClientRect().top / Math.max(distance, 1))
  }
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(measure)
}
const reveal = computed(() => ease((progress.value - 0.92255) / 0.07745))
const ready = computed(() => progress.value >= 0.9999)
let scrolling = 0
function cancelScroll() {
  cancelAnimationFrame(scrolling)
  scrolling = 0
}
function skip() {
  cancelScroll()
  const start = scrollY
  const began = performance.now()
  function step(now: number) {
    if (!section.value || !stage.value) return
    const target =
      scrollY +
      section.value.getBoundingClientRect().top +
      section.value.offsetHeight -
      stage.value.offsetHeight
    const t = reduced.value ? 1 : clamp((now - began) / 850)
    window.scrollTo({ top: start + (target - start) * (t * t * (3 - 2 * t)), behavior: 'instant' })
    if (t < 1) scrolling = requestAnimationFrame(step)
    else {
      scrolling = 0
      measure()
      void nextTick(() => panel.value?.querySelector('input')?.focus({ preventScroll: true }))
    }
  }
  scrolling = requestAnimationFrame(step)
}
const interruptions = [
  'wheel',
  'touchstart',
  'pointerdown',
  'keydown',
  'popstate',
  'hashchange',
  'pagehide',
]
onMounted(() => {
  media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  media?.addEventListener('change', schedule)
  if (typeof ResizeObserver !== 'undefined') observer = new ResizeObserver(schedule)
  if (section.value) observer?.observe(section.value)
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('pageshow', schedule)
  if (stage.value) observer?.observe(stage.value)
  interruptions.forEach((event) => window.addEventListener(event, cancelScroll, { passive: true }))
  measure()
})
onUnmounted(() => {
  cancelScroll()
  interruptions.forEach((event) => window.removeEventListener(event, cancelScroll))
  observer?.disconnect()
  media?.removeEventListener('change', schedule)
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('pageshow', schedule)
  cancelAnimationFrame(frame)
})
</script>
<template>
  <section ref="section" class="intro" aria-label="Just ToDo It">
    <div ref="stage" class="stage">
      <a v-if="!reduced && !ready" href="#account-entry" class="skip" @click.prevent="skip"
        >Direkt zum Login ↓</a
      >
      <svg class="scene" :viewBox="camera" aria-hidden="true">
        <image :href="torso" x="543" y="220" width="980" height="1605" />
        <rect x="-10000" y="700" width="20000" height="20000" fill="#f0f0f0" :opacity="fade" />
        <image
          :href="left"
          x="990"
          y="91"
          width="421"
          height="1093"
          :transform="`rotate(${-29.069 * (1 - ease(progress / 0.97238))} 1200.5 637.5)`"
        />
        <image
          :href="right"
          x="655.23"
          y="98.61"
          width="407.783"
          height="1057"
          :transform="`translate(${-0.234186 * clamp(progress / 0.97238)} ${9.388184 * clamp(progress / 0.97238)}) rotate(${31.533 * (1 - ease(progress / 0.97284))} 859.1215 627.11)`"
        />
      </svg>
      <div ref="panel" class="ending">
        <img
          class="wordmark"
          :src="lettering"
          alt="ToDo It"
          :style="{ opacity: letteringOpacity }"
        />
        <LoginWindow :opacity="reveal" :ready="ready"><slot /></LoginWindow>
      </div>
    </div>
  </section>
</template>
<style scoped>
.intro {
  background: #f0f0f0;
  display: flow-root;
  --login-width: 26rem;
  --login-padding: 1rem;
  --scene-padding: clamp(1rem, 3vh, 2rem);
  --wordmark-height: clamp(7rem, 22vh, 14rem);
  --login-gap: 1rem;
}
.stage {
  position: sticky;
  top: 0;
  display: grid;
  min-height: 100dvh;
}
.intro::after {
  content: '';
  display: block;
  height: 175svh;
}
.scene {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.ending {
  position: relative;
  align-self: center;
  display: flex;
  flex-direction: column;
  gap: var(--login-gap);
  padding: var(--scene-padding);
  pointer-events: none;
}
.ending :deep(.login-window:not([inert])) {
  pointer-events: auto;
}
.wordmark {
  display: block;
  height: var(--wordmark-height);
  width: auto;
  max-width: 100%;
  align-self: center;
}
.skip {
  padding: 0.65rem 1rem;
  border-radius: 2rem;
  text-decoration: none;
  position: absolute;
  right: clamp(1rem, 4vw, 3rem);
  top: 1rem;
  z-index: 2;
  background: #fff;
  color: #163c32;
}
@media (max-width: 700px) {
  .intro {
    --wordmark-height: 7rem;
    --scene-padding: 1rem;
  }
}
@media (prefers-reduced-motion: reduce) {
  .intro::after {
    height: 0;
  }
  .scene {
    display: none;
  }
}
</style>
