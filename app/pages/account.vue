<template>
  <div v-if="user" class="account">
    <header class="identity">
      <UserAvatar :src="user.avatarUrl" :size="64" />
      <div>
        <h1>{{ user.nickname || user.username || 'BITS account' }}</h1>
        <p v-if="user.username" class="username">@{{ user.username }}</p>
      </div>
    </header>

    <p class="lead">
      Signed in with BITS. Username, password and profile are managed there and cannot be changed in DROP.
    </p>

    <dl class="facts">
      <div>
        <dt>Email</dt>
        <dd>{{ user.email || '—' }}</dd>
      </div>
      <div>
        <dt>BITS ID</dt>
        <dd class="mono">{{ user.bitsId }}</dd>
      </div>
      <div>
        <dt>Joined</dt>
        <dd>{{ formatDate(user.createdAt) }}</dd>
      </div>
      <div>
        <dt>Last login</dt>
        <dd>{{ formatDate(user.lastLoginAt) }}</dd>
      </div>
    </dl>

    <div class="actions">
      <Button severity="secondary" @click="logout">
        <SignOut aria-hidden="true" />
        <span>Log out</span>
      </Button>
      <a v-if="profileUrl" :href="profileUrl" target="_blank" rel="noopener noreferrer">
        <ExternalLink aria-hidden="true" />
        <span>View BITS profile</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import SignOut from '@primeicons/vue/sign-out'
import ExternalLink from '@primeicons/vue/external-link'

useHead({ title: 'Account' })

const { user } = useAuthUser()
if (!user.value) await navigateTo('/sign')

const profileUrl = computed(() => {
  const profile = user.value?.profile
  if (profile && /^https?:\/\//.test(profile)) return profile
  return user.value?.username ? `https://bits.micropue.com.cn/${encodeURIComponent(user.value.username)}` : ''
})

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value)) : '—'

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/'
}
</script>

<style lang="scss" scoped>
.account {
  width: min(720px, 90%);
  margin: 0 auto;
  padding: clamp(4rem, 12vh, 8rem) 0 6rem;
}

.identity {
  display: flex;
  align-items: center;
  gap: 1.25rem;

  h1 {
    margin: 0;
    font-size: 1.8rem;
  }

  .username {
    margin: 0.25rem 0 0;
    color: var(--p-text-muted-color);
  }
}

.lead {
  margin: 2rem 0;
  line-height: 1.7;
  color: var(--p-text-muted-color);
}

.facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
  padding: 1.5rem;
  border: 1px solid var(--p-content-border-color);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--p-text-color) 3%, var(--p-content-background));

  div {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  dt {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--p-text-muted-color);
  }

  dd {
    margin: 0;
    font-size: 0.9rem;
  }

  .mono {
    font-family: var(--font-code);
    font-size: 0.8rem;
    word-break: break-all;
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;

  :deep(.p-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  :deep(svg) {
    width: 0.85rem;
    height: 0.85rem;
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--p-text-muted-color);
    font-size: 0.85rem;
    text-decoration: none;
  }

  a:hover {
    color: var(--p-text-color);
  }
}

@media screen and (max-width: 600px) {
  .facts {
    grid-template-columns: 1fr;
  }
}
</style>
