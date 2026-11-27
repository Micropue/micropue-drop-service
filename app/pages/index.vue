<template>
  <div class="home">
    <div class="dot-bg" aria-hidden="true">
      <DotField :dot-radius="2" :dot-spacing="18" :cursor-radius="460" :cursor-force="0.08" :bulge-strength="46"
        :glow-radius="180" :glow-color="glow" sparkle :gradient-from="dotFrom" :gradient-to="dotTo" />
    </div>

    <section class="hero-section">
      <p class="eyebrow">MICROPUE DROP</p>
      <div class="wordmark">
        <h1 class="sr-only">Drop — static sites, deployed free</h1>
        <TechText text="Drop" font-family="Montserrat" :font-weight="600" :font-size="280" :letter-spacing="-0.045"
          :color="ink" :accent-color="ink" reveal="letter" :reach="260" :softness="0.7" line-style="dashed"
          :dash-length="4" :dash-gap="3" :stroke-width="1.5" :specks="18" selection labels :draggable="false" sweep
          :speed="1" aria-hidden="true" />
      </div>
      <p class="lead">
        Publish static HTML, CSS and JS to the public web — from the editor or through your AI tool.
      </p>
      <div class="install-command" aria-label="DROP CLI and MCP installation commands">
        <div class="command-tabs" aria-label="Choose CLI or MCP">
          <button type="button" :class="{ active: activeCommand === 'cli' }"
            :aria-pressed="activeCommand === 'cli'" @click="activeCommand = 'cli'">
            CLI
          </button>
          <button type="button" :class="{ active: activeCommand === 'mcp' }"
            :aria-pressed="activeCommand === 'mcp'" @click="activeCommand = 'mcp'">
            MCP
          </button>
        </div>
        <div class="command-panel">
          <code><span class="prompt">$</span> {{ commands[activeCommand] }}</code>
        </div>
      </div>
      <div class="actions">
        <Button as-child v-slot="slotProps" severity="secondary">
          <NuxtLink to="/dashboard" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
            <ThLarge aria-hidden="true" />
            <span>Dashboard</span>
          </NuxtLink>
        </Button>
        <Button as-child v-slot="slotProps" severity="secondary">
          <NuxtLink to="/developers" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
            <Code aria-hidden="true" />
            <span>Developer</span>
          </NuxtLink>
        </Button>
        <Button as-child v-slot="slotProps">
          <NuxtLink to="/new" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
            <Plus aria-hidden="true" />
            <span>Create Project</span>
          </NuxtLink>
        </Button>
      </div>
    </section>

    <section class="highlights">
      <article v-for="item in highlights" :key="item.title" class="highlight">
        <span class="highlight-index">{{ item.index }}</span>
        <h2>{{ item.title }}</h2>
        <p>{{ item.text }}</p>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Plus from '@primeicons/vue/plus'
import ThLarge from '@primeicons/vue/th-large'
import Code from '@primeicons/vue/code'

useHead({ title: 'Free Static Site Hosting' })

useSeoMeta({
  description: 'Publish static HTML, CSS and JS sites with DROP MCP or the DROP API.',
  ogTitle: 'DROP — Free Static Site Hosting',
  ogDescription: 'Connect your AI tool with @micropue/drop-mcp and publish static sites to DROP.'
})

// TechText 画布不解析 CSS 变量，按系统主题传色
const isDark = ref(false)
let darkQuery: MediaQueryList | null = null
const onSchemeChange = (event: MediaQueryListEvent) => {
  isDark.value = event.matches
}

onMounted(() => {
  darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
  isDark.value = darkQuery.matches
  darkQuery.addEventListener('change', onSchemeChange)
})

onBeforeUnmount(() => {
  darkQuery?.removeEventListener('change', onSchemeChange)
})

