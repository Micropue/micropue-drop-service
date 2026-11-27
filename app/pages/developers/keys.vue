<template>
  <div class="keys-page">
    <header class="head">
      <div>
        <p class="eyebrow">DEVELOPER ACCESS</p>
        <h1>API keys</h1>
        <p class="sub">Keys authenticate scripts, CI jobs, MCP servers and Skills against the DROP API.</p>
      </div>
      <div class="head-actions">
        <span class="quota">{{ activeKeyCount }} / {{ maxActiveKeys }} active</span>
        <Button :disabled="keyLimitReached" :title="keyLimitReached ? 'Revoke an active key before creating another.' : undefined"
          @click="openCreate">
          <Plus aria-hidden="true" />
          <span>Create key</span>
        </Button>
      </div>
    </header>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <section v-if="!keys.length && !pending" class="empty">
      <h2>No API keys yet</h2>
      <p>Create a key to start deploying from outside the editor.</p>
      <Button @click="openCreate">Create your first key</Button>
    </section>

    <template v-else>
      <ul class="key-list" aria-label="API keys">
        <li v-for="key in keys" :key="key.id" class="key-row">
          <div class="key-main">
            <div class="key-title">
              <span class="key-name">{{ key.name }}</span>
              <span v-if="key.status === 'expired'" class="status status--expired">expired</span>
            </div>
            <code class="prefix">{{ key.prefix }}…</code>
            <div class="scopes">
              <span v-for="scope in key.scopes" :key="scope">{{ scope }}</span>
            </div>
          </div>
          <dl class="key-meta">
            <div><dt>Created</dt><dd>{{ formatDate(key.createdAt) }}</dd></div>
            <div><dt>Last used</dt><dd>{{ key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never' }}</dd></div>
            <div><dt>Expires</dt><dd>{{ key.expiresAt ? formatDate(key.expiresAt) : 'Never' }}</dd></div>
          </dl>
          <TrafficBadge class="traffic-cell" :traffic="key.traffic" :subject="key.name" unit-singular="call"
            unit-plural="calls" @click="openTraffic(key)" />
          <Button v-if="key.status === 'active'" class="revoke-button" text rounded
            :aria-label="`Revoke ${key.name}`" title="Revoke key" @click="askRevoke(key)">
            <Trash aria-hidden="true" />
          </Button>
        </li>
      </ul>

      <Paginator v-if="total > perPage" :first="(page - 1) * perPage" :rows="perPage"
        :total-records="total" template="PrevPageLink CurrentPageReport NextPageLink"
        current-page-report-template="{currentPage} / {totalPages}"
        @page="event => (page = event.page + 1)" />
    </template>

    <Dialog v-model:visible="createOpen" modal header="Create API key" :style="{ width: 'min(520px, 92vw)' }"
      :draggable="false">
      <div class="form">
        <label class="field">
          <span>Name</span>
          <InputText v-model="name" maxlength="60" placeholder="CI deploy" autofocus />
        </label>

        <div class="field">
          <span>Preset</span>
          <div class="preset-row">
            <button type="button" :class="{ active: preset === 'read' }" @click="applyPreset('read')">Read only</button>
            <button type="button" :class="{ active: preset === 'deploy' }" @click="applyPreset('deploy')">Deploy only</button>
            <button type="button" :class="{ active: preset === 'full' }" @click="applyPreset('full')">Full access</button>
          </div>
        </div>

        <fieldset class="field scopes-field">
          <legend>Scopes</legend>
          <label v-for="scope in allScopes" :key="scope.value" class="check-row">
            <input v-model="selectedScopes" type="checkbox" :value="scope.value" />
            <span>
              <strong>{{ scope.label }}</strong>
              <small>{{ scope.description }}</small>
            </span>
          </label>
        </fieldset>

        <label class="field">
          <span>Expires</span>
          <Select v-model="expiry" :options="expiryOptions" option-label="label" option-value="value" />
        </label>
        <p class="hint">The key is shown once. Store it in your secret manager.</p>
        <p v-if="createError" class="error" role="alert">{{ createError }}</p>
      </div>
      <template #footer>
        <Button text severity="secondary" @click="createOpen = false">Cancel</Button>
        <Button :loading="creating" :disabled="!selectedScopes.length" @click="createKey">Create key</Button>
      </template>
    </Dialog>

    <Dialog v-model:visible="secretOpen" modal header="Your new API key" :style="{ width: 'min(600px, 94vw)' }"
      :draggable="false" :closable="false">
      <div class="secret">
        <p>This is the only time the full key will be shown. Copy it now.</p>
        <div class="secret-row">
          <code class="secret-value">{{ newToken }}</code>
          <div class="secret-actions">
            <Button severity="secondary" @click="copyToken">
              <Copy aria-hidden="true" />
              <span>Copy key</span>
            </Button>
            <span v-if="copied" class="copied" aria-live="polite">Copied</span>
          </div>
        </div>
        <p class="hint">Do not put this key in a browser bundle or commit it to git.</p>
      </div>
      <template #footer>
        <Button @click="closeSecret">I saved the key</Button>
      </template>
    </Dialog>

    <Dialog v-model:visible="trafficOpen" modal header="API traffic" :style="{ width: 'min(640px, 94vw)' }"
      :draggable="false">
      <TrafficChart v-if="trafficKey" :traffic="trafficKey.traffic" :item-name="`${trafficKey.name} · ${trafficKey.prefix}…`"
        unit-singular="call" unit-plural="calls"
        hint="Authenticated API requests per day over the latest 7 calendar days, including today." />
    </Dialog>

    <Dialog v-model:visible="revokeOpen" modal header="Revoke API key" :style="{ width: 'min(440px, 92vw)' }"
      :draggable="false">
      <p>Revoke <strong>{{ revokeTarget?.name }}</strong>? Requests using it will fail immediately.</p>
      <template #footer>
        <Button text severity="secondary" @click="revokeOpen = false">Cancel</Button>
        <Button severity="danger" :loading="revoking" @click="revokeKey">Revoke</Button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import Select from 'primevue/select'
import Plus from '@primeicons/vue/plus'
import Trash from '@primeicons/vue/trash'
import Copy from '@primeicons/vue/copy'

useHead({ title: 'API Keys' })
useNoIndex()

interface ApiKey {
  id: string
  name: string
  prefix: string
  scopes: string[]
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  status: 'active' | 'expired' | 'revoked'
  traffic: {
    today: number
    days: Array<{ date: string; count: number }>
    total: number
  }
}

const { user } = useAuthUser()
if (!user.value) await navigateTo('/sign')

interface ApiKeyListResponse {
  keys: ApiKey[]
  maxActiveKeys: number
  activeKeyCount: number
  page: number
  perPage: number
  total: number
  pages: number
}

const page = ref(1)
const perPage = 5
const { data, pending, refresh } = await useFetch<ApiKeyListResponse>('/api/developer/keys', {
  query: { page, perPage }
})
const error = ref('')

const keys = computed(() => data.value?.keys ?? [])
const maxActiveKeys = computed(() => data.value?.maxActiveKeys ?? 100)
const activeKeyCount = computed(() => data.value?.activeKeyCount ?? 0)
const keyLimitReached = computed(() => activeKeyCount.value >= maxActiveKeys.value)
const total = computed(() => data.value?.total ?? 0)

watch(() => data.value?.page, value => {
  if (value && value !== page.value) page.value = value
})

const allScopes = [
  { value: 'projects:read', label: 'Read projects', description: 'List projects and read files and deployments.' },
  { value: 'projects:write', label: 'Write projects', description: 'Create projects and change metadata.' },
  { value: 'deployments:write', label: 'Deploy content', description: 'Publish new file snapshots to existing projects.' },
  { value: 'projects:delete', label: 'Delete projects', description: 'Permanently remove projects and their files.' }
]

const expiryOptions = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '180 days', value: 180 },
  { label: '365 days', value: 365 },
  { label: 'Never', value: 'never' }
]

