<template>
  <div class="developers">
    <header class="hero">
      <p class="eyebrow">DROP DEVELOPERS</p>
      <h1>Ship a static site with one request.</h1>
      <p class="lead">
        Use a personal API key to create, update and deploy HTML, CSS and JavaScript projects.
        Every successful deployment is live on the public content domain immediately.
      </p>
      <div class="hero-actions">
        <Button as-child v-slot="slotProps">
          <NuxtLink :to="user ? '/developers/keys' : '/sign'" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
            <Key aria-hidden="true" />
            <span>{{ user ? 'Manage API keys' : 'Sign in to get a key' }}</span>
          </NuxtLink>
        </Button>
        <Button as-child v-slot="slotProps" severity="secondary">
          <NuxtLink to="/developers/docs" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
            <Book aria-hidden="true" />
            <span>Read the docs</span>
          </NuxtLink>
        </Button>
      </div>
    </header>

    <section class="base-card">
      <div>
        <p class="label">API BASE URL</p>
        <code>https://drop.micropue.com.cn/v1</code>
      </div>
      <a href="/v1/openapi.json" target="_blank" rel="noopener noreferrer">OpenAPI 3.1</a>
    </section>

    <section class="quickstart">
      <div class="section-head">
        <div>
          <p class="eyebrow">QUICKSTART</p>
          <h2>Create and publish</h2>
        </div>
        <NuxtLink to="/developers/docs">Full reference →</NuxtLink>
      </div>
      <pre><code>export DROP_API_KEY="drop_sk_..."

curl -X POST https://drop.micropue.com.cn/v1/projects \
  -H "Authorization: Bearer $DROP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hello DROP",
    "slug": "hello-drop",
    "visibility": "public",
    "files": [
      { "path": "index.html", "content": "&lt;!doctype html&gt;&lt;h1&gt;Hello DROP&lt;/h1&gt;" }
    ]
  }'</code></pre>
      <p class="note">The response contains <code>project.url</code>, your public site address.</p>
    </section>

    <section class="features">
      <article>
        <span class="feature-index">01</span>
        <h3>Atomic deploys</h3>
        <p>Send a complete file snapshot. Validation runs before a single row changes.</p>
      </article>
      <article>
        <span class="feature-index">02</span>
        <h3>Scoped keys</h3>
        <p>Give CI only deploy access, or keep a full key for your own automation.</p>
      </article>
      <article>
        <span class="feature-index">03</span>
        <h3>MCP and Skills ready</h3>
        <p>Stable operation IDs and an OpenAPI contract make the API easy to wrap later.</p>
      </article>
    </section>

    <footer class="footnote">
      <p>v1 supports HTML, CSS and JavaScript files only. Images and fonts are planned for v1.1.</p>
      <NuxtLink to="/account">Back to account</NuxtLink>
    </footer>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Book from '@primeicons/vue/book'
import Key from '@primeicons/vue/key'

useHead({ title: 'Developers' })

const { user } = useAuthUser()
</script>

<style lang="scss" scoped>
.developers {
  width: min(1080px, 90%);
  margin: 0 auto;
  padding: clamp(3rem, 9vh, 6rem) 0 5rem;
}

.hero {
  max-width: 820px;

  h1 {
    margin: 0.6rem 0 1rem;
    font-size: clamp(2rem, 4vw, 3.4rem);
    line-height: 1.05;
    letter-spacing: -0.04em;
  }
}

.eyebrow,
.label {
  margin: 0;
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
}

.lead {
  max-width: 680px;
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 1rem;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.8rem;

  :deep(.p-button) {
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

.base-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 2.5rem 0 4rem;
  padding: 1rem 1.2rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--p-text-color) 3%, var(--p-content-background));

  code {
    display: block;
    margin-top: 0.35rem;
    font-family: var(--font-code);
    font-size: 0.88rem;
  }

  a {
    color: var(--p-text-color);
    font-size: 0.82rem;
  }
}

.quickstart {
  padding: 1.5rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 1rem;

  .section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  h2 {
    margin: 0.25rem 0 0;
    font-size: 1.5rem;
  }

  .section-head > a {
    color: var(--p-text-muted-color);
    font-size: 0.82rem;
  }

  pre {
    margin: 0;
    overflow-x: auto;
    padding: 1.1rem;
    border-radius: 0.6rem;
    background: #18181b;
    color: #fafafa;
    font-family: var(--font-code);
    font-size: 0.78rem;
    line-height: 1.55;
  }

  .note {
    margin: 0.9rem 0 0;
    color: var(--p-text-muted-color);
    font-size: 0.82rem;
  }
}

.features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;

  article {
    padding: 1.4rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.9rem;
  }

  h3 {
    margin: 0.9rem 0 0.5rem;
    font-size: 1rem;
  }

  p {
    margin: 0;
    color: var(--p-text-muted-color);
    font-size: 0.84rem;
    line-height: 1.65;
  }
}

.feature-index {
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 0.72rem;
}

.footnote {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2.5rem;
  color: var(--p-text-muted-color);
  font-size: 0.8rem;

  p {
    margin: 0;
  }

  a {
    color: var(--p-text-color);
    white-space: nowrap;
  }
}

@media (max-width: 760px) {
  .features {
    grid-template-columns: 1fr;
  }

  .base-card,
  .footnote {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
