<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator :height="2" style="width: 100%;" color="var(--p-text-color)" :throttle="0" :hide-delay="300" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const siteUrl = String(runtimeConfig.public.siteUrl).replace(/\/+$/, '')
const canonicalUrl = computed(() => {
  const path = route.path === '/' ? '/' : route.path.replace(/\/+$/, '')
  return `${siteUrl}${path}`
})

// 各路由用 useHead({ title: '...' }) 设置静态标题，这里统一追加站点后缀
useHead({
  titleTemplate: (title?: string | null) => (title ? `${title} | DROP` : 'DROP'),
  link: [{ rel: 'canonical', href: canonicalUrl }],
  meta: [{ property: 'og:url', content: canonicalUrl }]
})
</script>
