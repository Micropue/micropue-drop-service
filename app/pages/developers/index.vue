<template>
  <div class="docs-page">
    <header class="docs-header">
      <div class="header-copy">
        <p class="eyebrow">DROP DOCUMENTATION</p>
        <h1>Build with DROP</h1>
        <p class="lead">
          Connect AI tools to your account with Drop MCP, or automate deployments with the REST API.
          Both use a personal API key and publish the same static HTML, CSS and JavaScript projects.
        </p>
      </div>
      <div class="header-actions">
        <Button as-child v-slot="slotProps" severity="secondary">
          <NuxtLink to="/developers/keys" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
            <Key aria-hidden="true" />
            <span>API Keys</span>
          </NuxtLink>
        </Button>
        <Button as-child v-slot="slotProps" severity="secondary">
          <a href="/v1/openapi.json" target="_blank" rel="noopener noreferrer" :class="slotProps.class"
            v-bind="slotProps.a11yAttrs">
            <Book aria-hidden="true" />
            <span>OpenAPI</span>
          </a>
        </Button>
      </div>
    </header>

    <nav class="category-strip" aria-label="Documentation categories">
      <a href="#ai-tools">
        <span class="category-index">01</span>
        <span>
          <strong>AI Tools</strong>
          <small>Keys and integrations</small>
        </span>
      </a>
      <a href="#mcp">
        <span class="category-index">02</span>
        <span>
          <strong>MCP</strong>
          <small>Setup, tools and limits</small>
        </span>
      </a>
      <a href="#api">
        <span class="category-index">03</span>
        <span>
          <strong>API</strong>
          <small>REST reference for v1</small>
        </span>
      </a>
    </nav>

    <div class="docs-layout">
      <aside class="docs-sidebar">
        <nav class="side-nav" aria-label="On this page">
          <section>
            <p class="nav-title">MCP</p>
            <a href="#mcp">Overview</a>
            <a href="#mcp-quickstart">Quick start</a>
            <a href="#mcp-clients">Client configuration</a>
            <a href="#mcp-tools">Tools</a>
            <a href="#mcp-environment">Environment</a>
            <a href="#mcp-limits">Limits and safety</a>
            <a href="#mcp-errors">Troubleshooting</a>
          </section>

          <section>
            <p class="nav-title">API</p>
            <a href="#api">Overview</a>
            <a href="#api-auth">Authentication</a>
            <a href="#api-endpoints">Endpoints</a>
            <a href="#api-deploy">Deploy a project</a>
            <a href="#api-limits">Limits</a>
            <a href="#api-errors">Errors</a>
          </section>
        </nav>

        <div class="sidebar-card">
          <span class="sidebar-label">START HERE</span>
          <p>Create a key with the scopes your integration needs.</p>
          <NuxtLink to="/developers/keys">Manage API keys <span aria-hidden="true">→</span></NuxtLink>
        </div>
      </aside>

      <main class="docs-content">
        <section id="ai-tools" class="doc-section first-section">
          <p class="breadcrumb">AI TOOLS</p>
          <h2>Connect DROP to your AI workflow</h2>
          <p>
            DROP works with tools that can read a local site and publish it for you. Use Drop MCP
            with an MCP-capable client, or use the REST API from a custom Skill, script or CI job.
            Personal API keys are shared across both paths.
          </p>

          <div class="feature-grid">
            <a href="#mcp" class="feature-card">
              <span class="feature-kicker">RECOMMENDED</span>
              <h3>Drop MCP</h3>
              <p>Let Codex, Claude Desktop, Cursor or another MCP client publish a local static site.</p>
              <code>@micropue/drop-mcp</code>
            </a>
            <NuxtLink to="/developers/keys" class="feature-card">
              <span class="feature-kicker">AUTHENTICATION</span>
              <h3>Personal API keys</h3>
              <p>Choose scopes and an expiry date. The full key is shown only once after creation.</p>
              <span class="card-link">Manage keys →</span>
            </NuxtLink>
          </div>

          <div class="callout">
            <strong>Minimum scopes for Drop MCP</strong>
            <div class="scope-list">
              <code>projects:read</code>
              <code>projects:write</code>
              <code>deployments:write</code>
            </div>
          </div>
        </section>

        <section id="mcp" class="doc-section">
          <div class="section-label-row">
            <p class="breadcrumb">AI TOOLS <span>/</span> MCP</p>
            <span class="status-badge">stdio · local process</span>
          </div>
          <h2>Drop MCP</h2>
          <p>
            Drop MCP is a local MCP server that reads HTML, CSS and JavaScript files, validates the
            connection, and creates or atomically replaces a DROP project. The MCP client starts the
            process; DROP does not expose this server through a remote HTTP MCP endpoint.
          </p>

          <div class="quick-facts">
            <div>
              <span>Package</span>
              <code>@micropue/drop-mcp</code>
            </div>
            <div>
              <span>Runtime</span>
              <strong>Node.js 20.12+</strong>
            </div>
            <div>
              <span>Transport</span>
              <strong>stdio</strong>
            </div>
          </div>

          <h3>Install or run the package</h3>
          <p>
            No global installation is required. MCP clients can start the published package with
            <code>npx</code>. Diagnostics are written to <code>stderr</code>; <code>stdout</code> is
            reserved for MCP protocol messages.
          </p>
          <div class="code-block">
            <div class="code-head">
              <span>Terminal</span>
              <button type="button" @click="copyCode('install', installCommand)">
                <Copy aria-hidden="true" />
                <span>{{ copied === 'install' ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
            <pre><code><span class="prompt">$</span> {{ installCommand }}</code></pre>
          </div>

          <h3 id="mcp-quickstart">Quick start</h3>
          <ol class="steps">
            <li>
              <span class="step-number">01</span>
              <div>
                <strong>Create an API key</strong>
                <p>
                  In <NuxtLink to="/developers/keys">API Keys</NuxtLink>, create a key with
                  <code>projects:read</code>, <code>projects:write</code> and
                  <code>deployments:write</code>.
                </p>
              </div>
            </li>
            <li>
              <span class="step-number">02</span>
              <div>
                <strong>Configure your MCP client</strong>
                <p>Add Drop MCP with Node.js installed and the API key available in the client's environment.</p>
              </div>
            </li>
            <li>
              <span class="step-number">03</span>
              <div>
                <strong>Ask the client to publish</strong>
                <p>
                  Call <code>drop_whoami</code> first, then publish a local directory with
                  <code>drop_publish_site</code>. Trust only the <code>url</code> returned by the tool.
                </p>
              </div>
            </li>
          </ol>

          <h3 id="mcp-clients">Client configuration</h3>
          <p>
            All clients start the same local command. Set <code>DROP_ALLOWED_ROOTS</code> to a
            dedicated absolute sites directory so the MCP process cannot read unrelated local files.
          </p>

          <div class="config-grid">
            <article class="config-card">
              <div class="config-head">
                <div>
                  <span class="config-client">Codex</span>
                  <h4><code>~/.codex/config.toml</code></h4>
                </div>
              </div>
              <div class="code-block compact">
                <div class="code-head">
                  <span>TOML</span>
                  <button type="button" @click="copyCode('codex', codexConfig)">
                    <Copy aria-hidden="true" />
                    <span>{{ copied === 'codex' ? 'Copied' : 'Copy' }}</span>
                  </button>
                </div>
                <pre><code>{{ codexConfig }}</code></pre>
              </div>
              <p>Replace the placeholder key and directory with your own values.</p>
            </article>

            <article class="config-card">
              <div class="config-head">
                <div>
                  <span class="config-client">Claude Desktop · Cursor</span>
                  <h4>MCP JSON</h4>
                </div>
              </div>
              <div class="code-block compact">
                <div class="code-head">
                  <span>JSON</span>
                  <button type="button" @click="copyCode('json', jsonConfig)">
                    <Copy aria-hidden="true" />
                    <span>{{ copied === 'json' ? 'Copied' : 'Copy' }}</span>
                  </button>
                </div>
                <pre><code>{{ jsonConfig }}</code></pre>
              </div>
              <p>
                Claude Desktop uses <code>claude_desktop_config.json</code>. Cursor supports
                <code>~/.cursor/mcp.json</code> or a project-level <code>.cursor/mcp.json</code>.
              </p>
            </article>
          </div>

          <div class="note-row">
            <p><strong>Restart required.</strong> Restart the entire MCP client after changing its configuration.</p>
            <p>
              <strong>Path lists.</strong> Separate multiple allowed roots with <code>;</code> on
              Windows and <code>:</code> on macOS or Linux.
            </p>
          </div>

          <h3 id="mcp-tools">Tools</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Tool</th><th>Access</th><th>Purpose</th><th>Key parameters</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>drop_whoami</code></td>
                  <td>Read</td>
                  <td>Validate the key and show account, scopes and limits.</td>
                  <td>None</td>
                </tr>
                <tr>
                  <td><code>drop_list_projects</code></td>
                  <td>Read</td>
                  <td>Search and page through projects.</td>
                  <td><code>query</code>, <code>page</code>, <code>perPage</code>, <code>sort</code></td>
                </tr>
                <tr>
                  <td><code>drop_get_project</code></td>
                  <td>Read</td>
                  <td>Read project details and files.</td>
                  <td><code>projectId</code> or <code>slug</code></td>
                </tr>
                <tr>
                  <td><code>drop_publish_site</code></td>
                  <td>Write</td>
                  <td>Create a project or atomically replace its complete file snapshot.</td>
                  <td><code>slug</code>, <code>name</code>, <code>path</code> or <code>files</code>, <code>ignoreUnsupported</code>, <code>message</code></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="table-note">
            For <code>drop_publish_site</code>, provide exactly one of <code>path</code> or
            <code>files</code>. For <code>drop_get_project</code>, provide exactly one of
            <code>projectId</code> or <code>slug</code>.
          </p>

          <h3 id="mcp-environment">Environment variables</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Variable</th><th>Required</th><th>Default</th><th>Purpose</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>DROP_API_KEY</code></td>
                  <td>Yes</td>
                  <td>None</td>
                  <td>Personal DROP API key.</td>
                </tr>
                <tr>
                  <td><code>DROP_API_BASE</code></td>
                  <td>No</td>
                  <td><code>https://drop.micropue.com.cn/v1</code></td>
                  <td>API base URL.</td>
                </tr>
                <tr>
                  <td><code>DROP_REQUEST_TIMEOUT_MS</code></td>
                  <td>No</td>
                  <td><code>20000</code></td>
                  <td>Request timeout from 1,000 to 120,000 milliseconds.</td>
                </tr>
                <tr>
                  <td><code>DROP_ALLOWED_ROOTS</code></td>
                  <td>No</td>
                  <td>MCP process working directory</td>
                  <td>Filesystem roots from which local sites may be published.</td>
                </tr>
                <tr>
                  <td><code>DROP_ENV_FILE</code></td>
                  <td>No</td>
                  <td>Project-root <code>.env</code></td>
                  <td>Optional env file location for local development.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 id="mcp-limits">Limits and safety</h3>
          <div class="limits-grid">
            <div><strong>1–20</strong><span>files per project</span></div>
            <div><strong>512 KiB</strong><span>maximum per file</span></div>
            <div><strong>1 MiB</strong><span>maximum project size</span></div>
            <div><strong>50</strong><span>directories maximum</span></div>
          </div>
          <ul class="check-list">
            <li>Only lowercase <code>.html</code>, <code>.css</code> and <code>.js</code> files are accepted.</li>
            <li>Every file must be valid UTF-8 text. Hidden files and <code>node_modules</code> are skipped.</li>
            <li>Symbolic links are rejected when publishing a directory with <code>path</code>.</li>
            <li>Use the narrowest <code>DROP_ALLOWED_ROOTS</code> possible and never point it at your home directory or an entire disk.</li>
            <li>Never commit a real API key or local <code>.env</code> file. Revoke any key that may have leaked.</li>
          </ul>

          <h3 id="mcp-errors">Troubleshooting</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Error</th><th>Meaning</th><th>Resolution</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>missing_api_key</code></td>
                  <td>The process could not read <code>DROP_API_KEY</code>.</td>
                  <td>Set it in the client's <code>env</code> block or a readable <code>.env</code>, then restart the client.</td>
                </tr>
                <tr>
                  <td><code>401</code></td>
                  <td>The key is invalid, expired or revoked.</td>
                  <td>Run <code>drop_whoami</code> to verify the connection, or create a new key.</td>
                </tr>
                <tr>
                  <td><code>403</code></td>
                  <td>The key does not have every required scope.</td>
                  <td>Use a key with <code>projects:read</code>, <code>projects:write</code> and <code>deployments:write</code>.</td>
                </tr>
                <tr>
                  <td><code>409</code> / <code>412</code></td>
                  <td>A slug or project revision changed during publishing.</td>
                  <td>Read the current project again, then retry instead of repeatedly forcing the old snapshot.</td>
                </tr>
                <tr>
                  <td><code>413</code> / <code>422</code></td>
                  <td>Files, paths or project parameters failed validation.</td>
                  <td>Check file count, sizes, extensions, UTF-8 encoding, slug format and the <code>path</code>/<code>files</code> choice.</td>
                </tr>
                <tr>
                  <td><code>429</code> / <code>503</code></td>
                  <td>Requests are rate-limited or a DROP dependency is temporarily unavailable.</td>
                  <td>Honor <code>Retry-After</code>, keep the <code>requestId</code> and retry later.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="api" class="doc-section">
          <div class="section-label-row">
            <p class="breadcrumb">API</p>
            <span class="status-badge">v1</span>
          </div>
          <h2>REST API</h2>
          <p>
            The API lets scripts, CI jobs, MCP servers and Skills create projects and publish complete
            file snapshots. The machine-readable contract is available at
            <a href="/v1/openapi.json" target="_blank" rel="noopener noreferrer">/v1/openapi.json</a>.
          </p>
          <div class="base-url">
            <span>BASE URL</span>
            <code>https://drop.micropue.com.cn/v1</code>
          </div>

          <h3 id="api-auth">Authentication</h3>
          <p>
            Create a key in <NuxtLink to="/developers/keys">API Keys</NuxtLink>, then send it as a
            Bearer token. Session cookies are not accepted on <code>/v1</code>.
          </p>
          <div class="code-block">
            <pre><code>Authorization: Bearer $DROP_API_KEY</code></pre>
          </div>
          <ul class="check-list">
            <li><code>projects:read</code> — list projects, read files, read deployments and usage.</li>
            <li><code>projects:write</code> — create projects and update metadata.</li>
            <li><code>deployments:write</code> — publish a new file snapshot to an existing project.</li>
            <li><code>projects:delete</code> — permanently delete a project.</li>
          </ul>

          <h3 id="api-endpoints">Endpoints</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Method</th><th>Path</th><th>Scope</th><th>Purpose</th></tr>
              </thead>
              <tbody>
                <tr><td>GET</td><td><code>/me</code></td><td>Any key</td><td>Account and key context.</td></tr>
                <tr><td>GET</td><td><code>/usage</code></td><td><code>projects:read</code></td><td>Project and deployment usage.</td></tr>
                <tr><td>GET</td><td><code>/projects</code></td><td><code>projects:read</code></td><td>List projects.</td></tr>
                <tr><td>POST</td><td><code>/projects</code></td><td><code>projects:write</code> + <code>deployments:write</code></td><td>Create and publish.</td></tr>
                <tr><td>GET</td><td><code>/projects/{id}</code></td><td><code>projects:read</code></td><td>Read project and files.</td></tr>
                <tr><td>PATCH</td><td><code>/projects/{id}</code></td><td><code>projects:write</code></td><td>Change metadata.</td></tr>
                <tr><td>DELETE</td><td><code>/projects/{id}</code></td><td><code>projects:delete</code></td><td>Delete a project.</td></tr>
                <tr><td>POST</td><td><code>/projects/{id}/deploy</code></td><td><code>deployments:write</code></td><td>Publish a file snapshot.</td></tr>
                <tr><td>GET</td><td><code>/projects/{id}/deployments</code></td><td><code>projects:read</code></td><td>List deployment history.</td></tr>
              </tbody>
            </table>
          </div>

          <h3 id="api-deploy">Deploy a project</h3>
          <p>
            A deployment replaces the complete file set. It is atomic: if validation or the
            transaction fails, the previous snapshot stays live. The response is returned after the
            new content is readable on the public content domain.
          </p>
          <div class="code-block">
            <div class="code-head">
              <span>curl</span>
              <button type="button" @click="copyCode('deploy', deployCurl)">
                <Copy aria-hidden="true" />
                <span>{{ copied === 'deploy' ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
            <pre><code>{{ deployCurl }}</code></pre>
          </div>
          <p>
            Add <code>If-Match: "rev-3"</code> to prevent overwriting a newer revision. Add an
            <code>Idempotency-Key</code> header to make retries safe.
          </p>

          <h3 id="api-limits">Limits</h3>
          <div class="limits-grid">
            <div><strong>100</strong><span>projects per account</span></div>
            <div><strong>20</strong><span>files per project</span></div>
            <div><strong>512 KiB</strong><span>per file</span></div>
            <div><strong>1 MiB</strong><span>per project</span></div>
          </div>
          <p>
            v1 accepts only <code>.html</code>, <code>.css</code> and <code>.js</code> files.
            Read requests are limited to 300 per minute per key, writes to 60 per minute and deploys
            to 20 per minute.
          </p>

          <h3 id="api-errors">Errors</h3>
          <p>
            Errors use <code>application/problem+json</code> with a stable <code>code</code> and
            <code>requestId</code>.
          </p>
          <div class="code-block">
            <pre><code>{{ errorExample }}</code></pre>
          </div>
        </section>

        <footer class="docs-footer">
          <p>DROP v1 is intentionally limited to static HTML, CSS and JavaScript.</p>
          <div>
            <a href="https://www.npmjs.com/package/@micropue/drop-mcp" target="_blank" rel="noopener noreferrer">npm</a>
            <a href="https://github.com/Micropue/micropue-drop-MCP" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="/v1/openapi.json" target="_blank" rel="noopener noreferrer">OpenAPI</a>
          </div>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Book from '@primeicons/vue/book'
import Copy from '@primeicons/vue/copy'
import Key from '@primeicons/vue/key'

useHead({
  title: 'Documentation',
  meta: [
    {
      name: 'description',
      content: 'Set up Drop MCP or use the DROP REST API to publish static sites.'
    }
  ]
})

const installCommand = 'npx -y @micropue/drop-mcp'

const codexConfig = `[mcp_servers.drop]
command = "npx"
args = ["-y", "@micropue/drop-mcp"]
env = { DROP_API_KEY = "YOUR_DROP_API_KEY", DROP_ALLOWED_ROOTS = "/absolute/path/to/sites" }
startup_timeout_sec = 20`

const jsonConfig = `{
  "mcpServers": {
    "drop": {
      "command": "npx",
      "args": ["-y", "@micropue/drop-mcp"],
      "env": {
        "DROP_API_KEY": "YOUR_DROP_API_KEY",
        "DROP_ALLOWED_ROOTS": "/absolute/path/to/sites"
      }
    }
  }
}`

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

const copied = ref('')
let copyTimer: ReturnType<typeof setTimeout> | undefined

async function copyCode(id: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = id
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = ''
    }, 1800)
  } catch {
    copied.value = ''
  }
}

onBeforeUnmount(() => clearTimeout(copyTimer))
</script>

<style lang="scss" scoped>
.docs-page {
  width: 90%;
  max-width: 1300px;
  margin: 0 auto;
  padding: 2.5rem 0 6rem;
}

.docs-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
}

