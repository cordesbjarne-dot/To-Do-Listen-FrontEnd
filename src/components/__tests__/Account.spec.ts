import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import HomeView from '../../views/HomeView.vue'

const calls: { path: string; init: RequestInit }[] = []
let answer: (path: string) => [number, unknown]
beforeEach(() => {
  calls.length = 0
  answer = (path) => (path === '/auth/session' ? [200, { state: 'anonymous' }] : [202, null])
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const path = new URL(url, location.href).pathname
    calls.push({ path, init })
    const [status, data] = path === '/auth/csrf' ? [200, { token: 'test-csrf' }] : answer(path)
    return new Response(data === null ? null : JSON.stringify(data), { status })
  })
})
afterEach(() => vi.unstubAllGlobals())
describe('Accountansichten', () => {
  it('registriert mit unverändertem Unicode-Passwort und ermöglicht erneuten Versand bei Fehler', async () => {
    const w = mount(HomeView)
    await flushPromises()
    await w.get('button[type=button]').trigger('click')
    await w.get('input[type=email]').setValue('jonas+uni@example.org')
    await w.get('input[autocomplete=nickname]').setValue(' Jonas ')
    const pw = '  ' + '🔑'.repeat(11) + '  '
    await w.get('input[autocomplete=new-password]').setValue(pw)
    answer = (path) =>
      path === '/auth/register' ? [503, { message: 'Versand fehlgeschlagen' }] : [202, null]
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(w.get('[role=alert]').text()).toContain('Versand fehlgeschlagen')
    const call = calls.find((c) => c.path === '/auth/register')!
    expect(JSON.parse(String(call.init.body))).toEqual({
      email: 'jonas+uni@example.org',
      displayName: 'Jonas',
      password: pw,
    })
    expect(call.init.credentials).toBe('include')
    expect(call.init.headers).toHaveProperty('X-CSRF-TOKEN', 'test-csrf')
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(calls[calls.length - 1]?.path).toBe('/auth/resend')
    w.unmount()
  })
  it('lädt bei unbestätigter Anmeldung keine Aufgaben', async () => {
    const w = mount(HomeView)
    await flushPromises()
    await w.get('input[type=email]').setValue('jonas@example.org')
    await w.get('input[type=password]').setValue('ein langes Passwort')
    answer = () => [200, { state: 'pending' }]
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(w.get('h1').text()).toContain('Bitte E-Mail bestätigen')
    expect(calls.some((c) => c.path === '/todos')).toBe(false)
    w.unmount()
  })
  it('öffnet die persönliche Liste, ändert den Namen und meldet serverseitig ab', async () => {
    const w = mount(HomeView)
    await flushPromises()
    await w.get('input[type=email]').setValue('jonas@example.org')
    await w.get('input[type=password]').setValue('ein langes Passwort')
    answer = (path) => {
      if (path === '/todos') return [200, []]
      if (path === '/auth/logout') return [204, null]
      return [
        200,
        { state: 'authenticated', displayName: path === '/auth/profile' ? 'Jo' : 'Jonas' },
      ]
    }
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(w.text()).toContain('Deine Liste ist leer')
    await w.get('.accountbar button').trigger('click')
    await w.get('input[autocomplete=nickname]').setValue(' Jo ')
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(w.get('.accountbar span').text()).toBe('Jo')
    await w.get('.accountbar button:last-of-type').trigger('click')
    await flushPromises()
    expect(calls[calls.length - 1]?.path).toBe('/auth/logout')
    expect(w.get('h1').text()).toBe('Anmelden')
    w.unmount()
  })
  it('verbraucht den Link erst durch den Button und führt zur Anmeldung', async () => {
    vi.resetModules()
    location.hash = 'bestaetigen=test-link'
    const VerificationPage = (await import('../../views/HomeView.vue')).default
    const w = mount(VerificationPage)
    await flushPromises()
    expect(location.hash).toBe('')
    expect(calls).toHaveLength(0)
    answer = () => [204, null]
    await w.get('form').trigger('submit')
    await flushPromises()
    expect(calls.map((c) => c.path)).toEqual(['/auth/csrf', '/auth/verify'])
    expect(w.get('h1').text()).toBe('Anmelden')
    expect(w.get('[role=status]').text()).toContain('bestätigt')
    w.unmount()
  })
})
