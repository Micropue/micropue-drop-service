<template>
  <div class="docs-page">
    <header class="docs-header">
      <div class="header-copy">
        <h1>{{ messages.header.title }}</h1>
        <p class="lead">{{ messages.header.lead }}</p>
      </div>
      <div class="header-actions">
        <label class="language-switch">
          <Globe aria-hidden="true" />
          <span class="language-caption">{{ messages.header.language }}</span>
          <select :value="locale" :aria-label="messages.header.language" @change="changeLocale">
            <option v-for="option in docsLocaleOptions" :key="option.code" :value="option.code">
              {{ option.label }}
            </option>
          </select>
        </label>
        <Button as-child v-slot="slotProps" severity="secondary">
          <NuxtLink to="/developers/keys" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
            <Key aria-hidden="true" />
            <span>{{ messages.header.apiKeys }}</span>
          </NuxtLink>
        </Button>
        <Button as-child v-slot="slotProps" severity="secondary">
          <a href="/v1/openapi.json" target="_blank" rel="noopener noreferrer" :class="slotProps.class"
            v-bind="slotProps.a11yAttrs">
            <Book aria-hidden="true" />
            <span>{{ messages.header.openApi }}</span>
          </a>
        </Button>
      </div>
    </header>

    <div class="docs-layout">
      <aside class="docs-sidebar">
        <nav class="side-nav" aria-label="MCP, CLI, API">
          <section>
            <p class="nav-title">{{ messages.nav.mcpTitle }}</p>
            <a v-for="([href, label]) in messages.nav.mcp" :key="href" :href="href">{{ label }}</a>
          </section>

          <section>
            <p class="nav-title">{{ messages.nav.cliTitle }}</p>
            <a v-for="([href, label]) in messages.nav.cli" :key="href" :href="href">{{ label }}</a>
          </section>

          <section>
            <p class="nav-title">{{ messages.nav.apiTitle }}</p>
            <a v-for="([href, label]) in messages.nav.api" :key="href" :href="href">{{ label }}</a>
          </section>
        </nav>

        <div class="sidebar-card">
          <span class="sidebar-label">{{ messages.nav.startLabel }}</span>
          <p>{{ messages.nav.startBody }}</p>
          <NuxtLink to="/developers/keys">{{ messages.nav.startLink }} <span aria-hidden="true">→</span></NuxtLink>
        </div>
      </aside>

      <main class="docs-content">
        <section class="doc-section overview-section">
          <p class="breadcrumb">{{ messages.overview.breadcrumb }}</p>
          <h2>{{ messages.overview.title }}</h2>
          <p>{{ messages.overview.body }}</p>

          <div class="feature-grid">
            <a v-for="card in messages.overview.cards" :key="card.href" :href="card.href" class="feature-card">
              <span class="feature-kicker">{{ card.kicker }}</span>
              <h3>{{ card.title }}</h3>
              <DocsInline :text="card.body" />
              <span class="feature-meta"><DocsInline :text="card.meta" /></span>
            </a>
          </div>

          <div class="callout">
            <strong>{{ messages.overview.scopeTitle }}</strong>
            <div class="scope-list">
              <code v-for="scope in messages.overview.scopes" :key="scope">{{ scope }}</code>
            </div>
          </div>
        </section>

        <section id="mcp" class="doc-section">
          <div class="section-label-row">
            <p class="breadcrumb">{{ messages.mcp.breadcrumb }}</p>
            <span class="status-badge">{{ messages.mcp.status }}</span>
          </div>
          <h2>{{ messages.mcp.title }}</h2>
          <p>{{ messages.mcp.intro }}</p>
          <a class="repo-link" :href="mcpGithubUrl" target="_blank" rel="noopener noreferrer">
            <Github aria-hidden="true" />
            <span>{{ messages.footer.github }}</span>
            <code>github.com/Micropue/micropue-drop-MCP</code>
            <ArrowUpRight aria-hidden="true" />
          </a>

          <div class="quick-facts">
            <div v-for="fact in messages.mcp.facts" :key="fact[0]">
              <span>{{ fact[0] }}</span>
              <DocsInline :text="fact[1]" />
            </div>
          </div>

          <h3>{{ messages.mcp.installTitle }}</h3>
          <DocsInline :text="messages.mcp.installBody" />
          <DocsCodeBlock :code="mcpInstallCommand" :label="messages.common.terminal"
            :copy-label="messages.common.copy" :copied-label="messages.common.copied" prompt />

          <h3 id="mcp-quickstart">{{ messages.mcp.quickstartTitle }}</h3>
          <ol class="steps">
            <li v-for="([title, body], index) in messages.mcp.steps" :key="title">
              <span class="step-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <strong>{{ title }}</strong>
                <p><DocsInline :text="body" /></p>
              </div>
            </li>
          </ol>

          <h3 id="mcp-clients">{{ messages.mcp.clientsTitle }}</h3>
          <p><DocsInline :text="messages.mcp.clientsBody" /></p>

          <div class="config-grid">
            <article class="config-card">
              <div class="config-head">
                <div>
                  <span class="config-client">{{ messages.mcp.codexCard.client }}</span>
                  <h4><DocsInline :text="messages.mcp.codexCard.file" /></h4>
                </div>
              </div>
              <DocsCodeBlock :code="codexConfig" label="TOML" compact :copy-label="messages.common.copy"
                :copied-label="messages.common.copied" />
              <p><DocsInline :text="messages.mcp.codexCard.note" /></p>
            </article>

            <article class="config-card">
              <div class="config-head">
                <div>
                  <span class="config-client">{{ messages.mcp.jsonCard.client }}</span>
                  <h4><DocsInline :text="messages.mcp.jsonCard.file" /></h4>
                </div>
              </div>
              <DocsCodeBlock :code="jsonConfig" label="JSON" compact :copy-label="messages.common.copy"
                :copied-label="messages.common.copied" />
              <p><DocsInline :text="messages.mcp.jsonCard.note" /></p>
            </article>
          </div>

          <div class="note-row">
            <p><DocsInline :text="messages.mcp.restartNote" /></p>
            <p><DocsInline :text="messages.mcp.pathsNote" /></p>
          </div>

          <h3 id="mcp-tools">{{ messages.mcp.toolsTitle }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th v-for="column in messages.mcp.toolColumns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in messages.mcp.toolRows" :key="row.join('|')">
                  <td v-for="(cell, index) in row" :key="index"><DocsInline :text="cell" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="table-note"><DocsInline :text="messages.mcp.toolsNote" /></p>

          <h3 id="mcp-environment">{{ messages.mcp.envTitle }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th v-for="column in messages.mcp.envColumns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in messages.mcp.envRows" :key="row.join('|')">
                  <td v-for="(cell, index) in row" :key="index"><DocsInline :text="cell" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 id="mcp-limits">{{ messages.mcp.limitsTitle }}</h3>
          <div class="limits-grid">
            <div v-for="limit in messages.mcp.limits" :key="limit[1]">
              <strong>{{ limit[0] }}</strong>
              <span>{{ limit[1] }}</span>
            </div>
          </div>
          <ul class="check-list">
            <li v-for="item in messages.mcp.safety" :key="item"><DocsInline :text="item" /></li>
          </ul>

          <h3 id="mcp-errors">{{ messages.mcp.troubleshootingTitle }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th v-for="column in messages.mcp.troubleshootingColumns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in messages.mcp.troubleshootingRows" :key="row.join('|')">
                  <td v-for="(cell, index) in row" :key="index"><DocsInline :text="cell" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="cli" class="doc-section">
          <div class="section-label-row">
            <p class="breadcrumb">{{ messages.cli.breadcrumb }}</p>
            <span class="status-badge">{{ messages.cli.status }}</span>
          </div>
          <h2>{{ messages.cli.title }}</h2>
          <p>{{ messages.cli.intro }}</p>
          <a class="repo-link" :href="cliGithubUrl" target="_blank" rel="noopener noreferrer">
            <Github aria-hidden="true" />
            <span>{{ messages.footer.github }}</span>
            <code>github.com/Micropue/micropue-drop-CLI</code>
            <ArrowUpRight aria-hidden="true" />
          </a>

          <div class="quick-facts">
            <div v-for="fact in messages.cli.facts" :key="fact[0]">
              <span>{{ fact[0] }}</span>
              <DocsInline :text="fact[1]" />
            </div>
          </div>

          <h3 id="cli-install">{{ messages.cli.installTitle }}</h3>
          <p><DocsInline :text="messages.cli.installBody" /></p>
          <DocsCodeBlock :code="cliInstallCommand" :label="messages.common.terminal"
            :copy-label="messages.common.copy" :copied-label="messages.common.copied" prompt />
          <DocsCodeBlock :code="cliTemporaryCommand" label="npx" :copy-label="messages.common.copy"
            :copied-label="messages.common.copied" prompt />
          <div class="callout">
            <DocsInline :text="messages.cli.requirementNote" />
          </div>

          <h3 id="cli-auth">{{ messages.cli.authTitle }}</h3>
          <p><DocsInline :text="messages.cli.authBody" /></p>
          <DocsCodeBlock :code="cliAuthCommands" :label="messages.common.terminal"
            :copy-label="messages.common.copy" :copied-label="messages.common.copied" prompt />
          <p><DocsInline :text="messages.cli.authNote" /></p>

          <h3 id="cli-quickstart">{{ messages.cli.quickstartTitle }}</h3>
          <ol class="steps">
            <li v-for="([title, body], index) in messages.cli.quickstartSteps" :key="title">
              <span class="step-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <strong>{{ title }}</strong>
                <p><DocsInline :text="body" /></p>
              </div>
            </li>
          </ol>
          <DocsCodeBlock :code="cliQuickstartCommands" :label="messages.common.terminal"
            :copy-label="messages.common.copy" :copied-label="messages.common.copied" prompt />
          <div class="note-row single">
            <p><DocsInline :text="messages.cli.watchNote" /></p>
          </div>

          <h3 id="cli-commands">{{ messages.cli.commandsTitle }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th v-for="column in messages.cli.commandColumns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in messages.cli.commandRows" :key="row.join('|')">
                  <td v-for="(cell, index) in row" :key="index"><DocsInline :text="cell" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>{{ messages.cli.optionsTitle }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th v-for="column in messages.cli.optionColumns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in messages.cli.optionRows" :key="row.join('|')">
                  <td v-for="(cell, index) in row" :key="index"><DocsInline :text="cell" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 id="cli-files">{{ messages.cli.filesTitle }}</h3>
          <p><DocsInline :text="messages.cli.filesBody" /></p>
          <p><DocsInline :text="messages.cli.ignoreBody" /></p>
          <DocsCodeBlock :code="cliIgnoreExample" label=".drop-ignore" :copy-label="messages.common.copy"
            :copied-label="messages.common.copied" />

          <h3 id="cli-ci">{{ messages.cli.ciTitle }}</h3>
          <p><DocsInline :text="messages.cli.ciBody" /></p>
          <DocsCodeBlock :code="cliCiCommand" label="CI" :copy-label="messages.common.copy"
            :copied-label="messages.common.copied" />

          <h3 id="cli-errors">{{ messages.cli.errorsTitle }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th v-for="column in messages.cli.errorColumns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in messages.cli.errorRows" :key="row.join('|')">
                  <td v-for="(cell, index) in row" :key="index"><DocsInline :text="cell" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="api" class="doc-section">
          <div class="section-label-row">
            <p class="breadcrumb">{{ messages.api.breadcrumb }}</p>
            <span class="status-badge">{{ messages.api.status }}</span>
          </div>
          <h2>{{ messages.api.title }}</h2>
          <p><DocsInline :text="messages.api.intro" /></p>
          <div class="base-url">
            <span>{{ messages.api.baseLabel }}</span>
            <code>https://drop.micropue.com.cn/v1</code>
          </div>

          <h3 id="api-auth">{{ messages.api.authTitle }}</h3>
          <p><DocsInline :text="messages.api.authBody" /></p>
          <DocsCodeBlock code="Authorization: Bearer $DROP_API_KEY" label="HTTP"
            :copy-label="messages.common.copy" :copied-label="messages.common.copied" />
          <ul class="check-list">
            <li v-for="scope in messages.api.scopes" :key="scope"><DocsInline :text="scope" /></li>
          </ul>

          <h3 id="api-endpoints">{{ messages.api.endpointsTitle }}</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th v-for="column in messages.api.endpointColumns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in messages.api.endpointRows" :key="row.join('|')">
                  <td v-for="(cell, index) in row" :key="index"><DocsInline :text="cell" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 id="api-deploy">{{ messages.api.deployTitle }}</h3>
          <p>{{ messages.api.deployBody }}</p>
          <DocsCodeBlock :code="deployCurl" label="curl" :copy-label="messages.common.copy"
            :copied-label="messages.common.copied" />
          <p><DocsInline :text="messages.api.deployNote" /></p>

          <h3 id="api-limits">{{ messages.api.limitsTitle }}</h3>
          <div class="limits-grid">
            <div v-for="limit in messages.api.limits" :key="limit[1]">
              <strong>{{ limit[0] }}</strong>
              <span>{{ limit[1] }}</span>
            </div>
          </div>
          <p><DocsInline :text="messages.api.limitsBody" /></p>

          <h3 id="api-errors">{{ messages.api.errorsTitle }}</h3>
          <p><DocsInline :text="messages.api.errorsBody" /></p>
          <DocsCodeBlock :code="errorExample" label="JSON" :copy-label="messages.common.copy"
            :copied-label="messages.common.copied" />
        </section>

        <footer class="docs-footer">
          <p>{{ messages.footer.note }}</p>
          <div>
            <a href="https://www.npmjs.com/package/@micropue/drop-mcp" target="_blank"
              rel="noopener noreferrer">{{ messages.footer.npm }}</a>
            <a href="https://github.com/Micropue/micropue-drop-MCP" target="_blank"
              rel="noopener noreferrer">{{ messages.footer.github }}</a>
            <a href="/v1/openapi.json" target="_blank" rel="noopener noreferrer">{{ messages.footer.openApi }}</a>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import ArrowUpRight from '@primeicons/vue/arrow-up-right'
import Book from '@primeicons/vue/book'
import Globe from '@primeicons/vue/globe'
import Github from '@primeicons/vue/github'
import Key from '@primeicons/vue/key'
import en from '~/i18n/developers/en'
import { docsLocaleOptions, docsMessages, isDocsLocale, type DocsLocale } from '~/i18n/developers'

type EnglishMessages = typeof en

const localeCookie = useCookie<DocsLocale>('drop_docs_locale', {
  default: () => 'en',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 365
})

const locale = computed<DocsLocale>(() => (
  isDocsLocale(localeCookie.value) ? localeCookie.value : 'en'
))
const messages = computed<EnglishMessages>(() => docsMessages[locale.value] as EnglishMessages)
const localeOption = computed(() => (
  docsLocaleOptions.find(option => option.code === locale.value) ?? docsLocaleOptions[0]
))

function changeLocale(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (isDocsLocale(value)) localeCookie.value = value
}

useHead({
  title: computed(() => messages.value.meta.title),
  htmlAttrs: {
    lang: computed(() => localeOption.value.htmlLang)
  },
  meta: [
    { name: 'description', content: computed(() => messages.value.meta.description) },
    { property: 'og:locale', content: computed(() => localeOption.value.ogLocale) },
    { property: 'og:title', content: computed(() => `${messages.value.meta.title} | DROP`) },
    { property: 'og:description', content: computed(() => messages.value.meta.description) },
    { name: 'twitter:title', content: computed(() => `${messages.value.meta.title} | DROP`) },
    { name: 'twitter:description', content: computed(() => messages.value.meta.description) }
  ]
})

const mcpGithubUrl = 'https://github.com/Micropue/micropue-drop-MCP'
const cliGithubUrl = 'https://github.com/Micropue/micropue-drop-CLI'
const mcpInstallCommand = 'npx -y @micropue/drop-mcp'

const codexConfig = `[mcp_servers.drop]
command = "npx"
args = ["-y", "@micropue/drop-mcp"]
env = { DROP_API_KEY = "YOUR_DROP_API_KEY" }
startup_timeout_sec = 20`

const jsonConfig = `{
  "mcpServers": {
    "drop": {
      "command": "npx",
      "args": ["-y", "@micropue/drop-mcp"],
      "env": {
        "DROP_API_KEY": "YOUR_DROP_API_KEY"
      }
    }
  }
}`

const cliInstallCommand = 'npm install -g @micropue/drop-cli'
const cliTemporaryCommand = 'npx @micropue/drop-cli --help'
const cliAuthCommands = `drop login
drop whoami`
const cliQuickstartCommands = `cd my-site
drop login
drop`
const cliIgnoreExample = `drafts/
*.map
private-notes.html`
const cliCiCommand = `npm install -g @micropue/drop-cli
drop deploy dist --slug my-site --name "My Site"`

const deployCurl = `curl -X POST "https://drop.micropue.com.cn/v1/projects/$PROJECT_ID/deploy" \\
  -H "Authorization: Bearer $DROP_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "files": [
      { "path": "index.html", "content": "<!doctype html><h1>Version 2</h1>" }
    ],
    "message": "update hero"
  }'`

const errorExample = `{
  "type": "https://drop.micropue.com.cn/developers/errors/slug-taken",
  "title": "Slug already taken",
  "status": 409,
  "code": "slug_taken",
  "detail": "Choose a different slug.",
  "requestId": "req_..."
}`
</script>

<style lang="scss" scoped>
.docs-page {
  width: 90%;
  max-width: 1300px;
  margin: 0 auto;
  padding: 2.5rem 0 6rem;
  font-size: 1em;
}

.docs-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
}

.header-copy {
  max-width: 780px;
}

h1 {
  margin: 0 0 0.7rem;
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.04em;
}

.lead {
  max-width: 720px;
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 1em;
  line-height: 1.75;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;

  :deep(.p-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 36px;
    font-size: 1em;
    white-space: nowrap;
    text-decoration: none;
  }

  :deep(.p-button svg) {
    width: 0.85rem;
    height: 0.85rem;
  }
}

.language-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  height: 36px;
  padding: 0 0.55rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 999px;
  color: var(--p-text-muted-color);
  font-size: 1em;
  transition: border-color 0.15s, color 0.15s;

  &:focus-within,
  &:hover {
    border-color: color-mix(in srgb, var(--p-text-color) 45%, var(--p-content-border-color));
    color: var(--p-text-color);
  }

  >svg {
    flex: none;
    width: 0.85rem;
    height: 0.85rem;
  }

  select {
    max-width: 7.5rem;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--p-text-color);
    font: inherit;
    cursor: pointer;

    option {
      background: var(--p-content-background);
      color: var(--p-text-color);
    }
  }
}

.docs-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 4rem);
  margin-top: 2.5rem;
}

.docs-sidebar {
  position: sticky;
  top: 1.5rem;
  align-self: start;
}

.side-nav {
  padding-right: 1rem;
  border-right: 1px solid var(--p-content-border-color);

  section+section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--p-content-border-color);
  }

  .nav-title {
    margin: 0 0 0.55rem;
  }

  a {
    display: block;
    padding: 0.28rem 0;
    color: var(--p-text-muted-color);
    font-size: 1em;
    line-height: 1.45;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      color: var(--p-text-color);
    }
  }
}

