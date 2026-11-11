<template>
  <div class="dashboard">
    <header class="head">
      <div>
        <p class="eyebrow">MICROPUE DROP</p>
        <h1>Dashboard</h1>
        <p class="sub">Signed in as {{ user?.nickname || user?.username }}.</p>
      </div>
      <Button as-child v-slot="slotProps">
        <NuxtLink to="/new" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
          <Plus aria-hidden="true" />
          <span>Create Project</span>
        </NuxtLink>
      </Button>
    </header>

    <div class="toolbar">
      <IconField class="search">
        <InputIcon>
          <Search aria-hidden="true" />
        </InputIcon>
        <InputText v-model="search" placeholder="Search projects" aria-label="Search projects" />
      </IconField>
      <label class="sort-field">
        <span class="toolbar-label">Sort by</span>
        <Select v-model="sort" :options="sortOptions" option-label="label" option-value="value" />
      </label>
    </div>

    <p v-if="actionError" class="error" role="alert">{{ actionError }}</p>

    <section v-if="!projects.length && !pending" class="empty">
      <template v-if="search">
        <h2>No matching projects</h2>
        <p>Try a different search term.</p>
      </template>
      <template v-else>
        <h2>No projects yet</h2>
        <p>Your published projects will appear here.</p>
      </template>
    </section>

    <template v-else>
      <ul class="project-list">
        <li v-for="project in projects" :key="project.sid" class="project-row">
          <div class="project-main">
            <NuxtLink :to="{ path: '/new', query: { edit: project.sid } }" class="project-name">
              {{ project.name }}
            </NuxtLink>
            <span class="project-meta">
              <span class="path">
                <template v-if="project.enabled">
                  <a :href="`${contentUrl}${project.path}/`" target="_blank" rel="noopener noreferrer"
                    :title="`Open ${project.name}`">
                    <span class="path-host">{{ host }}</span>{{ project.path }}
                  </a>
                </template>
                <template v-else>
                  <span class="path-host">{{ host }}</span>{{ project.path }}
                </template>
              </span>
              <span class="dot" aria-hidden="true">·</span>
              <span class="updated">Updated {{ formatDate(project.updatedAt) }}</span>
            </span>
          </div>

          <span class="visibility-icon" :class="`visibility-icon--${project.visibility}`"
            role="img" :aria-label="visibilityLabel(project.visibility)" :title="visibilityLabel(project.visibility)">
            <Globe v-if="project.visibility === 'public'" aria-hidden="true" />
            <Lock v-else aria-hidden="true" />
          </span>

          <label class="enabled-switch">
            <Switch :model-value="project.enabled" :disabled="toggling === project.sid"
              @update:model-value="value => toggleEnabled(project, value)" />
            <span class="switch-label">{{ project.enabled ? 'Enabled' : 'Disabled' }}</span>
          </label>

          <Button as-child v-slot="slotProps" severity="secondary">
            <NuxtLink :to="{ path: '/new', query: { edit: project.sid } }" :class="[slotProps.class, 'edit-button']"
              :aria-label="`Edit ${project.name}`" v-bind="slotProps.a11yAttrs">
              <PenToSquare aria-hidden="true" />
              <span>Edit</span>
            </NuxtLink>
          </Button>

          <Button class="delete-button" text rounded :aria-label="`Delete ${project.name}`" title="Delete project"
            @click="openDelete(project)">
            <Trash aria-hidden="true" />
          </Button>
        </li>
      </ul>

      <Paginator v-if="total > perPage" :first="(page - 1) * perPage" :rows="perPage" :total-records="total"
        template="PrevPageLink CurrentPageReport NextPageLink" current-page-report-template="{currentPage} / {totalPages}"
        @page="event => (page = event.page + 1)" />
    </template>

    <Dialog v-model:visible="deleteDialog" modal header="Delete project" :style="{ width: 'min(400px, 92vw)' }"
      :draggable="false">
      <p v-if="deleteError" class="dialog-text">{{ deleteError }}</p>
      <p v-else class="dialog-text">Delete <strong>{{ pendingDelete?.name }}</strong>? This cannot be undone.</p>
      <template #footer>
        <Button text @click="deleteDialog = false">
          <Times aria-hidden="true" />
          <span>Cancel</span>
        </Button>
        <Button v-if="!deleteError" severity="danger" :loading="deleting" @click="confirmDelete">
          <Trash aria-hidden="true" />
          <span>Delete</span>
        </Button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import Switch from 'primevue/toggleswitch'
import Plus from '@primeicons/vue/plus'
import PenToSquare from '@primeicons/vue/pen-to-square'
import Trash from '@primeicons/vue/trash'
import Times from '@primeicons/vue/times'
import Search from '@primeicons/vue/search'
import Globe from '@primeicons/vue/globe'
import Lock from '@primeicons/vue/lock'

interface DashboardProject {
  sid: string
  name: string
  slug: string
  visibility: 'public' | 'password'
  enabled: boolean
  updatedAt: string
  path: string
}

interface ProjectListResponse {
  projects: DashboardProject[]
  page: number
  perPage: number
  total: number
  pages: number
}

useHead({ title: 'Dashboard' })

const { user } = useAuthUser()
if (!user.value) await navigateTo('/sign')

const config = useRuntimeConfig()
const contentUrl = String(config.public.contentUrl).replace(/\/+$/, '')
const host = contentUrl.replace(/^https?:\/\//, '')

const sortOptions = [
  { label: 'Last updated', value: 'updated' },
  { label: 'Newest', value: 'created' },
  { label: 'Name A–Z', value: 'name' }
]

const page = ref(1)
const search = ref('')
const appliedSearch = ref('')
const sort = ref('updated')

const { data, pending, refresh } = await useFetch<ProjectListResponse>('/api/projects', {
  query: { page, q: appliedSearch, sort }
})

const projects = computed(() => data.value?.projects ?? [])
const total = computed(() => data.value?.total ?? 0)
const perPage = computed(() => data.value?.perPage ?? 20)

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, value => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    appliedSearch.value = value.trim()
    page.value = 1
  }, 300)
})

