# Studienplaner

Die Aufgabenliste gehört zum angemeldeten Account. Registrierung, E-Mail-Bestätigung per Button, erneuter Versand und Login sind direkt auf der Startseite erreichbar. Nach der Anmeldung kannst du den Anzeigenamen ändern, Aufgaben erstellen und bearbeiten, nach Titel oder Beschreibung suchen, filtern, sortieren oder dich abmelden.

## Lokaler Start

1. Das Spring-Backend mit PostgreSQL starten. Die Backend-README dokumentiert die Datenbankvariablen, das Entwicklungsprofil, FRONTEND_URL und den Resend-Absender.
2. In diesem Verzeichnis mit Node 26 `npm ci` ausführen.
3. Mit `npm run dev` starten und http://localhost:5173 öffnen. Im Entwicklungsmodus ist http://localhost:8080 die Standardadresse der API. Für andere Adressen VITE_BACKEND_BASE_URL setzen.
4. Nach dem Registrieren die Mail öffnen und die Adresse per Button bestätigen. Anschließend mit E-Mail und Passwort anmelden. Neue Konten haben eine leere Liste.

## Aufbau

HomeView führt durch die Accountansichten. Der HTTP-Client in src/http.ts sendet das Sitzungscookie mit und holt vor jedem Schreibzugriff den CSRF-Wert aus dem Backend. TaskList verwaltet die persönlichen Aufgaben und Ansichtsfilter. TaskEditor bearbeitet eine Kopie der Felder in einem Dialog. Die Liste wird nach bestätigter Serverantwort aktualisiert. Die vorhandenen Task-Demonstrationen sind in [Abgabe.md](docs/Abgabe.md) beschrieben.

## Prüfungen

```sh
npm run lint
npm run test:unit
npm run build
```

Alle drei Befehle wurden lokal erfolgreich ausgeführt. Die acht Vitest-Tests umfassen auch Versandfehler, erneuten Versand, unveränderte Unicode-Passwörter, CSRF, eingeschränkten Login, die bewusste Linkbestätigung, persönlichen Taskzugriff, Namensänderung und Logout mit simulierter API.

Für `npm run test:e2e` benötigt Playwright ein Backend auf Port 18080 mit aktivem dev-Profil, FRONTEND_URL=http://localhost:15173, eine isolierte Datenbank sowie E2E_EMAIL und E2E_PASSWORD eines bestätigten Testkontos. Der Test bearbeitet ausschließlich Aufgaben dieses Kontos. Mit `npx playwright install chromium` den Browser installieren. Die GitHub-Action checkt beide Projekte aus, führt die Backendtests aus und bereitet das Konto in ihrer eigenen PostgreSQL-Datenbank vor. BACKEND_REF muss auf die Backendversion mit Accountfunktion zeigen (Standard main). Ein privates Backend benötigt BACKEND_READ_TOKEN.

Der lokale Aufruf von `npm run test:e2e` wurde beim Binden des Testserverports mit EPERM beendet. Ein erfolgreicher Lauf mit echtem Backend steht aus.

## Deployment

Build-Befehl `npm ci && npm run build`, Ausgabeordner dist. VITE_BACKEND_BASE_URL beim Build auf die öffentliche HTTPS-Adresse setzen. Frontend und Backend brauchen für das Sitzungscookie eine gemeinsame Site oder einen Reverse Proxy auf derselben Origin. Bei gemeinsamem Origin /auth und /todos einschließlich Unterpfaden zuerst ans Backend weiterleiten, danach die Frontend-Routen auf /index.html umschreiben. FRONTEND_URL im Backend muss exakt der Frontend-Origin entsprechen. Der Resend-Schlüssel gehört ausschließlich in den Backend-Prozess.