.sidebar-card {
  margin-top: 1.5rem;
  padding: 0.9rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.65rem;
  background: color-mix(in srgb, var(--p-text-color) 3%, var(--p-content-background));

  p {
    margin: 0.45rem 0 0.7rem;
    color: var(--p-text-muted-color);
    font-size: 1em;
    line-height: 1.6;
  }

  a {
    color: var(--p-text-color);
    font-size: 1em;
    text-decoration: none;
  }
}

.docs-content {
  min-width: 0;
  max-width: 900px;
}

.doc-section {
  scroll-margin-top: 1.5rem;

  &+& {
    margin-top: 5rem;
    padding-top: 4rem;
    border-top: 1px solid var(--p-content-border-color);
  }

  h2 {
    margin: 0.25rem 0 0.9rem;
    font-size: clamp(1.7rem, 3vw, 2.3rem);
    letter-spacing: -0.035em;
  }

  h3 {
    margin: 2.6rem 0 0.8rem;
    scroll-margin-top: 1.5rem;
    font-size: 1.1rem;
  }

  h4 {
    margin: 0;
    font-size: 1em;
    font-weight: 500;
  }

  p,
  li {
    color: var(--p-text-muted-color);
    line-height: 1.75;
  }

  p {
    margin: 0 0 1rem;
  }

  a {
    color: var(--p-text-color);
  }
}

