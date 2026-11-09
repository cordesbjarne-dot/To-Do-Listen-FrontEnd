import { expect, test, type Page } from '@playwright/test'

// Erzeugt je einen Screenshot pro Use-Case für die Projektdokumentation.
// Läuft nur, wenn SCREENSHOT_DIR gesetzt ist (nicht Teil der CI-Prüfung), z. B.:
//   SCREENSHOT_DIR=../docs/screenshots E2E_BASE_URL=http://localhost:5174 npx playwright test screenshots
// Die angelegte Beispielaufgabe wird am Ende wieder gelöscht.
const dir = process.env.SCREENSHOT_DIR
test.skip(!dir, 'SCREENSHOT_DIR nicht gesetzt')
test.use({ viewport: { width: 1280, height: 860 }, reducedMotion: 'reduce' })

const shot = (page: Page, name: string) => page.screenshot({ path: `${dir}/${name}.png` })

test('Screenshots für UC-01 bis UC-07', async ({ page }) => {
  const title = 'Präsentation WebTech-Projekt üben'
  await page.goto('/')
  await expect(page.getByTestId('result-count')).toBeVisible()

  // UC-02 Übersicht
  await shot(page, 'uc02-uebersicht')

  // UC-01 Erstellen
  await page.getByRole('button', { name: 'Neue Aufgabe' }).click()
  const create = page.getByRole('dialog', { name: 'Neue Aufgabe' })
  await create.getByLabel('Titel').fill(title)
  await create.getByLabel('Beschreibung').fill('Ablauf einmal komplett durchspielen, Zeit stoppen.')
  await create.getByLabel('Priorität').selectOption('HIGH')
  await create.getByLabel('Fällig am').fill('2026-11-16')
  await shot(page, 'uc01-erstellen')
  await create.getByRole('button', { name: 'Aufgabe anlegen' }).click()
  await expect(create).toBeHidden()

  // UC-03 Bearbeiten
  await page.getByRole('button', { name: `„${title}“ bearbeiten` }).click()
  const edit = page.getByRole('dialog', { name: 'Aufgabe bearbeiten' })
  await edit.getByLabel('Priorität').selectOption('MEDIUM')
  await shot(page, 'uc03-bearbeiten')
  await edit.getByRole('button', { name: 'Änderungen speichern' }).click()
  await expect(edit).toBeHidden()

  // UC-04 Abschließen
  await page.getByLabel(`„${title}“ als erledigt markieren`).check()
  await expect(page.getByText(`„${title}“ erledigt.`)).toBeVisible()
  await shot(page, 'uc04-abschliessen')
  await page.getByLabel(`„${title}“ wieder öffnen`).uncheck()
  await expect(page.getByLabel(`„${title}“ als erledigt markieren`)).not.toBeChecked()

  // UC-06 Suchen und Filtern
  await page.getByLabel('Aufgaben durchsuchen').fill('statistik')
  await page.locator('#filter-status').selectOption('OPEN')
  await shot(page, 'uc06-suchen-filtern')
  await page.locator('#filter-status').selectOption('DONE')
  await page.locator('#filter-priority').selectOption('LOW')
  await shot(page, 'uc06-keine-treffer')
  await page.getByRole('button', { name: 'Filter zurücksetzen' }).first().click()

  // UC-07 Sortieren
  await page.locator('#sort').selectOption('DUE_ASC')
  await shot(page, 'uc07-sortieren')
  await page.locator('#sort').selectOption('CREATED_DESC')

  // UC-05 Löschen (räumt gleichzeitig auf)
  await page.getByRole('button', { name: `„${title}“ löschen` }).click()
  const confirm = page.getByRole('dialog', { name: 'Aufgabe löschen?' })
  await expect(confirm).toBeVisible()
  await shot(page, 'uc05-loeschen')
  await confirm.getByRole('button', { name: 'Endgültig löschen' }).click()
  await expect(confirm).toBeHidden()

  // Mobile Ansicht
  await page.setViewportSize({ width: 375, height: 812 })
  await page.reload()
  await expect(page.getByTestId('result-count')).toBeVisible()
  await page.screenshot({ path: `${dir}/mobil-uebersicht.png`, fullPage: true })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  )
  expect(overflow, 'kein horizontales Scrollen auf 375 px').toBe(false)
})
