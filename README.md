# MyNMS – Deine Plattform für Neumünster

MyNMS ist eine lokale Community-Plattform für die Stadt Neumünster. Sie bündelt Fundmeldungen (Tiere & Gegenstände), lokale Nachrichten aus mehreren Quellen und ein Verzeichnis vorgestellter Orte in einer klar strukturierten, mobiloptimierten Webanwendung. Die Plattform richtet sich an Einwohnerinnen und Einwohner Neumünsters, die eine datenschutzfreundliche Alternative zu sozialen Netzwerken für nachbarschaftliche Anliegen suchen.

---

## Features

- **Fundtiere** – Vermisste oder gefundene Tiere melden, mit optionalem Foto, Standortkarte und Kontaktangabe
- **Fundsachen** – Verlorene oder gefundene Gegenstände melden
- **Nachrichten** – Aggregierte Lokalnachrichten aus sechs RSS-Quellen, serverseitig gecacht, mit Bildvorschau
- **Vorgestellt** – Verzeichnis lokaler Orte, Vereine und Initiativen mit Kategorien (Kultur, Sport, Vereine, Sonstiges), Öffnungszeiten, Social-Media-Links und Kartenansicht
- **Admin-Dashboard** – Geschützter Bereich zum Verwalten von Einträgen, Vorgestellt-Vorschlägen und Analytics
- **Analytics** – Eigenes, datenschutzkonformes Tracking ohne externe Dienste (Seitenaufrufe, Geräte, Referrer, Zeitreihen)
- **Dark Mode** – System-, Hell- und Dunkel-Theme per Toggle
- **PWA** – Installierbar als Progressive Web App auf Mobil- und Desktop-Geräten
- **Mehrsprachig** – Vollständige Übersetzungen auf Deutsch, Englisch und Türkisch (DE / EN / TR)
- **Two-Click OpenStreetMap** – Karten werden erst nach expliziter Nutzereinwilligung geladen (DSGVO-konform)

---

## Tech Stack

