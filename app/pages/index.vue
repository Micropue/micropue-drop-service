<template>
  <div class="home">
    <section class="hero-section">
      <p class="eyebrow">MICROPUE DROP</p>
      <h1 class="hero">
        Static sites,
        <span class="special">deployed free.</span>
      </h1>
      <p class="lead">
        Upload HTML, CSS and JS files as a project. It goes live at
        <span class="url">drop.micropue.com.cn/{username}/{project}</span>
      </p>
      <div class="actions">
        <Button as-child v-slot="slotProps">
          <NuxtLink to="/sign" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
            Log in with BITS
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

useHead({ title: 'Free Static Site Hosting' })
useSeoMeta({
  description: 'DROP hosts static HTML, CSS and JS projects for free.',
  ogTitle: 'DROP — Free Static Site Hosting',
  ogDescription: 'Upload HTML, CSS and JS files and publish them at drop.micropue.com.cn/{username}/{project}.'
})

const highlights = [
  { index: '01', title: 'Free hosting', text: 'Every project is published as a static site — no build step required.' },
  { index: '02', title: 'One account', text: 'Sign in with BITS. Your profile and username are shared across both sites.' },
  { index: '03', title: 'Database only', text: 'Files live in the database, not on disk. Nothing to sync or deploy manually.' }
]
</script>

<style lang="scss" scoped>
.home {
  width: 90%;
  max-width: 1300px;
  margin: 0 auto;
  padding: clamp(4rem, 12vh, 9rem) 0 6rem;
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

.hero {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25em;
  margin: 0;
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 700;
  line-height: 1.15;

  .special {
    font-family: 'Dancing Script';
  }
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
