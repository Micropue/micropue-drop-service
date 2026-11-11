<template>
  <div class="creator">
    <header class="creator-head">
      <div>
        <p class="eyebrow">MICROPUE DROP</p>
        <h1>{{ editingSid ? 'Edit Project' : 'Create Project' }}</h1>
      </div>
      <div class="save-area">
        <span class="status" :class="`status--${statusTone}`" aria-live="polite">
          <span class="status-dot" aria-hidden="true"></span>
          {{ statusText }}
        </span>
        <Button severity="secondary" :disabled="!savedPath" @click="openShare">
          <ShareAlt aria-hidden="true" />
          <span>Share</span>
        </Button>
        <Button :disabled="loadingProject || loadFailed" @click="handleSave">
          <SaveIcon aria-hidden="true" />
          <span>Save</span>
        </Button>
        <Button class="settings-button" severity="secondary" rounded :disabled="loadingProject || loadFailed"
          aria-label="Project settings" title="Project settings" @click="openSettings">
          <Cog aria-hidden="true" />
        </Button>
      </div>
    </header>

    <div class="workspace">
      <div v-if="loadingProject" class="workspace-loading" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <span>Loading project…</span>
      </div>
      <div v-else-if="loadFailed" class="workspace-error">
        <p>Could not load this project. It may have been deleted.</p>
        <Button as-child v-slot="slotProps" severity="secondary">
          <NuxtLink to="/dashboard" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
            <ArrowLeft aria-hidden="true" />
            <span>Back to Dashboard</span>
          </NuxtLink>
        </Button>
      </div>
      <template v-else>
        <div v-if="explorerOpen" class="drawer-backdrop" @click="explorerOpen = false"></div>
        <aside class="explorer-panel" :class="{ 'is-open': explorerOpen }">
        <div class="panel-head">
          <h2>Explorer</h2>
          <div class="panel-actions">
            <button type="button" class="panel-action" title="New file" aria-label="New file" @click="startCreate('file')">
              <FilePlus />
            </button>
            <button type="button" class="panel-action" title="New folder" aria-label="New folder"
              @click="startCreate('folder')">
              <FolderPlus />
            </button>
            <button type="button" class="panel-action" title="Upload folder" aria-label="Upload folder"
              :disabled="uploading" @click="folderInput?.click()">
              <Upload />
            </button>
            <button type="button" class="panel-action close-explorer" title="Close explorer"
              aria-label="Close explorer" @click="explorerOpen = false">
              ×
            </button>
          </div>
        </div>
        <input ref="folderInput" class="folder-input" type="file" webkitdirectory multiple
          @change="onFolderUpload" />

        <div class="tree-scroll">
          <Draggable ref="treeRef" v-model="treeData" :node-key="nodeKey" :indent="10" tree-line :tree-line-offset="8"
            trigger-class="tree-row" resolve-start-move-point="mouse" :disable-drag="!!creatingKind"
            :each-droppable="eachDroppable" class="he-tree" aria-label="Project files" @click:node="onHeClick"
            @change="syncFromTree">
            <template #default="{ node, stat }">
              <div v-if="node.data.kind === 'draft'" class="tree-row tree-row--draft" :style="rowStyle(stat)">
                <span class="tree-toggle-spacer"></span>
                <FileTypeIcon :type="creatingKind === 'folder' ? 'folder' : draftFileType" />
                <input ref="draftInput" v-model="draftName" class="tree-input"
                  :placeholder="creatingKind === 'folder' ? 'folder-name' : 'filename.html'" autocomplete="off"
                  spellcheck="false" @keydown.enter.prevent="commitCreate" @keydown.esc.prevent="cancelCreate"
                  @blur="cancelCreate" />
              </div>
              <div v-else class="tree-row" :title="node.data.path" :style="rowStyle(stat)" :class="{
                'is-selected': (node.data.kind === 'folder' || node.data.kind === 'file')
                  && selection?.kind === node.data.kind && selection?.path === node.data.path
              }">
                <button v-if="stat.children.length" type="button" class="tree-toggle"
                  :aria-label="stat.open ? 'Collapse' : 'Expand'" @click.stop="stat.open = !stat.open">
                  <svg class="chevron" :class="{ open: stat.open }" width="12" height="12" viewBox="0 0 16 16"
                    aria-hidden="true">
                    <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.4"
                      stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
                <span v-else class="tree-toggle-spacer"></span>
                <FileTypeIcon
                  :type="node.data.kind === 'folder' ? (stat.open && stat.children.length ? 'folder-open' : 'folder') : node.data.language" />
                <span class="tree-label">{{ node.label }}</span>
                <button v-if="node.data.kind === 'file'" type="button" class="file-remove"
                  :aria-label="`Delete ${node.data.path}`"
                  @click.stop="node.data.index !== undefined && requestDelete(node.data.index)">×</button>
              </div>
            </template>
          </Draggable>
        </div>
        <p v-if="uploadError" class="tree-error">{{ uploadError }}</p>
        <p v-if="uploadNotice" class="tree-notice">{{ uploadNotice }}</p>
        <p v-if="draftError" class="tree-error">{{ draftError }}</p>
      </aside>

      <section class="editor-panel">
        <div class="editor-head">
          <div class="editor-file-group">
            <button type="button" class="files-toggle" @click="explorerOpen = true">
              <FolderOpen aria-hidden="true" />
              <span>Files</span>
            </button>
            <span class="editor-file">{{ activeFile?.name || 'No file selected' }}</span>
          </div>
          <span class="editor-language">{{ activeFile ? languageLabel(activeFile.language) : '' }}</span>
        </div>
        <CodeEditor v-if="activeFile" :key="activeFile.name" v-model="activeFile.content"
          :language="languageLabel(activeFile.language)" :height="620" placeholder="Start typing…" />
        <div v-else class="editor-empty">Create a file to start.</div>
      </section>
      </template>
    </div>

    <Dialog v-model:visible="settingsDialog" modal header="Project settings" :style="{ width: 'min(480px, 92vw)' }"
      :draggable="false">
      <div class="dialog-fields">
        <label class="field">
          <span>Name</span>
          <InputText v-model="name" maxlength="80" placeholder="My first project" />
        </label>
        <label class="field">
          <span>URL</span>
          <InputText v-model="slug" maxlength="40" placeholder="my-project" @input="slugTouched = true" />
          <span class="url-preview">{{ siteHost }}/{{ username }}/{{ slug || 'project' }}</span>
        </label>
        <label class="field">
          <span>Visibility</span>
          <Select v-model="visibility" :options="visibilityOptions" option-label="label"
            option-value="value" />
        </label>
        <label v-if="visibility === 'password'" class="field">
          <span>Password</span>
          <InputText v-model="password" type="password" maxlength="128"
            :placeholder="savedAsPassword ? 'Leave blank to keep current password' : 'Set a password (at least 6 characters)'" />
        </label>
        <p v-if="needsPassword" class="hint hint--warn">This project has no password yet. Set one before sharing it.</p>
        <p class="hint">{{ visibilityHint }}</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </div>
      <template #footer>
        <Button text @click="settingsDialog = false">
          <Times aria-hidden="true" />
          <span>Cancel</span>
        </Button>
        <Button :loading="saving" @click="save">
          <SaveIcon aria-hidden="true" />
          <span>{{ saving ? 'Saving…' : 'Save project' }}</span>
        </Button>
      </template>
    </Dialog>

    <Dialog v-model:visible="shareDialog" modal header="Share project" :style="{ width: 'min(380px, 92vw)' }"
      :draggable="false">
      <div class="share-card">
        <div class="qr-wrap">
          <img v-if="qrSrc" :src="qrSrc" width="220" height="220" alt="Project QR code">
        </div>
        <p class="share-label">{{ visibility === 'public' ? 'Public link' : 'Project link' }}</p>
        <div class="share-link">
          <InputText :model-value="shareUrl" readonly />
          <Button severity="secondary" @click="copyShareUrl">
            <Copy aria-hidden="true" />
            <span>Copy</span>
          </Button>
        </div>
        <p class="hint">{{ shareHint }}</p>
        <p v-if="copied" class="copied">Copied</p>
      </div>
    </Dialog>

    <Dialog v-model:visible="deleteDialog" modal header="Delete file" :style="{ width: 'min(380px, 92vw)' }"
      :draggable="false">
      <p v-if="deleteError" class="dialog-text">{{ deleteError }}</p>
      <p v-else class="dialog-text">Delete <strong>{{ deleteName }}</strong>? This cannot be undone.</p>
      <template #footer>
        <Button text @click="deleteDialog = false">
          <Times aria-hidden="true" />
          <span>Cancel</span>
        </Button>
        <Button v-if="!deleteError" severity="danger" @click="confirmDelete">
          <Trash aria-hidden="true" />
          <span>Delete</span>
        </Button>
      </template>
    </Dialog>

    <Dialog v-model:visible="leaveDialog" modal header="Unsaved changes" :style="{ width: 'min(400px, 92vw)' }"
      :draggable="false">
      <p class="dialog-text">You have unsaved changes. Leave this page?</p>
      <template #footer>
        <Button text @click="leaveDialog = false">
          <Times aria-hidden="true" />
          <span>Stay</span>
        </Button>
        <Button severity="danger" @click="confirmLeave">
          <SignOut aria-hidden="true" />
          <span>Leave</span>
        </Button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { Draggable } from '@he-tree/vue'
