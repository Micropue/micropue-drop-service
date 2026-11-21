<template>
  <div class="fork-invite">
    <div v-if="pending" class="invite-state invite-loading" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <span>Loading invitation…</span>
    </div>

    <section v-else-if="unavailable" class="invite-state invite-unavailable">
      <div class="state-icon state-icon--muted">
        <ExclamationTriangle aria-hidden="true" />
      </div>
      <h1>Invitation unavailable</h1>
      <p class="lede">
        This invitation may have expired, been turned off, or the link is incomplete.
        Ask the project owner for a current link.
      </p>
      <Button as-child v-slot="slotProps" severity="secondary">
        <NuxtLink to="/" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
          <Home aria-hidden="true" />
          <span>Back to DROP</span>
        </NuxtLink>
      </Button>
    </section>

    <article v-else-if="invitation" class="invite-content">
      <header class="invite-head">
        <h1 v-if="acceptedResult || invitation.viewer.accepted">Fork complete</h1>
        <h1 v-else-if="invitation.viewer.isOwner">This project is already yours</h1>
        <h1 v-else>Create a new fork</h1>

        <p v-if="acceptedResult || invitation.viewer.accepted" class="lede invite-lede">
          A complete copy of <strong>{{ invitation.name }}</strong> is now in your account.
          The original project has not been changed.
        </p>
        <p v-else-if="invitation.viewer.isOwner" class="lede invite-lede">
          Forking your own project would create a duplicate. Open the editor to keep working
          on the original instead.
        </p>
        <p v-else class="lede invite-lede">
          A fork is a complete copy of this project. Accepting the invitation copies every file,
          folder and setting without changing the original.
        </p>
      </header>

      <div class="invite-rule" aria-hidden="true"></div>

      <section class="action-panel">
        <template v-if="acceptedResult || invitation.viewer.accepted">
          <div v-if="acceptedProject" class="field-block">
            <span class="field-label">Your fork *</span>
            <div class="read-field project-destination">
              <CodeBranch aria-hidden="true" />
              <code>{{ acceptedProject.path }}</code>
            </div>
          </div>
          <div class="action-row action-row--end">
            <Button v-if="acceptedProject" as-child v-slot="slotProps">
              <a :href="liveProjectUrl(acceptedProject.path)" target="_blank" rel="noopener noreferrer"
                :class="slotProps.class" v-bind="slotProps.a11yAttrs">
                <ArrowUpRight aria-hidden="true" />
                <span>Open project</span>
              </a>
            </Button>
            <Button v-if="acceptedProject" as-child v-slot="slotProps" severity="secondary">
              <NuxtLink :to="`/new?edit=${encodeURIComponent(acceptedProject.sid)}`" :class="slotProps.class"
                v-bind="slotProps.a11yAttrs">
                <CodeBranch aria-hidden="true" />
                <span>Edit</span>
              </NuxtLink>
            </Button>
            <Button as-child v-slot="slotProps" severity="secondary" text>
              <NuxtLink to="/dashboard" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
                <span>Dashboard</span>
                <ArrowRight aria-hidden="true" />
              </NuxtLink>
            </Button>
          </div>
        </template>

        <template v-else-if="invitation.viewer.isOwner">
          <div class="owner-row">
            <UserAvatar :src="invitation.owner.avatarUrl" :size="42" />
            <div class="owner-copy">
              <span>Original project</span>
              <strong>{{ invitation.owner.nickname || `@${invitation.owner.username}` }}</strong>
              <code>@{{ invitation.owner.username }}/{{ invitation.slug }}</code>
            </div>
          </div>
          <div class="action-row action-row--end">
            <Button as-child v-slot="slotProps">
              <NuxtLink to="/dashboard" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
                <span>Go to Dashboard</span>
                <ArrowRight aria-hidden="true" />
              </NuxtLink>
            </Button>
          </div>
        </template>

        <template v-else>
          <p class="required-note">Required fields are marked with an asterisk (*).</p>

          <div class="fork-fields" aria-label="Fork details">
            <div class="field-block">
              <span class="field-label">Owner *</span>
              <div class="read-field read-field--owner">
                <UserAvatar :src="invitation.viewer.avatarUrl" :size="26" />
                <span v-if="invitation.viewer.username">@{{ invitation.viewer.username }}</span>
                <span v-else class="read-field-placeholder">Your account after login</span>
              </div>
            </div>

            <span class="field-separator" aria-hidden="true">/</span>

            <label class="field-block">
              <span class="field-label">Fork name *</span>
              <InputText v-model="forkName" class="fork-name-input" maxlength="40" autocomplete="off"
                spellcheck="false" placeholder="project-fork" :invalid="Boolean(forkNameError)"
                :aria-invalid="Boolean(forkNameError)" aria-describedby="fork-name-help"
                @update:model-value="onForkNameInput" />
              <span v-if="forkNameError" class="field-error" role="alert">{{ forkNameError }}</span>
            </label>
          </div>

          <p id="fork-name-help" class="fork-explainer">
            Choose a unique URL for your fork using lowercase letters, numbers and hyphens.
          </p>

          <div class="project-facts" aria-label="Project details">
            <span>
              <CodeBranch aria-hidden="true" />
              @{{ invitation.owner.username }}/{{ invitation.slug }}
            </span>
            <span>
              <File aria-hidden="true" />
              {{ invitation.fileCount }} file{{ invitation.fileCount === 1 ? '' : 's' }}
            </span>
            <span>
              <Folder aria-hidden="true" />
              {{ invitation.folderCount }} folder{{ invitation.folderCount === 1 ? '' : 's' }}
            </span>
            <span>
              <Lock v-if="invitation.visibility !== 'public'" aria-hidden="true" />
              <CodeBranch v-else aria-hidden="true" />
              {{ invitation.visibility === 'public' ? 'Public project' : 'Password protected' }}
            </span>
          </div>

          <p v-if="acceptError" class="accept-error" role="alert">{{ acceptError }}</p>

          <div v-if="invitation.viewer.signedIn" class="action-row action-row--end">
            <Button :loading="accepting" @click="acceptInvitation">
              <CodeBranch aria-hidden="true" />
              <span>{{ accepting ? 'Creating fork…' : 'Create fork' }}</span>
            </Button>
          </div>
          <div v-else class="signed-out-action">
            <p>You need a DROP account to accept this invitation.</p>
            <Button as-child v-slot="slotProps">
              <a :href="loginUrl" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
                <SignIn aria-hidden="true" />
                <span>Log in to accept</span>
              </a>
            </Button>
          </div>
        </template>
      </section>

    </article>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ArrowRight from '@primeicons/vue/arrow-right'
