import { build } from 'esbuild'

// 把迁移脚本和 schema 代码打包进 .output/server，生产服务器只需要 Node。
// mysql2 由 .output/server/node_modules 提供，避免再安装一套依赖。
await build({
  entryPoints: ['scripts/migrate.mjs'],
  outfile: '.output/server/migrate.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  external: ['mysql2'],
  logLevel: 'info'
})
