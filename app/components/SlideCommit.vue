<template>
  <div
    class="slide-commit"
    :class="className"
    :data-phase="phase"
    :data-held="held ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :style="rootStyle"
  >
    <div ref="trackRef" class="slide-track" @pointerdown="down">
      <span ref="sayRef" class="slide-copy" aria-hidden="true">
        <span class="slide-say">{{ label }}</span>
        <span class="slide-error">{{ errorLabel }}</span>
      </span>
      <div
        ref="capsuleRef"
        class="slide-capsule"
        role="slider"
        :tabindex="disabled ? -1 : 0"
        :aria-label="labelText"
        :aria-valuemin="0"
        :aria-valuemax="100"
        aria-valuenow="0"
        :aria-busy="phase === 'pending' || undefined"
        :aria-disabled="disabled || undefined"
        @pointerenter="onCapsuleEnter"
        @pointerleave="hot = false"
        @keydown="onKeyDown"
      >
        <div ref="contentRef" class="slide-capsule-content">
          <span ref="arrowRef" class="slide-label slide-arrow" aria-hidden="true">
            <slot name="icon">
              <HugeiconsIcon :icon="ArrowRight02Icon as IconArray" :size="iconSize" :stroke-width="2" />
            </slot>
          </span>
          <span ref="spinRef" class="slide-label slide-spinner" style="opacity: 0" aria-hidden="true">
            <svg :width="iconSize" :height="iconSize" viewBox="0 0 24 24" aria-hidden="true">
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-opacity="0.25"
              />
              <path
                d="M12 3a9 9 0 0 1 9 9"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
              />
            </svg>
          </span>
          <span class="slide-label slide-done" aria-hidden="true">
            <HugeiconsIcon
              :icon="Tick02Icon as IconArray"
              :size="Math.round(gripSize * 0.38)"
              :stroke-width="2.5"
            />
            {{ doneLabel }}
          </span>
        </div>
      </div>
      <span class="sr-only" aria-live="polite">
        {{ phase === 'pending' ? 'Working' : phase === 'done' ? doneLabel : phase === 'error' ? errorLabel : '' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon, type IconArray } from '@hugeicons/vue'
import { animate, motionValue, useReducedMotion } from 'motion-v'
import { computed, onMounted, onUnmounted, ref, watchPostEffect, type CSSProperties } from 'vue'

export type SlideCommitPhase = 'idle' | 'pending' | 'done' | 'error'

interface SlideCommitProps {
  label?: string
  doneLabel?: string
  errorLabel?: string
  onConfirm?: () => void | Promise<unknown>
  trackColor?: string
  handleColor?: string
  successColor?: string
  dangerColor?: string
  width?: number
  height?: number
  radius?: number
  speed?: number
  returnBounce?: number
  landingDip?: number
  holdMs?: number
  disabled?: boolean
  className?: string
}

type Sample = [number, number]
type Grip = { id: number; grab: number | null; moved: boolean; hist: Sample[] }
type MoveEvent = { pointerId: number; clientX: number; timeStamp: number }
type UpEvent = { pointerId: number }

const PAD = 4
const COMMIT_SLOP = 8
const SQUASH_MAX = 0.08
const SQUASH_DIV = 110
const SWELL = 1.03
const MIN_PENDING = 300
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const SHAKE = [0, -5, 5, -3, 3, -1, 0]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const onColor = (hex: string) => {
  const raw = hex.replace('#', '')
  const full = raw.length === 3 ? [...raw].map(ch => ch + ch).join('') : raw.slice(0, 6)
  const n = parseInt(full, 16)
  if (Number.isNaN(n)) return '#ffffff'
  const yiq = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000
  return yiq >= 128 ? '#111111' : '#ffffff'
}
const velocityOf = (hist: Sample[]) => {
  if (hist.length < 2) return 0
  const [t0, x0] = hist[0]
  const [t1, x1] = hist[hist.length - 1]
  return ((x1 - x0) / Math.max(1, t1 - t0)) * 1000
}
const finePointer = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

const props = withDefaults(defineProps<SlideCommitProps>(), {
  label: 'Slide to pay',
  doneLabel: 'Paid',
  errorLabel: 'Payment failed',
  onConfirm: undefined,
  trackColor: '#262626',
  handleColor: '#f5f5f5',
  successColor: '#22c55e',
  dangerColor: '#e5484d',
  width: 280,
  height: 56,
  radius: 28,
  speed: 50,
  returnBounce: 0.38,
  landingDip: 0.026,
  holdMs: 1500,
  disabled: false,
  className: ''
})

const emit = defineEmits<{ done: []; error: [reason: unknown] }>()

const reduce = useReducedMotion()
const phase = ref<SlideCommitPhase>('idle')
const held = ref(false)
const hot = ref(false)

const trackRef = ref<HTMLDivElement | null>(null)
const capsuleRef = ref<HTMLDivElement | null>(null)
const contentRef = ref<HTMLDivElement | null>(null)
const sayRef = ref<HTMLSpanElement | null>(null)
const arrowRef = ref<HTMLSpanElement | null>(null)
const spinRef = ref<HTMLSpanElement | null>(null)
let grip: Grip | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let homeTimer: ReturnType<typeof setTimeout> | undefined
let run = 0
let unwatch: (() => void) | null = null
let lastPercent = 0
const offs: (() => void)[] = []

const gripSize = computed(() => props.height - PAD * 2)
const inner = computed(() => props.width - PAD * 2)
const travel = computed(() => Math.max(1, inner.value - gripSize.value))
const corner = computed(() => clamp(props.radius, 0, props.height / 2))
const gripR = computed(() => Math.max(0, corner.value - PAD))
const stiffness = computed(() => 260 + (clamp(props.speed, 0, 100) / 100) * 640)
const mass = 0.9
const critical = computed(() => 2 * Math.sqrt(stiffness.value * mass))
const commitSpring = () => ({
  type: 'spring' as const,
  stiffness: stiffness.value,
  damping: critical.value,
  mass
})
const homeSpring = () => ({
  ...commitSpring(),
  damping: critical.value * (1 - clamp(props.returnBounce, 0, 0.5))
})

const x = motionValue(0)
const anchor = motionValue(0)
const shown = motionValue(1)
const spin = motionValue(0)
const pulse = motionValue(1)
const shake = motionValue(0)

const labelText = computed(() => props.label || 'Slide to confirm')

const paint = () => {
  const T = travel.value
  const G = gripSize.value
  const W = inner.value
  const v = clamp(x.get(), 0, T)
  const edge = v + G + clamp(anchor.get() - v, 0, T)
  const swell = hot.value && !held.value && phase.value === 'idle' && !reduce.value ? SWELL : 1
  const q = 1 - Math.min(SQUASH_MAX, Math.max(0, -x.get()) / SQUASH_DIV)
  const cap = capsuleRef.value
  if (cap) {
    cap.style.clipPath = `inset(0 ${W - edge}px 0 0 round ${gripR.value}px)`
    cap.style.transform = `scale(${q * swell}, ${swell / q})`
    cap.style.transformOrigin = `${v}px 50%`
    const percent = Math.round((v / T) * 100)
    if (percent !== lastPercent) {
      lastPercent = percent
      cap.setAttribute('aria-valuenow', String(percent))
      cap.setAttribute('aria-valuetext', `${labelText.value}, ${percent}%`)
    }
  }
  if (contentRef.value) contentRef.value.style.transform = `translateX(${(v + edge) / 2 - W / 2}px)`
  if (sayRef.value) sayRef.value.style.opacity = String(clamp(1 - v / (T * 0.55), 0, 1))
  if (arrowRef.value) {
    arrowRef.value.style.opacity = String(shown.get() * clamp(1 - (v - T * 0.55) / (T * 0.4), 0, 1))
  }
  if (spinRef.value) spinRef.value.style.opacity = String(spin.get())
  if (trackRef.value) trackRef.value.style.transform = `translateX(${shake.get()}px) scale(${pulse.get()})`
}
watchPostEffect(paint)
onMounted(() => {
  ;[x, anchor, shown, spin, pulse, shake].forEach(mv => offs.push(mv.on('change', paint)))
  paint()
  trackRef.value?.addEventListener('touchstart', preventTouchStart, { passive: false })
  trackRef.value?.addEventListener('touchmove', preventTouchMove, { passive: false })
})

onUnmounted(() => {
  clearTimeout(timer)
  clearTimeout(homeTimer)
  unwatch?.()
  offs.forEach(off => off())
  ;[x, anchor, shown, spin, pulse, shake].forEach(mv => mv.stop())
  trackRef.value?.removeEventListener('touchstart', preventTouchStart)
  trackRef.value?.removeEventListener('touchmove', preventTouchMove)
  run += 1
})

const local = (clientX: number) => {
  const rect = trackRef.value?.getBoundingClientRect()
  if (!rect) return 0
  return (clientX - rect.left) / (rect.width / props.width || 1)
}

const goHome = (velocity: number) => {
  if (reduce.value) animate(x, 0, { duration: 0.2, ease: EASE_OUT })
  else animate(x, 0, { ...homeSpring(), velocity: Math.min(0, velocity) })
}

const settle = () => {
  phase.value = 'idle'
  animate(shown, 1, { duration: 0.2, delay: 0.12 })
  if (reduce.value) anchor.set(0)
  else animate(anchor, 0, { type: 'spring', duration: 0.3, bounce: 0 })
}

const resolve = (viaKey: boolean) => {
  phase.value = 'done'
  anchor.set(x.get())
  animate(spin, 0, { duration: 0.12 })
  if (reduce.value) x.set(0)
  else {
    animate(x, 0, commitSpring())
    if (!viaKey && props.landingDip > 0) {
      animate(pulse, [1, 1 - props.landingDip, 1], {
        duration: 0.46,
        times: [0, 0.62, 1],
        ease: EASE_OUT,
        delay: 0.1
      })
    }
  }
  emit('done')
  if (props.holdMs > 0) timer = setTimeout(settle, props.holdMs)
}

const reject = (reason: unknown) => {
  phase.value = 'error'
  emit('error', reason)
  animate(spin, 0, { duration: 0.12 })
  animate(shown, 1, { duration: 0.2, delay: 0.12 })
  if (reduce.value) goHome(0)
  else {
    animate(shake, SHAKE, { duration: 0.45, ease: EASE_OUT })
    homeTimer = setTimeout(() => {
      if (!grip) goHome(0)
    }, 300)
  }
  timer = setTimeout(() => (phase.value = 'idle'), Math.max(props.holdMs, 1500))
}

const commit = (viaKey: boolean) => {
  clearTimeout(timer)
  const id = ++run
  x.set(travel.value)
  let out: void | Promise<unknown>
  try {
    out = props.onConfirm?.()
  } catch (reason) {
    reject(reason)
    return
  }
  const pending = out && typeof (out as Promise<unknown>).then === 'function' ? (out as Promise<unknown>) : null
  if (!pending) {
    animate(shown, 0, { duration: 0.12 })
    resolve(viaKey)
    return
  }
  phase.value = 'pending'
  animate(shown, 0, { duration: 0.2 })
  animate(spin, 1, { duration: 0.2 })
  const t0 = performance.now()
  const later = (fn: () => void) => {
    setTimeout(
      () => {
        if (id === run) fn()
      },
      Math.max(0, MIN_PENDING - (performance.now() - t0))
    )
  }
  pending.then(
    () => later(() => resolve(viaKey)),
    reason => later(() => reject(reason))
  )
}

let live: {
  move: (e: MoveEvent) => void
  up: (e: UpEvent) => void
  cancel: (e: UpEvent) => void
} = { move: () => {}, up: () => {}, cancel: () => {} }

const down = (e: PointerEvent) => {
  if (
    props.disabled ||
    grip ||
    phase.value === 'pending' ||
    phase.value === 'done' ||
    (e.pointerType === 'mouse' && e.button !== 0)
  ) {
    return
  }
  e.preventDefault()
  x.stop()
  grip = { id: e.pointerId, grab: null, moved: false, hist: [] }
  held.value = true
  try {
    trackRef.value?.setPointerCapture(e.pointerId)
  } catch {
    // Pointer capture can fail in browsers that only support mouse events.
  }
  unwatch?.()
  const onMove = (ev: PointerEvent) => ev.isTrusted && live.move(ev)
  const onUp = (ev: PointerEvent) => ev.isTrusted && live.up(ev)
  const onCancel = (ev: PointerEvent) => ev.isTrusted && live.cancel(ev)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onCancel)
  unwatch = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onCancel)
    unwatch = null
  }
}