import ArrowUpRight from '@primeicons/vue/arrow-up-right'
import CodeBranch from '@primeicons/vue/code-branch'
import ExclamationTriangle from '@primeicons/vue/exclamation-triangle'
import File from '@primeicons/vue/file'
import Folder from '@primeicons/vue/folder'
import Home from '@primeicons/vue/home'
import Lock from '@primeicons/vue/lock'
import SignIn from '@primeicons/vue/sign-in'

type Visibility = 'public' | 'password'

interface ForkOwner {
  username: string
  nickname: string
  avatarUrl: string
}

interface AcceptedForkProject {
  sid: string
  slug: string
  path: string
}

interface ForkInvitation {
  name: string
  slug: string
  visibility: Visibility
  owner: ForkOwner
  sourcePath: string
  fileCount: number
  folderCount: number
  viewer: {
    signedIn: boolean
    isOwner: boolean
    username: string | null
    nickname: string | null
    avatarUrl: string | null
    accepted: {
      acceptedAt: string
      project: AcceptedForkProject | null
    } | null
  }
}

interface AcceptedFork {
  project: {
    sid: string
    name: string
    slug: string
    visibility: Visibility
    enabled: boolean
    path: string
    editorPath: string
  }
  source: {
    name: string
    slug: string
    path: string
    owner: ForkOwner
  }
}

const route = useRoute()
const config = useRuntimeConfig()

const username = computed(() => String(route.params.username || ''))
const slug = computed(() => String(route.params.slug || ''))
const code = computed(() => typeof route.query.code === 'string' ? route.query.code.trim().toUpperCase() : '')
const invitationUrl = computed(() => {
  const query = code.value ? `?code=${encodeURIComponent(code.value)}` : ''
  return `/api/fork-invites/${encodeURIComponent(username.value)}/${encodeURIComponent(slug.value)}${query}`
})

const { data, pending, error } = await useFetch<{ invitation: ForkInvitation }>(invitationUrl, {
  key: `fork-invite-${username.value}-${slug.value}-${code.value}`
})