import '@he-tree/vue/style/default.css'
import Dialog from 'primevue/dialog'
import FilePlus from '@primeicons/vue/file-plus'
import FolderPlus from '@primeicons/vue/folder-plus'
import Upload from '@primeicons/vue/upload'
import FolderOpen from '@primeicons/vue/folder-open'
import SaveIcon from '@primeicons/vue/save'
import ShareAlt from '@primeicons/vue/share-alt'
import Cog from '@primeicons/vue/cog'
import Copy from '@primeicons/vue/copy'
import Trash from '@primeicons/vue/trash'
import Times from '@primeicons/vue/times'
import SignOut from '@primeicons/vue/sign-out'
import ArrowLeft from '@primeicons/vue/arrow-left'
import { onBeforeRouteLeave } from 'vue-router'
import { parseFolderFiles } from '~/utils/folder-import'

type Visibility = 'public' | 'password'
type Language = 'html' | 'css' | 'js'

interface DraftFile {
  name: string
  language: Language
  content: string
}

interface ExplorerNode {
  key: string
  label: string
  data: {
    kind: 'folder' | 'file' | 'draft'
    path: string
    language?: Language
    index?: number
  }
  children?: ExplorerNode[]
}

type TreeSelection = { kind: 'file' | 'folder'; path: string }

