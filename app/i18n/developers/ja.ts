import type { DocsContent } from './en'

const ja: DocsContent = {
  meta: {
    title: '開発者ドキュメント',
    description: 'Drop MCP または DROP CLI を導入するか、v1 REST API で静的サイトを公開します。'
  },
  header: {
    title: 'DROP で構築する',
    lead: 'エディタ、ターミナル、AI クライアント、自動化から静的 HTML・CSS・JavaScript プロジェクトを公開できます。Drop MCP、DROP CLI、REST API は同じパーソナル API キーを使用します。',
    apiKeys: 'API Keys',
    openApi: 'OpenAPI',
    language: '言語'
  },
  categoryLabels: {
    mcp: 'MCP',
    mcpSummary: 'AI クライアント連携',
    cli: 'CLI',
    cliSummary: 'ターミナルから監視・デプロイ',
    api: 'API',
    apiSummary: 'v1 REST リファレンス'
  },
  nav: {
    mcpTitle: 'MCP',
    mcp: [
      ['#mcp', '概要'],
      ['#mcp-quickstart', 'クイックスタート'],
      ['#mcp-clients', 'クライアント設定'],
      ['#mcp-tools', 'ツール'],
      ['#mcp-environment', '環境変数'],
      ['#mcp-limits', '制限と安全性'],
      ['#mcp-errors', 'トラブルシューティング']
    ],
    cliTitle: 'CLI',
    cli: [
      ['#cli', '概要'],
      ['#cli-install', 'インストール'],
      ['#cli-auth', '認証'],
      ['#cli-quickstart', 'クイックスタート'],
      ['#cli-commands', 'コマンドとオプション'],
      ['#cli-files', 'ローカル状態'],
      ['#cli-ci', 'CI デプロイ'],
      ['#cli-errors', 'トラブルシューティング']
    ],
    apiTitle: 'API',
    api: [
      ['#api', '概要'],
      ['#api-auth', '認証'],
      ['#api-endpoints', 'エンドポイント'],
      ['#api-deploy', 'プロジェクトの公開'],
      ['#api-limits', '制限'],
      ['#api-errors', 'エラー']
    ],
    startLabel: 'はじめに',
    startBody: '連携に必要なスコープを持つキーを作成してください。',
    startLink: 'API キーを管理'
  },
  common: {
    copy: 'コピー',
    copied: 'コピー済み',
    terminal: 'ターミナル',
    required: '必須',
    default: 'デフォルト',
    optional: '任意'
  },
  overview: {
    breadcrumb: '開発者プラットフォーム',
    title: 'ワークフローに合う方法を選ぶ',
    body: 'AI クライアントからは Drop MCP で、ターミナルからは DROP CLI でローカルディレクトリを同期し、スクリプトや CI からは REST API を直接呼び出せます。どの方法でも同じ静的プロジェクトが作成され、同じパーソナル API キーを使用します。',
    cards: [
      {
        href: '#mcp',
        kicker: 'おすすめ',
        title: 'Drop MCP',
        body: 'Codex、Claude Desktop、Cursor などの MCP クライアントからキーを検証し、ローカルの静的サイトを公開できます。',
        meta: '`@micropue/drop-mcp`'
      },
      {
        href: '#cli',
        kicker: 'ターミナル',
        title: 'DROP CLI',
        body: '一度インストールし、`drop` を実行するだけで公開とディレクトリ監視を開始できます。監視を止めてもサイトはオンラインのままです。',
        meta: '`@micropue/drop-cli`'
      },
      {
        href: '#api',
        kicker: '自動化',
        title: 'REST API',
        body: 'スクリプト、CI、独自ツールからプロジェクト作成、メタデータ更新、完全なスナップショット公開を実行できます。',
        meta: '`/v1/openapi.json`'
      }
    ],
    scopeTitle: 'MCP と CLI に必要な最小スコープ',
    scopes: ['projects:read', 'projects:write', 'deployments:write']
  },
  mcp: {
    breadcrumb: 'MCP',
    status: 'stdio · ローカルプロセス',
    title: 'Drop MCP',
    intro: 'Drop MCP は、HTML・CSS・JavaScript ファイルを読み取り、接続を検証し、DROP プロジェクトを作成または原子的に置き換えるローカル MCP サーバーです。プロセスは MCP クライアントが起動します。DROP はこのサーバーをリモート HTTP MCP エンドポイントとして公開しません。',
    facts: [
      ['パッケージ', '`@micropue/drop-mcp`'],
      ['実行環境', 'Node.js 20.12+'],
      ['トランスポート', 'stdio']
    ],
    installTitle: 'インストールまたは実行',
    installBody: 'グローバルインストールは不要です。MCP クライアントは公開済みパッケージを `npx` で起動できます。診断情報は `stderr` に出力され、`stdout` は MCP プロトコル専用です。',
    quickstartTitle: 'クイックスタート',
    steps: [
      ['API キーを作成', '[API Keys](/developers/keys) を開き、必要なスコープを持つキーを作成します。完全なキーは一度だけ表示されます。'],
      ['MCP クライアントを設定', 'Node.js を用意して Drop MCP を追加し、クライアントの環境に `DROP_API_KEY` と `DROP_ALLOWED_ROOTS` を設定します。'],
      ['クライアントから公開', '最初に `drop_whoami` を呼び、次に `drop_publish_site` で公開します。ツールが返した `url` だけを信頼してください。']
    ],
    clientsTitle: 'クライアント設定',
    clientsBody: 'どのクライアントも同じローカルコマンドを起動します。`DROP_ALLOWED_ROOTS` には専用の絶対パスのサイトディレクトリを指定し、MCP プロセスが無関係なローカルファイルを読めないようにしてください。',
    codexCard: {
      client: 'Codex',
      file: '`~/.codex/config.toml`',
      note: 'プレースホルダーのキーとディレクトリを自分の値に置き換えてください。'
    },
    jsonCard: {
      client: 'Claude Desktop · Cursor',
      file: 'MCP JSON',
      note: 'Claude Desktop は `claude_desktop_config.json` を使用します。Cursor は `~/.cursor/mcp.json` またはプロジェクト内の `.cursor/mcp.json` に対応しています。'
    },
    restartNote: '**再起動が必要です。** 設定を変更したら MCP クライアント全体を再起動してください。',
    pathsNote: '**パスリスト。** Windows では `;`、macOS と Linux では `:` で複数の許可ルートを区切ります。',
    toolsTitle: 'ツール',
    toolColumns: ['ツール', 'アクセス', '用途', '主なパラメータ'],
    toolRows: [
      ['`drop_whoami`', '読み取り', 'キーを検証し、アカウント、スコープ、制限を表示します。', 'なし'],
      ['`drop_list_projects`', '読み取り', 'プロジェクトを検索し、ページ単位で取得します。', '`query`、`page`、`perPage`、`sort`'],
      ['`drop_get_project`', '読み取り', 'プロジェクトの詳細とファイルを読み取ります。', '`projectId` または `slug`'],
      ['`drop_publish_site`', '書き込み', 'プロジェクトを作成、または完全なファイルスナップショットを原子的に置換します。', '`slug`、`name`、`path` または `files`、`ignoreUnsupported`、`message`']
    ],
    toolsNote: '`drop_publish_site` には `path` または `files` のどちらか一方だけを指定します。`drop_get_project` には `projectId` または `slug` のどちらか一方だけを指定します。',
    envTitle: '環境変数',
    envColumns: ['変数', '必須', 'デフォルト', '用途'],
    envRows: [
      ['`DROP_API_KEY`', 'はい', 'なし', 'DROP パーソナル API キー。'],
      ['`DROP_API_BASE`', 'いいえ', '`https://drop.micropue.com.cn/v1`', 'API のベース URL。'],
      ['`DROP_REQUEST_TIMEOUT_MS`', 'いいえ', '`20000`', 'リクエストタイムアウト。1,000〜120,000 ミリ秒。'],
      ['`DROP_ALLOWED_ROOTS`', 'いいえ', 'MCP プロセスの作業ディレクトリ', 'ローカルサイトの公開を許可するファイルシステムルート。'],
      ['`DROP_ENV_FILE`', 'いいえ', 'プロジェクトルートの `.env`', 'ローカル開発用の任意の env ファイル。']
    ],
    limitsTitle: '制限と安全性',
    limits: [
      ['1〜20', 'プロジェクトあたりのファイル数'],
      ['512 KiB', '1 ファイルの上限'],
      ['1 MiB', 'プロジェクト全体の上限'],
      ['50', 'ディレクトリ数の上限']
    ],
    safety: [
      '小文字拡張子の `.html`、`.css`、`.js` のみ受け付けます。',
      '各ファイルは有効な UTF-8 テキストである必要があります。隠しファイルと `node_modules` はスキップされます。',
      '`path` でディレクトリを公開する場合、シンボリックリンクは拒否されます。',
      '`DROP_ALLOWED_ROOTS` は可能な限り狭くし、ホームディレクトリやディスク全体を指定しないでください。',
      '実際の API キーやローカルの `.env` をコミットしないでください。漏えいの疑いがあるキーは失効させてください。'
    ],
    troubleshootingTitle: 'トラブルシューティング',
    troubleshootingColumns: ['エラー', '意味', '解決方法'],
    troubleshootingRows: [
      ['`missing_api_key`', 'プロセスが `DROP_API_KEY` を読み取れませんでした。', 'クライアントの `env` ブロックまたは読み取り可能な `.env` に設定し、クライアントを再起動します。'],
      ['`401`', 'キーが無効、期限切れ、または失効しています。', '`drop_whoami` で接続を確認するか、新しいキーを作成します。'],
      ['`403`', 'キーに必要なスコープが揃っていません。', '`projects:read`、`projects:write`、`deployments:write` を持つキーを使用します。'],
      ['`409` / `412`', '公開中に slug またはプロジェクト revision が変更されました。', '最新のプロジェクトを再取得してから再試行し、古いスナップショットを強制しないでください。'],
      ['`413` / `422`', 'ファイル、パス、プロジェクト設定の検証に失敗しました。', 'ファイル数、サイズ、拡張子、UTF-8 エンコード、slug 形式、`path`/`files` の指定を確認します。'],
      ['`429` / `503`', 'レート制限中、または DROP の依存サービスが一時的に利用できません。', '`Retry-After` に従い、`requestId` を保管して後で再試行します。']
    ]
  },
  cli: {
    breadcrumb: 'CLI',
    status: 'Node.js · npm',
    title: 'DROP CLI',
    intro: 'DROP CLI はローカルの HTML・CSS・JavaScript ディレクトリを DROP に公開し、実行中はサイトを継続的に同期します。最初の公開を素早く行う用途、ターミナルでの反復作業、CI での非対話実行に向いています。トンネルとは異なり、ファイルは実際に DROP へアップロードされるため、コマンドを停止してもサイトはオンラインのままです。',
    facts: [
      ['パッケージ', '`@micropue/drop-cli`'],
      ['実行環境', 'Node.js 20.12+'],
      ['コマンド', '`drop` · `drop-cli`']
    ],
    installTitle: 'インストール',
    installBody: '頻繁に使う場合はグローバルにインストールします。単発の実行や再現性のある CI ステップには `npx` を使用します。',
    requirementNote: '**必要条件。** Node.js 20.12 以上、DROP パーソナル API キー、UTF-8 の `.html`・`.css`・`.js` のみを含むディレクトリが必要です。Vue、React、Astro、Vite などのプロジェクトは先にビルドし、静的出力ディレクトリを公開してください。',
    authTitle: '認証',
    authBody: '[API Keys](/developers/keys) で `projects:read`、`projects:write`、`deployments:write` を持つキーを作成します。`drop login` がキーを検証し、ユーザー設定ディレクトリに保存します。',
    authNote: 'CI などの非対話環境では `DROP_API_KEY` を設定してください。保存済みの認証情報より優先されます。別の認証ファイルを使う場合は `DROP_AUTH_FILE` を指定します。',
    quickstartTitle: 'クイックスタート',
    quickstartSteps: [
      ['静的サイトのディレクトリへ移動', '`index.html` または公開したいビルド出力を含むフォルダでコマンドを実行します。'],
      ['一度だけログイン', '3 つのデプロイ用スコープを持つ API キーで CLI を認証します。'],
      ['公開して監視', '`drop` を実行します。初回はプロジェクトを作成して公開 URL を表示し、ファイル変更後に新しい完全スナップショットをアップロードします。']
    ],
    watchNote: 'デフォルトコマンドは `drop watch` と同じです。`Ctrl+C` は監視だけを停止し、サイトはオンラインのままです。同じディレクトリで後から `drop` を実行すると、同じプロジェクトの更新を続けられます。',
    commandsTitle: 'コマンドとオプション',
    commandColumns: ['コマンド', '動作'],
    commandRows: [
      ['`drop [directory]`', 'ディレクトリを監視して変更を公開します。`drop watch` と同じです。'],
      ['`drop watch [directory]`', 'ファイル変更を監視し、デバウンス後に完全なスナップショットを公開します。'],
      ['`drop deploy [directory]`', '完全なスナップショットを 1 回公開して終了します。CI やスクリプト向けです。'],
      ['`drop init [directory]`', 'API を呼ばず、公開もせずに `.drop/` のローカル情報だけを作成します。'],
      ['`drop status [directory]`', 'リクエストを送らずにローカルのデプロイ記録を表示します。'],
      ['`drop login`', 'API キーを検証して保存します。'],
      ['`drop whoami`', '現在のアカウント、スコープ、クォータを表示します。'],
      ['`drop logout`', 'ローカルに保存した API キーを削除します。']
    ],
    optionsTitle: 'よく使うオプション',
    optionColumns: ['オプション', '用途'],
    optionRows: [
      ['`--slug <slug>`', 'プロジェクト slug を指定します。小文字英数字とハイフンで 1〜40 文字。'],
      ['`--name <name>`', 'プロジェクト表示名を最大 80 文字で指定します。'],
      ['`--private`', 'パスワード保護付きサイトを作成します。'],
      ['`--visibility <mode>`', '`public` または `password` を選択します。'],
      ['`--password <password>`', '6〜128 文字のサイトパスワードを指定します。'],
      ['`--api-url <url>`', 'DROP API のベース URL を上書きします。'],
      ['`--message <message>`', 'デプロイメモを最大 200 文字で付けます。'],
      ['`--force`', 'コンテンツハッシュが変わっていなくても公開します。'],
      ['`--interval <ms>`', '監視のデバウンス時間を指定します。デフォルト 2000 ミリ秒、最小 500 ミリ秒。'],
      ['`--poll`', 'ネットワークドライブなど、ファイルイベントが不安定な環境でポーリングします。']
    ],
    filesTitle: 'ローカル状態と除外ルール',
    filesBody: 'CLI は `.drop/` にプロジェクト識別情報と最新の再利用可能なスナップショットを保存します。これには `drop.json` と公開対象ファイルが含まれます。サイト本文を含む可能性があるため、公開リポジトリに `.drop/` をコミットせず `.gitignore` に追加してください。`.drop/` を削除するとローカルの関連情報は失われますが、オンラインプロジェクトは削除されません。',
    ignoreBody: 'サイトルートに `.drop-ignore` を作成すると、下書き、非公開ファイル、ビルドキャッシュを除外できます。書式は `.gitignore` と同じです。隠しファイル、シンボリックリンク、`.drop/`、`.git/`、`node_modules/` は常にスキップされます。',
    ciTitle: 'CI デプロイ',
    ciBody: '非対話の単発公開には `drop deploy` を使用します。`DROP_API_KEY` は保護された CI シークレットとして渡し、ソースではなくビルド出力ディレクトリを公開してください。',
    errorsTitle: 'トラブルシューティング',
    errorColumns: ['症状', '解決方法'],
    errorRows: [
      ['`401` または API キーが無効', '`drop logout`、`drop login`、`drop whoami` の順に実行し、3 つのスコープを確認します。'],
      ['slug が使用済み', '別の `--slug` を指定するか、そのプロジェクトの元の `.drop/drop.json` を復元します。'],
      ['変更が反映されない', '拡張子が小文字の `.html`、`.css`、`.js` か確認し、`.drop-ignore`、サイズ制限、未対応アセットへの参照を確認します。'],
      ['ネットワークドライブで変更を取りこぼす', '`drop --poll` で再起動します。'],
      ['`Ctrl+C` 後にサイトが消えたように見える', '通常は停止しません。`drop status` を実行し、`.drop/drop.json` に保存された URL を開いてください。プロセス終了で止まるのは監視だけです。'],
      ['画像やフォントがアップロードされない', 'API v1 と CLI が受け付けるのは `.html`、`.css`、`.js` のみです。他のアセットは別途ホストし、URL で参照してください。']
    ]
  },
  api: {
    breadcrumb: 'API',
    status: 'v1',
    title: 'REST API',
    intro: 'API を使うと、スクリプト、CI、MCP サーバー、Skill からプロジェクトを作成し、完全なファイルスナップショットを公開できます。機械可読な仕様は [/v1/openapi.json](/v1/openapi.json) にあります。',
    baseLabel: 'ベース URL',
    authTitle: '認証',
    authBody: '[API Keys](/developers/keys) でキーを作成し、Bearer トークンとして送信します。`/v1` ではセッション Cookie を受け付けません。',
    scopes: [
      '`projects:read` — プロジェクト一覧、ファイル、デプロイ、使用量の読み取り。',
      '`projects:write` — プロジェクト作成とメタデータ更新。',
      '`deployments:write` — 既存プロジェクトへ新しいファイルスナップショットを公開。',
      '`projects:delete` — プロジェクトを完全に削除。'
    ],
    endpointsTitle: 'エンドポイント',
    endpointColumns: ['メソッド', 'パス', 'スコープ', '用途'],
    endpointRows: [
      ['GET', '`/me`', '任意のキー', 'アカウントとキーのコンテキスト。'],
      ['GET', '`/usage`', '`projects:read`', 'プロジェクトとデプロイの使用量。'],
      ['GET', '`/projects`', '`projects:read`', 'プロジェクト一覧。'],
      ['POST', '`/projects`', '`projects:write` + `deployments:write`', '作成と公開。'],
      ['GET', '`/projects/{id}`', '`projects:read`', 'プロジェクトとファイルの読み取り。'],
      ['PATCH', '`/projects/{id}`', '`projects:write`', 'メタデータの変更。'],
      ['DELETE', '`/projects/{id}`', '`projects:delete`', 'プロジェクトの削除。'],
      ['POST', '`/projects/{id}/deploy`', '`deployments:write`', 'ファイルスナップショットの公開。'],
      ['GET', '`/projects/{id}/deployments`', '`projects:read`', 'デプロイ履歴の一覧。']
    ],
    deployTitle: 'プロジェクトの公開',
    deployBody: 'デプロイは完全なファイルセットを置き換え、原子的に反映されます。検証またはトランザクションが失敗した場合、以前のスナップショットがオンラインのまま残ります。新しい内容が公開コンテンツドメインから読み取れるようになってからレスポンスが返ります。',
    deployNote: 'より新しい revision を上書きしないように `If-Match: "rev-3"` を追加します。`Idempotency-Key` ヘッダーを付けると安全に再試行できます。',
    limitsTitle: '制限',
    limits: [
      ['100', 'アカウントあたりのプロジェクト数'],
      ['20', 'プロジェクトあたりのファイル数'],
      ['512 KiB', '1 ファイルあたり'],
      ['1 MiB', '1 プロジェクトあたり']
    ],
    limitsBody: 'v1 は `.html`、`.css`、`.js` のみ受け付けます。キーごとに読み取りは毎分 300 回、書き込みは毎分 60 回、デプロイは毎分 20 回に制限されます。',
    errorsTitle: 'エラー',
    errorsBody: 'エラーは `application/problem+json` 形式で、安定した `code` と `requestId` を含みます。'
  },
  footer: {
    note: 'DROP v1 は静的 HTML・CSS・JavaScript のみを意図的にサポートしています。',
    npm: 'npm',
    github: 'GitHub',
    openApi: 'OpenAPI'
  }
}

export default ja