const invitation = computed(() => data.value?.invitation || null)
const unavailable = computed(() => Boolean(error.value) || !invitation.value)
const loginUrl = computed(() => `/api/auth/bits?return=${encodeURIComponent(route.fullPath)}`)
const contentUrl = computed(() => String(config.public.contentUrl).replace(/\/+$/, ''))

const accepting = ref(false)
const acceptError = ref('')
const forkNameError = ref('')
const acceptedResult = ref<AcceptedFork | null>(null)
const forkName = ref('')

watch(() => invitation.value?.slug, sourceSlug => {
  if (sourceSlug && !forkName.value) forkName.value = `${sourceSlug}-fork`
}, { immediate: true })

const acceptedProject = computed<AcceptedForkProject | null>(() => {
  if (acceptedResult.value) {
    return {
      sid: acceptedResult.value.project.sid,
      slug: acceptedResult.value.project.slug,
      path: acceptedResult.value.project.path
    }
  }
  return invitation.value?.viewer.accepted?.project || null
})

useHead({
  title: computed(() => invitation.value ? `Fork ${invitation.value.name}` : 'Fork invitation')
})
useNoIndex()

function liveProjectUrl(path: string) {
  return `${contentUrl.value}${path}/`
}

function onForkNameInput(value: string) {
  forkNameError.value = ''
  forkName.value = value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+/, '')
    .slice(0, 40)
}

function messageOf(err: unknown) {
  const errorObject = err as { data?: { statusMessage?: string }, statusMessage?: string, message?: string }
  return errorObject?.data?.statusMessage || errorObject?.statusMessage || errorObject?.message
    || 'Could not accept this invitation. Please try again.'
}

function statusOf(err: unknown) {
  const errorObject = err as { statusCode?: number, status?: number, data?: { statusCode?: number } }
  return errorObject?.statusCode || errorObject?.status || errorObject?.data?.statusCode || 0
}

async function acceptInvitation() {
  if (accepting.value || !invitation.value) return
  const targetSlug = forkName.value.trim()
  if (targetSlug && !/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(targetSlug)) {
    forkNameError.value = 'Fork name must be 1-40 characters: lowercase letters, numbers and hyphens.'
    return
  }

  accepting.value = true
  acceptError.value = ''
  forkNameError.value = ''

  try {
    acceptedResult.value = await $fetch<AcceptedFork>(
      `/api/fork-invites/${encodeURIComponent(username.value)}/${encodeURIComponent(slug.value)}/accept`,
      { method: 'POST', body: { code: code.value, slug: targetSlug || undefined } }
    )
  } catch (err) {
    const message = messageOf(err)
    if ([400, 409].includes(statusOf(err)) && /(fork name|project url|already taken)/i.test(message)) {
      forkNameError.value = message
    } else {
      acceptError.value = message
    }
  } finally {
    accepting.value = false
  }
}
</script>

<style lang="scss" scoped>
// Flat invitation layout, matching a repository fork page rather than a card/modal.
.fork-invite {
  width: min(760px, 90%);
  margin: 0 auto;
  padding: clamp(1.6rem, 4vw, 3rem) 0 5rem;
  font-size: 1rem;
}

.invite-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  min-height: min(60vh, 520px);
  padding: 2rem;
  color: var(--p-text-muted-color);
  font-size: 0.88em;
  text-align: center;
}

.invite-unavailable {
  h1 {
    margin: 0;
    color: var(--p-text-color);
    font-size: clamp(2rem, 5vw, 3rem);
    line-height: 1.08;
    letter-spacing: -0.05em;
  }

  .lede {
    max-width: 32rem;
  }

  :deep(.p-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.45rem;
    font-size: 0.88em;
    text-decoration: none;
  }
}

.state-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin-bottom: 0.25rem;
  border-radius: 50%;

  svg {
    width: 1rem;
    height: 1rem;
  }
}

.state-icon--muted {
  background: color-mix(in srgb, var(--p-text-color) 7%, transparent);
  color: var(--p-text-muted-color);
}

.invite-content {
  width: 100%;
}

.invite-head {
  max-width: 100%;
}

.invite-head h1 {
  max-width: 100%;
  margin: 0;
  font-size: clamp(2.1rem, 5vw, 3.05rem);
  line-height: 1.08;
  letter-spacing: -0.055em;
  overflow-wrap: anywhere;
}

.invite-lede {
  max-width: 100%;
  margin-top: 0.75rem;
  font-size: 0.92em;
  line-height: 1.7;
}

.lede {
  margin: 0;
  color: var(--p-text-muted-color);
  font-size: 0.92em;
  line-height: 1.7;
}

