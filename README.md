# Studienplaner

Eine gemeinsame Aufgabenliste für Studierende. Die Anwendung zeigt echte Backend-Daten. Jede Person mit Zugriff kann Aufgaben bearbeiten und löschen. Für die öffentliche Demo ausschließlich unverfängliche Beispiele verwenden.

## Start und Vorführung

1. Das Spring-Backend aus dem zweiten Repository mit einer separaten PostgreSQL-Entwicklungsdatenbank starten. Siehe dessen README für IntelliJ und die nur lokal erreichbare Testinstanz.
2. Im Frontend-Ordner mit Node.js 26 und npm die Abhängigkeiten über npm ci installieren.
3. npm run dev ausführen und http://localhost:5173 öffnen. .env.development zeigt auf Port 8080. VITE_BACKEND_BASE_URL kann in einer lokalen Entwicklungsdatei oder beim Build gesetzt werden.
4. Eine erste Aufgabe anlegen. Die Demoanleitung führt durch alle sieben Use-Cases: [Bewertungsmatrix und Demonstration](docs/Abgabe.md).

## Architektur

TaskList hält die geladene Liste und die Ansichtsfilter. TaskEditor bearbeitet eine Kopie der Felder im nativen Dialog. Escape schließt den Dialog und der Fokus kehrt zum Auslöser zurück. tasks.ts kapselt HTTP, fachliche Typen, Filter und stabile Sortierung. Die Liste wird nach bestätigter Serverantwort aktualisiert. Während Laden oder Speichern ist kein zweiter schreibender Aufruf möglich. Ein Fehler beim Speichern erhält den Entwurf.

Die Kennzahlen beziehen sich auf den ganzen Datenbestand. Die Trefferzahl beschreibt die gefilterte Ansicht. Vergleiche für Fälligkeit verwenden das Kalenderdatum des Browsers. Die Anwendung lädt die gemeinsame Liste vollständig. Sie ist für kleine Gruppen ausgelegt und synchronisiert Änderungen anderer Browser beim Neuladen.

## Prüfungen

    npm ci
    npm run lint
    npm run test:unit
    npm run build

Der Build enthält die TypeScript-Prüfung. Die Vitest-Tests prüfen Ansichtslogik und Vue-Komponenten. Der Browser-Test startet sein eigenes Frontend auf Port 15173. Er benötigt ein Backend auf Port 18080 mit FRONTEND_URL=http://localhost:15173 und einer ausschließlich für diesen Test gestarteten lokalen Datenbank. Er legt eindeutig benannte Studienbeispiele an und räumt sie nach dem Durchlauf auf.

    npx playwright install chromium
    npm run test:e2e

Mit installiertem Google Chrome ist alternativ PW_CHANNEL=chrome npm run test:e2e möglich. Die CI-Action zeigt die vollständige Startreihenfolge. Sie installiert aus dem Lockfile, prüft das Frontend und führt anschließend den Browserablauf gegen echtes Spring und PostgreSQL aus. In GitHub BACKEND_REF möglichst auf einen kompatiblen Commit des Backend-Repos setzen. Standard ist der passende Backend-Commit a5c7f44. Bei privatem Backend-Repo muss BACKEND_READ_TOKEN lesenden Zugriff auf dieses Repo haben.

## Render

Vor Veröffentlichung beim bestehenden Static-Site-Service Build-Befehl npm ci && npm run build und Publish Directory dist einstellen. Node 26 auswählen. VITE_BACKEND_BASE_URL muss beim Build auf die HTTPS-Adresse des Backend-Service zeigen. In Redirects/Rewrites die Regel /* → /index.html als Rewrite hinzufügen. Die Route /about leitet auf die Aufgabenübersicht um. In beiden Services den Deployment-Branch prüfen und „After CI Checks Pass“ aktivieren. Die Workflows wurden lokal vorbereitet. Ein GitHub-Lauf und der öffentliche Test dieser Version stehen aus. [Vue auf Render](https://render.com/docs/deploy-vue-js)
