<template>
  <div class="code-block" :class="{ compact }">
    <div v-if="label" class="code-head">
      <span>{{ label }}</span>
      <button type="button" @click="copy">
        <Copy aria-hidden="true" />
        <span>{{ copied ? copiedLabel : copyLabel }}</span>
      </button>
    </div>
    <pre><code class="hljs"><span v-if="prompt" class="prompt" aria-hidden="true">$</span>{{ prompt ? ' ' : '' }}<span v-html="highlightedCode"></span></code></pre>
  </div>
</template>

<script setup lang="ts">
import Copy from '@primeicons/vue/copy'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import http from 'highlight.js/lib/languages/http'
import ini from 'highlight.js/lib/languages/ini'
import json from 'highlight.js/lib/languages/json'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('http', http)
hljs.registerLanguage('ini', ini)
hljs.registerLanguage('json', json)

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

const languageByLabel: Record<string, string> = {
  toml: 'ini',
  json: 'json',
  npx: 'bash',
  ci: 'bash',
  curl: 'bash',
  http: 'http',
  '.drop-ignore': 'plaintext'
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;'
  })[character] ?? character)
}

const highlightedCode = computed(() => {
  const language = props.prompt
    ? 'bash'
    : languageByLabel[props.label.trim().toLowerCase()] ?? 'plaintext'

  if (language === 'plaintext') return escapeHtml(props.code)

  try {
    return hljs.highlight(props.code, { language }).value
  } catch {
    return escapeHtml(props.code)
  }
})

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
  border: 1px solid #30363d;
  border-radius: 0.65rem;
  background: #0d1117;
  color: #e6edf3;

  .code-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 48px;
    padding: 0 0.65rem 0 1rem;
    border-bottom: 1px solid #30363d;
    background: #161b22;
    color: #8b949e;
    font-family: var(--font-code);
    font-size: 1em;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 34px;
    padding: 0.4rem 0.65rem;
    border: 1px solid transparent;
    border-radius: 0.4rem;
    background: transparent;
    color: #c9d1d9;
    font: inherit;
    font-size: 1em;
    letter-spacing: normal;
    text-transform: none;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      border-color: #30363d;
      background: #21262d;
      color: #fff;
    }

    svg {
      width: 1em;
      height: 1em;
    }
  }

  pre {
    margin: 0;
    overflow-x: auto;
    background: #0d1117;
    padding: 1rem;
    font-family: var(--font-code);
    font-size: 1em;
    line-height: 1.7;
  }

  code {
    font-family: inherit;
    font-size: inherit;
  }

  .prompt {
    color: #7d8590;
    user-select: none;
  }

  :deep(.hljs-comment),
  :deep(.hljs-quote) {
    color: #8b949e;
  }

  :deep(.hljs-keyword),
  :deep(.hljs-selector-tag),
  :deep(.hljs-subst) {
    color: #ff7b72;
  }

  :deep(.hljs-string),
  :deep(.hljs-doctag),
  :deep(.hljs-regexp) {
    color: #a5d6ff;
  }

  :deep(.hljs-title),
  :deep(.hljs-section),
  :deep(.hljs-selector-id),
  :deep(.hljs-selector-class) {
    color: #d2a8ff;
  }

  :deep(.hljs-number),
  :deep(.hljs-literal),
  :deep(.hljs-variable),
  :deep(.hljs-template-variable),
  :deep(.hljs-tag),
  :deep(.hljs-attr) {
    color: #79c0ff;
  }

  :deep(.hljs-attribute),
  :deep(.hljs-name) {
    color: #7ee787;
  }

  :deep(.hljs-type),
  :deep(.hljs-built_in),
  :deep(.hljs-symbol),
  :deep(.hljs-bullet) {
    color: #ffa657;
  }

  :deep(.hljs-meta),
  :deep(.hljs-selector-pseudo) {
    color: #d2a8ff;
  }

  :deep(.hljs-addition) {
    background: #04260f;
    color: #aff5b4;
  }

  :deep(.hljs-deletion) {
    background: #490202;
    color: #ffdcd7;
  }

  :deep(.hljs-emphasis) {
    font-style: italic;
  }

  :deep(.hljs-strong) {
    font-weight: 700;
  }

  &.compact {
    margin-bottom: 0.75rem;
  }
}
</style>
