// 文件夹上传的纯前端解析：保留内部目录，只接收 html/css/js
// 限制与 server/utils/projects.ts 保持一致
export type FolderLanguage = 'html' | 'css' | 'js'

export interface FolderFileLike {
  name: string
  size: number
  webkitRelativePath?: string
  text: () => Promise<string>
}

export interface FolderImportFile {
  name: string
  language: FolderLanguage
  content: string
}

export interface FolderImportResult {
  files: FolderImportFile[]
  folders: string[]
  skipped: number
}

const MAX_FILES = 20
const MAX_FOLDERS = 50
const MAX_FILE_BYTES = 512 * 1024
const MAX_TOTAL_BYTES = 1024 * 1024
const FILE_RE = /^[\p{L}\p{N}][\p{L}\p{N}._-]{0,79}\.(html|css|js)$/u
const SEGMENT_RE = /^[\p{L}\p{N}._-]+$/u

export async function parseFolderFiles(list: FolderFileLike[]): Promise<FolderImportResult> {
  const entries: { file: FolderFileLike; path: string }[] = []
  const seen = new Set<string>()
  let skipped = 0
  let totalBytes = 0

  for (const file of list) {
    const relative = file.webkitRelativePath || file.name
    const parts = relative.split('/').filter(Boolean)
    if (!parts.length) {
      skipped++
      continue
    }

    // 去掉用户选择的根文件夹名，只保留内部结构
    const path = parts.length > 1 ? parts.slice(1).join('/') : parts[0]
    const base = path.split('/').pop() || ''

    if (!/\.(html|css|js)$/i.test(base)) {
      skipped++
      continue
    }
    if (!FILE_RE.test(base) || path.length > 120
      || path.split('/').some(segment => !SEGMENT_RE.test(segment) || segment === '.' || segment === '..')) {
      throw new Error(`Cannot import ${relative}. Use lowercase .html/.css/.js names and letters (including Chinese), numbers, dots, underscores or hyphens.`)
    }

    const key = path.toLowerCase()
    if (seen.has(key)) throw new Error(`Duplicate file path: ${path}`)
    if (file.size > MAX_FILE_BYTES) throw new Error(`${path} is larger than 512 KB.`)

    totalBytes += file.size
    if (totalBytes > MAX_TOTAL_BYTES) throw new Error('The folder is larger than 1 MB in total.')

    seen.add(key)
    entries.push({ file, path })
  }

  if (!entries.length) throw new Error('No .html, .css or .js files found in this folder.')
  if (entries.length > MAX_FILES) throw new Error(`A project can have at most ${MAX_FILES} files.`)

  const files: FolderImportFile[] = []
  for (const entry of entries) {
    files.push({
      name: entry.path,
      language: entry.path.split('.').pop()!.toLowerCase() as FolderLanguage,
      content: await entry.file.text()
    })
  }
  files.sort((a, b) => a.name.localeCompare(b.name))

  const folderSet = new Set<string>()
  for (const file of files) {
    const parts = file.name.split('/')
    parts.pop()
    let current = ''
    for (const part of parts) {
      current = current ? `${current}/${part}` : part
      folderSet.add(current)
    }
  }
  if (folderSet.size > MAX_FOLDERS) throw new Error(`A project can have at most ${MAX_FOLDERS} folders.`)
  if ([...folderSet].some(folder => folder.length > 100)) {
    throw new Error('A folder path is too long (max 100 characters).')
  }

  return {
    files,
    folders: [...folderSet].sort((a, b) => a.localeCompare(b)),
    skipped
  }
}
