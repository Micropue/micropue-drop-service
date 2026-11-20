import { normalizeBaseUrl, SEO_CONTENT_UPDATED_AT } from './seo'

interface LinkItem {
  title: string
  url: string
  description: string
}

function linkList(items: LinkItem[]) {
  return items.map(item => `- [${item.title}](${item.url}): ${item.description}`).join('\n')
}

export function buildLlmsDocuments(siteUrlValue: string, contentUrlValue: string) {
  const siteUrl = normalizeBaseUrl(siteUrlValue)
  const contentUrl = normalizeBaseUrl(contentUrlValue)

  const corePages: LinkItem[] = [
    {
      title: 'DROP home',
      url: `${siteUrl}/`,
      description: 'Product overview, supported publishing methods and entry points to the editor and developer platform.'
    },
    {
      title: 'Developer documentation',
      url: `${siteUrl}/developers`,
      description: 'Integration guide for Drop MCP, the DROP CLI and the v1 REST API.'
    },
    {
      title: 'Privacy Policy',
      url: `${siteUrl}/privacy`,
      description: 'Data handling, retention and account terms for DROP.'
    },
    {
      title: 'OpenAPI 1.0 contract',
      url: `${siteUrl}/v1/openapi.json`,
      description: 'Machine-readable schema and endpoint reference for the public API.'
    }
  ]

  const documentation: LinkItem[] = [
    {
      title: 'Drop MCP',
      url: `${siteUrl}/developers#mcp`,
      description: 'Install and configure the local stdio MCP server for AI clients.'
    },
    {
      title: 'DROP CLI',
      url: `${siteUrl}/developers#cli`,
      description: 'Deploy or watch a local static directory from a terminal or CI job.'
    },
    {
      title: 'REST API',
      url: `${siteUrl}/developers#api`,
      description: 'Create projects, update metadata and publish atomic file snapshots.'
    },
    {
      title: 'API key management',
      url: `${siteUrl}/developers/keys`,
      description: 'Authenticated page for creating scoped personal API keys; excluded from search indexes.'
    },
    {
      title: 'Drop MCP source',
      url: 'https://github.com/Micropue/micropue-drop-MCP',
      description: 'Source code and issue tracker for the MCP server.'
    },
    {
      title: 'DROP CLI source',
      url: 'https://github.com/Micropue/micropue-drop-CLI',
      description: 'Source code and issue tracker for the command-line client.'
    }
  ]

  const productDefinition = [
    'DROP is a free static site hosting service operated by MICROPUE and a companion service to BITS.',
    'A project contains HTML, CSS and JavaScript files stored in MySQL and is published without a build step or tunnel.',
    `Public projects are served from the isolated content domain at ${contentUrl}/{username}/{project}/. The main application domain does not execute user-authored files.`,
    'Users can publish from the browser editor, Drop MCP, the DROP CLI or the v1 REST API. The developer tools share personal API keys with project-scoped permissions.',
    'DROP is intended for static sites only. It does not run server-side application code and does not accept arbitrary binary assets in API v1.'
  ]

  const short = `# DROP

> DROP is a free static site hosting service from MICROPUE for HTML, CSS and JavaScript projects. Publish from the web editor, Drop MCP, the DROP CLI or the v1 REST API; public sites are served from a separate content domain.

Last updated: ${SEO_CONTENT_UPDATED_AT}

Canonical site: ${siteUrl}/
User content domain: ${contentUrl}/

## Core pages

${linkList(corePages)}

## Product definition

${productDefinition.map(item => `- ${item}`).join('\n')}

## Documentation

${linkList(documentation)}

## Complete reference

- [llms-full.txt](${siteUrl}/llms-full.txt): Extended product, publishing, API, limits and indexing reference for language models.

## Indexing

- Public site pages are listed in [sitemap.xml](${siteUrl}/sitemap.xml).
- Account and project-management routes are marked noindex.
- User project URLs are indexed only when the project is public and enabled.
`

  const full = `# DROP — Complete Reference

> DROP is a free static site hosting service from MICROPUE for HTML, CSS and JavaScript projects. This document expands the concise /llms.txt reference with product, publishing, API and operational details.

Last updated: ${SEO_CONTENT_UPDATED_AT}

Canonical site: ${siteUrl}/
Content domain: ${contentUrl}/

## Product definition

${productDefinition.map(item => `- ${item}`).join('\n')}

## Core pages

${linkList(corePages)}

## Documentation entry points

${linkList(documentation)}

## Publishing model

1. Sign in through BITS OAuth and create a scoped API key, or use the browser editor.
2. Send a complete static file snapshot containing UTF-8 \`.html\`, \`.css\` and \`.js\` files.
3. DROP validates paths and limits, stores the new snapshot in MySQL and increments the project revision.
4. A successful deployment is immediately available on the content domain. There is no build pipeline to wait for.
5. Public projects receive indexable URLs. Password-protected and disabled projects are not included in the content sitemap; password projects also send \`X-Robots-Tag: noindex\`.

The editor is available at ${siteUrl}/new and the project dashboard at ${siteUrl}/dashboard. Both require authentication and are excluded from search indexes.

## Developer tools

### Drop MCP

- Package: \`@micropue/drop-mcp\`
- Runtime: Node.js 20.12 or newer
- Transport: local process over stdio
- Start command: \`npx -y @micropue/drop-mcp\`
- Required environment: \`DROP_API_KEY\`; use \`DROP_ALLOWED_ROOTS\` to restrict readable filesystem roots.
- Documentation: ${siteUrl}/developers#mcp

### DROP CLI

- Package: \`@micropue/drop-cli\`
- Runtime: Node.js 20.12 or newer
- Install: \`npm install -g @micropue/drop-cli\`
- Watch and publish: \`drop [directory]\`
- One-shot deployment: \`drop deploy [directory]\`
- In CI, provide \`DROP_API_KEY\` as a protected secret.
- Documentation: ${siteUrl}/developers#cli

### REST API v1

- Base URL: ${siteUrl}/v1
- Authentication: \`Authorization: Bearer drop_sk_...\`
- Contract: ${siteUrl}/v1/openapi.json
- Documentation: ${siteUrl}/developers#api
- Scopes: \`projects:read\`, \`projects:write\`, \`deployments:write\`, \`projects:delete\`
- Endpoints: \`GET /me\`, \`GET /usage\`, \`GET|POST /projects\`, \`GET|PATCH|DELETE /projects/{id}\`, \`POST /projects/{id}/deploy\`, \`GET /projects/{id}/deployments\`.

## Limits

- 100 projects per account.
- 1–20 files per project.
- 512 KiB maximum per file.
- 1 MiB maximum project size.
- 50 folders maximum.
- 40 characters maximum project slug.
- API v1 read requests: 300 per minute per key; writes: 60 per minute; deploys: 20 per minute.

## Content and indexing

- Main-site sitemap: ${siteUrl}/sitemap-main.xml
- User-content sitemap: ${contentUrl}/sitemap-content.xml
- Sitemap index: ${siteUrl}/sitemap.xml
- The main sitemap lists the home, developer documentation, privacy policy and AI-readable references.
- The content sitemap lists public, enabled projects with an \`index.html\`, using the database deployment timestamp as \`lastmod\`.
- Temporary, generated, generic and duplicate project entries are omitted from the content sitemap.
- \`/sign\`, \`/dashboard\`, \`/new\`, \`/account\` and \`/developers/keys\` are private workflow routes and send both a robots meta tag and \`X-Robots-Tag: noindex, nofollow\`.

## Contact and source

- Privacy policy: ${siteUrl}/privacy
- MCP source: https://github.com/Micropue/micropue-drop-MCP
- CLI source: https://github.com/Micropue/micropue-drop-CLI
`

  return { short, full }
}
