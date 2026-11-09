# Abgabe und Demonstration

Die Introfolien 16–19 der bereitgestellten Vorlesung nennen die Projektdemonstration, die öffentliche Render-App, über die Oberfläche gespeicherte Entitäten, Spring/Vue/Postgres, automatisierte Frontend- und Backend-Tests, vertrauliche Zugangsdaten und einen Screenshot pro Use-Case. Bewertungsdimensionen umfassen Funktionsumfang, CSS, dynamisches Frontend, Tests/Continuous Delivery und Backend-Struktur. Der Foliensatz bezeichnet das Projekt als 50 % der Modulnote. Die Termine im Foliensatz für das Sommersemester bitte mit den Angaben des aktuellen Kurses abgleichen.

Die sieben folgenden Use-Cases sind unsere Produktentscheidung. Ihre Zählung wurde nicht durch den Dozenten bestätigt.

| Vorgabe | Umsetzung und Datei | Prüfnachweis / Demohandlung |
|---|---|---|
| UC-01 Erstellen | TaskEditor, POST /todos | Titel, Beschreibung und Priorität eingeben, speichern. [Bild](screenshots/01-erstellen.png) |
| UC-02 Übersicht | TaskList, GET /todos | Seite neu laden und Aufgabe samt Kennzahlen zeigen. [Bild](screenshots/02-uebersicht.png) |
| UC-03 Bearbeiten | TaskEditor und TaskService.save | Titel ergänzen und speichern. [Bild](screenshots/03-bearbeiten.png) |
| UC-04 Status wechseln | TaskList und PUT /todos/{id} | Abschließen, neu laden, wieder öffnen. [Bild](screenshots/04-status.png) |
| UC-05 Löschen | Bestätigungsdialog und TaskService.delete | Löschen öffnen, abbrechen, erneut öffnen, bestätigen und neu laden. [Bild](screenshots/05-loeschen.png) |
| UC-06 Suche und Filter | select in tasks.ts | Nach SEMINAR in der Beschreibung suchen, Status offen und Priorität hoch wählen. [Bild](screenshots/06-filter.png) |
| UC-07 Sortierung | select in tasks.ts | Filter zurücksetzen und nach Fälligkeit sortieren. Aufgaben ohne Termin folgen am Ende. [Bild](screenshots/07-sortieren.png) |
| Responsive Gestaltung | main.css, TaskList und TaskEditor | Desktop mit 1280 px und [Mobilansicht mit 375 px](screenshots/mobil.png) im Browsertest |
| Validierung und Persistenz | TaskInput, TaskService, schema.sql | DemoApplicationTests mit PostgreSQL, SchemaTests für Altbestand |
| Frontend- und Backend-Prüfungen | .github/workflows/check.yml in beiden Repos | Lokale Befehle erfolgreich, erster Lauf auf GitHub steht aus |
| Veröffentlichung und Vorführung | Dockerfile, READMEs | Render-Konfiguration vorbereitet. Öffentlicher Aufruf und Vorführung stehen aus |

Die Screenshots stammen aus Chrome mit einer isolierten PostgreSQL-Datenbank. Alle sieben Aktionen wurden in einem echten Browserablauf geprüft. Filterkombinationen, stabile Reihenfolge, Priorität, heutige und vergangene Fälligkeit sowie das Verhalten bei fehlgeschlagenem Speichern sind zusätzlich automatisiert abgedeckt. Demo-Daten entstehen ausschließlich im ausdrücklich gestarteten Browser-Test. Eine frische produktive Datenbank beginnt leer.
