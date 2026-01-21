## Key aspects for experiment

### Einstieg & Rahmen
- Teilnehmer kommen über einen Link auf unsere Webseite, auf der sie das Experiment durchführen.  
  In der URL wird die Gruppe mit übergeben, sodass ersichtlich ist, welcher Gruppe der jeweilige Teilnehmer zugeordnet ist.
- Einführungstext
- Aufgabenstellung
- Datenschutzbestimmungen inkl. Tracking der Aktivitäten sowie Datenspeicherung
- Bedankung für die Teilnahme inkl. Angabe der Dauer des Experiments sowie Beschreibung des Ablaufs
- Start des Experiments (eine der vier Ausprägungen / Gruppen)
- Möglichst wenige Kontextwechsel: optimalerweise bleibt der Teilnehmer auf derselben Webseite und es wechselt nur das Fenster bzw. der Inhalt.

---

### Ticketsystem
- Die Teilnehmer sehen eine Übersicht mit Tickets.
- Beim Klick auf ein Ticket öffnet sich dieses:
  - Verschiedene Dropdown-Menüs zur Entscheidungsfindung
  - Chat-Möglichkeit, um dem Kunden Feedback zur Entscheidung zu geben
- Während das System geöffnet ist, wird im oberen Bereich stets ein Überblick über den Prozess angezeigt:
  - Anzeige des aktuellen Prozessschritts
  - Anzeige, welche Entscheidungen/Punkte noch offen sind
  - Die Prozessleiste wird live aktualisiert, sodass der Teilnehmer jederzeit weiß, wo er sich im Prozess befindet.
- Nach Abschluss eines Tickets wird der Teilnehmer wieder zur Ticketübersicht zurückgeführt.

---

### Gruppen­spezifisches Design
- **Knowledge Base**  
  - Linke Seite: Knowledge Base  
  - Rechte Seite: Ticketsystem  
  - Die Knowledge Base ist hierarchisch aufgebaut; Unterpunkte/Kategorien können ein- und ausgeklappt werden.
- **Chat**  
  - Linke Seite: Chat  
  - Unterstützung durch Beantwortung von Fragen zur Knowledge Base sowie Hilfe bei der Formulierung von Kundenantworten.
- **AI Agents mit Rückfragen**  
  - Der Prozess wird schrittweise durch einen AI Agent ausgeführt.  
  - Der Teilnehmer wird regelmäßig um Bestätigung gebeten und kann Entscheidungen annehmen, ablehnen oder bearbeiten.
- **Autonome AI Agents**  
  - Der Prozess wird vollständig von AI Agents durchgeführt.  
  - Am Ende können Teilnehmer dem Ergebnis und der Kundenrückmeldung zustimmen oder diese ablehnen bzw. bearbeiten.

---

### Ablauf & Zeit
- Es stehen **10 Tickets** zur Verfügung.
- Gesamtbearbeitungszeit: **15 Minuten**.
- Zwei Varianten der Ticketbereitstellung:
  - **Option 1:** Alle Tickets sind von Beginn an sichtbar.
  - **Option 2:** Tickets erscheinen zeitlich versetzt nach einem festen Muster (für alle gleich), um Stress zu erzeugen.

---

### Fragebogen (nach Ablauf der 15 Minuten)
- Der Fragebogen wird innerhalb derselben Webseite angezeigt (Fensterwechsel, kein Seitenwechsel).
- Enthaltene Konstrukte:
  - Perceived Stress Level
  - Decision Confidence
  - Self-Efficacy
  - Trust in das System vs. eigene Fähigkeiten
  - Trust in die Entscheidung
  - Engagement im Prozess

---

### Digital Trace Data
- Performance: Abstand zum Goldstandard-Ergebnis der Tickets
- Error Rate: Anzahl der Fehler im Prozess
- Ticketqualität und Userzufriedenheit mit Antwort und Entscheidung
- Time to First Response / Time to Close Ticket
- Gesamtanzahl gelöster Tickets in 15 Minuten
- Klicks und Mausbewegungsgeschwindigkeit
- Kundenantworten (semantische Analyse)
- Zeit zwischen Entscheidungen im Ticketprozess

---

### Abschluss
- Nach Abschluss des Fragebogens wird eine Abschlussseite angezeigt:
  - Dank für die Teilnahme
  - Hinterlegung der Kontaktdaten
  - Bestätigungslink von Prolific

---

## Technical

- Posthog sollte zum tracken verwendet werden (URL in env var)
- Knowledge sollte in einem speziellen Verzeichnis in Markdown konfiguriert werden
- Die Tickets die dem Nutzer angezeigt werden, sollten in einer JSON konfiguriert werden können
