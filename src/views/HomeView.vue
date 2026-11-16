<script lang="ts">
// Read once, before Vue Router records the initial location.
const fragment = new URLSearchParams(location.hash.slice(1))
let initialProof = fragment.get('bestaetigen')
if (initialProof !== null)
  history.replaceState(history.state, '', location.pathname + location.search)
</script>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import TaskList from '../components/TaskList.vue'
import { ApiError, request } from '../http'

type Page =
  'loading' | 'offline' | 'login' | 'register' | 'pending' | 'verify' | 'tasks' | 'profile'
type Session = { state: 'authenticated' | 'anonymous' | 'pending'; displayName: string | null }
const proof = initialProof
initialProof = null
const page = ref<Page>(proof !== null ? 'verify' : 'loading')
const email = ref('')
const password = ref('')
const name = ref('')
const displayName = ref('')
const show = ref(false)
const busy = ref(false)
const info = ref('')
const error = ref('')

function go(next: Page, message = '') {
  page.value = next
  info.value = message
  error.value = ''
  password.value = ''
  show.value = false
}
function editProfile() {
  name.value = displayName.value
  go('profile')
}
function sessionEnded() {
  go('login', 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.')
}
async function load() {
  go('loading')
  try {
    const s = await request<Session>('/auth/session')
    displayName.value = s.displayName || ''
    go(s.state === 'authenticated' ? 'tasks' : 'login')
  } catch {
    go('offline', 'Die Verbindung zum Server ist fehlgeschlagen.')
  }
}
onMounted(() => {
  window.addEventListener('session-ended', sessionEnded)
  if (page.value === 'loading') void load()
})
onUnmounted(() => window.removeEventListener('session-ended', sessionEnded))

async function submit() {
  if (busy.value) return
  error.value = ''
  info.value = ''
  busy.value = true
  try {
    const address = email.value.trim()
    if (page.value === 'register' || page.value === 'login' || page.value === 'pending') {
      if (address.length > 254 || !/^[^\s@]+@[^\s@]+$/u.test(address))
        throw new Error('Bitte gib eine gültige E-Mail-Adresse ein.')
    }
    if (page.value === 'register' || page.value === 'login') {
      const n = [...password.value].length
      if (n < 15 || n > 128) throw new Error('Das Passwort muss 15–128 Zeichen lang sein.')
    }
    if (page.value === 'register' || page.value === 'profile') {
      const normalized = name.value.trim()
      if ([...normalized].length < 2 || [...normalized].length > 50)
        throw new Error('Der Anzeigename muss 2–50 Zeichen lang sein.')
      if (page.value === 'profile') {
        const s = await request<Session>('/auth/profile', 'PUT', { displayName: normalized })
        displayName.value = s.displayName || ''
        go('tasks')
        return
      }
      await request('/auth/register', 'POST', {
        email: address,
        displayName: normalized,
        password: password.value,
      })
      go(
        'pending',
        'Prüfe dein Postfach und den Spamordner. Bereits registriert? Du kannst dich auch anmelden.',
      )
    } else if (page.value === 'login') {
      const s = await request<Session>('/auth/login', 'POST', {
        email: address,
        password: password.value,
      })
      displayName.value = s.displayName || ''
      go(s.state === 'authenticated' ? 'tasks' : 'pending')
    } else if (page.value === 'pending') {
      await request('/auth/resend', 'POST', { email: address })
      info.value = 'Wenn eine Bestätigung aussteht, erhältst du einen Link per E-Mail.'
    } else if (page.value === 'verify') {
      await request('/auth/verify', 'POST', { token: proof })
      go('login', 'Deine E-Mail-Adresse ist bestätigt. Du kannst dich jetzt anmelden.')
    } else if (page.value === 'tasks') {
      await request('/auth/logout', 'POST')
      go('login', 'Du bist abgemeldet.')
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 503 && page.value === 'register') go('pending')
    error.value = e instanceof Error ? e.message : 'Bitte versuche es erneut.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <template v-if="page === 'tasks'">
    <div class="accountbar">
      <span>{{ displayName }}</span>
      <button :disabled="busy" @click="editProfile">Anzeigename ändern</button>
      <button :disabled="busy" @click="submit">
        {{ busy ? 'Wird abgemeldet …' : 'Abmelden' }}
      </button>
      <span v-if="error" role="alert">{{ error }}</span>
    </div>
    <TaskList />
  </template>
  <main v-else class="account">
    <h1>
      {{
        {
          profile: 'Anzeigename ändern',
          loading: 'Sitzung laden …',
          offline: 'Server nicht erreichbar',
          login: 'Anmelden',
          register: 'Account erstellen',
          pending: 'Bitte E-Mail bestätigen',
          verify: 'E-Mail-Adresse bestätigen',
        }[page]
      }}
    </h1>
    <p v-if="info" role="status">{{ info }}</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <button v-if="page === 'offline'" @click="load">Erneut versuchen</button>
    <form v-else-if="page !== 'loading'" @submit.prevent="submit">
      <fieldset :disabled="busy">
        <label v-if="page !== 'verify' && page !== 'profile'"
          >E-Mail-Adresse<input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            maxlength="254"
        /></label>
        <label v-if="page === 'register' || page === 'profile'"
          >Anzeigename (2–50 Zeichen)<input v-model="name" autocomplete="nickname" required
        /></label>
        <template v-if="page === 'login' || page === 'register'">
          <label
            >Passwort{{ page === 'register' ? ' (15–128 Zeichen)' : '' }}
            <input
              v-model="password"
              :type="show ? 'text' : 'password'"
              :autocomplete="page === 'login' ? 'current-password' : 'new-password'"
              required
            />
          </label>
          <label class="check"><input v-model="show" type="checkbox" /> Passwort anzeigen</label>
        </template>
        <p v-if="page === 'verify'">
          Bestätige mit dem Button, dass diese E-Mail-Adresse dir gehört.
        </p>
        <p v-if="page === 'pending'">
          Öffne den Link aus der E-Mail. Nach einer Minute kannst du einen neuen anfordern.
        </p>
        <button v-if="page === 'profile'" type="button" @click="go('tasks')">Abbrechen</button>
        <button class="primary">
          {{
            busy
              ? 'Bitte warten …'
              : {
                  profile: 'Speichern',
                  login: 'Anmelden',
                  register: 'Registrieren',
                  pending: 'Link erneut senden',
                  verify: 'E-Mail bestätigen',
                }[page]
          }}
        </button>
        <button v-if="page === 'login'" type="button" @click="go('register')">
          Account erstellen
        </button>
        <button v-if="page === 'verify' || page === 'login'" type="button" @click="go('pending')">
          Bestätigungslink anfordern
        </button>
        <button v-if="page !== 'login' && page !== 'profile'" type="button" @click="go('login')">
          Zur Anmeldung
        </button>
      </fieldset>
    </form>
  </main>
</template>

<style scoped>
.account {
  max-width: 30rem;
  margin: 3rem auto;
  padding: 1rem;
}
.account h1 {
  font-size: 1.65rem;
}
.account fieldset,
.account label {
  display: grid;
  gap: 0.4rem;
}
.account fieldset {
  border: 0;
  padding: 0;
  gap: 1rem;
  margin-top: 1rem;
}
.account .check,
.accountbar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.accountbar {
  justify-content: flex-end;
  padding: 0.6rem 1rem;
  flex-wrap: wrap;
}
.account .check input {
  width: auto;
}
.account input:not([type='checkbox']) {
  width: 100%;
  min-width: 0;
}
</style>