const createOpen = ref(false)
const secretOpen = ref(false)
const trafficOpen = ref(false)
const revokeOpen = ref(false)
const creating = ref(false)
const revoking = ref(false)
const copied = ref(false)
const name = ref('')
const expiry = ref<number | 'never'>(90)
const selectedScopes = ref<string[]>(['projects:read', 'projects:write', 'deployments:write'])
const preset = ref('')
const createError = ref('')
const newToken = ref('')
const trafficKey = ref<ApiKey | null>(null)
const revokeTarget = ref<ApiKey | null>(null)

function applyPreset(value: 'read' | 'deploy' | 'full') {
  preset.value = value
  if (value === 'read') selectedScopes.value = ['projects:read']
  if (value === 'deploy') selectedScopes.value = ['projects:read', 'deployments:write']
  if (value === 'full') selectedScopes.value = allScopes.map(scope => scope.value)
}

function openCreate() {
  if (keyLimitReached.value) {
    error.value = `You can have at most ${maxActiveKeys.value} active API keys. Revoke one before creating another.`
    return
  }
  error.value = ''
  name.value = ''
  expiry.value = 90
  selectedScopes.value = ['projects:read', 'projects:write', 'deployments:write']
  preset.value = ''
  createError.value = ''
  createOpen.value = true
}