.overview-section {
  padding-top: 0.2rem;
}

.breadcrumb,
.nav-title,
.sidebar-label,
.feature-kicker,
.config-client {
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 1em;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.breadcrumb {
  margin: 0;
}

.section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.status-badge {
  padding: 0.25rem 0.45rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 999px;
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 1em;
}

.repo-link {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  max-width: 100%;
  margin-top: 1rem;
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.55rem;
  color: var(--p-text-muted-color);
  font-size: 1em;
  text-decoration: none;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease;

  code {
    overflow-wrap: anywhere;
    color: var(--p-text-color);
    font-family: var(--font-code);
    font-size: 1em;
  }

  &:hover,
  &:focus-visible {
    border-color: color-mix(in srgb, var(--p-primary-color) 45%, var(--p-content-border-color));
    background: color-mix(in srgb, var(--p-primary-color) 7%, transparent);
    color: var(--p-text-color);
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
  margin: 1.4rem 0;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin: 1.4rem 0;
}

.feature-card,
.config-card {
  padding: 1.15rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--p-text-color) 2%, var(--p-content-background));
}

.feature-card {
  display: flex;
  flex-direction: column;
  color: var(--p-text-color);
  font-size: 1em;
  line-height: 1.65;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s;

  &:hover,
  &:focus-visible {
    border-color: color-mix(in srgb, var(--p-text-color) 28%, var(--p-content-border-color));
    background: var(--p-content-hover-background);
  }

  h3 {
    margin: 0.55rem 0 0.45rem;
    font-size: 1rem;
  }
}

