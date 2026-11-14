# signdigital-player

Gebärden von [SIGNdigital](https://sign-digital.de) auf dem Handy: suchen, im
Vollbild im Loop abspielen, antippen zum Pausieren, die Lernlisten aus dem
eigenen Konto durchgehen.
Eine PWA für Android und iPhone. Sie braucht ein eigenes SIGNdigital-Abo.

Die Anmeldung bleibt auf dem Handy und geht nur an sign-digital.de. Läuft sie
ab, meldet sich die App selbst neu an. Videos werden zum Anschauen in den
Arbeitsspeicher geladen und nirgends gespeichert. Die App liest nur: Listen
legst du auf sign-digital.de als Lernliste an und änderst sie dort.

## Aufs Handy

- **Android, Chrome:** Seite öffnen, Menü, „App installieren“.
- **iPhone, Safari:** Seite öffnen, Teilen, „Zum Home-Bildschirm“. Erst als App
  vom Home-Bildschirm läuft das Video ohne Safari-Leisten.

## Entwickeln

```
npm install
npm run dev        # http://127.0.0.1:3010
npm test
npm run typecheck
npm run icons      # nach einer Änderung an public/icon.svg
```

Aufbau:

- `src/lib/` – alles ohne Oberfläche: der SIGNdigital-Client, Speicher, Geschwindigkeiten, Icons.
- `src/state/` – der reaktive Zustand, je Aufgabe ein Modul: Anmeldung,
  Listen, Navigation, Player, Einstellungen, Suche.
- `src/components/` – Bausteine, die mehrere Bildschirme nutzen.
- `src/views/` – die Bildschirme und Sheets.
- `src/main.ts` – verdrahtet einmal, was auf den Browser hört.

Die Schnittstelle ist dieselbe wie in zeigmals `SignDigitalProvider`
(Lautstark/zeigmal), Lernlisten eingeschlossen, dazu die Suche der Website
(`GET /search/query`).