.header-copy {
  max-width: 760px;
}

.eyebrow,
.breadcrumb,
.nav-title,
.sidebar-label,
.feature-kicker,
.config-client {
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.eyebrow {
  margin: 0;
}

h1 {
  margin: 0.45rem 0 0.7rem;
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.04em;
}

.lead {
  max-width: 700px;
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.96rem;
  line-height: 1.75;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.65rem;

  :deep(.p-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
    text-decoration: none;
  }

  :deep(svg) {
    width: 0.85rem;
    height: 0.85rem;
  }
}

.category-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 2rem;
  overflow: hidden;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.8rem;

  a {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-width: 0;
    padding: 0.9rem 1rem;
    color: var(--p-text-color);
    text-decoration: none;
    transition: background 0.15s;

    & + a {
      border-left: 1px solid var(--p-content-border-color);
    }

    &:hover,
    &:focus-visible {
      background: var(--p-content-hover-background);
    }

    strong,
    small {
      display: block;
    }

    strong {
      font-size: 0.82rem;
    }

    small {
      margin-top: 0.18rem;
      color: var(--p-text-muted-color);
      font-size: 0.7rem;
    }
  }
}

.category-index {
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 0.68rem;
}

.docs-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 4rem);
  margin-top: 3rem;
}

.docs-sidebar {
  align-self: start;
  position: sticky;
  top: 1.5rem;
}

