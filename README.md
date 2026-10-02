# signdigital-player

Gebärden von [SIGNdigital](https://sign-digital.de) auf dem Handy: suchen, im
Vollbild im Loop abspielen, antippen zum Pausieren, eigene Listen anlegen.
Eine PWA für Android und iPhone. Sie braucht ein eigenes SIGNdigital-Abo.

Die Anmeldung bleibt auf dem Handy und geht nur an sign-digital.de. Läuft sie
ab, meldet sich die App selbst neu an. Videos werden zum Anschauen in den
Arbeitsspeicher geladen und nirgends gespeichert. Die Listen liegen nur auf
dem Handy.

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

Die Schnittstelle ist dieselbe wie in zeigmals `SignDigitalProvider`
(Lautstark/zeigmal). Die Suche findet vorerst nur das genaue Wort, weil noch
nicht nachgesehen ist, wie die Website selbst sucht.
