# Studienaufgaben – Frontend

Vue-3-/TypeScript-Oberfläche der Aufgabenverwaltung für Studierende (WebTech-Kurs).
Gesamtdokumentation, Architektur und Bewertungsmatrix liegen im Projektordner (`README.md`, `docs/`).

## Start

Voraussetzungen: Node.js 24 (oder ≥ 22.18), laufendes Backend.

```bash
npm ci
npm run dev
```

Die Backend-Adresse kommt aus `VITE_BACKEND_BASE_URL` (`.env.development`, Vorlage `.env.example`).

## Skripte

| Befehl                 | Zweck                                                 |
|------------------------|-------------------------------------------------------|
| `npm run dev`          | Entwicklungsserver (Port 5173)                        |
| `npm run build`        | Typprüfung + Produktionsbuild nach `dist/`            |
| `npm run type-check`   | vue-tsc                                               |
| `npm run lint`         | oxlint + ESLint, nur prüfen                           |
| `npm run lint:fix`     | automatische Korrekturen                              |
| `npm run format:check` | Prettier prüfen (`npm run format` schreibt)           |
| `npm test`             | Vitest einmalig (`npm run test:unit` im Watch-Modus)  |
| `npm run test:e2e`     | Playwright-Hauptablauf gegen ein laufendes Backend    |

Für E2E einmalig `npx playwright install chromium`. Ohne `E2E_BASE_URL` baut Playwright das
Frontend selbst und startet `vite preview` auf Port 4173; das Backend muss unter
`VITE_BACKEND_BASE_URL` laufen und `http://localhost:4173` per CORS erlauben (Standard).

## Aufbau

- `src/api/tasks.ts` – alle HTTP-Aufrufe, `ApiError`
- `src/composables/useTasks.ts` – Listenzustand, Schutz vor verspäteten Antworten/Doppelanfragen
- `src/utils/taskView.ts` – Suche, Filter, Sortierung, Kennzahlen, „überfällig“
- `src/views/TasksView.vue` – Hauptseite
- `src/components/*` – Kennzahlen, Filterleiste, Liste, Formular- und Löschdialog, Meldungen

## Deployment (Render Static Site)

Build `npm ci && npm run build`, Publish-Verzeichnis `dist`, Variable `VITE_BACKEND_BASE_URL`,
Rewrite-Regel `/*` → `/index.html`. CI: `.github/workflows/ci.yml`.
