import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '',
    component: () => import('@/pages/index.vue'),
  },
  {
    path: '/rules_card',
    component: () => import('@/pages/rules_card/index.vue'),
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