interface SavedProject {
  sid: string
  name: string
  slug: string
  visibility: Visibility
  folders: string[]
  path: string
}

const { user } = useAuthUser()
if (!user.value) await navigateTo('/sign')

const route = useRoute()
const editingSid = typeof route.query.edit === 'string' ? route.query.edit : ''

useHead({ title: computed(() => (editingSid ? 'Edit Project' : 'Create Project')) })

const username = computed(() => user.value?.username || '')
const config = useRuntimeConfig()
const contentUrl = computed(() => String(config.public.contentUrl).replace(/\/+$/, ''))
const siteHost = computed(() =>
  contentUrl.value.replace(/^https?:\/\//, '').replace(/\/+$/, ''))

const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/

const name = ref('')
const slug = ref('')
const slugTouched = ref(false)
const visibility = ref<Visibility>('public')
const password = ref('')

const files = ref<DraftFile[]>([
  {
    name: 'index.html',
    language: 'html',
    content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <script src="app.js"><\/script>
</body>
</html>
`
  },
  { name: 'style.css', language: 'css', content: '/* style.css */\n' },
  { name: 'app.js', language: 'js', content: '// app.js\n' }
])
const activeIndex = ref(0)
const activeFile = computed(() => files.value[activeIndex.value] ?? null)

const folders = ref<string[]>([])
const selection = ref<TreeSelection | null>(
  files.value[0] ? { kind: 'file', path: files.value[0].name } : null
)

const creationParent = computed(() => {
  const selected = selection.value
  if (!selected) return ''
  if (selected.kind === 'folder') return selected.path
  const parts = selected.path.split('/')
  parts.pop()
  return parts.join('/')
})

const folderKey = (path: string) => `folder:${path}`
const fileKey = (path: string) => `file:${path}`

const treeRef = ref<{ openNodeAndParents: (node: ExplorerNode) => void } | null>(null)
const nodeKey = (stat: { data?: ExplorerNode }) => stat.data?.key || stat.data?.path

const allFolders = computed(() => {
  const set = new Set<string>()
  const add = (path: string) => {
    if (!path) return
    const parts = path.split('/')
    let current = ''
    for (const part of parts) {
      current = current ? `${current}/${part}` : part
      set.add(current)
    }
  }
  folders.value.forEach(add)
  for (const file of files.value) {
    const parts = file.name.split('/')
    parts.pop()
    add(parts.join('/'))
  }
  return [...set].sort((a, b) => a.localeCompare(b))
})

function buildTree(): ExplorerNode[] {
  const root: ExplorerNode[] = []
  const folderNodes = new Map<string, ExplorerNode>()

  for (const path of allFolders.value) {
    folderNodes.set(path, {
      key: folderKey(path),
      label: path.split('/').pop() || path,
      data: { kind: 'folder', path },
      children: []
    })
  }

  for (const path of allFolders.value) {
    const node = folderNodes.get(path)
    if (!node) continue
    const slash = path.lastIndexOf('/')
    if (slash === -1) root.push(node)
    else folderNodes.get(path.slice(0, slash))?.children?.push(node)
  }

  files.value.forEach((file, index) => {
    const slash = file.name.lastIndexOf('/')
    const node: ExplorerNode = {
      key: fileKey(file.name),
      label: file.name.slice(slash + 1),
      data: { kind: 'file', path: file.name, language: file.language, index }
    }
    if (slash === -1) root.push(node)
    else folderNodes.get(file.name.slice(0, slash))?.children?.push(node)
  })

  const sortNodes = (nodes: ExplorerNode[]) => {
    nodes.sort((a, b) => a.data.kind === b.data.kind
      ? a.label.localeCompare(b.label)
      : a.data.kind === 'folder' ? -1 : 1)
    nodes.forEach(node => {
      if (node.children?.length) sortNodes(node.children)
    })
  }
  sortNodes(root)
  return root
}

const treeData = ref<ExplorerNode[]>(buildTree())

function rebuildTree() {
  treeData.value = buildTree()
}

function findTreeNode(nodes: ExplorerNode[], path: string, kind: 'folder' | 'file'): ExplorerNode | null {
  for (const node of nodes) {
    if (node.data.kind === kind && node.data.path === path) return node
    if (node.children?.length) {
      const found = findTreeNode(node.children, path, kind)
      if (found) return found
    }
  }
  return null
}

async function revealNode(path: string, kind: 'folder' | 'file') {
  await nextTick()
  const node = findTreeNode(treeData.value, path, kind)
  if (node) treeRef.value?.openNodeAndParents(node)
}

function onHeClick(stat: { data: ExplorerNode }) {
  onNodeSelect(stat.data)
}

function onNodeSelect(node: ExplorerNode) {
  if (node.data.kind === 'draft') return
  if (node.data.kind === 'folder') {
    selection.value = { kind: 'folder', path: node.data.path }
    return
  }
  if (node.data.index === undefined) return
  activeIndex.value = node.data.index
  selection.value = { kind: 'file', path: node.data.path }
  if (typeof window !== 'undefined' && window.innerWidth <= 900) explorerOpen.value = false
}

// 拖拽 / Alt+方向键移动后，把 he-tree 的树结构同步回文件/文件夹数组；文件内容沿用原对象
function syncFromTree() {
  const previousFiles = files.value.slice()
  const active = activeFile.value
  const selectedBefore = selection.value
  let selectedAfter = selectedBefore
  const nextFiles: DraftFile[] = []
  const nextFolders = new Set<string>()

  const walk = (nodes: ExplorerNode[], parentPath: string) => {
    for (const node of nodes) {
      if (node.data.kind === 'draft') continue
      const path = parentPath ? `${parentPath}/${node.label}` : node.label
      if (node.data.kind === 'folder') {
        nextFolders.add(path)
        if (selectedBefore?.kind === 'folder' && node.data.path === selectedBefore.path) {
          selectedAfter = { kind: 'folder', path }
        }
        node.data.path = path
        node.key = folderKey(path)
        if (node.children?.length) walk(node.children, path)
      } else {
        const source = node.data.index === undefined ? undefined : previousFiles[node.data.index]
        if (!source) continue
        source.name = path
        const index = nextFiles.length
        nextFiles.push(source)
        if (selectedBefore?.kind === 'file' && node.data.path === selectedBefore.path) {
          selectedAfter = { kind: 'file', path }
        }
        node.data.path = path
        node.data.index = index
        node.key = fileKey(path)
      }
    }
  }

  walk(treeData.value, '')

  files.value = nextFiles
  folders.value = [...nextFolders].sort((a, b) => a.localeCompare(b))
  selection.value = selectedAfter
  const activeAt = active ? nextFiles.indexOf(active) : -1
  activeIndex.value = activeAt >= 0 ? activeAt : 0
  dirty.value = true
}

const projectId = ref<string | null>(null)
const savedAsPassword = ref(false)
const savedPath = ref<string>('')
const saving = ref(false)
const error = ref('')
const dirty = ref(false)
const loadingProject = ref(Boolean(editingSid))
const loadFailed = ref(false)
const lastSaved = ref<Date | null>(null)

// /new?edit=<sid>：把已有项目读回编辑器，后续保存走 PUT
// 放在 onMounted 里，避免顶层 await 让页面变成异步组件、CodeEditor 无法挂载
async function loadProject() {
  if (!editingSid) return
  try {
    const { project } = await $fetch(`/api/projects/${editingSid}`)
    projectId.value = project.sid
    name.value = project.name
    slug.value = project.slug
    slugTouched.value = true
    visibility.value = project.visibility
    savedAsPassword.value = project.visibility === 'password' && Boolean(project.hasPassword)
    folders.value = project.folders
    files.value = project.files
    savedPath.value = project.path
    activeIndex.value = 0
    selection.value = project.files[0] ? { kind: 'file', path: project.files[0].name } : null
    rebuildTree()
    lastSaved.value = new Date()
    // 迁移来的密码项目没有密码：打开设置让所有者补一个
    if (project.visibility === 'password' && !project.hasPassword) settingsDialog.value = true
    await nextTick()
    dirty.value = false
  } catch {
    loadFailed.value = true
    error.value = 'Could not load this project.'
  } finally {
    loadingProject.value = false
  }
}

const visibilityOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Password protected', value: 'password' }
]

const visibilityHint = computed(() => {
  if (visibility.value === 'public') return 'Anyone with the link can open this project.'
  return 'Visitors need the password to open this project.'
})

const needsPassword = computed(() => visibility.value === 'password' && !savedAsPassword.value)

const statusText = computed(() => {
  if (loadingProject.value) return 'Loading…'
  if (loadFailed.value) return 'Load failed'
  if (saving.value) return 'Saving…'
  if (error.value) return 'Save failed'
  if (dirty.value) return 'Unsaved changes'
  return lastSaved.value ? 'Saved' : 'Draft'
})

const statusTone = computed(() => {
  if (loadingProject.value) return 'saving'
  if (loadFailed.value) return 'error'
  if (saving.value) return 'saving'
  if (error.value) return 'error'
  if (dirty.value) return 'dirty'
  return lastSaved.value ? 'saved' : 'draft'
})

watch(name, value => {
  if (slugTouched.value) return
  slug.value = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
})

watch([name, slug, visibility, password, files, folders], () => {
  dirty.value = true
  error.value = ''
}, { deep: true })

const languageLabel = (language: Language) =>
  ({ html: 'HTML', css: 'CSS', js: 'JavaScript' })[language]

const settingsDialog = ref(false)
const shareDialog = ref(false)
const deleteDialog = ref(false)
const leaveDialog = ref(false)
const explorerOpen = ref(false)
const folderInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref('')
const uploadNotice = ref('')
const creatingKind = ref<'file' | 'folder' | null>(null)
const creatingParent = ref('')
const draftName = ref('')
const draftError = ref('')
const draftInput = ref<HTMLInputElement | null>(null)
const deleteIndex = ref<number | null>(null)
const deleteName = ref('')
const deleteError = ref('')
const qrSrc = ref('')
const copied = ref(false)
let allowLeave = false
let pendingPath = ''

const router = useRouter()

const draftFileType = computed<Language | 'file'>(() => {
  const ext = draftName.value.trim().split('.').pop()?.toLowerCase()
  return ext === 'html' || ext === 'css' || ext === 'js' ? ext : 'file'
})

const shareUrl = computed(() => `${contentUrl.value}${savedPath.value}`)
const shareHint = computed(() => {
  if (visibility.value === 'public') return 'Anyone with the link can open this project.'
  return 'Visitors need the project password to open this project.'
})

function fileTemplate(language: Language, fileName: string) {
  if (language === 'html') {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${fileName}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <script src="app.js"><\/script>
</body>
</html>
`
  }
  if (language === 'css') return `/* ${fileName} */\n`
  return `// ${fileName}\n`
}

function eachDroppable(stat: { data?: ExplorerNode } | null) {
  return stat?.data?.kind === 'folder'
}

function rowStyle(stat: { level?: number }) {
  const offset = Math.max(0, (stat.level || 1) - 1) * 10
  return {
    marginLeft: `-${offset}px`,
    width: `calc(100% + ${offset}px)`,
    paddingLeft: `${offset + 1}px`
  }
}

async function startCreate(kind: 'file' | 'folder') {
  if (creatingKind.value) cancelCreate()

  creatingKind.value = kind
  creatingParent.value = creationParent.value
  draftName.value = ''
  draftError.value = ''

  const draft: ExplorerNode = {
    key: 'draft:new',
    label: '',
    data: { kind: 'draft', path: creatingParent.value }
  }

  if (creatingParent.value) {
    const parent = findTreeNode(treeData.value, creatingParent.value, 'folder')
    if (parent) {
      parent.children = parent.children || []
      parent.children.unshift(draft)
    } else {
      creatingParent.value = ''
      treeData.value.unshift(draft)
    }
  } else {
    treeData.value.unshift(draft)
  }

  // 让 he-tree 重新读取新数据
  treeData.value = [...treeData.value]
  await nextTick()

  if (creatingParent.value) {
    const parent = findTreeNode(treeData.value, creatingParent.value, 'folder')
    if (parent) treeRef.value?.openNodeAndParents(parent)
  }

  await nextTick()
  draftInput.value?.focus()
}

function cancelCreate() {
  if (!creatingKind.value) return
  creatingKind.value = null
  creatingParent.value = ''
  draftName.value = ''
  draftError.value = ''
  rebuildTree()
}

async function commitCreate() {
  if (!creatingKind.value) return

  const value = draftName.value.trim()
  const parent = creatingParent.value
  if (!value) {
    draftError.value = 'Enter a name.'
    return
  }

  if (creatingKind.value === 'folder') {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) {
      draftError.value = 'Use letters, numbers, dots, underscores or hyphens.'
      return
    }
    const path = parent ? `${parent}/${value}` : value
    if (path.length > 100) {
      draftError.value = 'Folder path is too long.'
      return
    }
    if (allFolders.value.some(folder => folder.toLowerCase() === path.toLowerCase())) {
      draftError.value = 'That folder already exists.'
      return
    }

    creatingKind.value = null
    draftName.value = ''
    draftError.value = ''
    folders.value.push(path)
    selection.value = { kind: 'folder', path }
    rebuildTree()
    await revealNode(path, 'folder')
    return
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.(html|css|js)$/.test(value)) {
    draftError.value = 'File name must end with .html, .css or .js.'
    return
  }

  const language = value.split('.').pop() as Language
  const path = parent ? `${parent}/${value}` : value
  if (path.length > 120) {
    draftError.value = 'File path is too long.'
    return
  }
  if (files.value.some(file => file.name.toLowerCase() === path.toLowerCase())) {
    draftError.value = 'A file with that name already exists.'
    return
  }

  creatingKind.value = null
  draftName.value = ''
  draftError.value = ''
  files.value.push({ name: path, language, content: fileTemplate(language, value) })
  activeIndex.value = files.value.length - 1
  selection.value = { kind: 'file', path }
  rebuildTree()
  await revealNode(path, 'file')
}

// 纯前端解析文件夹：保留目录结构，覆盖当前项目后统一保存
async function onFolderUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const list = input.files ? [...input.files] : []
  input.value = ''
  if (!list.length) return

  uploadError.value = ''
  uploadNotice.value = ''
  uploading.value = true
  try {
    const result = await parseFolderFiles(list)
    files.value = result.files
    folders.value = result.folders
    activeIndex.value = Math.max(0, result.files.findIndex(file => file.name === 'index.html'))
    const active = result.files[activeIndex.value]
    selection.value = active ? { kind: 'file', path: active.name } : null
    rebuildTree()
    if (active) await revealNode(active.name, 'file')

    const skippedText = result.skipped
      ? `, skipped ${result.skipped} unsupported file${result.skipped === 1 ? '' : 's'}`
      : ''
    uploadNotice.value = `Imported ${result.files.length} file${result.files.length === 1 ? '' : 's'}${skippedText}.`
  } catch (err) {
    uploadError.value = err instanceof Error ? err.message : 'Could not read the selected folder.'
  } finally {
    uploading.value = false
  }
}

function requestDelete(index: number) {
  const file = files.value[index]
  if (!file) return
  deleteIndex.value = index
  deleteName.value = file.name
  deleteError.value = files.value.length <= 1 ? 'A project needs at least one file.' : ''
  deleteDialog.value = true
}

function confirmDelete() {
  if (deleteIndex.value === null) return
  const index = deleteIndex.value
  const removed = files.value[index]
  const removedPath = removed?.name || ''
  const removedSelected = selection.value?.kind === 'file' && selection.value.path === removedPath
  deleteIndex.value = null
  deleteDialog.value = false

  files.value.splice(index, 1)
  if (index < activeIndex.value) activeIndex.value--
  else if (activeIndex.value >= files.value.length) activeIndex.value = files.value.length - 1
  if (activeIndex.value < 0) activeIndex.value = 0

  if (removedSelected) {
    const next = files.value[activeIndex.value]
    selection.value = next ? { kind: 'file', path: next.name } : null
  }
  rebuildTree()
}

function openSettings() {
  if (loadingProject.value || loadFailed.value) return
  error.value = ''
  settingsDialog.value = true
}

function handleSave() {
  if (loadingProject.value || loadFailed.value) return
  if (!projectId.value) {
    openSettings()
    return
  }
  void save()
}

async function openShare() {
  if (!savedPath.value) return
  copied.value = false
  shareDialog.value = true
  if (qrSrc.value) return

  try {
    const QRCode = (await import('qrcode')).default
    qrSrc.value = await QRCode.toDataURL(shareUrl.value, {
      margin: 1,
      width: 220,
      color: { dark: '#09090b', light: '#ffffff' }
    })
  } catch (err) {
    console.warn('[share] QR code failed', err)
  }
}

async function copyShareUrl() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    copied.value = false
  }
}

