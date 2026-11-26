import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createJiti } from 'jiti'

process.env.AUTH_SECRET ||= 'developer-platform-test-secret'

const jiti = createJiti(import.meta.url)
const apiKeys = await jiti.import('../server/utils/api-keys.ts')
const developerPortal = await jiti.import('../server/utils/developer-portal.ts')
const projectPaths = await jiti.import('../shared/project-paths.ts')

const first = apiKeys.generateApiKey()
const second = apiKeys.generateApiKey()

assert.match(first.token, /^drop_sk_[A-Za-z0-9_-]{43}$/)
assert.equal(first.token.length, 51)
assert.equal(first.prefix, first.token.slice(0, 16))
assert.equal(first.hash, apiKeys.hashApiKey(first.token))
assert.equal(first.hash.length, 64)
assert.notEqual(first.token, second.token)
assert.notEqual(first.hash, second.hash)

assert.deepEqual(
  apiKeys.normalizeScopes(['projects:read', 'projects:read', 'deployments:write']),
  ['projects:read', 'deployments:write']
)
assert.throws(() => apiKeys.normalizeScopes(['projects:read', 'unknown']))
assert.throws(() => apiKeys.normalizeScopes([]))

assert.equal(apiKeys.normalizeExpiry(undefined), 90)
assert.equal(apiKeys.normalizeExpiry(null), null)
assert.equal(apiKeys.normalizeExpiry('never'), null)
assert.equal(apiKeys.normalizeExpiry(30), 30)
assert.equal(apiKeys.normalizeExpiry(365), 365)
assert.throws(() => apiKeys.normalizeExpiry(7))
assert.equal(apiKeys.MAX_ACTIVE_KEYS, 100)

assert.equal(developerPortal.normalizeHostname('drop.micropue.com.cn:80'), 'drop.micropue.com.cn')
assert.equal(developerPortal.normalizeHostname('https://DROP.micropue.com.cn:443/path'), 'drop.micropue.com.cn')
assert.equal(developerPortal.normalizeHostname('drop.micropue.com.cn.'), 'drop.micropue.com.cn')
assert.equal(developerPortal.normalizeHostname('not a host'), '')

assert.deepEqual(projectPaths.validateFolderPath('中文/notes-v2'), {
  ok: true,
  path: '中文/notes-v2'
})
assert.deepEqual(projectPaths.validateFilePath('assets/style.css'), {
  ok: true,
  path: 'assets/style.css',
  language: 'css'
})
assert.match(
  projectPaths.validateFolderPath('Documents (old)').message,
  /unsupported characters.*"\(" and "\)"/
)
assert.match(projectPaths.validateFilePath('my file.html').message, /unsupported character/)
assert.match(projectPaths.validateFilePath('index.HTML').message, /lowercase \.html, \.css or \.js/)
assert.match(projectPaths.validateFilePath('.hidden.html').message, /must start with a Unicode letter or number/)
assert.match(
  projectPaths.validateFilePath(`assets/${'a'.repeat(101)}/index.html`).message,
  /Folder path.*too long/
)
assert.match(
  projectPaths.validateFilePath(`${'a'.repeat(119)}.html`).message,
  /File path.*too long/
)

const openapiJson = JSON.parse(fs.readFileSync(new URL('../server/assets/openapi.v1.json', import.meta.url), 'utf8'))
assert.equal(openapiJson.openapi, '3.1.0')
assert.equal(openapiJson.paths['/projects/{projectId}/deploy'].post.operationId, 'deployProject')

// docs/ 是本地内部文档，不进 CI；本地存在时额外校验 YAML 与发布 JSON 同步。
const openapiYamlPath = new URL('../docs/openapi.v1.yaml', import.meta.url)
if (fs.existsSync(openapiYamlPath) && !process.env.CI) {
  const { default: YAML } = await import('yaml')
  const openapiYaml = YAML.parse(fs.readFileSync(openapiYamlPath, 'utf8'))
  assert.deepEqual(openapiJson, openapiYaml)
}

const operationIds = []
for (const [path, item] of Object.entries(openapiJson.paths)) {
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    if (item[method]) operationIds.push(item[method].operationId)
  }
}
assert.equal(new Set(operationIds).size, operationIds.length)
assert.equal(operationIds.length, 11)
assert.equal(openapiJson.components.schemas.KeyInfo.properties.expiresAt.type[1], 'null')

const schemaSource = fs.readFileSync(new URL('../server/utils/schema.ts', import.meta.url), 'utf8')
assert.doesNotMatch(schemaSource, /\bDROP\s+TABLE\b/i)
assert.doesNotMatch(schemaSource, /\bTRUNCATE\b/i)
assert.doesNotMatch(schemaSource, /\bDROP\s+COLUMN\b/i)
assert.match(schemaSource, /CREATE TABLE IF NOT EXISTS/)
assert.match(schemaSource, /addColumnIfMissing/)

console.log('[test:developer] developer platform checks passed')
process.exit(0)