.side-nav {
  padding-right: 1rem;
  border-right: 1px solid var(--p-content-border-color);

  section + section {
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
    font-size: 0.78rem;
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
    font-size: 0.72rem;
    line-height: 1.6;
  }

  a {
    color: var(--p-text-color);
    font-size: 0.72rem;
    text-decoration: none;
  }
}

.docs-content {
  min-width: 0;
  max-width: 900px;
}

.doc-section {
  scroll-margin-top: 1.5rem;

  & + & {
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
    font-size: 0.8rem;
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

.breadcrumb {
  margin: 0;

  span {
    margin-inline: 0.2rem;
    opacity: 0.5;
  }
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
  font-size: 0.65rem;
}

.feature-grid,
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
  color: var(--p-text-color);
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

  p {
    margin: 0 0 0.85rem;
    font-size: 0.8rem;
  }

  code {
    color: var(--p-text-color);
    font-family: var(--font-code);
    font-size: 0.75rem;
  }
}

.card-link {
  color: var(--p-text-color);
  font-size: 0.75rem;
}

.callout {
  margin-top: 1.2rem;
  padding: 0.9rem 1rem;
  border-left: 2px solid var(--p-text-color);
  background: color-mix(in srgb, var(--p-text-color) 4%, var(--p-content-background));

  strong {
    font-size: 0.78rem;
  }
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
    font-size: 0.68rem;
  }
}

