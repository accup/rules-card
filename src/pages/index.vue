<script setup lang="ts">
import styles from './index.module.scss'

interface Page {
  url: string
  content: string
}

const pages: Page[] = [
  {
    url: '/rules_card/',
    content: 'Rules Card',
  },
]
</script>

<template>
  <ul>
    <a v-for="page in pages" :href="page.url">
      <li>{{ page.content }}</li>
    </a>
  </ul>
</template>

<style lang="scss">
@use './index_global.module';
</style>
