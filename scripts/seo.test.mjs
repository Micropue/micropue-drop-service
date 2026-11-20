import assert from 'node:assert/strict'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
const seo = await jiti.import('../server/utils/seo.ts')
const llms = await jiti.import('../server/utils/llms.ts')

const staticUrls = seo.STATIC_SITEMAP_ENTRIES.map(entry => entry.url)
assert.deepEqual(staticUrls, ['/', '/developers', '/privacy', '/llms.txt', '/llms-full.txt'])
assert.ok(seo.STATIC_SITEMAP_ENTRIES.every(entry => !Number.isNaN(Date.parse(entry.lastmod))))
assert.ok(!staticUrls.some(url => /\/(?:sign|dashboard|new|account)$|\/developers\/keys$/.test(url)))

assert.equal(seo.normalizeBaseUrl('https://drop.example.test///'), 'https://drop.example.test')
assert.equal(seo.normalizeSitemapLastmod('2026-11-20 10:00:00'), '2026-11-20T02:00:00.000Z')
assert.equal(seo.normalizeSitemapLastmod('2026-11-20T10:00:00+08:00'), '2026-11-20T02:00:00.000Z')
assert.equal(seo.normalizeSitemapLastmod('not-a-date'), null)

assert.equal(seo.isTemporarySitemapProject('site-124bf6', 'Portfolio'), true)
assert.equal(seo.isTemporarySitemapProject('news-1120-19', 'Morning brief'), true)
assert.equal(seo.isTemporarySitemapProject('gh-new-1120', 'Release notes'), true)
assert.equal(seo.isTemporarySitemapProject('my-test-site', 'Portfolio'), true)
assert.equal(seo.isTemporarySitemapProject('notes', 'Test'), true)
assert.equal(seo.isTemporarySitemapProject('notes', '发布测试'), true)
assert.equal(seo.isTemporarySitemapProject('notes', 'Field notes'), false)
assert.equal(seo.isTemporarySitemapProject('notes', 'Testimonials'), false)

const entries = seo.contentSitemapEntries([
  { username: 'alice', name: 'Portfolio', slug: 'portfolio', lastmod: '2026-11-19 10:00:00' },
  { username: 'alice', name: 'Portfolio', slug: 'portfolio', lastmod: '2026-11-20 10:00:00' },
  { username: 'alice', name: 'Portfolio', slug: 'portfolio', lastmod: '2026-11-18 10:00:00' },
  { username: 'alice', name: 'Personal home', slug: '个人主页', lastmod: '2026-11-21T09:00:00+08:00' },
  { username: 'alice', name: 'Field notes', slug: 'notes', lastmod: '2026-11-17 09:00:00' },
  { username: 'alice', name: 'Real site', slug: 'site-124bf6', lastmod: '2026-11-21 09:00:00' },
  { username: 'alice', name: 'Morning brief', slug: 'news-1120-19', lastmod: '2026-11-21 09:00:00' },
  { username: 'alice', name: 'Portfolio', slug: 'my-test-site', lastmod: '2026-11-21 09:00:00' },
  { username: 'alice', name: 'Test', slug: 'generic-test', lastmod: '2026-11-21 09:00:00' },
  { username: '', name: 'No owner', slug: 'orphan', lastmod: '2026-11-21 09:00:00' },
  { username: 'alice', name: 'Invalid timestamp', slug: 'invalid', lastmod: 'not-a-date' }
], 'https://dropcontent.example.test/')

assert.deepEqual(entries, [
  {
    url: 'https://dropcontent.example.test/alice/%E4%B8%AA%E4%BA%BA%E4%B8%BB%E9%A1%B5/',
    lastmod: '2026-11-21T01:00:00.000Z'
  },
  {
    url: 'https://dropcontent.example.test/alice/portfolio/',
    lastmod: '2026-11-20T02:00:00.000Z'
  },
  {
    url: 'https://dropcontent.example.test/alice/notes/',
    lastmod: '2026-11-17T01:00:00.000Z'
  }
])

const urlset = seo.sitemapXml([
  { url: 'https://drop.example.test/?a=1&b=2', lastmod: '2026-11-21T00:00:00.000Z' }
])
assert.match(urlset, /<loc>https:\/\/drop\.example\.test\/\?a=1&amp;b=2<\/loc>/)

const index = seo.sitemapIndexXml([
  { url: 'https://drop.example.test/sitemap-main.xml' },
  { url: 'https://dropcontent.example.test/sitemap-content.xml' }
])
assert.match(index, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/)
assert.match(index, /sitemap-content\.xml/)

const { short, full } = llms.buildLlmsDocuments(
  'https://drop.example.test/',
  'https://dropcontent.example.test/'
)
for (const document of [short, full]) {
  assert.match(document, /^# DROP/)
  assert.match(document, /Last updated: 2026-11-21/)
  assert.match(document, /https:\/\/drop\.example\.test\/developers/)
  assert.match(document, /https:\/\/dropcontent\.example\.test\/\{username\}\/\{project\}\//)
  assert.doesNotMatch(document, /drop\.example\.test\/\/developers/)
}
assert.match(short, /## Core pages/)
assert.match(short, /## Product definition/)
assert.match(short, /## Documentation/)
assert.match(full, /## Publishing model/)
assert.match(full, /sitemap-content\.xml/)
assert.match(full, /\/sign.*\/dashboard.*\/new.*\/account.*\/developers\/keys/)

console.log('[test:seo] SEO, llms.txt and sitemap checks passed')
