import { createRouter, createWebHistory } from 'vue-router'
import TasksView from '../views/TasksView.vue'

// History-Modus: saubere URLs ohne "#". Damit ein Direktaufruf (z. B. /irgendwas) auf Render
// funktioniert, leitet eine Rewrite-Regel alle Pfade auf index.html um (siehe render.yaml).
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'tasks', component: TasksView, meta: { title: 'Studienaufgaben' } },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: 'Seite nicht gefunden – Studienaufgaben' },
    },
  ],
})

router.afterEach((to) => {
  document.title = (to.meta.title as string | undefined) ?? 'Studienaufgaben'
})

export default router
