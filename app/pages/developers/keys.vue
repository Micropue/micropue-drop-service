<template>
  <div class="keys-page">
    <header class="head">
      <div>
        <p class="eyebrow">DEVELOPER ACCESS</p>
        <h1>API keys</h1>
        <p class="sub">Keys authenticate scripts, CI jobs, MCP servers and Skills against the DROP API.</p>
      </div>
      <Button @click="openCreate">
        <Plus aria-hidden="true" />
        <span>Create key</span>
      </Button>
    </header>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <section v-if="!keys.length && !pending" class="empty">
      <h2>No API keys yet</h2>
      <p>Create a key to start deploying from outside the editor.</p>
      <Button @click="openCreate">Create your first key</Button>
    </section>

    <section v-else class="key-list" aria-label="API keys">
      <article v-for="key in keys" :key="key.id" class="key-card">
        <div class="key-main">
          <div class="key-title">
            <h2>{{ key.name }}</h2>
            <span class="status" :class="`status--${key.status}`">{{ key.status }}</span>
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
        <Button v-if="key.status === 'active'" text severity="danger" @click="askRevoke(key)">
          <Trash aria-hidden="true" />
          <span>Revoke</span>
        </Button>
      </article>
    </section>

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
        <code class="secret-value">{{ newToken }}</code>
        <div class="secret-actions">
          <Button severity="secondary" @click="copyToken">
            <Copy aria-hidden="true" />
            <span>Copy key</span>
          </Button>
          <span v-if="copied" class="copied">Copied</span>
        </div>
        <p class="hint">Do not put this key in a browser bundle or commit it to git.</p>
      </div>
      <template #footer>
        <Button @click="closeSecret">I saved the key</Button>
      </template>
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
import Select from 'primevue/select'
import Plus from '@primeicons/vue/plus'
import Trash from '@primeicons/vue/trash'
import Copy from '@primeicons/vue/copy'

useHead({ title: 'API Keys' })

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
}

const { user } = useAuthUser()
if (!user.value) await navigateTo('/sign')

const { data, pending, refresh } = await useFetch<{ keys: ApiKey[] }>('/api/developer/keys')
const error = ref('')

const keys = computed(() => data.value?.keys ?? [])

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
const revokeTarget = ref<ApiKey | null>(null)

function applyPreset(value: 'read' | 'deploy' | 'full') {
  preset.value = value
  if (value === 'read') selectedScopes.value = ['projects:read']
  if (value === 'deploy') selectedScopes.value = ['projects:read', 'deployments:write']
  if (value === 'full') selectedScopes.value = allScopes.map(scope => scope.value)
}

function openCreate() {
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
    const result = await $fetch<{ key: ApiKey; token: string }>('/api/developer/keys', {
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
  width: min(1080px, 90%);
  margin: 0 auto;
  padding: clamp(3rem, 9vh, 6rem) 0 5rem;
}

.head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;

  h1 {
    margin: 0.35rem 0 0.5rem;
    font-size: clamp(2rem, 4vw, 3rem);
    letter-spacing: -0.04em;
  }

  .sub {
    max-width: 620px;
    margin: 0;
    color: var(--p-text-muted-color);
    line-height: 1.7;
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
  padding: 3rem 1.5rem;
  border: 1px dashed var(--p-content-border-color);
  border-radius: 1rem;
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
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.key-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 1.5rem;
  padding: 1.2rem 1.3rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.85rem;
}

.key-title {
  display: flex;
  align-items: center;
  gap: 0.65rem;

  h2 {
    margin: 0;
    font-size: 1.05rem;
  }
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

  &--active {
    color: var(--p-green-600);
  }

  &--revoked,
  &--expired {
    color: var(--p-red-500);
  }
}

.prefix {
  display: inline-block;
  margin-top: 0.35rem;
  color: var(--p-text-muted-color);
  font-family: var(--font-code);
  font-size: 0.78rem;
}

.scopes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.55rem;

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
  gap: 1.4rem;
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
    font-size: 0.78rem;
  }
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
  overflow-wrap: anywhere;
  padding: 0.9rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--p-text-color) 4%, var(--p-content-background));
  font-family: var(--font-code);
  font-size: 0.8rem;
  line-height: 1.5;
}

.secret-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  :deep(.p-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
}

.copied {
  color: var(--p-green-600);
  font-size: 0.78rem;
}

@media (max-width: 900px) {
  .key-card {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .key-meta {
    flex-wrap: wrap;
  }

  .head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