function confirmLeave() {
  allowLeave = true
  leaveDialog.value = false
  if (pendingPath) router.push(pendingPath)
}

function messageOf(err: unknown) {
  const errorObject = err as { data?: { statusMessage?: string }, statusMessage?: string, message?: string }
  return errorObject?.data?.statusMessage || errorObject?.statusMessage || errorObject?.message || 'Could not save the project.'
}

async function save() {
  if (saving.value || loadingProject.value) return

  error.value = ''
  const trimmedName = name.value.trim()

  if (!trimmedName) {
    error.value = 'Project name is required.'
    return
  }
  if (!slugPattern.test(slug.value)) {
    error.value = 'Project URL must be 1-40 characters: lowercase letters, numbers and hyphens.'
    return
  }
  if (visibility.value === 'password' && (!projectId.value || !savedAsPassword.value) && password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (visibility.value === 'password' && password.value && password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (!files.value.length) {
    error.value = 'Add at least one file.'
    return
  }

  saving.value = true

  try {
    const body = {
      name: trimmedName,
      slug: slug.value,
      visibility: visibility.value,
      password: password.value || undefined,
      folders: allFolders.value,
      files: files.value.map(file => ({
        name: file.name,
        language: file.language,
        content: file.content
      }))
    }

    const response = projectId.value
      ? await $fetch<{ project: SavedProject }>(`/api/projects/${projectId.value}`, { method: 'PUT', body })
      : await $fetch<{ project: SavedProject }>('/api/projects', { method: 'POST', body })

    projectId.value = response.project.sid
    savedAsPassword.value = response.project.visibility === 'password'
    savedPath.value = response.project.path
    qrSrc.value = ''
    password.value = ''
    await nextTick()
    dirty.value = false
    lastSaved.value = new Date()
    settingsDialog.value = false
  } catch (err) {
    error.value = messageOf(err)
  } finally {
    saving.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    if (settingsDialog.value) void save()
    else handleSave()
  }
}

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('beforeunload', onBeforeUnload)
  void loadProject()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('beforeunload', onBeforeUnload)
})

