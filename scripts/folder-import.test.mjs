// 运行：npm run test:folder-import
import assert from 'node:assert/strict'
import { parseFolderFiles } from '../app/utils/folder-import.ts'

const file = (path, size = 10) => ({
  name: path.split('/').pop(),
  size,
  webkitRelativePath: path,
  text: async () => `content:${path}`
})

const result = await parseFolderFiles([
  file('site/index.html', 100),
  file('site/assets/style.css'),
  file('site/pages/about.html'),
  file('site/logo.png')
])
assert.deepEqual(result.files.map(item => item.name), ['assets/style.css', 'index.html', 'pages/about.html'])
assert.deepEqual(result.folders, ['assets', 'pages'])
assert.equal(result.skipped, 1)
assert.equal(result.files[1].language, 'html')

const chinese = await parseFolderFiles([file('站点/中文目录/页面.html')])
assert.deepEqual(chinese.files.map(item => item.name), ['中文目录/页面.html'])
assert.deepEqual(chinese.folders, ['中文目录'])

await assert.rejects(() => parseFolderFiles([file('site/my file.html')]), /Cannot import/)
await assert.rejects(() => parseFolderFiles([file('site/index.HTML')]), /Cannot import/)
await assert.rejects(() => parseFolderFiles([file('site/big.html', 600 * 1024)]), /512 KB/)
await assert.rejects(
  () => parseFolderFiles(Array.from({ length: 21 }, (_, i) => file(`site/f${i}.html`))),
  /at most 20 files/
)

console.log('folder-import tests passed')
