<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import torso from '../assets/just-todo/torso.png'
import left from '../assets/just-todo/left.png'
import right from '../assets/just-todo/right.png'
import background from '../assets/just-todo/background.svg'
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

  }
}
function schedule() { if (!frame) frame = requestAnimationFrame(measure) }
const reveal = computed(() => ease((progress.value - .96) / .04))
const ready = computed(() => progress.value >= .9999)
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
    const target = scrollY + section.value.getBoundingClientRect().top
      + section.value.offsetHeight - stage.value.offsetHeight
    const t = reduced.value ? 1 : clamp((now - began) / 850)
    window.scrollTo({top: start + (target - start) * (t*t*(3-2*t)), behavior:'instant'})
    if (t < 1) scrolling = requestAnimationFrame(step)
    else {
      scrolling = 0
      measure()
      void nextTick(() => panel.value?.querySelector('input')?.focus({preventScroll:true}))
    }
  }
  scrolling = requestAnimationFrame(step)
}
const interruptions = ['wheel','touchstart','pointerdown','keydown','popstate','hashchange','pagehide']
onMounted(() => {
  media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  media?.addEventListener('change', schedule)
  if (typeof ResizeObserver !== 'undefined') observer = new ResizeObserver(schedule)
  if (section.value) observer?.observe(section.value)
  window.addEventListener('scroll', schedule, {passive:true})
  window.addEventListener('pageshow', schedule)
  if (stage.value) observer?.observe(stage.value)
  interruptions.forEach(event => window.addEventListener(event,cancelScroll,{passive:true}))
  measure()
})
onUnmounted(() => {
  cancelScroll()
  interruptions.forEach(event => window.removeEventListener(event,cancelScroll))
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
    <a v-if="!reduced && !ready" href="#account-entry" class="skip" @click.prevent="skip">Direkt zum Login ↓</a>
    <svg class="scene" :viewBox="camera" aria-hidden="true">
      <defs><clipPath id="shirt-crop"><rect x="214" y="241" width="461" height="941"/></clipPath></defs>
      <image :href="torso" x="-391" y="241" width="1671" height="941" clip-path="url(#shirt-crop)"/>
      <image :href="left" x="407" y="112" width="399" height="1035" :transform="`rotate(${-29.069*(1-ease(progress/.97238))} 606.5 629.5)`"/>
      <image :href="right" x="95" y="98" width="407" height="1057" :transform="`rotate(${31.533*(1-ease(progress/.97284))} 298.5 626.5)`"/>
      <image :href="background" x="25.897312" y="676" width="837.205" height="471" :opacity="fade"/>
      <image :href="lettering" x="292" y="670" width="315" height="229" :opacity="fade"/>
    </svg>
    <div ref="panel" class="ending" :style="{opacity:reveal}" :inert="!ready" :aria-hidden="!ready">
      <img class="wordmark" :src="lettering" alt="ToDo It">
      <slot/>
    </div>
  </div>
</section>
</template>
<style scoped>
.intro {background:#f0f0f0;display:flow-root}
.stage {position:sticky;top:0;display:grid;align-items:center;justify-items:center;min-height:100dvh}
/* The trailing track belongs to the sticky containing block. */
.intro::after {content:"";display:block;height:175svh}
.scene,.ending {grid-area:1/1}
.scene {display:block;width:min(100%,177.78svh);aspect-ratio:16/9;overflow:hidden}
.ending {align-self:stretch;width:100%;display:flex;align-items:center;justify-content:center;gap:clamp(2rem,7vw,7rem);padding:2rem;background:#f0f0f0 url('../assets/just-todo/background.svg') center/100% 100% no-repeat}
.ending[inert] {pointer-events:none}
.wordmark {width:min(28vw,315px);height:auto}
.ending :deep(.account) {margin:0;width:min(100%,26rem)}
.skip {padding:.65rem 1rem;border-radius:2rem;text-decoration:none;position:absolute;right:clamp(1rem,4vw,3rem);top:1rem;z-index:1;background:#fff;color:#163c32}
@media(max-width:700px){.ending{flex-direction:column;gap:.5rem;padding:1rem}.wordmark{width:7rem}}
@media(prefers-reduced-motion:reduce){.intro::after{height:0}.scene{display:none}}
</style>