.feature-kicker {
  display: block;
}

.feature-meta {
  display: block;
  margin-top: auto;
  padding-top: 0.85rem;
  font-size: 1em;
}

.callout {
  margin: 1.2rem 0;
  padding: 0.9rem 1rem;
  border-left: 2px solid var(--p-text-color);
  background: color-mix(in srgb, var(--p-text-color) 4%, var(--p-content-background));
  color: var(--p-text-muted-color);
  font-size: 1em;
  line-height: 1.7;
}

.scope-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.65rem;

  code {
    padding: 0.2rem 0.4rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.3rem;
    font-family: var(--font-code);
    font-size: 1em;
  }
}

.quick-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 1.4rem 0 2rem;

  >div {
    padding: 0.8rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.6rem;
  }

  span {
    display: block;
    margin-bottom: 0.35rem;
    color: var(--p-text-muted-color);
    font-size: 1em;
  }

  :deep(strong),
  :deep(code) {
    display: inline;
    overflow-wrap: anywhere;
    color: var(--p-text-color);
    font-size: 1em;
  }
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin: 1rem 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    gap: 0.8rem;
    padding: 0.85rem 0.95rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.65rem;

    p {
      margin: 0.25rem 0 0;
      font-size: 1em;
    }
  }
}

.step-number {
  flex: none;
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 1em;
}