onBeforeRouteLeave(to => {
  if (!dirty.value || allowLeave) return true
  pendingPath = to.fullPath
  leaveDialog.value = true
  return false
})
</script>

<style lang="scss" scoped>
.creator {
  width: 90%;
  max-width: 1300px;
  margin: 0 auto;
  padding: 2.5rem 0 5rem;
}

.creator-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;

  .eyebrow {
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    color: var(--p-text-muted-color);
  }

  h1 {
    margin: 0;
    font-size: 2rem;
  }
}

.save-area {
  display: flex;
  align-items: center;
  gap: 0.9rem;

  :deep(.p-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  :deep(.p-button svg) {
    width: 1rem;
    height: 1rem;
  }

  .settings-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    min-width: 36px;
    height: 36px;
    padding: 0;
    flex: none;

    :deep(svg) {
      width: 1.1rem;
      height: 1.1rem;
    }
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    color: var(--p-text-muted-color);
    white-space: nowrap;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--p-text-color) 32%, transparent);
  }

  .status--dirty .status-dot {
    background: #f59e0b;
  }

  .status--saved .status-dot {
    background: #22c55e;
  }

  .status--saving .status-dot {
    background: #3b82f6;
    animation: status-pulse 1s ease-in-out infinite;
  }

  .status--error {
    color: var(--p-red-500);
  }

  .status--error .status-dot {
    background: var(--p-red-500);
  }
}

