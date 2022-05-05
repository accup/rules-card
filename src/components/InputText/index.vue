<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  text: string
}>()
const emit = defineEmits<{
  (e: 'update:text', text: string): void
}>()

const text = computed({
  get(): string {
    return props.text
  },
  set(text: string) {
    emit('update:text', text)
  },
})
</script>

<template>
  <input v-model="text" class="input-text" type="text" />
</template>

<style scoped lang="scss">
@use '@/styles/prelude';

.input-text {
  font-family: Consolas, Menlo, 'Courier New', Courier, monospace;
  font-size: 20px;
  padding: 8px 10px;
  border: 2px solid prelude.$color-input-border;
  border-radius: 8px;
}
</style>
