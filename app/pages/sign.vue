<template>
  <div class="sign">
    <h1>Log in with BITS</h1>
    <p>
      DROP uses BITS OAuth for sign-in. Your account details are managed on
      <a href="https://bits.micropue.com.cn" target="_blank" rel="noopener noreferrer">bits.micropue.com.cn</a>
      and cannot be changed here.
    </p>
    <p class="pending">OAuth is not connected yet in this scaffold.</p>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Log In' })
</script>

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

  a {
    color: var(--p-text-color);
  }

  .pending {
    font-family: var(--font-code);
    font-size: 0.8rem;
  }
}
</style>