@keyframes status-pulse {
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .status--saving .status-dot {
    animation: none;
  }
}

.workspace {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 1.25rem;
  align-items: stretch;
  margin-top: 1.5rem;
}

.workspace-loading {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 620px;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.75rem;
  color: var(--p-text-muted-color);
  font-size: 0.85rem;
}

.workspace-error {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 620px;
  border: 1px dashed var(--p-content-border-color);
  border-radius: 0.75rem;
  color: var(--p-text-muted-color);
  font-size: 0.9rem;

  p {
    margin: 0;
  }

  :deep(.p-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  :deep(.p-button svg) {
    width: 0.9rem;
    height: 0.9rem;
  }
}

.spinner {
  width: 1.4rem;
  height: 1.4rem;
  border: 2px solid var(--p-content-border-color);
  border-top-color: var(--p-text-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 2s;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.85rem;

  >span:first-child {
    font-size: 0.75rem;
    color: var(--p-text-muted-color);
  }

  :deep(.p-inputtext),
  :deep(.p-select) {
    width: 100%;
  }
}

.url-preview {
  margin: 0;
  font-family: var(--font-code);
  font-size: 0.65rem;
  line-height: 1.5;
  color: var(--p-text-muted-color);
  overflow-wrap: anywhere;
}

.hint {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.5;
  color: var(--p-text-muted-color);

  &--warn {
    color: var(--p-amber-600);
  }

  code {
    font-family: var(--font-code);
  }
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0;
  padding: 0.55rem 0.6rem 0.45rem;
  border-bottom: 1px solid var(--p-content-border-color);

  h2 {
    margin: 0;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--p-text-muted-color);
  }
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.panel-action {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--p-text-muted-color);
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }

  &:hover {
    background: color-mix(in srgb, var(--p-text-color) 8%, transparent);
    color: var(--p-text-color);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.explorer-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.75rem;
  background: var(--p-content-background);
}

.tree-scroll {
  flex: 1;
  min-height: 0;
  padding: 0.35rem 0.4rem;
  overflow: auto;
}

.files-toggle {
  display: none;
  align-items: center;
  gap: 0.35rem;
  flex: none;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--p-text-muted-color);
  font: inherit;
  font-size: 0.72rem;
  cursor: pointer;
}

