<template>
  <div class="sign">
    <h1>Log in with BITS</h1>
    <p>
      DROP uses BITS OAuth for sign-in. Your account details are managed on
      <a href="https://bits.micropue.com.cn" target="_blank" rel="noopener noreferrer">bits.micropue.com.cn</a>
      and cannot be changed here.
    </p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <Button as-child v-slot="slotProps">
      <a href="/api/auth/bits" :class="slotProps.class" v-bind="slotProps.a11yAttrs">
        <SignIn aria-hidden="true" />
        <span>Continue with BITS</span>
      </a>
    </Button>
    <p class="note">Username and password are managed by BITS. DROP never stores your password.</p>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import SignIn from '@primeicons/vue/sign-in'

useHead({ title: 'Log In' })

const route = useRoute()
const error = computed(() => {
  switch (route.query.error) {
    case 'denied': return 'Authorization was cancelled on BITS.'
    case 'state': return 'The login session expired. Please try again.'
    case 'oauth': return 'BITS login failed. Please try again.'
    default: return ''
  }
})

const { user } = useAuthUser()
if (user.value) await navigateTo('/account')</script>

<style lang="scss" scoped>
.sign {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: min(520px, 90%);
  margin: 0 auto;
  padding: clamp(4rem, 12vh, 8rem) 0;

  h1 {
    margin: 0;
    font-size: 1.8rem;
  }

  p {
    margin: 0;
    line-height: 1.7;
    color: var(--p-text-muted-color);
  }

  a:not(.p-button) {
    color: var(--p-text-color);
  }

  :deep(.p-button) {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    align-self: flex-start;
    text-decoration: none;
  }

  :deep(.p-button svg) {
    width: 0.9rem;
    height: 0.9rem;
  }

  .error {
    color: var(--p-red-500);
  }

  .note {
    font-family: var(--font-code);
    font-size: 0.8rem;
  }
}
</style>
