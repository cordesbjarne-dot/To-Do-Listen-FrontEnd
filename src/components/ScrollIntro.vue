<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import torso from '../assets/just-todo/torso.png'
import left from '../assets/just-todo/left.png'
import right from '../assets/just-todo/right.png'
import background from '../assets/just-todo/background.svg'
import lettering from '../assets/just-todo/letter.svg'

const emit = defineEmits<{ ready: [boolean] }>()
const section = ref<HTMLElement>()
const stage = ref<HTMLElement>()
const progress = ref(0)
const reduced = ref(false)
const clamp = (v: number) => Math.max(0, Math.min(1, v))
// Invert the x coordinate of Figma's cubic-bezier(.5,0,.5,1).
function ease(x: number) {
  if (x <= 0 || x >= 1) return clamp(x)
  let lo = 0, hi = 1
  for (let i = 0; i < 18; i++) {
    const t = (lo + hi) / 2
    if (1.5*t - 1.5*t*t + t*t*t < x) lo = t
    else hi = t
  }
  const t = (lo + hi) / 2
  return t*t*(3-2*t)
}
const camera = computed(() => {
  const t = clamp(progress.value / .86536)
  return [81 - 55.102688*t, 184 + 492*t, 727 + 110.205*t, 409 + 62*t].join(' ')
})
const fade = computed(() => ease((progress.value - .90002) / .09998))
let frame = 0
let observer: ResizeObserver | undefined
let media: MediaQueryList | undefined
function measure() {
  frame = 0
  reduced.value = media?.matches ?? false
  if (section.value && stage.value) {
    const distance = section.value.offsetHeight - stage.value.offsetHeight
    progress.value = reduced.value ? 1 : clamp(-section.value.getBoundingClientRect().top / Math.max(distance, 1))
    emit("ready", progress.value >= .999)
  }
}
function schedule() { if (!frame) frame = requestAnimationFrame(measure) }
async function skip() {
  emit("ready", true)
  await nextTick()
  const form = document.getElementById('account-entry')
  form?.scrollIntoView({block:'start'})
  form?.querySelector('input')?.focus({preventScroll:true})
}
onMounted(() => {
  media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  media?.addEventListener('change', schedule)
  if (typeof ResizeObserver !== 'undefined') observer = new ResizeObserver(schedule)
  if (section.value) observer?.observe(section.value)
  window.addEventListener('scroll', schedule, {passive:true})
  window.addEventListener('pageshow', schedule)
  measure()
})
onUnmounted(() => {
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
    <a v-if="!reduced" href="#account-entry" class="skip" @click.prevent="skip">Direkt zum Login ↓</a>
    <svg class="scene" :viewBox="camera" aria-hidden="true">
      <defs><clipPath id="shirt-crop"><rect x="214" y="241" width="461" height="941"/></clipPath></defs>
      <image :href="torso" x="-391" y="241" width="1671" height="941" clip-path="url(#shirt-crop)"/>
      <image :href="left" x="407" y="112" width="399" height="1035" :transform="`rotate(${-29.069*(1-ease(progress/.97238))} 606.5 629.5)`"/>
      <image :href="right" x="95" y="98" width="407" height="1057" :transform="`rotate(${31.533*(1-ease(progress/.97284))} 298.5 626.5)`"/>
      <image :href="background" x="25.897312" y="676" width="837.205" height="471" :opacity="fade"/>
      <image :href="lettering" x="292" y="670" width="315" height="229" :opacity="fade"/>
    </svg>
  </div>
</section>
</template>
<style scoped>
.intro {height:275svh;background:#f0f0f0}
.stage {height:100svh;position:sticky;top:0;display:grid;place-items:center;overflow:hidden}
.scene {display:block;width:min(100%,177.78svh);height:auto;aspect-ratio:16/9;overflow:hidden}
.skip {padding:.65rem 1rem;border-radius:2rem;text-decoration:none;position:absolute;right:clamp(1rem,4vw,3rem);top:1rem;z-index:1;background:#fff;color:#163c32}
@media(prefers-reduced-motion:reduce){.intro,.stage{height:auto}.scene{width:min(100%,34rem)}}
</style>