.files-toggle svg {
  width: 0.8rem;
  height: 0.8rem;
}

.close-explorer {
  display: none;
}

.drawer-backdrop {
  display: none;
}

.tree-error {
  margin: 0.35rem 0.6rem;
  color: var(--p-red-500);
  font-size: 0.72rem;
}

.tree-notice {
  margin: 0.35rem 0.6rem;
  color: var(--p-text-muted-color);
  font-size: 0.72rem;
  line-height: 1.5;
}

.folder-input {
  display: none;
}

.editor-file-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;

  .editor-file {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.he-tree {
  width: 100%;
  padding: 2px 0;
  font-size: 0.8rem;

  :deep(.tree-line) {
    background: color-mix(in srgb, var(--p-text-color) 16%, transparent);
  }

  :deep(.tree-vline) {
    width: 1px;
  }

  :deep(.tree-hline) {
    height: 1px;
  }

  :deep(.tree-node:focus-visible) {
    outline: 1px solid var(--p-primary-color);
    outline-offset: -1px;
  }

  :deep(.he-tree-drag-placeholder) {
    height: 26px;
    border: 1px dashed var(--p-primary-color);
    border-radius: 4px;
    background: color-mix(in srgb, var(--p-primary-color) 10%, transparent);
  }

  :deep(.dragging-node) {
    opacity: 0.45;
  }
}

.tree-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
  box-sizing: border-box;
  width: 100%;
  height: 24px;
  min-width: 0;
  padding: 0 1px;
  border-radius: 3px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.1s ease;

  &:hover {
    background: color-mix(in srgb, var(--p-text-color) 5%, transparent);
  }

  &.is-selected {
    background: color-mix(in srgb, var(--p-text-color) 11%, transparent);
  }
}