const move = (e: MoveEvent) => {
  const g = grip
  if (!g || g.id !== e.pointerId) return
  const at = local(e.clientX)
  if (g.grab === null) {
    g.grab = at - x.get()
    return
  }
  const next = clamp(at - g.grab, 0, travel.value)
  if (Math.abs(next - x.get()) > 0.5) g.moved = true
  g.hist.push([e.timeStamp, next])
  if (g.hist.length > 4) g.hist.shift()
  x.set(next)
}

const up = (e: UpEvent) => {
  const g = grip
  if (!g || g.id !== e.pointerId) return
  grip = null
  unwatch?.()
  try {
    trackRef.value?.releasePointerCapture(e.pointerId)
  } catch {
    // Pointer capture may already have been released.
  }
  held.value = false
  if (x.get() >= travel.value - COMMIT_SLOP) commit(false)
  else if (g.moved) goHome(velocityOf(g.hist))
}

const cancel = (e: UpEvent) => {
  const g = grip
  if (!g || g.id !== e.pointerId) return
  grip = null
  unwatch?.()
  try {
    trackRef.value?.releasePointerCapture(e.pointerId)
  } catch {
    // Pointer capture may already have been released.
  }
  held.value = false
  goHome(velocityOf(g.hist))
}
live = { move, up, cancel }

