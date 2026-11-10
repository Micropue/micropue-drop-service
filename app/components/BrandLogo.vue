<template>
  <NuxtLink to="/" class="brand" aria-label="MICROPUE Drop 首页">
    <span class="brand-name">MICROPUE</span>
    <span class="brand-product-clip">
      <span class="brand-product">Drop</span>
    </span>
  </NuxtLink>
</template>

<style lang="scss" scoped>
.brand {
  display: flex;
  align-items: center;
  /* 颜色由父级决定：header 用 a:not(.p-button) 的 initial，footer 继承反色文字色 */
  color: inherit;
  text-decoration: none;
}

.brand-product {
  font-family: 'Dancing Script';
  display: inline-block;
}

// 左边缘裁切：Drop 初始位于左侧被裁掉，向右滑出时像从 MICROPUE 后方出现
.brand-product-clip {
  display: inline-block;
  margin-left: 0.5em;
  clip-path: inset(-0.5em -0.5em -0.5em 0);
}
</style>