.tree-row--draft {
  cursor: default;

  &:hover {
    background: transparent;
  }
}

.tree-toggle {
  display: grid;
  flex: none;
  place-items: center;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--p-text-muted-color);
  cursor: pointer;
}

.chevron {
  transition: transform 0.12s ease;

  &.open {
    transform: rotate(90deg);
  }
}

.tree-toggle-spacer {
  flex: none;
  width: 12px;
}

.tree-label {
  flex: 1;
  min-width: 0;
  padding-right: 0;
  overflow: hidden;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-row:hover .tree-label,
.tree-row.is-selected .tree-label {
  padding-right: 1.1rem;
}

.tree-input {
  flex: 1;
  min-width: 0;
  height: 20px;
  padding: 0 4px;
  border: 1px solid var(--p-primary-color);
  border-radius: 3px;
  outline: 0;
  background: var(--p-content-background);
  color: var(--p-text-color);
  font: inherit;
  font-size: 0.78rem;
}

.file-remove {
  position: absolute;
  top: 50%;
  right: 2px;
  z-index: 1;
  padding: 0.05rem 0.25rem;
  border: 0;
  background: transparent;
  color: var(--p-text-muted-color);
  font-size: 0.95rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transform: translateY(-50%);

  &:hover {
    color: var(--p-text-color);
  }
}

.tree-row:hover .file-remove,
.tree-row.is-selected .file-remove {
  opacity: 1;
}

.editor-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.75rem;
  background: var(--p-content-background);
}

.editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0.9rem;
  border-bottom: 1px solid var(--p-content-border-color);
  font-family: var(--font-code);
  font-size: 0.75rem;

  .editor-language {
    color: var(--p-text-muted-color);
  }
}

.editor-empty {
  padding: 2rem;
  color: var(--p-text-muted-color);
  font-size: 0.9rem;
}

.error {
  margin: 1rem 0 0;
  color: var(--p-red-500);
  font-size: 0.85rem;
}

.dialog-text {
  margin: 0;
  line-height: 1.65;
  color: var(--p-text-muted-color);
}

:deep(.p-dialog .p-button) {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

:deep(.p-dialog .p-button svg) {
  width: 1rem;
  height: 1rem;
}

.dialog-fields {
  display: flex;
  flex-direction: column;
}

.share-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.qr-wrap {
  display: grid;
  place-items: center;
  min-height: 252px;
  padding: 1rem;
  border-radius: 0.5rem;
  background: #ffffff;
}

.qr-wrap img {
  display: block;
  width: 220px;
  height: 220px;
  image-rendering: pixelated;
}

.share-label {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--p-text-muted-color);
}

.share-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  :deep(.p-inputtext) {
    flex: 1;
    min-width: 0;
    font-family: var(--font-code);
    font-size: 0.72rem;
  }
}

.copied {
  margin: 0;
  font-size: 0.72rem;
  color: var(--p-primary-color);
}

@media screen and (max-width: 900px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .files-toggle {
    display: inline-flex;
  }

  .close-explorer {
    display: grid;
  }

  .explorer-panel {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 50;
    width: min(300px, 86vw);
    height: 100dvh;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-right: 1px solid var(--p-content-border-color);
    border-radius: 0;
    background: var(--p-content-background);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
    transform: translateX(-102%);
    transition: transform 0.18s ease;
  }

  .explorer-panel.is-open {
    transform: none;
  }

  .drawer-backdrop {
    position: fixed;
    inset: 0;
    z-index: 49;
    display: block;
    background: rgba(0, 0, 0, 0.35);
  }

  .tree-scroll {
    flex: 1;
    max-height: none;
  }
}
</style>