const onKeyDown = (e: KeyboardEvent) => {
  if (props.disabled || phase.value === 'pending' || phase.value === 'done') return
  const step = travel.value / 10
  if (e.key === 'End') {
    e.preventDefault()
    commit(true)
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault()
    const next = Math.min(travel.value, x.get() + step)
    x.set(next)
    if (next >= travel.value) commit(true)
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault()
    x.set(Math.max(0, x.get() - step))
  } else if (e.key === 'Home' || e.key === 'Escape') {
    e.preventDefault()
    if (grip) up({ pointerId: grip.id })
    else x.set(0)
  }
}

const onCapsuleEnter = (e: PointerEvent) => {
  if (e.pointerType === 'mouse' && finePointer()) hot.value = true
}

const canSuppressTouch = () =>
  !props.disabled && phase.value !== 'pending' && phase.value !== 'done'

const preventTouchStart = (e: TouchEvent) => {
  if (e.cancelable && canSuppressTouch()) e.preventDefault()
}

const preventTouchMove = (e: TouchEvent) => {
  if (e.cancelable && grip) e.preventDefault()
}

const fontSize = computed(() => clamp(Math.round(props.height * 0.25), 13, 17))
const iconSize = computed(() => Math.round(gripSize.value * 0.42))

const rootStyle = computed(
  () =>
    ({
      width: `${props.width}px`,
      height: `${props.height}px`,
      '--sc-track': props.trackColor,
      '--sc-ink': props.handleColor,
      '--sc-ok': props.successColor,
      '--sc-no': props.dangerColor,
      '--sc-on-ink': onColor(props.handleColor),
      '--sc-on-ok': onColor(props.successColor),
      '--sc-on-no': onColor(props.dangerColor),
      '--sc-radius': `${corner.value}px`,
      '--sc-grip-r': `${gripR.value}px`,
      '--sc-pad': `${PAD}px`,
      '--sc-font': `${fontSize.value}px`
    }) as CSSProperties
)
</script>

