import { test, expect } from '@playwright/test'
test('Studienaufgabe vom Anlegen bis zur bestätigten Löschung', async ({ page }) => {
  const testApi = 'http://localhost:18080/todos'
  const examples = [
    { name: 'Lesetext annotieren', priority: 'mittel', dueDate: '2026-10-15', status: 'offen' },
    { name: 'Vorlesungsnotizen ordnen', priority: 'niedrig', dueDate: null, status: 'erledigt' },
  ]
  const rows = (await (await page.request.get(testApi)).json()) as { id: number; name: string }[]
  for (const task of rows.filter(
    (t) =>
      examples.some((e) => e.name === t.name) ||
      ['Lerngruppe vorbereiten', 'Lerngruppe vorbereiten · Kapitel 2'].includes(t.name),
  )) {
    await page.request.delete(testApi + '/' + task.id)
  }
  for (const example of examples)
    expect((await page.request.post(testApi, { data: example })).status()).toBe(201)
  await page.goto('/')
  const shot = async (n: string) => {
    await page.screenshot({ path: 'docs/screenshots/' + n + '.png', fullPage: true })
  }
  await page.getByRole('button', { name: 'Neue Aufgabe' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Titel').fill('Lerngruppe vorbereiten')
  await dialog.getByLabel('Beschreibung').fill('Übungsblatt für das Seminar zusammenstellen.')
  await dialog.getByLabel('Priorität').selectOption('hoch')
  await shot('01-erstellen')
  await dialog.getByRole('button', { name: 'Speichern' }).click()
  const row = page.locator('article').filter({ hasText: 'Lerngruppe vorbereiten' })
  await expect(row).toBeVisible()
  await shot('02-uebersicht')
  await row.getByText('Bearbeiten').click()
  await dialog.getByLabel('Titel').fill('Lerngruppe vorbereiten · Kapitel 2')
  await shot('03-bearbeiten')
  await dialog.getByText('Speichern').click()
  await row.getByText('Abschließen').click()
  await expect(row.getByText('Wieder öffnen')).toBeVisible()
  await page.reload()
  await expect(row.getByText('Wieder öffnen')).toBeVisible()
  await shot('04-status')
  await row.getByText('Wieder öffnen').click()
  await page.getByLabel('Suche').fill('SEMINAR')
  await page.getByLabel('Priorität', { exact: true }).selectOption('hoch')
  await page.getByLabel('Status', { exact: true }).selectOption('offen')
  await expect(row).toBeVisible()
  await shot('06-filter')
  await page.getByLabel('Suche').fill('')
  await page.getByLabel('Priorität', { exact: true }).selectOption('')
  await page.getByLabel('Status', { exact: true }).selectOption('')
  await page.getByLabel('Sortierung').selectOption('frist')
  await expect(page.locator('article').first()).toContainText('Lesetext annotieren')
  await shot('07-sortieren')
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(row).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await shot('mobil')
  await row.getByText('Löschen').click()
  await expect(dialog).toContainText('Kapitel 2')
  await shot('05-loeschen')
  await dialog.getByText('Abbrechen').click()
  await expect(row).toBeVisible()
  await row.getByText('Löschen').click()
  await dialog.getByText('Endgültig löschen', { exact: true }).click()
  await expect(row).toHaveCount(0)
  await page.reload()
  await expect(page.locator('article').first()).toBeVisible()
  await expect(row).toHaveCount(0)
  const remaining = (await (await page.request.get(testApi)).json()) as {
    id: number
    name: string
  }[]
  for (const task of remaining.filter((t) => examples.some((e) => e.name === t.name)))
    await page.request.delete(testApi + '/' + task.id)
})
