# Auftragsverarbeitung — API, Worker und React-Oberfläche

Eine kleine Auftragsverarbeitung aus drei einzeln startbaren Diensten. Eine
FastAPI-API nimmt Textaufträge samt gewünschter Auswertung an und legt sie in
einer gemeinsamen SQLite-Datei ab. Ein eigener Python-Worker-Prozess holt offene
Aufträge aus derselben Datei, wertet sie aus (Wörter zählen, häufigste Wörter,
Lesezeit schätzen) und schreibt Ergebnis und Status zurück. Eine
Vite/React/TypeScript-Oberfläche legt Aufträge an, zeigt die Liste mit Status und
Ergebnis und aktualisiert sich alle paar Sekunden selbst.

## Tech-Stack

- **Backend/Worker**: Python 3.11+, FastAPI + Uvicorn, Pydantic-Schemas,
  SQLite über das Standardmodul `sqlite3` im WAL-Modus.
- **Frontend**: Vite + React + TypeScript, schlichtes CSS ohne UI-Framework.
- **Tests**: pytest + httpx (Backend), Vitest + Testing Library (Frontend).
- **Start**: `RUN.json` deklariert die Startbefehle der Dienste.

## Installation

Die Backend-Abhängigkeiten stehen in `backend/pyproject.toml`. Im Verzeichnis
`backend/`:

```bash
cd backend
py -m pip install -e .
```

Das Frontend wird mit npm installiert (Verzeichnis `frontend/`):

```bash
cd frontend
npm ci
```

## Starten (Entwicklung)

Alle Dienste werden aus dem Repository-Wurzelverzeichnis gestartet.

### API

```bash
py -m uvicorn backend.app.main:app --port 8000
```

Die API ist dann unter `http://localhost:8000` erreichbar. Beim Start wird die
Tabelle `jobs` in der konfigurierten SQLite-Datei automatisch angelegt.

### Worker

```bash
py -m backend.app.worker
```

Der Worker läuft dauerhaft und verarbeitet offene Aufträge aus derselben
SQLite-Datei wie die API.

### Frontend

```bash
cd frontend
npm run dev
```

Das Frontend liest die API-Basis-URL aus `VITE_API_BASE_URL` (Standard:
`http://localhost:8000`) und holt die Auftragsliste regelmäßig neu.

## Build für die Produktion

```bash
cd frontend
npm run build
npm run preview
```

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
| --- | --- | --- |
| `JOB_DB_PATH` | `<repo-root>/data/jobs.db` | Pfad zur gemeinsamen SQLite-Datei von API und Worker. |
| `API_HOST` | `127.0.0.1` | Host, auf dem die API lauscht. |
| `API_PORT` | `8000` | Port der API. |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Erlaubte CORS-Herkunft des Frontends. |
| `VITE_API_BASE_URL` | `http://localhost:8000` | API-Basis-URL, die das Frontend verwendet. |

## API-Endpunkte

| Methode | Pfad | Body | Antwort |
| --- | --- | --- | --- |
| `GET` | `/health` | – | `200 {"status": "ok"}` |
| `POST` | `/api/jobs` | `{"text": "<string>", "analysis": "word_count" \| "top_words" \| "reading_time"}` | `201` mit dem angelegten Job; `400` bei leerem Text oder unbekannter Auswertung |
| `GET` | `/api/jobs` | – | `200` mit allen Jobs, neueste zuerst |
| `GET` | `/api/jobs/{job_id}` | – | `200` mit einem Job; `404`, wenn er nicht existiert |

Ein Job hat die Form
`{"id": 1, "text": "...", "analysis": "word_count", "status": "pending", "result": null, "error": null, "created_at": "..."}`.
Der Status durchläuft `pending` → `running` → `done` (oder `failed`).

Jede Nicht-2xx-Antwort hat den gemeinsamen Fehler-Body
`{"error": "<code>", "message": "<Text>"}` mit den Codes `invalid_request`,
`not_found` (und `server_error` für unerwartete Fehler).

## Fehler am laufenden System prüfen

```bash
py _office_run_check.py
```

Dieser Befehl liest `RUN.json`, startet die deklarierten Server mit ihrer
deklarierten Umgebung, prüft den Health-Pfad und beendet die Prozesse wieder.

## Tests

Backend:

```bash
cd backend
PYTHONPATH=. py -m pytest
```

Frontend:

```bash
cd frontend
npm test
```

## Funktionsumfang

- Aufträge anlegen mit Text und gewünschter Auswertung.
- Drei Auswertungen: `word_count`, `top_words`, `reading_time`.
- Hintergrundverarbeitung durch einen eigenen Worker-Prozess.
- Liste aller Aufträge mit Status und Ergebnis, neueste zuerst.
- Automatische Aktualisierung der Liste im Frontend.
- Sichtbare Fehlerzustände (abgelehnte Eingabe, nicht erreichbare API).
- Gemeinsame SQLite-Datei im WAL-Modus für API und Worker.
