<template>
  <img class="file-type-icon" :src="src" alt="" width="16" height="16" draggable="false">
</template>

<script setup lang="ts">
type IconType = 'folder' | 'folder-open' | 'html' | 'css' | 'js' | 'file'

const props = defineProps<{ type: IconType }>()

const src = computed(() => `/file-icons/${props.type}.svg`)
</script>

<style scoped>
.file-type-icon {
  flex: none;
  display: block;
  width: 16px;
  height: 16px;
}
</style>
