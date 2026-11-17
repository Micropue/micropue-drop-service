<template>
  <div class="code-block" :class="{ compact }">
    <div v-if="label" class="code-head">
      <span>{{ label }}</span>
      <button type="button" @click="copy">
        <Copy aria-hidden="true" />
        <span>{{ copied ? copiedLabel : copyLabel }}</span>
      </button>
    </div>
    <pre><code><span v-if="prompt" class="prompt">$</span> {{ code }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import Copy from '@primeicons/vue/copy'

const props = withDefaults(defineProps<{
  code: string
  label?: string
  copyLabel?: string
  copiedLabel?: string
  prompt?: boolean
  compact?: boolean
}>(), {
  label: '',
  copyLabel: 'Copy',
  copiedLabel: 'Copied',
  prompt: false,
  compact: false
})

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch {
    copied.value = false
  }
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>

<style lang="scss" scoped>
.code-block {
  overflow: hidden;
  margin: 1rem 0;
  border-radius: 0.65rem;
  background: #18181b;
  color: #fafafa;

  .code-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 34px;
    padding: 0 0.65rem 0 0.9rem;
    border-bottom: 1px solid #303035;
    color: #a1a1aa;
    font-family: var(--font-code);
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.4rem;
    border: 0;
    border-radius: 0.25rem;
    background: transparent;
    color: #d4d4d8;
    font: inherit;
    letter-spacing: normal;
    text-transform: none;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      background: #303035;
      color: #fff;
    }

    svg {
      width: 0.75rem;
      height: 0.75rem;
    }
  }

  pre {
    margin: 0;
    overflow-x: auto;
    padding: 0.9rem;
    font-family: var(--font-code);
    font-size: 1rem;
    line-height: 1.7;
  }

  code {
    font-family: inherit;
    font-size: inherit;
  }

  .prompt {
    color: #71717a;
    user-select: none;
  }

  &.compact {
    margin-bottom: 0.75rem;
  }
}

@media screen and (max-width: 560px) {
  .code-block pre {
    font-size: 0.85rem;
  }
}
</style>