.config-card {
  min-width: 0;

  >p {
    margin: 0;
    font-size: 1em;
    line-height: 1.65;
  }
}

.config-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.note-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.9rem;

  &.single {
    grid-template-columns: minmax(0, 1fr);
  }

  p {
    margin: 0;
    padding: 0.75rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.6rem;
    font-size: 1em;
  }
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.7rem;
}

table {
  width: 100%;
  min-width: 620px;
  border-collapse: collapse;
  font-size: 1em;

  th,
  td {
    padding: 0.68rem 0.75rem;
    border-bottom: 1px solid var(--p-content-border-color);
    text-align: left;
    vertical-align: top;
  }

  th {
    color: var(--p-text-muted-color);
    font-weight: 600;
    white-space: nowrap;
  }

  td {
    color: var(--p-text-muted-color);
    line-height: 1.55;
  }

  tr:last-child td {
    border-bottom: 0;
  }
}

.table-note {
  margin-top: 0.7rem;
  font-size: 1em;
}

.limits-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  margin: 1rem 0;

  div {
    padding: 0.8rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.6rem;
  }

  strong,
  span {
    display: block;
  }

  strong {
    font-size: 1.1rem;
  }

  span {
    margin-top: 0.2rem;
    color: var(--p-text-muted-color);
    font-size: 1em;
  }
}

