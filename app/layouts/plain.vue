<template>
  <header class="plain-header">
    <BrandLogo />
    <NuxtLink to="/" class="back">Back to DROP</NuxtLink>
  </header>
  <main>
    <slot />
  </main>
</template>

<style scoped lang="scss">
.plain-header {
  width: 90%;
  max-width: 900px;
  margin: 0 auto;
  padding: 1.1rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.back {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
  text-decoration: none;

  &:hover {
    color: var(--p-text-color);
  }
}

main {
  min-height: calc(100vh - 70px);
}
</style>