const ink = computed(() => (isDark.value ? '#fafafa' : '#09090b'))
// 背景点阵：浅色深灰点 / 深色白点，整体低透明度，不抢字标
const dotFrom = computed(() => (isDark.value ? 'rgba(250, 250, 250, 0.34)' : 'rgba(9, 9, 11, 0.30)'))
const dotTo = computed(() => (isDark.value ? 'rgba(250, 250, 250, 0.08)' : 'rgba(9, 9, 11, 0.08)'))
const glow = computed(() => (isDark.value ? 'rgba(250, 250, 250, 0.14)' : 'rgba(9, 9, 11, 0.10)'))

const activeCommand = ref<'cli' | 'mcp'>('cli')
const commands = {
  cli: 'npm install -g @micropue/drop-cli',
  mcp: 'npx -y @micropue/drop-mcp'
} as const

const highlights = [
  { index: '01', title: 'MCP-native', text: 'Connect Codex, Claude Desktop or Cursor through the @micropue/drop-mcp package.' },
  { index: '02', title: 'Free hosting', text: 'Every project is published as a static site — no build step required.' },
  { index: '03', title: 'One account', text: 'Sign in with BITS. Your profile and username are shared across both sites.' }
]
</script>

<style lang="scss" scoped>
.home {
  position: relative;
  width: 90%;
  max-width: 1300px;
  min-height: calc(100dvh - 70px);
  margin: 0 auto;
  padding: clamp(4rem, 12vh, 9rem) 0 2rem;
}

.dot-bg {
  position: absolute;
  /* 向上探出 70px，铺到顶栏后面（header 高度 70px） */
  top: -70px;
  bottom: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  z-index: 0;
  pointer-events: none;
}

.hero-section,
.highlights {
  position: relative;
  z-index: 1;
}

.hero-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: min(900px, 100%);
  margin: 0 auto;
  text-align: center;
}

.eyebrow {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--p-text-muted-color);
}

.wordmark {
  width: 100%;
  height: clamp(200px, 34vw, 340px);
  margin: -1rem 0;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.lead {
  max-width: 34rem;
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--p-text-muted-color);
}

.install-command {
  width: min(36rem, 100%);
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.7rem;
  background: color-mix(in srgb, var(--p-text-color) 4%, var(--p-content-background));
  overflow: hidden;
  text-align: left;
}

.command-tabs {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0 0.45rem;
  border-bottom: 1px solid var(--p-content-border-color);

  button {
    position: relative;
    padding: 0.65rem 0.55rem 0.6rem;
    border: 0;
    background: transparent;
    color: var(--p-text-muted-color);
    font-family: var(--font-code);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: color 0.15s;

    &::after {
      position: absolute;
      right: 0.45rem;
      bottom: -1px;
      left: 0.45rem;
      height: 2px;
      background: transparent;
      content: '';
    }

    &:hover,
    &:focus-visible {
      color: var(--p-text-color);
    }

    &.active {
      color: var(--p-text-color);

      &::after {
        background: var(--p-text-color);
      }
    }
  }
}

.command-panel {
  padding: 0.9rem 1rem;

  code {
    display: flex;
    gap: 0.55rem;
    overflow-x: auto;
    color: var(--p-text-color);
    font-family: var(--font-code);
    font-size: 0.88rem;
    white-space: nowrap;
  }

  .prompt {
    color: var(--p-text-muted-color);
    user-select: none;
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    text-decoration: none;
  }

  :deep(svg) {
    width: 0.9rem;
    height: 0.9rem;
  }
}

.highlights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: clamp(4rem, 10vh, 7rem);
}

.highlight {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--p-text-color) 3%, var(--p-content-background));

  .highlight-index {
    font-family: var(--font-code);
    font-size: 0.75rem;
    color: var(--p-text-muted-color);
  }

  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.65;
    color: var(--p-text-muted-color);
  }
}

@media screen and (max-width: 760px) {
  .highlights {
    grid-template-columns: 1fr;
  }
}
</style>