.invite-rule {
  width: 100%;
  margin-top: 1.65rem;
  border-top: 1px solid var(--p-content-border-color);
}

.action-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  padding: 1.35rem 0 0;

  code {
    font-family: var(--font-code);
  }
}

.owner-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.owner-copy {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  min-width: 0;

  span,
  code {
    font-size: 0.88em;
  }

  span {
    color: var(--p-text-muted-color);
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  strong {
    font-size: 0.92em;
  }

  code {
    overflow: hidden;
    color: var(--p-text-muted-color);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.required-note {
  margin: 0;
  color: var(--p-text-color);
  font-size: 0.92em;
  font-style: italic;
  line-height: 1.6;
}

.fork-fields {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  width: 100%;
  margin-top: 1.4rem;
}

.field-block {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 0.42rem;
  min-width: 0;
}

.field-label {
  font-size: 0.92em;
  font-weight: 700;
  line-height: 1.35;
}

.field-separator {
  flex: none;
  padding-bottom: 0.7rem;
  color: var(--p-text-muted-color);
  font-size: 1.35rem;
  font-weight: 400;
}

.read-field {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  min-height: 46px;
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.42rem;
  background: var(--p-content-background);
  color: var(--p-text-color);
  font-size: 1em;

  code {
    min-width: 0;
    overflow: hidden;
    font-family: var(--font-code);
    font-size: 0.94em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  svg {
    flex: none;
    width: 0.9rem;
    height: 0.9rem;
    color: var(--p-text-muted-color);
  }
}

.fork-name-input {
  width: 100%;
  min-height: 46px;
  font-family: var(--font-code);
  font-size: 1em;

  &.is-invalid,
  &.p-invalid {
    border-color: var(--p-red-500);
  }
}

.field-error {
  color: var(--p-red-500);
  font-size: 0.88em;
  line-height: 1.5;
}

.read-field-placeholder {
  color: var(--p-text-muted-color);
}

.read-field--owner {
  overflow: hidden;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.fork-explainer {
  max-width: 100%;
  margin-top: 1.15rem;
  color: var(--p-text-muted-color);
  font-size: 0.92em;
  line-height: 1.7;

  code {
    color: var(--p-text-color);
    font-size: 1em;
  }
}

.project-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 1.2rem;
  margin-top: 1.05rem;
  color: var(--p-text-muted-color);
  font-size: 0.88em;

  span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  svg {
    flex: none;
    width: 0.8rem;
    height: 0.8rem;
  }
}

.accept-error {
  width: 100%;
  margin: 1rem 0 0;
  padding: 0.7rem 0.8rem;
  border: 1px solid color-mix(in srgb, var(--p-red-500) 32%, transparent);
  border-radius: 0.5rem;
  color: var(--p-red-500);
  font-size: 0.92em;
  line-height: 1.5;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1.25rem;

  :deep(.p-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.88em;
    text-decoration: none;
  }

  :deep(.p-button svg) {
    width: 0.9rem;
    height: 0.9rem;
  }
}

.action-row--end {
  justify-content: flex-end;
  width: 100%;
}

.project-destination {
  flex-direction: row;
  gap: 0.55rem;
  width: 100%;
  margin-top: 0;
  padding: 0.8rem 0.9rem;
  border-radius: 0.42rem;
  background: var(--p-content-background);
}

.signed-out-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
  margin-top: 1.25rem;

  p {
    margin: 0;
    color: var(--p-text-muted-color);
    font-size: 0.88em;
    line-height: 1.55;
    text-align: right;
  }

  :deep(.p-button) {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.88em;
    text-decoration: none;
  }

  :deep(.p-button svg) {
    width: 0.9rem;
    height: 0.9rem;
  }
}

.spinner {
  width: 1.35rem;
  height: 1.35rem;
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

@media screen and (max-width: 560px) {
  .fork-invite {
    width: 88%;
    padding-top: 1.2rem;
  }

  .fork-fields {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;
    width: 100%;
  }

  .field-separator {
    display: none;
  }

  .action-row--end,
  .action-row--end :deep(.p-button),
  .signed-out-action,
  .signed-out-action :deep(.p-button) {
    width: 100%;
  }

  .action-row--end :deep(.p-button),
  .signed-out-action :deep(.p-button) {
    justify-content: center;
  }

  .signed-out-action {
    flex-direction: column;
    align-items: stretch;

    p {
      text-align: left;
    }
  }
}
</style>