<style lang="scss">
@keyframes sc-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes sc-breathe {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.slide-commit {
  position: relative;
  display: inline-block;
  max-width: 100%;
  font-family: inherit;
  vertical-align: middle;

  &[data-disabled] {
    opacity: 0.55;
    pointer-events: none;
  }
}

.slide-track {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--sc-radius);
  background: var(--sc-track);
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;

  .slide-commit[data-held] & {
    cursor: grabbing;
  }

  .slide-commit[data-phase='done'] &,
  .slide-commit[data-phase='pending'] & {
    cursor: default;
  }
}

.slide-copy {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: color-mix(in srgb, var(--sc-ink) 45%, transparent);
  font-size: var(--sc-font);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.006em;
  pointer-events: none;
  white-space: nowrap;

  .slide-say,
  .slide-error {
    grid-area: 1 / 1;
    transition: opacity 200ms ease, filter 200ms ease;
  }

  .slide-error {
    color: var(--sc-no);
    opacity: 0;
    filter: blur(2px);
  }

  .slide-commit[data-phase='error'] & {
    .slide-say {
      opacity: 0;
      filter: blur(2px);
    }

    .slide-error {
      opacity: 1;
      filter: none;
    }
  }
}

.slide-capsule {
  position: absolute;
  top: var(--sc-pad);
  left: var(--sc-pad);
  width: calc(100% - var(--sc-pad) * 2);
  height: calc(100% - var(--sc-pad) * 2);
  border-radius: var(--sc-grip-r);
  outline: none;
  background: var(--sc-ink);
  color: var(--sc-on-ink);
  transition: background-color 200ms ease, color 200ms ease;

  &:focus-visible {
    box-shadow: inset 0 0 0 2px var(--sc-track);
  }

  .slide-commit[data-phase='done'] & {
    background: var(--sc-ok);
    color: var(--sc-on-ok);
  }

  .slide-commit[data-phase='error'] & {
    background: var(--sc-no);
    color: var(--sc-on-no);
  }
}

.slide-capsule-content {
  position: absolute;
  inset: 0;
}

.slide-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  font-size: var(--sc-font);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.006em;
  white-space: nowrap;
  pointer-events: none;

  svg {
    display: block;
  }
}

.slide-arrow,
.slide-spinner {
  transition: filter 200ms ease;
}

.slide-commit[data-phase='pending'] {
  .slide-arrow {
    filter: blur(2px);
  }

  .slide-spinner {
    filter: none;
  }
}

.slide-spinner {
  filter: blur(2px);

  svg {
    animation: sc-spin 1s linear infinite;
    animation-play-state: paused;
  }

  .slide-commit[data-phase='pending'] & svg {
    animation-play-state: running;
  }
}

.slide-done {
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1);

  .slide-commit[data-phase='done'] & {
    opacity: 1;
    transform: scale(1);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .slide-spinner svg {
    animation: sc-breathe 1.4s ease-in-out infinite;
    animation-play-state: paused;
  }

  .slide-commit[data-phase='pending'] .slide-spinner svg {
    animation-play-state: running;
  }

  .slide-done {
    transform: none;
  }
}
</style>
