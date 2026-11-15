<template>
  <div class="docs">
    <header>
      <p class="eyebrow">DROP API · v1</p>
      <h1>API reference</h1>
      <p class="lead">
        Everything you need to deploy a static site from a script, CI job, MCP server or Skill.
        The machine-readable contract lives at
        <a href="/v1/openapi.json" target="_blank" rel="noopener noreferrer">/v1/openapi.json</a>.
      </p>
    </header>

    <nav class="toc" aria-label="API reference sections">
      <a href="#auth">Authentication</a>
      <a href="#endpoints">Endpoints</a>
      <a href="#deploy">Deploy</a>
      <a href="#limits">Limits</a>
      <a href="#errors">Errors</a>
      <a href="#mcp">MCP / Skills</a>
    </nav>

    <section id="auth">
      <h2>Authentication</h2>
      <p>
        Create a key in <NuxtLink to="/developers/keys">API keys</NuxtLink>. Send it as a Bearer token:
      </p>
      <pre><code>Authorization: Bearer $DROP_API_KEY</code></pre>
      <p>
        Session cookies are not accepted on <code>/v1</code>. Keys can be scoped to read, write,
        deploy or delete. Scopes are fixed when the key is created.
      </p>
      <ul>
        <li><code>projects:read</code> — list projects, read files, read deployments and usage.</li>
        <li><code>projects:write</code> — create projects and update metadata.</li>
        <li><code>deployments:write</code> — publish a new file snapshot to an existing project.</li>
        <li><code>projects:delete</code> — permanently delete a project.</li>
      </ul>
    </section>

    <section id="endpoints">
      <h2>Endpoints</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Method</th><th>Path</th><th>Scope</th><th>Purpose</th></tr>
          </thead>
          <tbody>
            <tr><td>GET</td><td><code>/me</code></td><td>any key</td><td>Account and key context.</td></tr>
            <tr><td>GET</td><td><code>/usage</code></td><td><code>projects:read</code></td><td>Project and deployment usage.</td></tr>
            <tr><td>GET</td><td><code>/projects</code></td><td><code>projects:read</code></td><td>List projects.</td></tr>
            <tr><td>POST</td><td><code>/projects</code></td><td><code>projects:write</code> + <code>deployments:write</code></td><td>Create and publish.</td></tr>
            <tr><td>GET</td><td><code>/projects/{id}</code></td><td><code>projects:read</code></td><td>Read project and files.</td></tr>
            <tr><td>PATCH</td><td><code>/projects/{id}</code></td><td><code>projects:write</code></td><td>Change metadata.</td></tr>
            <tr><td>DELETE</td><td><code>/projects/{id}</code></td><td><code>projects:delete</code></td><td>Delete project.</td></tr>
            <tr><td>POST</td><td><code>/projects/{id}/deploy</code></td><td><code>deployments:write</code></td><td>Publish a snapshot.</td></tr>
            <tr><td>GET</td><td><code>/projects/{id}/deployments</code></td><td><code>projects:read</code></td><td>Deployment history.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section id="deploy">
      <h2>Deploy a project</h2>
      <p>
        A deployment replaces the complete file set. It is atomic: if validation or the transaction
        fails, the previous snapshot stays live. The response is returned after the new content is
        readable on the public content domain.
      </p>
      <pre><code>curl -X POST "https://drop.micropue.com.cn/v1/projects/$PROJECT_ID/deploy" \
  -H "Authorization: Bearer $DROP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      { "path": "index.html", "content": "&lt;!doctype html&gt;&lt;h1&gt;Version 2&lt;/h1&gt;" }
    ],
    "message": "update hero"
  }'</code></pre>
      <p>
        Add <code>If-Match: "rev-3"</code> to prevent overwriting a newer revision.
        Add <code>Idempotency-Key</code> to make retries safe.
      </p>
    </section>

    <section id="limits">
      <h2>Limits</h2>
      <div class="limit-grid">
        <div><strong>100</strong><span>projects per account</span></div>
        <div><strong>20</strong><span>files per project</span></div>
        <div><strong>512 KB</strong><span>per file</span></div>
        <div><strong>1 MB</strong><span>per project</span></div>
      </div>
      <p>
        Only <code>.html</code>, <code>.css</code> and <code>.js</code> are accepted in v1.
        Read requests are limited to 300/minute per key; writes to 60/minute; deploys to 20/minute.
      </p>
    </section>

    <section id="errors">
      <h2>Errors</h2>
      <p>Errors use <code>application/problem+json</code> with a stable <code>code</code> and <code>requestId</code>.</p>
      <pre><code>{
  "type": "https://drop.micropue.com.cn/developers/errors/slug-taken",
  "title": "Slug already taken",
  "status": 409,
  "code": "slug_taken",
  "detail": "Choose a different slug.",
  "requestId": "req_..."
}</code></pre>
    </section>

    <section id="mcp">
      <h2>MCP and Skills</h2>
      <p>
        v1 exposes a stable OpenAPI contract and Bearer authentication. A local MCP server or Skill
        can use a personal key now. Remote multi-user MCP with OAuth is planned for v2.
      </p>
      <p class="note">OpenAPI: <a href="/v1/openapi.json" target="_blank" rel="noopener noreferrer">/v1/openapi.json</a></p>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Developer Docs' })
</script>

<style lang="scss" scoped>
.docs {
  width: min(920px, 90%);
  margin: 0 auto;
  padding: clamp(3rem, 9vh, 6rem) 0 6rem;
}

.eyebrow {
  margin: 0;
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
}

h1 {
  margin: 0.6rem 0 0.8rem;
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.04em;
}

h2 {
  margin: 0 0 0.9rem;
  font-size: 1.35rem;
}

p,
li {
  color: var(--p-text-muted-color);
  line-height: 1.75;
}

a {
  color: var(--p-text-color);
}

.lead {
  max-width: 720px;
  margin: 0;
  font-size: 0.98rem;
}

.toc {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  margin: 2rem 0 3rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--p-content-border-color);

  a {
    color: var(--p-text-muted-color);
    font-size: 0.82rem;
    text-decoration: none;

    &:hover {
      color: var(--p-text-color);
    }
  }
}

section {
  scroll-margin-top: 2rem;
  margin-top: 3rem;
}

pre {
  overflow-x: auto;
  padding: 1rem;
  border-radius: 0.6rem;
  background: #18181b;
  color: #fafafa;
  font-family: var(--font-code);
  font-size: 0.78rem;
  line-height: 1.55;
}

code {
  font-family: var(--font-code);
  font-size: 0.86em;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.75rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;

  th,
  td {
    padding: 0.7rem 0.8rem;
    border-bottom: 1px solid var(--p-content-border-color);
    text-align: left;
    vertical-align: top;
  }

  th {
    color: var(--p-text-muted-color);
    font-weight: 600;
    white-space: nowrap;
  }

  tr:last-child td {
    border-bottom: 0;
  }
}

.limit-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;

  div {
    padding: 1rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.75rem;
  }

  strong {
    display: block;
    font-size: 1.3rem;
  }

  span {
    color: var(--p-text-muted-color);
    font-size: 0.75rem;
  }
}

.note {
  font-family: var(--font-code);
  font-size: 0.78rem;
}

@media (max-width: 700px) {
  .limit-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
