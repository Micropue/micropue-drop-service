const en = {
  meta: {
    title: 'Developer Documentation',
    description: 'Install Drop MCP and the DROP CLI, or use the v1 REST API to publish static sites.'
  },
  header: {
    title: 'Build with DROP',
    lead: 'Publish static HTML, CSS and JavaScript projects from your editor, terminal, AI client or automation. Drop MCP, the DROP CLI and the REST API share the same personal API keys.',
    apiKeys: 'API Keys',
    openApi: 'OpenAPI',
    language: 'Language'
  },
  categoryLabels: {
    mcp: 'MCP',
    mcpSummary: 'AI client integration',
    cli: 'CLI',
    cliSummary: 'Watch and deploy from a terminal',
    api: 'API',
    apiSummary: 'REST reference for v1'
  },
  nav: {
    mcpTitle: 'MCP',
    mcp: [
      ['#mcp', 'Overview'],
      ['#mcp-quickstart', 'Quick start'],
      ['#mcp-clients', 'Client configuration'],
      ['#mcp-tools', 'Tools'],
      ['#mcp-environment', 'Environment'],
      ['#mcp-limits', 'Limits and safety'],
      ['#mcp-errors', 'Troubleshooting']
    ],
    cliTitle: 'CLI',
    cli: [
      ['#cli', 'Overview'],
      ['#cli-install', 'Install'],
      ['#cli-auth', 'Authentication'],
      ['#cli-quickstart', 'Quick start'],
      ['#cli-commands', 'Commands and options'],
      ['#cli-files', 'Local state'],
      ['#cli-ci', 'CI deployments'],
      ['#cli-errors', 'Troubleshooting']
    ],
    apiTitle: 'API',
    api: [
      ['#api', 'Overview'],
      ['#api-auth', 'Authentication'],
      ['#api-endpoints', 'Endpoints'],
      ['#api-deploy', 'Deploy a project'],
      ['#api-limits', 'Limits'],
      ['#api-errors', 'Errors']
    ],
    startLabel: 'START HERE',
    startBody: 'Create a key with the scopes your integration needs.',
    startLink: 'Manage API keys'
  },
  common: {
    copy: 'Copy',
    copied: 'Copied',
    terminal: 'Terminal',
    required: 'Required',
    default: 'Default',
    optional: 'Optional'
  },
  overview: {
    breadcrumb: 'DEVELOPER PLATFORM',
    title: 'Choose the path that fits your workflow',
    body: 'Ship a site from an AI client with Drop MCP, keep a local directory synchronized with the DROP CLI, or call the REST API from a script or CI job. Every path creates the same static projects and uses the same personal API key.',
    cards: [
      {
        href: '#mcp',
        kicker: 'RECOMMENDED',
        title: 'Drop MCP',
        body: 'Let Codex, Claude Desktop, Cursor or another MCP client validate a key and publish a local static site.',
        meta: '`@micropue/drop-mcp`'
      },
      {
        href: '#cli',
        kicker: 'TERMINAL',
        title: 'DROP CLI',
        body: 'Install once, then run `drop` to deploy and watch a directory. The published site stays online after the watcher stops.',
        meta: '`@micropue/drop-cli`'
      },
      {
        href: '#api',
        kicker: 'AUTOMATION',
        title: 'REST API',
        body: 'Create projects, update metadata and publish complete snapshots from scripts, CI pipelines or your own tools.',
        meta: '`/v1/openapi.json`'
      }
    ],
    scopeTitle: 'Minimum scopes for MCP and CLI',
    scopes: ['projects:read', 'projects:write', 'deployments:write']
  },
  mcp: {
    breadcrumb: 'MCP',
    status: 'stdio · local process',
    title: 'Drop MCP',
    intro: 'Drop MCP is a local MCP server that reads HTML, CSS and JavaScript files, validates the connection, and creates or atomically replaces a DROP project. Your MCP client starts the process; DROP does not expose this server through a remote HTTP MCP endpoint.',
    facts: [
      ['Package', '`@micropue/drop-mcp`'],
      ['Runtime', 'Node.js 20.12+'],
      ['Transport', 'stdio']
    ],
    installTitle: 'Install or run the package',
    installBody: 'No global installation is required. MCP clients can start the published package with `npx`. Diagnostics are written to `stderr`; `stdout` is reserved for MCP protocol messages.',
    quickstartTitle: 'Quick start',
    steps: [
      ['Create an API key', 'Open [API Keys](/developers/keys) and create a key with the required scopes. The key is shown only once.'],
      ['Configure your MCP client', 'Add Drop MCP with Node.js installed and set `DROP_API_KEY`. `DROP_ALLOWED_ROOTS` is optional and defaults to your home directory.'],
      ['Ask the client to publish', 'Call `drop_whoami` first, then publish with `drop_publish_site`. Trust only the `url` returned by the tool.']
    ],
    clientsTitle: 'Client configuration',
    clientsBody: 'All clients start the same local command. Only `DROP_API_KEY` is required. Local publishing is scoped to your home directory by default; set the optional `DROP_ALLOWED_ROOTS` only when you want to narrow or change that scope.',
    codexCard: {
      client: 'Codex',
      file: '`~/.codex/config.toml`',
      note: 'Replace the placeholder key with your own. Add `DROP_ALLOWED_ROOTS` only when you want to override the default home-directory scope.'
    },
    jsonCard: {
      client: 'Claude Desktop · Cursor',
      file: 'MCP JSON',
      note: 'Claude Desktop uses `claude_desktop_config.json`. Cursor supports `~/.cursor/mcp.json` or a project-level `.cursor/mcp.json`.'
    },
    restartNote: '**Restart required.** Restart the entire MCP client after changing its configuration.',
    pathsNote: '**Optional path scope.** By default, Drop MCP reads from your home directory. If you set `DROP_ALLOWED_ROOTS`, separate multiple roots with `;` on Windows and `:` on macOS or Linux.',
    toolsTitle: 'Tools',
    toolColumns: ['Tool', 'Access', 'Purpose', 'Key parameters'],
    toolRows: [
      ['`drop_whoami`', 'Read', 'Validate the key and show account, scopes and limits.', 'None'],
      ['`drop_list_projects`', 'Read', 'Search and page through projects.', '`query`, `page`, `perPage`, `sort`'],
      ['`drop_get_project`', 'Read', 'Read project details and files.', '`projectId` or `slug`'],
      ['`drop_publish_site`', 'Write', 'Create a project or atomically replace its complete file snapshot.', '`slug`, `name`, `path` or `files`, `ignoreUnsupported`, `message`']
    ],
    toolsNote: 'For `drop_publish_site`, provide exactly one of `path` or `files`. For `drop_get_project`, provide exactly one of `projectId` or `slug`.',
    envTitle: 'Environment variables',
    envColumns: ['Variable', 'Required', 'Default', 'Purpose'],
    envRows: [
      ['`DROP_API_KEY`', 'Yes', 'None', 'Personal DROP API key.'],
      ['`DROP_API_BASE`', 'No', '`https://drop.micropue.com.cn/v1`', 'API base URL.'],
      ['`DROP_REQUEST_TIMEOUT_MS`', 'No', '`20000`', 'Request timeout from 1,000 to 120,000 milliseconds.'],
      ['`DROP_ALLOWED_ROOTS`', 'No', 'User home directory (`/Users/{username}` on macOS)', 'Optional filesystem roots from which local sites may be published.'],
      ['`DROP_ENV_FILE`', 'No', 'Project-root `.env`', 'Optional env file location for local development.']
    ],
    limitsTitle: 'Limits and safety',
    limits: [
      ['1–20', 'files per project'],
      ['512 KiB', 'maximum per file'],
      ['1 MiB', 'maximum project size'],
      ['50', 'directories maximum'],
      ['100', 'characters per folder path'],
      ['120', 'characters per file path'],
      ['80', 'characters per file name, including extension']
    ],
    safety: [
      'Only lowercase `.html`, `.css` and `.js` files are accepted.',
      'Folder and file paths use `/` between segments. Each segment may contain only Unicode letters (including Chinese), numbers, `.`, `_` and `-`. Spaces, brackets such as `(` and `)` and other symbols are rejected. File names must start with a letter or number.',
      'Every file must be valid UTF-8 text. Hidden files and `node_modules` are skipped.',
      'Symbolic links are rejected when publishing a directory with `path`.',
      'Publishing is limited to the user home directory by default. Narrow the scope with `DROP_ALLOWED_ROOTS` when your sites live in a dedicated folder.',
      'Never commit a real API key or local `.env` file. Revoke any key that may have leaked.'
    ],
    troubleshootingTitle: 'Troubleshooting',
    troubleshootingColumns: ['Error', 'Meaning', 'Resolution'],
    troubleshootingRows: [
      ['`missing_api_key`', 'The process could not read `DROP_API_KEY`.', 'Set it in the client `env` block or a readable `.env`, then restart the client.'],
      ['`401`', 'The key is invalid, expired or revoked.', 'Run `drop_whoami` to verify the connection, or create a new key.'],
      ['`403`', 'The key does not have every required scope.', 'Use a key with `projects:read`, `projects:write` and `deployments:write`.'],
      ['`409` / `412`', 'A slug or project revision changed during publishing.', 'Read the current project again, then retry instead of forcing the old snapshot.'],
      ['`413` / `422`', 'Files, paths or project parameters failed validation.', 'Check file count, sizes, UTF-8 encoding, slug format and the `path`/`files` choice. Folder and file path segments allow only Unicode letters, numbers, `.`, `_` and `-`; spaces and brackets are invalid. The response `errors` field identifies the exact `folders[n]` or `files[n].path`.'],
      ['`429` / `503`', 'Requests are rate-limited or a DROP dependency is temporarily unavailable.', 'Honor `Retry-After`, keep the `requestId` and retry later.']
    ]
  },
  cli: {
    breadcrumb: 'CLI',
    status: 'Node.js · npm',
    title: 'DROP CLI',
    intro: 'DROP CLI deploys a local directory of HTML, CSS and JavaScript files and keeps the published site in sync while it runs. It is built for fast first deployments, terminal-based iteration and non-interactive CI runs. Unlike a tunnel, the files are uploaded to DROP and the site stays online after you stop the command.',
    facts: [
      ['Package', '`@micropue/drop-cli`'],
      ['Runtime', 'Node.js 20.12+'],
      ['Commands', '`drop` · `drop-cli`']
    ],
    installTitle: 'Install',
    installBody: 'Install the CLI globally when you use it often. Use `npx` for a one-off command or a reproducible CI step.',
    requirementNote: '**Requirements.** Node.js 20.12 or newer, a DROP personal API key and a directory containing only UTF-8 `.html`, `.css` and `.js` files. Folder and file names may use letters (including Chinese), numbers, `.`, `_` and `-` only; spaces and brackets are rejected. Build Vue, React, Astro or Vite projects first and publish their static output directory.',
    authTitle: 'Authenticate',
    authBody: 'Create a key in [API Keys](/developers/keys) with `projects:read`, `projects:write` and `deployments:write`. `drop login` verifies the key and stores it in the user configuration directory.',
    authNote: 'In CI or other non-interactive environments, set `DROP_API_KEY` instead. It takes precedence over the saved credential. Use `DROP_AUTH_FILE` to choose a different credential file.',
    quickstartTitle: 'Quick start',
    quickstartSteps: [
      ['Open your static site directory', 'Run the commands from the folder that contains `index.html` or the build output you want to publish.'],
      ['Sign in once', 'Authenticate the CLI with an API key that has all three deployment scopes.'],
      ['Publish and watch', 'Run `drop`. The CLI creates the project on first use, prints the public URL and uploads a new complete snapshot after files change.']
    ],
    watchNote: 'The default command is equivalent to `drop watch`. Press `Ctrl+C` to stop watching; the website remains online. Run `drop` in the same directory later to continue updating the same project.',
    commandsTitle: 'Commands and options',
    commandColumns: ['Command', 'What it does'],
    commandRows: [
      ['`drop [directory]`', 'Watch the directory and publish changes. Equivalent to `drop watch`.'],
      ['`drop watch [directory]`', 'Watch for file changes and publish a complete snapshot after each debounced change.'],
      ['`drop deploy [directory]`', 'Publish one complete snapshot and exit. Use this in CI or scripts.'],
      ['`drop init [directory]`', 'Create `.drop/` local metadata without calling the API or publishing.'],
      ['`drop status [directory]`', 'Show the local deployment record without making a request.'],
      ['`drop login`', 'Verify and save an API key.'],
      ['`drop whoami`', 'Show the current account, scopes and quota.'],
      ['`drop logout`', 'Remove the locally saved API key.']
    ],
    optionsTitle: 'Useful options',
    optionColumns: ['Option', 'Purpose'],
    optionRows: [
      ['`--slug <slug>`', 'Set the project slug: 1–40 lowercase letters, numbers or hyphens.'],
      ['`--name <name>`', 'Set the project display name, up to 80 characters.'],
      ['`--private`', 'Create a password-protected site.'],
      ['`--visibility <mode>`', 'Choose `public` or `password`.'],
      ['`--password <password>`', 'Set a site password from 6 to 128 characters.'],
      ['`--api-url <url>`', 'Override the DROP API base URL.'],
      ['`--message <message>`', 'Attach a deployment note, up to 200 characters.'],
      ['`--force`', 'Publish even when the content hash has not changed.'],
      ['`--interval <ms>`', 'Set the watch debounce time; default 2000 ms, minimum 500 ms.'],
      ['`--poll`', 'Use polling for network drives or filesystems without reliable file events.']
    ],
    filesTitle: 'Local state and ignore rules',
    filesBody: 'The CLI stores project identity and the latest reusable snapshot in `.drop/`, including `drop.json` and the deployable files. Do not commit `.drop/` to a public repository because it can contain site content. Add it to `.gitignore`. Deleting `.drop/` loses the local project link but does not delete the online project.',
    ignoreBody: 'Create a `.drop-ignore` file in the site root to exclude drafts, private files or build caches. Rules use `.gitignore` syntax. Hidden files, symbolic links, `.drop/`, `.git/` and `node_modules/` are always skipped.',
    ciTitle: 'CI deployments',
    ciBody: 'Use `drop deploy` for a single non-interactive release. Provide `DROP_API_KEY` as a protected CI secret and publish the build output directory, not the source project.',
    errorsTitle: 'Troubleshooting',
    errorColumns: ['Symptom', 'Resolution'],
    errorRows: [
      ['`401` or invalid API key', 'Run `drop logout`, then `drop login`, then `drop whoami`. Verify all three scopes.'],
      ['Slug already taken', 'Choose another `--slug` or restore the original `.drop/drop.json` from that project.'],
      ['`422` invalid file or folder path', 'Use only Unicode letters, numbers, `.`, `_` and `-` in each path segment. Spaces, brackets and other symbols are rejected. Folder paths are limited to 100 characters, file paths to 120 and file names to 80.'],
      ['Changes are not appearing', 'Confirm the extension is lowercase `.html`, `.css` or `.js`; check `.drop-ignore`, file size limits and whether an unsupported asset is referenced.'],
      ['Changes are missed on a network drive', 'Restart with `drop --poll`.'],
      ['The site seems offline after `Ctrl+C`', 'That should not happen. Check `drop status`, then open the URL saved in `.drop/drop.json`; only the watcher stops with the process.'],
      ['Images or fonts were not uploaded', 'API v1 and the CLI accept only `.html`, `.css` and `.js`. Host other assets elsewhere and reference them by URL.']
    ]
  },
  api: {
    breadcrumb: 'API',
    status: 'v1',
    title: 'REST API',
    intro: 'The API lets scripts, CI jobs, MCP servers and Skills create projects and publish complete file snapshots. The machine-readable contract is available at [/v1/openapi.json](/v1/openapi.json).',
    baseLabel: 'BASE URL',
    authTitle: 'Authentication',
    authBody: 'Create a key in [API Keys](/developers/keys), then send it as a Bearer token. Session cookies are not accepted on `/v1`.',
    scopes: [
      '`projects:read` — list projects, read files, read deployments and usage.',
      '`projects:write` — create projects and update metadata.',
      '`deployments:write` — publish a new file snapshot to an existing project.',
      '`projects:delete` — permanently delete a project.'
    ],
    endpointsTitle: 'Endpoints',
    endpointColumns: ['Method', 'Path', 'Scope', 'Purpose'],
    endpointRows: [
      ['GET', '`/me`', 'Any key', 'Account and key context.'],
      ['GET', '`/usage`', '`projects:read`', 'Project and deployment usage.'],
      ['GET', '`/projects`', '`projects:read`', 'List projects.'],
      ['POST', '`/projects`', '`projects:write` + `deployments:write`', 'Create and publish.'],
      ['GET', '`/projects/{id}`', '`projects:read`', 'Read project and files.'],
      ['PATCH', '`/projects/{id}`', '`projects:write`', 'Change metadata.'],
      ['DELETE', '`/projects/{id}`', '`projects:delete`', 'Delete a project.'],
      ['POST', '`/projects/{id}/deploy`', '`deployments:write`', 'Publish a file snapshot.'],
      ['GET', '`/projects/{id}/deployments`', '`projects:read`', 'List deployment history.']
    ],
    deployTitle: 'Deploy a project',
    deployBody: 'A deployment replaces the complete file set. It is atomic: if validation or the transaction fails, the previous snapshot stays live. The response is returned after the new content is readable on the public content domain.',
    deployNote: 'Add `If-Match: "rev-3"` to prevent overwriting a newer revision. Add an `Idempotency-Key` header to make retries safe.',
    limitsTitle: 'Limits',
    limits: [
      ['1,000', 'projects per account'],
      ['20', 'files per project'],
      ['512 KiB', 'per file'],
      ['1 MiB', 'per project'],
      ['100 / 120 / 80', 'folder path / file path / file name characters']
    ],
    limitsBody: 'v1 accepts only UTF-8 `.html`, `.css` and `.js` files. Path segments may contain only Unicode letters (including Chinese), numbers, `.`, `_` and `-`; spaces, brackets and other symbols are rejected. Read requests are limited to 300 per minute per key, writes to 60 per minute and deploys to 20 per minute.',
    errorsTitle: 'Errors',
    errorsBody: 'Errors use `application/problem+json` with a stable `code` and `requestId`.'
  },
  footer: {
    note: 'DROP v1 is intentionally limited to static HTML, CSS and JavaScript.',
    npm: 'npm',
    github: 'GitHub',
    openApi: 'OpenAPI'
  }
} as const

type DeepString<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? DeepString<U>[]
    : { [K in keyof T]: DeepString<T[K]> }

export type DocsContent = DeepString<typeof en>

export default en