watch(sort, () => { page.value = 1 })
onBeforeUnmount(() => clearTimeout(searchTimer))

const toggling = ref('')
const actionError = ref('')
const deleteDialog = ref(false)
const deleting = ref(false)
const deleteError = ref('')
const pendingDelete = ref<DashboardProject | null>(null)

const visibilityLabel = (visibility: DashboardProject['visibility']) =>
  ({ public: 'Public', password: 'Password protected' })[visibility]

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

function messageOf(err: unknown) {
  const errorObject = err as { data?: { statusMessage?: string }, statusMessage?: string, message?: string }
  return errorObject?.data?.statusMessage || errorObject?.statusMessage || errorObject?.message || 'Something went wrong.'
}

async function toggleEnabled(project: DashboardProject, value: boolean) {
  actionError.value = ''
  toggling.value = project.sid
  try {
    const res = await $fetch<{ project: { enabled: boolean } }>(
      `/api/projects/${project.sid}`,
      { method: 'PATCH', body: { enabled: value } }
    )
    project.enabled = res.project.enabled
  } catch (err) {
    actionError.value = messageOf(err)
  } finally {
    toggling.value = ''
  }
}

function openDelete(project: DashboardProject) {
  deleteError.value = ''
  pendingDelete.value = project
  deleteDialog.value = true
}

async function confirmDelete() {
  if (!pendingDelete.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await $fetch(`/api/projects/${pendingDelete.value.sid}`, { method: 'DELETE' })
    deleteDialog.value = false
    pendingDelete.value = null
    await refresh()
    if (!projects.value.length && page.value > 1) page.value--
  } catch (err) {
    deleteError.value = messageOf(err)
  } finally {
    deleting.value = false
  }
}
</script>

<style lang="scss" scoped>
.dashboard {
  width: 90%;
  max-width: 1300px;
  margin: 0 auto;
  padding: 2.5rem 0 6rem;
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;

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

  .sub {
    margin: 0.5rem 0 0;
    color: var(--p-text-muted-color);
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;

  .search {
    flex: 1;
    min-width: min(100%, 260px);
    max-width: 400px;
  }

  :deep(.p-inputtext) {
    width: 100%;
  }

  :deep(.p-select) {
    min-width: 160px;
  }
}

.sort-field {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  .toolbar-label {
    font-size: 0.78rem;
    color: var(--p-text-muted-color);
    white-space: nowrap;
  }
}

.error {
  margin: 1.5rem 0 0;
  font-size: 0.85rem;
  color: var(--p-red-500);
}

.empty {
  margin-top: 2rem;
  padding: 2rem;
  border: 1px dashed var(--p-content-border-color);
  border-radius: 0.75rem;

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  p {
    margin: 0.5rem 0 0;
    font-size: 0.9rem;
    color: var(--p-text-muted-color);
  }
}

.project-list {
  margin: 1.25rem 0 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.75rem;
  overflow: hidden;
}

.project-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto auto;
  align-items: center;
  gap: 1rem;
  padding: 0.95rem 1.25rem;

  & + & {
    border-top: 1px solid var(--p-content-border-color);
  }

  &:hover {
    background: var(--p-content-hover-background);
  }
}

.project-main {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.project-name {
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  color: var(--p-text-color);
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: var(--p-text-muted-color);

  .path {
    overflow: hidden;
    font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
    text-overflow: ellipsis;
    white-space: nowrap;

    a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: var(--p-text-color);
        text-decoration: underline;
      }
    }
  }

  .dot {
    opacity: 0.6;
  }
}

.visibility-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--p-text-muted-color);

  svg {
    width: 1rem;
    height: 1rem;
  }

  &--public {
    color: var(--p-green-600);
  }

  &--password {
    color: var(--p-amber-600);
  }
}

.enabled-switch {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  min-width: 6.75rem;
  font-size: 0.78rem;
  color: var(--p-text-muted-color);
  cursor: pointer;
  user-select: none;
}

a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
}

a :deep(svg) {
  width: 0.85rem;
  height: 0.85rem;
}

:deep(.p-paginator) {
  margin-top: 1rem;
  background: transparent;
  border: 0;
}

:deep(.delete-button) {
  color: var(--p-text-muted-color);
}

:deep(.delete-button.p-button:not(:disabled):hover) {
  color: var(--p-red-500);
  background: transparent;
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

@media screen and (max-width: 760px) {
  .project-row {
    grid-template-columns: minmax(0, 1fr) auto auto auto;
    grid-template-areas:
      'name name name vis'
      'meta switch edit delete';
    gap: 0.45rem 0.75rem;
    padding: 0.95rem 1rem;
  }

  .project-main {
    display: contents;
  }

  .project-name {
    grid-area: name;
  }

  .project-meta {
    grid-area: meta;
    flex-wrap: nowrap;
    overflow: hidden;
  }

  .path-host,
  .dot,
  .updated {
    display: none;
  }

  .visibility-icon {
    grid-area: vis;
    justify-content: flex-end;
    justify-self: end;
  }

  .enabled-switch {
    grid-area: switch;
    min-width: 0;
  }

  .edit-button {
    grid-area: edit;
    justify-content: center;
    gap: 0;
    min-width: 2.75rem;
  }

  .delete-button {
    grid-area: delete;
  }

  .edit-button :deep(svg) {
    width: 1rem;
    height: 1rem;
  }

  .edit-button span,
  .switch-label {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
}
</style>