.check-list {
  margin: 1rem 0;
  padding-left: 1.1rem;

  li {
    margin: 0.35rem 0;
    font-size: 1em;
  }
}

.base-url {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 1.2rem 0 2rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.6rem;

  span {
    flex: none;
    color: var(--p-text-muted-color);
    font-family: var(--font-code);
    font-size: 1em;
    letter-spacing: 0.1em;
  }

  code {
    overflow-wrap: anywhere;
    font-family: var(--font-code);
    font-size: 1em;
  }
}

.docs-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 4rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--p-content-border-color);

  p {
    margin: 0;
    color: var(--p-text-muted-color);
    font-size: 1em;
  }

  div {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
  }

  a {
    color: var(--p-text-muted-color);
    font-size: 1em;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      color: var(--p-text-color);
    }
  }
}

@media screen and (max-width: 1120px) {
  .docs-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }
}

@media screen and (max-width: 980px) {
  .docs-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .docs-sidebar {
    position: static;
  }

  .side-nav {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
    padding-right: 0;
    border-right: 0;

    section+section {
      margin-top: 0;
      padding-top: 0;
      border-top: 0;
    }
  }

  .sidebar-card {
    display: none;
  }

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media screen and (max-width: 700px) {
  .docs-sidebar {
    display: none;
  }

  .feature-grid,
  .config-grid,
  .note-row {
    grid-template-columns: 1fr;
  }

  .quick-facts,
  .limits-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .docs-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media screen and (max-width: 460px) {
  .language-caption {
    display: none;
  }

  .section-label-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.5rem;
  }

  .quick-facts,
  .limits-grid {
    grid-template-columns: 1fr;
  }
}
</style>
