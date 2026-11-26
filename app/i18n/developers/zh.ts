import type { DocsContent } from './en'

const zh: DocsContent = {
  meta: {
    title: '开发者文档',
    description: '安装 Drop MCP 或 DROP CLI，或通过 v1 REST API 发布静态站点。'
  },
  header: {
    title: '使用 DROP 构建',
    lead: '从编辑器、终端、AI 客户端或自动化流程发布静态 HTML、CSS 和 JavaScript 项目。Drop MCP、DROP CLI 与 REST API 共用同一组个人 API Key。',
    apiKeys: 'API Keys',
    openApi: 'OpenAPI',
    language: '语言'
  },
  categoryLabels: {
    mcp: 'MCP',
    mcpSummary: '接入 AI 客户端',
    cli: 'CLI',
    cliSummary: '在终端监听并部署',
    api: 'API',
    apiSummary: 'v1 REST 接口参考'
  },
  nav: {
    mcpTitle: 'MCP',
    mcp: [
      ['#mcp', '概览'],
      ['#mcp-quickstart', '快速开始'],
      ['#mcp-clients', '客户端配置'],
      ['#mcp-tools', '工具'],
      ['#mcp-environment', '环境变量'],
      ['#mcp-limits', '限制与安全'],
      ['#mcp-errors', '故障排查']
    ],
    cliTitle: 'CLI',
    cli: [
      ['#cli', '概览'],
      ['#cli-install', '安装'],
      ['#cli-auth', '认证'],
      ['#cli-quickstart', '快速开始'],
      ['#cli-commands', '命令与选项'],
      ['#cli-files', '本地状态'],
      ['#cli-ci', 'CI 部署'],
      ['#cli-errors', '故障排查']
    ],
    apiTitle: 'API',
    api: [
      ['#api', '概览'],
      ['#api-auth', '认证'],
      ['#api-endpoints', '接口'],
      ['#api-deploy', '部署项目'],
      ['#api-limits', '限制'],
      ['#api-errors', '错误']
    ],
    startLabel: '从这里开始',
    startBody: '按你的集成需求创建具备相应权限的 API Key。',
    startLink: '管理 API Keys'
  },
  common: {
    copy: '复制',
    copied: '已复制',
    terminal: '终端',
    required: '必填',
    default: '默认值',
    optional: '可选'
  },
  overview: {
    breadcrumb: '开发者平台',
    title: '选择适合你的工作方式',
    body: '通过 Drop MCP 从 AI 客户端发布站点，用 DROP CLI 保持本地目录与线上同步，或从脚本和 CI 调用 REST API。三种方式创建相同的静态项目，并使用同一组个人 API Key。',
    cards: [
      {
        href: '#mcp',
        kicker: '推荐',
        title: 'Drop MCP',
        body: '让 Codex、Claude Desktop、Cursor 或其他 MCP 客户端验证密钥并发布本地静态站点。',
        meta: '`@micropue/drop-mcp`'
      },
      {
        href: '#cli',
        kicker: '终端',
        title: 'DROP CLI',
        body: '安装一次，之后运行 `drop` 即可部署并监听目录。停止监听后，已发布的站点仍保持在线。',
        meta: '`@micropue/drop-cli`'
      },
      {
        href: '#api',
        kicker: '自动化',
        title: 'REST API',
        body: '通过脚本、CI 流水线或自有工具创建项目、更新元数据并发布完整快照。',
        meta: '`/v1/openapi.json`'
      }
    ],
    scopeTitle: 'MCP 与 CLI 至少需要以下权限',
    scopes: ['projects:read', 'projects:write', 'deployments:write']
  },
  mcp: {
    breadcrumb: 'MCP',
    status: 'stdio · 本地进程',
    title: 'Drop MCP',
    intro: 'Drop MCP 是一个本地 MCP 服务，可读取 HTML、CSS 和 JavaScript 文件、验证连接，并创建或原子替换 DROP 项目。服务由你的 MCP 客户端启动；DROP 不通过公网 HTTP MCP 端点暴露该服务。',
    facts: [
      ['npm 包', '`@micropue/drop-mcp`'],
      ['运行环境', 'Node.js 20.12+'],
      ['传输方式', 'stdio']
    ],
    installTitle: '安装或运行',
    installBody: '无需全局安装。MCP 客户端可通过 `npx` 启动已发布的 npm 包。诊断信息写入 `stderr`，`stdout` 仅用于 MCP 协议消息。',
    quickstartTitle: '快速开始',
    steps: [
      ['创建 API Key', '打开 [API Keys](/developers/keys)，创建包含所需权限的密钥。完整密钥只会显示一次。'],
      ['配置 MCP 客户端', '安装 Node.js 后添加 Drop MCP，并设置 `DROP_API_KEY`。`DROP_ALLOWED_ROOTS` 为可选项，默认使用用户主目录。'],
      ['让客户端执行发布', '先调用 `drop_whoami`，再使用 `drop_publish_site` 发布。只信任工具返回的 `url`。']
    ],
    clientsTitle: '客户端配置',
    clientsBody: '所有客户端启动的都是同一个本地命令，只有 `DROP_API_KEY` 是必填项。默认情况下，本地发布范围限制为用户主目录；如需收窄或更改范围，再设置可选的 `DROP_ALLOWED_ROOTS`。',
    codexCard: {
      client: 'Codex',
      file: '`~/.codex/config.toml`',
      note: '只需将占位密钥替换为你自己的密钥。如需更改默认的用户主目录范围，再添加 `DROP_ALLOWED_ROOTS`。'
    },
    jsonCard: {
      client: 'Claude Desktop · Cursor',
      file: 'MCP JSON',
      note: 'Claude Desktop 使用 `claude_desktop_config.json`。Cursor 支持 `~/.cursor/mcp.json` 或项目内的 `.cursor/mcp.json`。'
    },
    restartNote: '**需要重启。** 修改配置后请重启整个 MCP 客户端。',
    pathsNote: '**可选路径范围。** 默认情况下，Drop MCP 从用户主目录读取文件。设置 `DROP_ALLOWED_ROOTS` 时，Windows 使用 `;`，macOS 和 Linux 使用 `:` 分隔多个目录。',
    toolsTitle: '工具',
    toolColumns: ['工具', '权限', '用途', '主要参数'],
    toolRows: [
      ['`drop_whoami`', '读取', '验证密钥并显示账号、权限与配额。', '无'],
      ['`drop_list_projects`', '读取', '搜索并分页浏览项目。', '`query`、`page`、`perPage`、`sort`'],
      ['`drop_get_project`', '读取', '读取项目详情与文件。', '`projectId` 或 `slug`'],
      ['`drop_publish_site`', '写入', '创建项目，或原子替换其完整文件快照。', '`slug`、`name`、`path` 或 `files`、`ignoreUnsupported`、`message`']
    ],
    toolsNote: '`drop_publish_site` 的 `path` 与 `files` 必须且只能提供一个；`drop_get_project` 的 `projectId` 与 `slug` 必须且只能提供一个。',
    envTitle: '环境变量',
    envColumns: ['变量', '必填', '默认值', '用途'],
    envRows: [
      ['`DROP_API_KEY`', '是', '无', 'DROP 个人 API Key。'],
      ['`DROP_API_BASE`', '否', '`https://drop.micropue.com.cn/v1`', 'API 基础地址。'],
      ['`DROP_REQUEST_TIMEOUT_MS`', '否', '`20000`', '请求超时，可设置为 1,000–120,000 毫秒。'],
      ['`DROP_ALLOWED_ROOTS`', '否', '用户主目录（macOS 为 `/Users/{username}`）', '可选的本地站点发布范围。'],
      ['`DROP_ENV_FILE`', '否', '项目根目录 `.env`', '本地开发时可选的环境变量文件。']
    ],
    limitsTitle: '限制与安全',
    limits: [
      ['1–20', '每个项目的文件数'],
      ['512 KiB', '单文件上限'],
      ['1 MiB', '项目总大小上限'],
      ['50', '目录数上限'],
      ['100', '文件夹完整路径字符数'],
      ['120', '文件完整路径字符数'],
      ['80', '文件名（含扩展名）字符数']
    ],
    safety: [
      '只接受小写扩展名的 `.html`、`.css` 与 `.js` 文件。',
      '文件夹和文件路径使用 `/` 分隔。每段只允许 Unicode 字母（包括中文）、数字、`.`、`_` 和 `-`；空格、`(`、`)` 等括号以及其他符号都会被拒绝。文件名必须以字母或数字开头。',
      '文件必须是有效的 UTF-8 文本。隐藏文件和 `node_modules` 会被跳过。',
      '使用 `path` 发布目录时会拒绝符号链接。',
      '默认情况下，发布范围限制为用户主目录。站点位于专用目录时，可使用 `DROP_ALLOWED_ROOTS` 收窄范围。',
      '不要提交真实 API Key 或本地 `.env` 文件。怀疑泄露时立即吊销密钥。'
    ],
    troubleshootingTitle: '故障排查',
    troubleshootingColumns: ['错误', '含义', '解决方法'],
    troubleshootingRows: [
      ['`missing_api_key`', '进程无法读取 `DROP_API_KEY`。', '在客户端 `env` 块或可读的 `.env` 中设置，然后重启客户端。'],
      ['`401`', '密钥无效、已过期或已吊销。', '运行 `drop_whoami` 验证连接，或创建新的密钥。'],
      ['`403`', '密钥缺少必要权限。', '使用具有 `projects:read`、`projects:write` 与 `deployments:write` 的密钥。'],
      ['`409` / `412`', '发布期间 slug 或项目 revision 已变化。', '重新读取最新项目后重试，不要反复强制旧快照。'],
      ['`413` / `422`', '文件、路径或项目参数未通过校验。', '检查文件数、大小、UTF-8 编码、slug 格式以及 `path`/`files` 的选择。文件夹和文件路径的每一段只允许 Unicode 字母、数字、`.`、`_` 和 `-`，空格和括号不合法。响应中的 `errors` 会标明具体的 `folders[n]` 或 `files[n].path`。'],
      ['`429` / `503`', '请求受到限流，或 DROP 的依赖暂时不可用。', '遵守 `Retry-After`，保留 `requestId`，稍后重试。']
    ]
  },
  cli: {
    breadcrumb: 'CLI',
    status: 'Node.js · npm',
    title: 'DROP CLI',
    intro: 'DROP CLI 可将本地 HTML、CSS 与 JavaScript 目录部署到 DROP，并在运行期间持续同步线上站点。它适合快速完成首次发布、在终端反复迭代，以及在 CI 中执行非交互部署。它不是内网穿透：文件会真实上传到 DROP，停止命令后网站仍保持在线。',
    facts: [
      ['npm 包', '`@micropue/drop-cli`'],
      ['运行环境', 'Node.js 20.12+'],
      ['命令', '`drop` · `drop-cli`']
    ],
    installTitle: '安装',
    installBody: '经常使用时可以全局安装；只运行一次或在 CI 中复现时，可以直接使用 `npx`。',
    requirementNote: '**环境要求。** Node.js 20.12 或更高版本、一个 DROP 个人 API Key，以及一个只包含 UTF-8 `.html`、`.css`、`.js` 文件的目录。文件夹和文件名只能使用字母（包括中文）、数字、`.`、`_` 和 `-`，空格与括号会被拒绝。Vue、React、Astro、Vite 等项目应先生成静态产物，再发布输出目录。',
    authTitle: '认证',
    authBody: '在 [API Keys](/developers/keys) 创建包含 `projects:read`、`projects:write` 与 `deployments:write` 的密钥。`drop login` 会验证密钥并保存到用户配置目录。',
    authNote: '在 CI 等非交互环境中，请设置 `DROP_API_KEY`，它的优先级高于本地凭据。可通过 `DROP_AUTH_FILE` 指定其他凭据文件。',
    quickstartTitle: '快速开始',
    quickstartSteps: [
      ['进入静态站点目录', '在包含 `index.html` 或待发布构建产物的目录中运行以下命令。'],
      ['登录一次', '使用具备三种部署权限的 API Key 完成 CLI 认证。'],
      ['发布并监听', '运行 `drop`。首次使用时 CLI 会创建项目、输出公网地址，并在文件变化后上传新的完整快照。']
    ],
    watchNote: '默认命令等同于 `drop watch`。按 `Ctrl+C` 只会停止监听，网站仍保持在线。之后在同一目录再次运行 `drop`，即可继续更新原项目。',
    commandsTitle: '命令与选项',
    commandColumns: ['命令', '作用'],
    commandRows: [
      ['`drop [directory]`', '监听目录并发布变化，等同于 `drop watch`。'],
      ['`drop watch [directory]`', '监听文件变化，在防抖结束后发布完整快照。'],
      ['`drop deploy [directory]`', '发布一次完整快照后退出，适合 CI 或脚本。'],
      ['`drop init [directory]`', '只创建 `.drop/` 本地记录，不调用 API，也不发布。'],
      ['`drop status [directory]`', '显示本地部署记录，不发送请求。'],
      ['`drop login`', '验证并保存 API Key。'],
      ['`drop whoami`', '显示当前账号、权限与配额。'],
      ['`drop logout`', '删除本地保存的 API Key。']
    ],
    optionsTitle: '常用选项',
    optionColumns: ['选项', '作用'],
    optionRows: [
      ['`--slug <slug>`', '设置项目 slug：1–40 位小写字母、数字或连字符。'],
      ['`--name <name>`', '设置项目显示名称，最多 80 个字符。'],
      ['`--private`', '创建密码保护站点。'],
      ['`--visibility <mode>`', '选择 `public` 或 `password`。'],
      ['`--password <password>`', '设置 6–128 个字符的站点密码。'],
      ['`--api-url <url>`', '覆盖 DROP API 基础地址。'],
      ['`--message <message>`', '添加部署说明，最多 200 个字符。'],
      ['`--force`', '内容哈希未变化时也强制发布。'],
      ['`--interval <ms>`', '设置监听防抖时间，默认 2000 毫秒，最小 500 毫秒。'],
      ['`--poll`', '对网络盘或文件事件不可靠的文件系统使用轮询。']
    ],
    filesTitle: '本地状态与忽略规则',
    filesBody: 'CLI 在 `.drop/` 中保存项目身份和最近一次可复用快照，包括 `drop.json` 和可部署文件。`.drop/` 可能包含站点正文，不应提交到公开仓库，请加入 `.gitignore`。删除 `.drop/` 会失去本地关联，但不会删除线上项目。',
    ignoreBody: '在站点根目录创建 `.drop-ignore`，可排除草稿、私有文件或构建缓存。规则与 `.gitignore` 相同。隐藏文件、符号链接、`.drop/`、`.git/` 与 `node_modules/` 始终会被跳过。',
    ciTitle: 'CI 部署',
    ciBody: '使用 `drop deploy` 执行一次非交互发布。将 `DROP_API_KEY` 保存为受保护的 CI Secret，并发布构建输出目录，而不是源码目录。',
    errorsTitle: '故障排查',
    errorColumns: ['现象', '解决方法'],
    errorRows: [
      ['`401` 或 API Key 无效', '依次运行 `drop logout`、`drop login`、`drop whoami`，并确认三个权限都已勾选。'],
      ['slug 已被占用', '使用其他 `--slug`，或恢复该项目原有的 `.drop/drop.json`。'],
      ['`422` 文件或文件夹路径不合法', '路径的每一段只能使用 Unicode 字母、数字、`.`、`_` 和 `-`，空格、括号及其他符号都会被拒绝。文件夹完整路径最多 100 个字符，文件完整路径最多 120 个字符，文件名（含扩展名）最多 80 个字符。'],
      ['修改没有上线', '确认扩展名为小写 `.html`、`.css` 或 `.js`；检查 `.drop-ignore`、文件大小限制，以及页面是否引用了不支持的资源。'],
      ['网络盘上的修改被漏掉', '使用 `drop --poll` 重新启动。'],
      ['按 `Ctrl+C` 后网站似乎离线', '正常情况下不会离线。运行 `drop status`，再打开 `.drop/drop.json` 中保存的地址；进程退出只会停止监听。'],
      ['图片或字体没有上传', 'API v1 与 CLI 只接受 `.html`、`.css` 与 `.js`。请将其他资源托管到别处，并通过 URL 引用。']
    ]
  },
  api: {
    breadcrumb: 'API',
    status: 'v1',
    title: 'REST API',
    intro: 'API 可让脚本、CI、MCP 服务和 Skill 创建项目并发布完整文件快照。机器可读的接口定义位于 [/v1/openapi.json](/v1/openapi.json)。',
    baseLabel: '基础地址',
    authTitle: '认证',
    authBody: '在 [API Keys](/developers/keys) 创建密钥，然后通过 Bearer Token 发送。`/v1` 不接受会话 Cookie。',
    scopes: [
      '`projects:read` — 列出项目、读取文件、读取部署记录与用量。',
      '`projects:write` — 创建项目并更新元数据。',
      '`deployments:write` — 向已有项目发布新的文件快照。',
      '`projects:delete` — 永久删除项目。'
    ],
    endpointsTitle: '接口',
    endpointColumns: ['方法', '路径', '权限', '用途'],
    endpointRows: [
      ['GET', '`/me`', '任意密钥', '账号与密钥上下文。'],
      ['GET', '`/usage`', '`projects:read`', '项目与部署用量。'],
      ['GET', '`/projects`', '`projects:read`', '列出项目。'],
      ['POST', '`/projects`', '`projects:write` + `deployments:write`', '创建并发布。'],
      ['GET', '`/projects/{id}`', '`projects:read`', '读取项目与文件。'],
      ['PATCH', '`/projects/{id}`', '`projects:write`', '修改元数据。'],
      ['DELETE', '`/projects/{id}`', '`projects:delete`', '删除项目。'],
      ['POST', '`/projects/{id}/deploy`', '`deployments:write`', '发布文件快照。'],
      ['GET', '`/projects/{id}/deployments`', '`projects:read`', '列出部署历史。']
    ],
    deployTitle: '部署项目',
    deployBody: '每次部署都会替换完整文件集合，并以原子方式生效：如果校验或事务失败，旧快照仍保持在线。响应会在新内容可从公网内容域名读取后返回。',
    deployNote: '添加 `If-Match: "rev-3"` 可避免覆盖更新的 revision。添加 `Idempotency-Key` 请求头可让重试更安全。',
    limitsTitle: '限制',
    limits: [
      ['1,000', '每个账号的项目数'],
      ['20', '每个项目的文件数'],
      ['512 KiB', '单文件上限'],
      ['1 MiB', '单项目上限'],
      ['100 / 120 / 80', '文件夹路径 / 文件路径 / 文件名字符数']
    ],
    limitsBody: 'v1 只接受 UTF-8 编码的 `.html`、`.css` 与 `.js` 文件。路径的每一段只允许 Unicode 字母（包括中文）、数字、`.`、`_` 和 `-`；空格、括号及其他符号都会被拒绝。每个密钥的读取请求限制为每分钟 300 次，写入为每分钟 60 次，部署为每分钟 20 次。',
    errorsTitle: '错误',
    errorsBody: '错误使用 `application/problem+json`，包含稳定的 `code` 与 `requestId`。'
  },
  footer: {
    note: 'DROP v1 有意只支持静态 HTML、CSS 与 JavaScript。',
    npm: 'npm',
    github: 'GitHub',
    openApi: 'OpenAPI'
  }
}

export default zh
