<template>
  <template v-for="(token, index) in tokens" :key="`${token.type}-${index}`">
    <code v-if="token.type === 'code'">{{ token.value }}</code>
    <strong v-else-if="token.type === 'strong'">{{ token.value }}</strong>
    <NuxtLink v-else-if="token.type === 'internal-link'" :to="token.href">{{ token.value }}</NuxtLink>
    <a v-else-if="token.type === 'external-link'" :href="token.href" target="_blank"
      rel="noopener noreferrer">{{ token.value }}</a>
    <template v-else>{{ token.value }}</template>
  </template>
</template>

<script setup lang="ts">
type InlineToken = {
  type: 'text' | 'code' | 'strong' | 'internal-link' | 'external-link'
  value: string
  href?: string
}

const props = defineProps<{
  text: string
}>()

const inlinePattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\))/g

function safeHref(value: string) {
  if (value.startsWith('/') && !value.startsWith('//')) return value
  if (value.startsWith('#')) return value
  if (/^https?:\/\//i.test(value)) return value
  return null
}

const tokens = computed<InlineToken[]>(() => {
  const result: InlineToken[] = []
  let cursor = 0

  for (const match of props.text.matchAll(inlinePattern)) {
    const index = match.index ?? 0
    const raw = match[0]

    if (index > cursor) {
      result.push({ type: 'text', value: props.text.slice(cursor, index) })
    }

    if (raw.startsWith('`')) {
      result.push({ type: 'code', value: raw.slice(1, -1) })
    } else if (raw.startsWith('**')) {
      result.push({ type: 'strong', value: raw.slice(2, -2) })
    } else {
      const link = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      const href = link?.[2] ? safeHref(link[2]) : null

      if (link && href) {
        result.push({
          type: href.startsWith('http') ? 'external-link' : 'internal-link',
          value: link[1] ?? '',
          href
        })
      } else {
        result.push({ type: 'text', value: link?.[1] ?? raw })
      }
    }

    cursor = index + raw.length
  }

  if (cursor < props.text.length) {
    result.push({ type: 'text', value: props.text.slice(cursor) })
  }

  return result
})
</script>

<style lang="scss" scoped>
code {
  padding: 0.08em 0.28em;
  border-radius: 0.25rem;
  background: color-mix(in srgb, currentColor 9%, transparent);
  color: var(--p-text-color);
  font-family: var(--font-code);
  font-size: 1em;
}

strong {
  color: var(--p-text-color);
  font-weight: 600;
}

a {
  color: var(--p-text-color);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
  text-underline-offset: 0.18em;

  &:hover,
  &:focus-visible {
    text-decoration-color: currentColor;
  }
}
</style>
