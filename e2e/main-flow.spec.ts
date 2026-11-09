import { expect, test, type Page } from '@playwright/test'

// Hauptablauf aus der Aufgabenstellung:
// erstellen -> bearbeiten -> erledigen -> neu laden -> Persistenz prüfen
// -> löschen -> neu laden -> Löschung prüfen.
// Eindeutige Titel sorgen dafür, dass der Test vorhandene Daten nicht stört.

function taskItem(page: Page, title: string) {
  return page
    .locator('li.task')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
}

async function waitForList(page: Page) {
  await expect(page.getByTestId('result-count')).toBeVisible()
  await expect(page.getByText('Aufgaben werden geladen')).toHaveCount(0)
}

test('Aufgabe durchläuft den kompletten Lebenszyklus und bleibt nach Neuladen erhalten', async ({
  page,
}) => {
  const suffix = Date.now().toString(36)
  const title = `E2E Referat ${suffix}`
  const editedTitle = `E2E Referat überarbeitet ${suffix}`

  await page.goto('/')
  await waitForList(page)

  // 1. Erstellen
  await page.getByRole('button', { name: 'Neue Aufgabe' }).click()
  const createDialog = page.getByRole('dialog', { name: 'Neue Aufgabe' })
  await expect(createDialog).toBeVisible()
  await createDialog.getByLabel('Titel').fill(title)
  await createDialog.getByLabel('Beschreibung').fill('Folien für das Seminar vorbereiten')
  await createDialog.getByLabel('Priorität').selectOption('HIGH')
  await createDialog.getByLabel('Fällig am').fill('2030-01-15')
  await createDialog.getByRole('button', { name: 'Aufgabe anlegen' }).click()
  await expect(createDialog).toBeHidden()
  await expect(page.getByText(`Aufgabe „${title}“ angelegt.`)).toBeVisible()
  await expect(taskItem(page, title)).toContainText('Hoch')
  await expect(taskItem(page, title)).toContainText('Fällig am 15.01.2030')

  // 2. Bearbeiten
  await page.getByRole('button', { name: `„${title}“ bearbeiten` }).click()
  const editDialog = page.getByRole('dialog', { name: 'Aufgabe bearbeiten' })
  await expect(editDialog.getByLabel('Titel')).toHaveValue(title)
  await editDialog.getByLabel('Titel').fill(editedTitle)
  await editDialog.getByLabel('Priorität').selectOption('LOW')
  await editDialog.getByRole('button', { name: 'Änderungen speichern' }).click()
  await expect(editDialog).toBeHidden()
  await expect(taskItem(page, editedTitle)).toContainText('Niedrig')

  // 3. Erledigen
  await page.getByLabel(`„${editedTitle}“ als erledigt markieren`).check()
  await expect(taskItem(page, editedTitle)).toContainText('Erledigt')

  // 4. Neu laden und Persistenz prüfen
  await page.reload()
  await waitForList(page)
  const persisted = taskItem(page, editedTitle)
  await expect(persisted).toBeVisible()
  await expect(persisted).toContainText('Erledigt')
  await expect(persisted).toContainText('Niedrig')
  await expect(persisted).toContainText('Folien für das Seminar vorbereiten')
  await expect(page.getByLabel(`„${editedTitle}“ wieder öffnen`)).toBeChecked()
  await expect(taskItem(page, title)).toHaveCount(0)

  // 5. Löschen mit Bestätigung
  await page.getByRole('button', { name: `„${editedTitle}“ löschen` }).click()
  const confirm = page.getByRole('dialog', { name: 'Aufgabe löschen?' })
  await expect(confirm).toContainText(`„${editedTitle}“`)
  await confirm.getByRole('button', { name: 'Endgültig löschen' }).click()
  await expect(confirm).toBeHidden()
  await expect(taskItem(page, editedTitle)).toHaveCount(0)

  // 6. Neu laden und Löschung prüfen
  await page.reload()
  await waitForList(page)
  await expect(taskItem(page, editedTitle)).toHaveCount(0)
})

test('Direktaufruf einer unbekannten Route zeigt eine verständliche Seite', async ({ page }) => {
  await page.goto('/gibt-es-nicht')
  await expect(page.getByRole('heading', { name: 'Seite nicht gefunden' })).toBeVisible()
  await page.getByRole('link', { name: 'Zur Aufgabenliste', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Studienaufgaben' })).toBeVisible()
})