| Technologie | Version | Zweck |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16 | React-Framework, App Router, Standalone-Build |
| TypeScript | 5 | Statische Typisierung |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first Styling |
| [ShadCN UI](https://ui.shadcn.com/) | – | Komponenten-Bibliothek (Style: Radix Vega, Farbe: Mist) |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | 12 | Datenbankzugriff (SQLite, synchron) |
| [react-leaflet](https://react-leaflet.js.org/) | 5 | Interaktive Karten via OpenStreetMap |
| [next-intl](https://next-intl-docs.vercel.app/) | 4 | Internationalisierung (DE/EN/TR) |
| [next-themes](https://github.com/pacocoursey/next-themes) | 0.4 | Dark-Mode-Verwaltung |
| [lucide-react](https://lucide.dev/) | 1 | Icon-Set |
| [recharts](https://recharts.org/) | 3 | Diagramme im Analytics-Dashboard |
| [Geist](https://vercel.com/font) | – | Schriftart (Sans + Mono) |
| [@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa) | 10 | PWA / Service Worker |

---

## Voraussetzungen

- **Node.js** >= 20.9
- **npm** >= 10 (wird mit Node.js mitgeliefert)
- **Docker** (für den Produktionsbetrieb)

---

## Lokale Entwicklung

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen anlegen
cp .env.example .env.local
# .env.local nach Bedarf anpassen

# 3. Entwicklungsserver starten (Turbopack)
npm run dev
```

Die Anwendung ist anschließend unter **http://localhost:3000** erreichbar.

Im Entwicklungsmodus wird ein temporäres SQLite-Datenbankfile im Verzeichnis `/data` angelegt (kann über `DATA_DIR` in `.env.local` geändert werden). PWA und Service Worker sind im Entwicklungsmodus deaktiviert.

---

## Umgebungsvariablen

Alle Variablen werden in `.env.local` (Entwicklung) bzw. als Container-Umgebungsvariablen (Produktion) gesetzt. Die Datei `.env.example` enthält alle verfügbaren Schlüssel:

| Variable | Standard | Beschreibung |
|---|---|---|
| `DATA_DIR` | `/data` | Basisverzeichnis für alle persistenten Daten (Datenbank, Fotos, Logos) |
| `DB_PATH` | `/data/mynms.db` | Vollständiger Pfad zur SQLite-Datenbankdatei |
| `PHOTO_DIR` | `/data/photos` | Verzeichnis für hochgeladene Fotos von Fund-Einträgen |
| `LOGO_DIR` | `/data/logos` | Verzeichnis für Logos der Vorgestellt-Einträge |
| `ADMIN_USERNAME` | `admin` | Benutzername für den Admin-Login |
| `ADMIN_PASSWORD` | – | Passwort für den Admin-Login (**muss gesetzt werden**) |
| `JWT_SECRET` | – | Geheimer Schlüssel für die JWT-Signierung (**muss gesetzt werden**, mindestens 32 Zeichen) |
| `ANALYTICS_ENABLED` | `true` | Analytics aktivieren (`true`) oder vollständig deaktivieren (`false`) |

### JWT_SECRET generieren

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Das Ergebnis (96 Hex-Zeichen) als `JWT_SECRET` eintragen.

---

## Docker-Deployment

### Image bauen und betreiben

Das Projekt enthält ein mehrstufiges `Dockerfile` (Builder → Runner, Node 20 Alpine). Ein fertiger Docker-Compose-Stack:

```yaml
services:
  mynms:
    image: mynms:latest        # oder build: context: .
    ports:
      - "3000:3000"
    environment:
      DATA_DIR: /data
      DB_PATH: /data/mynms.db
      PHOTO_DIR: /data/photos
      LOGO_DIR: /data/logos
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: sicheres_passwort
      JWT_SECRET: dein_jwt_secret_min_32_zeichen
      ANALYTICS_ENABLED: "true"
    volumes:
      - mynms-data:/data        # Alle persistenten Daten
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/ > /dev/null || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

volumes:
  mynms-data:
```

Das Volume `/data` enthält die SQLite-Datenbank sowie alle hochgeladenen Bilder. Es muss für Updates und Backups gesichert werden.

### Image lokal bauen

```bash
docker build -t mynms:latest .
```

---

## Datenbankstruktur

MyNMS verwendet eine einzige SQLite-Datei. Die Tabellen werden beim ersten Start automatisch angelegt (inkl. Migrations für neue Spalten).

| Tabelle | Beschreibung |
|---|---|
| `entries` | Fund- und Vermissteneinträge (Tiere & Gegenstände) mit Kategorie, Typ, Status, optionalem Foto und GPS-Koordinaten |
| `news_cache` | Gecachte Nachrichtenartikel aus den RSS-Feeds (max. 365 Tage Aufbewahrung) |
| `news_images` | Serverseitig heruntergeladene Vorschaubilder der Nachrichtenartikel |
| `directory` | Vorgestellt-Einträge (Orte, Vereine, Initiativen) mit Adresse, Social-Links, Öffnungszeiten und Genehmigungsstatus |
| `page_views` | Anonymisierte Seitenaufrufe für das eigene Analytics-System (max. 365 Tage Aufbewahrung) |
| `analytics_config` | Konfigurationswerte des Analytics-Systems (z. B. täglicher Salt für IP-Hashing) |

---

## Projektstruktur

```
mynms/
├── app/
│   ├── [locale]/           # Alle öffentlichen Seiten (DE/EN/TR)
│   │   ├── eintraege/      # Fundtiere & Fundsachen (Liste + Detailseite)
│   │   ├── nachrichten/    # Nachrichtenübersicht
│   │   ├── vorgestellt/    # Verzeichnis vorgestellter Orte
│   │   ├── neu/            # Neuen Eintrag erstellen
│   │   ├── datenschutz/    # Datenschutzerklärung
│   │   └── impressum/      # Impressum
│   ├── admin/              # Admin-Dashboard (Login, Verwaltung, Analytics)
│   └── api/                # API-Routen (Einträge, News, Analytics, Bilder)
├── components/             # Wiederverwendbare React-Komponenten
├── lib/                    # Datenbankzugriff, Typen, Hilfsfunktionen, News-Parser
├── messages/               # Übersetzungsdateien (de.json, en.json, tr.json)
├── public/                 # Statische Assets, PWA-Icons, Service Worker
├── i18n/                   # next-intl Routing- und Request-Konfiguration
└── proxy.ts                # Next.js Middleware (Authentifizierung, Analytics-Tracking)
```

---

## Admin-Dashboard

Das Admin-Dashboard ist unter **`/admin/login`** erreichbar. Die Zugangsdaten werden ausschließlich über Umgebungsvariablen (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) gesetzt – es gibt keine Registrierung.

Nach dem Login stehen folgende Bereiche zur Verfügung:

- **Fundtiere** – Einträge einsehen, bearbeiten, Status setzen (offen / erledigt) und löschen
- **Fundsachen** – analog zu Fundtieren
- **Vorgestellt** – eingereichte Vorschläge prüfen, freischalten, bearbeiten und löschen
- **Analytics** – Seitenaufrufe, Gerätetypen, Browser, Referrer und Zeitreihen einsehen; Analytics-Tracking aktivieren oder deaktivieren

Die Authentifizierung basiert auf JWTs, die mit dem `JWT_SECRET` signiert werden und als HttpOnly-Cookie gespeichert werden.

---

## RSS-Quellen

MyNMS aggregiert Nachrichten aus sechs lokalen Quellen:

| Kürzel | Quelle | Feed-URL |
|---|---|---|
| NDR | NDR Schleswig-Holstein (Neumünster) | `https://www.ndr.de/nachrichten/schleswig-holstein/Neumuenster-Aktuelle-Nachrichten-und-Videos,neumuenster770~rss2.html` |
| KN | Kieler Nachrichten (Neumünster) | `https://www.kn-online.de/arc/outboundfeeds/rss/category/lokales/neumuenster/` |
| SHZ | Schleswig-Holsteinische Zeitungsverlag | `https://www.shz.de/lokales/neumuenster/rss` |
| POLIZEI | Polizeidirektion Neumünster (Presseportal) | `https://www.presseportal.de/rss/dienststelle_47769.rss2` |
| FEUERWEHR | Feuerwehr Neumünster (Presseportal) | `https://www.presseportal.de/rss/dienststelle_178961.rss2` |
| STADT | Offizielle Meldungen der Stadt Neumünster | `https://www.neumuenster.de/aktuelle-meldungen/rss` |

Feeds werden serverseitig gecacht (TTL 15 Minuten). Vorschaubilder werden ebenfalls serverseitig heruntergeladen und über die eigene API ausgeliefert, sodass keine externen Bild-URLs an den Browser weitergegeben werden.

---

## Datenschutz & DSGVO

MyNMS ist von Grund auf datenschutzfreundlich konzipiert:

- **Kein Google Analytics, keine Drittanbieter-Tracker** – das Analytics-System ist vollständig selbst implementiert
- **IP-Anonymisierung** – IP-Adressen werden nie gespeichert; stattdessen wird ein täglicher, rotierender Salt verwendet, um einen nicht rückverfolgbaren Hash zu erzeugen
- **Datenlöschung** – Seitenaufrufe und News-Cache-Einträge werden nach 365 Tagen automatisch gelöscht
- **Two-Click-Einwilligung für OpenStreetMap** – Karten werden erst geladen, nachdem die Nutzerin oder der Nutzer aktiv zugestimmt hat (kein automatisches Laden externer Ressourcen)
- **Serverseitiges Bild-Caching** – Nachrichtenbilder werden über die eigene API ausgeliefert; externe Bild-Server erhalten keine direkten Anfragen vom Browser
- **Analytics deaktivierbar** – Über `ANALYTICS_ENABLED=false` kann das gesamte Tracking serverseitig abgeschaltet werden

---

## Lizenz

Dieses Projekt steht unter der **MIT-Lizenz** – siehe [LICENSE](LICENSE).

Copyright © 2026 Sandro Hildebrand

---

## Kontakt

- **E-Mail:** kontakt@mynms.de
- **Website:** https://mynms.de