async function createKey() {
  if (creating.value) return
  creating.value = true
  createError.value = ''
  try {
    const result = await $fetch<{ key: Omit<ApiKey, 'traffic'>; token: string }>('/api/developer/keys', {
      method: 'POST',
      body: {
        name: name.value.trim() || 'API key',
        scopes: selectedScopes.value,
        expiresInDays: expiry.value === 'never' ? null : expiry.value
      }
    })
    newToken.value = result.token
    createOpen.value = false
    secretOpen.value = true
    await refresh()
    page.value = 1
  } catch (err) {
    createError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not create the key.'
  } finally {
    creating.value = false
  }
}

async function copyToken() {
  try {
    await navigator.clipboard.writeText(newToken.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1800)
  } catch {
    copied.value = false
  }
}

function closeSecret() {
  secretOpen.value = false
  newToken.value = ''
  copied.value = false
}

function openTraffic(key: ApiKey) {
  trafficKey.value = key
  trafficOpen.value = true
}

function askRevoke(key: ApiKey) {
  revokeTarget.value = key
  revokeOpen.value = true
}

async function revokeKey() {
  if (!revokeTarget.value || revoking.value) return
  revoking.value = true
  try {
    await $fetch(`/api/developer/keys/${revokeTarget.value.id}`, { method: 'DELETE' })
    revokeOpen.value = false
    revokeTarget.value = null
    await refresh()
  } catch (err) {
    error.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not revoke the key.'
  } finally {
    revoking.value = false
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
}

</script>

<style lang="scss" scoped>
.keys-page {
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
  margin-bottom: 2rem;

  h1 {
    margin: 0.35rem 0 0;
    font-size: 2rem;
  }

  .sub {
    max-width: 620px;
    margin: 0.5rem 0 0;
    color: var(--p-text-muted-color);
  }
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .quota {
    color: var(--p-text-muted-color);
    font-family: var(--font-code);
    font-size: 0.7rem;
    white-space: nowrap;
  }

  :deep(.p-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    flex: none;
  }

  :deep(svg) {
    width: 0.85rem;
    height: 0.85rem;
  }
}

.eyebrow {
  margin: 0;
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
}

.error {
  color: var(--p-red-500);
  font-size: 0.85rem;
}

.empty {
  margin-top: 2rem;
  padding: 3rem 1.5rem;
  border: 1px dashed var(--p-content-border-color);
  border-radius: 0.75rem;
  text-align: center;

  h2 {
    margin: 0 0 0.5rem;
  }

  p {
    margin: 0 0 1rem;
    color: var(--p-text-muted-color);
  }
}

.key-list {
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.75rem;
  list-style: none;
}

:deep(.p-paginator) {
  margin-top: 1rem;
  background: transparent;
  border: 0;
}

.key-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  align-items: center;
  gap: 1.5rem;
  padding: 0.95rem 1.25rem;

  & + & {
    border-top: 1px solid var(--p-content-border-color);
  }

  &:hover {
    background: var(--p-content-hover-background);
  }
}

