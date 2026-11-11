// 给本地/演示环境注入示例项目（只写数据库，不落磁盘）
// 用法：node --env-file-if-exists=.env scripts/seed-demo.mjs <username>
import { randomBytes, randomUUID, scryptSync } from 'node:crypto'
import mysql from 'mysql2/promise'

const username = process.argv[2] || 'micropue'
const demoSlugs = [
  'personal-site', 'portfolio', 'photo-gallery', 'blog', 'links', 'wedding', 'resume',
  'landing', 'showcase', 'event', 'music', 'weather', 'todo', 'quiz', 'countdown',
  'typing', 'colors', 'maze', 'snake', 'pomodoro', 'docs', 'changelog', 'not-found'
]

const projects = [
  { name: 'Personal Site', slug: 'personal-site', accent: '#6366f1' },
  { name: 'Portfolio', slug: 'portfolio', accent: '#0ea5e9' },
  { name: 'Photo Gallery', slug: 'photo-gallery', accent: '#f97316' },
  { name: 'Blog', slug: 'blog', accent: '#22c55e' },
  { name: 'Link in Bio', slug: 'links', accent: '#ec4899' },
  { name: 'Wedding Invitation', slug: 'wedding', accent: '#d4a373' },
  { name: 'Resume', slug: 'resume', accent: '#334155' },
  { name: 'Landing Page', slug: 'landing', accent: '#8b5cf6' },
  { name: 'Product Showcase', slug: 'showcase', accent: '#14b8a6' },
  { name: 'Event Page', slug: 'event', accent: '#ef4444' },
  { name: 'Music Player', slug: 'music', accent: '#a855f7' },
  { name: 'Weather App', slug: 'weather', accent: '#38bdf8' },
  { name: 'Todo List', slug: 'todo', accent: '#10b981' },
  { name: 'Quiz', slug: 'quiz', accent: '#f59e0b' },
  { name: 'Countdown', slug: 'countdown', accent: '#e11d48' },
  { name: 'Typing Test', slug: 'typing', accent: '#64748b' },
  { name: 'Color Picker', slug: 'colors', accent: '#f43f5e' },
  { name: 'Maze Game', slug: 'maze', accent: '#84cc16' },
  { name: 'Snake Game', slug: 'snake', accent: '#16a34a' },
  { name: 'Pomodoro Timer', slug: 'pomodoro', accent: '#fb7185' },
  { name: 'Documentation', slug: 'docs', accent: '#0f172a' },
  { name: 'Changelog', slug: 'changelog', accent: '#7c3aed' },
  { name: '404 Page', slug: 'not-found', accent: '#52525b' }
]

function html(name, cssPath, jsPath = 'app.js') {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${name}</title>
  <link rel="stylesheet" href="${cssPath}">
</head>
<body>
  <main class="page">
    <h1>${name}</h1>
    <p>This is a sample ${name} project on MICROPUE DROP.</p>
    <button id="cta" type="button">Say hello</button>
    <p id="out" class="out" hidden></p>
  </main>
  <script src="${jsPath}"><\/script>
</body>
</html>
`
}

function css(accent) {
  return `:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: ui-sans-serif, system-ui, sans-serif;
  background: #fafafa;
  color: #18181b;
}
.page {
  max-width: 560px;
  padding: 3rem 2rem;
  border-top: 3px solid ${accent};
}
h1 { margin: 0 0 0.75rem; font-size: 2rem; letter-spacing: -0.02em; }
p { line-height: 1.7; color: #52525b; }
button {
  margin-top: 1rem;
  padding: 0.6rem 1.1rem;
  border: 0;
  border-radius: 6px;
  background: ${accent};
  color: #fff;
  font: inherit;
  cursor: pointer;
}
.out { margin-top: 1rem; font-size: 0.9rem; }
`
}

function js(name) {
  return `const button = document.getElementById('cta')
const out = document.getElementById('out')

button.addEventListener('click', () => {
  out.hidden = false
  out.textContent = 'Hello from ${name}.'
})
`
}

function withFolders(project, index) {
  const nested = index % 4 === 0
  const extraPage = index % 5 === 0
  const files = nested
    ? [
        { name: 'index.html', language: 'html', content: html(project.name, 'assets/style.css') },
        { name: 'assets/style.css', language: 'css', content: css(project.accent) },
        { name: 'app.js', language: 'js', content: js(project.name) }
      ]
    : [
        { name: 'index.html', language: 'html', content: html(project.name, 'style.css') },
        { name: 'style.css', language: 'css', content: css(project.accent) },
        { name: 'app.js', language: 'js', content: js(project.name) }
      ]

  if (extraPage) {
    files.push({
      name: 'pages/about.html',
      language: 'html',
      content: html(`${project.name} — About`, nested ? '../assets/style.css' : '../style.css', '../app.js')
    })
  }

  const folders = new Set()
  for (const file of files) {
    const parts = file.name.split('/')
    parts.pop()
    let current = ''
    for (const part of parts) {
      current = current ? `${current}/${part}` : part
      folders.add(current)
    }
  }
  return { files, folders: [...folders].sort() }
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`
}

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
})

try {
  const [accounts] = await conn.query('SELECT `bits_id` FROM `accounts` WHERE `username` = ? LIMIT 1', [username])
  const owner = accounts[0]?.bits_id
  if (!owner) throw new Error(`Account not found: ${username}`)

  // 重复执行时先清掉旧的示例项目（project_files 级联删除）
  await conn.query('DELETE FROM `projects` WHERE `owner_bits_id` = ? AND `slug` IN (?)', [owner, demoSlugs])

  let index = 0
  for (const project of projects) {
    const { files, folders } = withFolders(project, index)
    const visibility = index % 5 === 3 ? 'password' : 'public'
    const enabled = index % 7 === 3 ? 0 : 1
    const sid = randomUUID()

    await conn.query(
      'INSERT INTO `projects` (`sid`, `owner_bits_id`, `slug`, `name`, `visibility`, `enabled`, `password_hash`, `folders`, `updated_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL ? DAY)',
      [sid, owner, project.slug, project.name, visibility, enabled,
        visibility === 'password' ? hashPassword('demo123') : null,
        JSON.stringify(folders), index]
    )

    for (const [order, file] of files.entries()) {
      await conn.query(
        'INSERT INTO `project_files` (`sid`, `project_sid`, `name`, `language`, `content`, `sort_order`) VALUES (?, ?, ?, ?, ?, ?)',
        [randomUUID(), sid, file.name, file.language, file.content, order]
      )
    }
    index++
  }

  const [[count]] = await conn.query(
    'SELECT COUNT(*) AS `count` FROM `projects` WHERE `owner_bits_id` = ?', [owner]
  )
  console.log(`Seeded ${projects.length} projects for ${username}. Total projects: ${count.count}`)
} finally {
  await conn.end()
}