.quick-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 1.4rem 0 2rem;

  div {
    padding: 0.8rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.6rem;
  }

  span,
  strong,
  code {
    display: block;
  }

  span {
    margin-bottom: 0.35rem;
    color: var(--p-text-muted-color);
    font-size: 0.68rem;
  }

  strong,
  code {
    color: var(--p-text-color);
    font-size: 0.78rem;
  }

  code {
    overflow-wrap: anywhere;
    font-family: var(--font-code);
  }
}

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
    font-size: 0.64rem;
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
    font-size: inherit;
    font-family: inherit;
  }

  .prompt {
    color: #71717a;
    user-select: none;
  }

  &.compact {
    margin-bottom: 0.75rem;
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
      font-size: 0.8rem;
    }
  }
}

.step-number {
  flex: none;
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 0.68rem;
}

.config-card {
  min-width: 0;

  > p {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.6;
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

  p {
    margin: 0;
    padding: 0.75rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.6rem;
    font-size: 0.74rem;
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
  font-size: 0.76rem;

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

  td code {
    color: var(--p-text-color);
  }

  tr:last-child td {
    border-bottom: 0;
  }
}

code {
  font-family: var(--font-code);
  font-size: 0.95rem;
}

.table-note {
  margin-top: 0.7rem;
  font-size: 0.76rem;
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
    font-size: 0.68rem;
  }
}

.check-list {
  margin: 1rem 0;
  padding-left: 1.1rem;

  li {
    margin: 0.35rem 0;
    font-size: 0.82rem;
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
    font-size: 0.65rem;
    letter-spacing: 0.1em;
  }

  code {
    overflow-wrap: anywhere;
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
    font-size: 0.74rem;
  }

  div {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
  }

  a {
    color: var(--p-text-muted-color);
    font-size: 0.74rem;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      color: var(--p-text-color);
    }
  }
}

@media screen and (max-width: 980px) {
  .docs-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .docs-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .docs-sidebar {
    position: static;
  }

  .side-nav {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
    padding-right: 0;
    border-right: 0;

    section + section {
      margin-top: 0;
      padding-top: 0;
      border-top: 0;
    }
  }

  .sidebar-card {
    display: none;
  }
}

@media screen and (max-width: 700px) {
  .docs-sidebar {
    display: none;
  }

  .category-strip {
    grid-template-columns: 1fr;

    a + a {
      border-top: 1px solid var(--p-content-border-color);
      border-left: 0;
    }
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

  .side-nav {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }

  .docs-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media screen and (max-width: 460px) {
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