.key-main {
  min-width: 0;
}

.key-title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.key-name {
  overflow: hidden;
  font-size: 0.95rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  padding: 0.18rem 0.45rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--p-text-color) 8%, transparent);
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;

  &--expired {
    color: var(--p-red-500);
  }
}

.prefix {
  display: inline-block;
  margin-top: 0.25rem;
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 0.75rem;
}

.scopes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.45rem;

  span {
    padding: 0.15rem 0.4rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.3rem;
    color: var(--p-text-muted-color);
    font-family: var(--font-code);
    font-size: 0.65rem;
  }
}

.key-meta {
  display: flex;
  gap: 1.5rem;
  margin: 0;

  div {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  dt {
    color: var(--p-text-muted-color);
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  dd {
    margin: 0;
    font-size: 0.8rem;
  }
}

:deep(.revoke-button.p-button) {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  color: var(--p-text-muted-color);
}

:deep(.revoke-button svg) {
  width: 1.15rem;
  height: 1.15rem;
}

:deep(.revoke-button.p-button:not(:disabled):hover) {
  background: transparent;
  color: var(--p-red-500);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  > span,
  legend {
    color: var(--p-text-muted-color);
    font-size: 0.75rem;
    font-weight: 600;
  }
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;

  button {
    padding: 0.4rem 0.65rem;
    border: 1px solid var(--p-content-border-color);
    border-radius: 0.35rem;
    background: transparent;
    color: var(--p-text-muted-color);
    font: inherit;
    font-size: 0.75rem;
    cursor: pointer;

    &.active {
      border-color: var(--p-primary-color);
      color: var(--p-text-color);
    }
  }
}

.scopes-field {
  margin: 0;
  padding: 0;
  border: 0;
}

.check-row {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.45rem 0;
  cursor: pointer;

  input {
    margin-top: 0.25rem;
  }

  span {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  strong {
    font-size: 0.82rem;
  }

  small {
    color: var(--p-text-muted-color);
    font-size: 0.72rem;
    line-height: 1.45;
  }
}

.hint {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.75rem;
  line-height: 1.5;
}

.secret {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  p {
    margin: 0;
    color: var(--p-text-muted-color);
    line-height: 1.6;
  }
}

.secret-value {
  display: block;
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  padding: 0.9rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--p-text-color) 4%, var(--p-content-background));
  font-family: var(--font-code);
  font-size: 0.8rem;
  line-height: 1.5;
}

.secret-row {
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
}

.secret-actions {
  position: relative;
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;

  :deep(.p-button) {
    display: inline-flex;
    align-items: center;
    height: 100%;
    gap: 0.35rem;
    white-space: nowrap;
  }
}

.copied {
  position: absolute;
  right: 0.2rem;
  bottom: -1.35rem;
  color: var(--p-green-600);
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .key-row {
    grid-template-columns: minmax(0, 1fr) auto auto;
    grid-template-areas:
      'main main revoke'
      'meta traffic revoke';
    align-items: start;
    gap: 0.9rem 1rem;
  }

  .key-main {
    grid-area: main;
  }

  .key-meta {
    grid-area: meta;
    flex-wrap: wrap;
  }

  .traffic-cell {
    grid-area: traffic;
    justify-self: end;
  }

  .revoke-button {
    grid-area: revoke;
    align-self: start;
  }

  .head {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .key-row {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'main revoke'
      'meta meta'
      'traffic traffic';
    gap: 0.75rem;
  }

  .secret-row {
    flex-direction: column;
  }

  .secret-actions {
    width: 100%;
    flex-direction: row;
    justify-content: flex-end;
    align-self: auto;

    :deep(.p-button) {
      height: auto;
    }
  }

  .copied {
    position: static;
  }
}
</style>
