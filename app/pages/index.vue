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
        Upload HTML, CSS and JS files as a project. It goes live at
        <span class="url">{{ contentHost }}/{username}/{project}</span>
      </p>
      <div class="actions">
        <template v-if="authUser">
          <Button as-child v-slot="slotProps" severity="secondary">
            <NuxtLink to="/dashboard" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
              <ThLarge aria-hidden="true" />
              <span>Dashboard</span>
            </NuxtLink>
          </Button>
          <Button as-child v-slot="slotProps">
            <NuxtLink to="/new" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
              <Plus aria-hidden="true" />
              <span>Create Project</span>
            </NuxtLink>
          </Button>
        </template>
        <Button v-else as-child v-slot="slotProps">
          <NuxtLink to="/sign" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
            <SignIn aria-hidden="true" />
            <span>Log in with BITS</span>
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
import SignIn from '@primeicons/vue/sign-in'
import Plus from '@primeicons/vue/plus'
import ThLarge from '@primeicons/vue/th-large'

useHead({ title: 'Free Static Site Hosting' })

const runtimeConfig = useRuntimeConfig()
const contentHost = String(runtimeConfig.public.contentUrl).replace(/^https?:\/\//, '').replace(/\/+$/, '')

useSeoMeta({
  description: 'DROP hosts static HTML, CSS and JS projects for free.',
  ogTitle: 'DROP — Free Static Site Hosting',
  ogDescription: `Upload HTML, CSS and JS files and publish them at ${contentHost}/{username}/{project}.`
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
const { user: authUser } = useAuthUser()

// 背景点阵：浅色深灰点 / 深色白点，整体低透明度，不抢字标
const dotFrom = computed(() => (isDark.value ? 'rgba(250, 250, 250, 0.34)' : 'rgba(9, 9, 11, 0.30)'))
const dotTo = computed(() => (isDark.value ? 'rgba(250, 250, 250, 0.08)' : 'rgba(9, 9, 11, 0.08)'))
const glow = computed(() => (isDark.value ? 'rgba(250, 250, 250, 0.14)' : 'rgba(9, 9, 11, 0.10)'))

const highlights = [
  { index: '01', title: 'Free hosting', text: 'Every project is published as a static site — no build step required.' },
  { index: '02', title: 'One account', text: 'Sign in with BITS. Your profile and username are shared across both sites.' },
  { index: '03', title: 'Database only', text: 'Files live in the database, not on disk. Nothing to sync or deploy manually.' }
]
</script>

<style lang="scss" scoped>
.home {
  position: relative;
  width: 90%;
  max-width: 1300px;
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

.url {
  display: block;
  margin-top: 0.5rem;
  color: var(--p-text-color);
  font-family: var(--font-code);
  font-size: 0.85em;
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
