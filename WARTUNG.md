# Wartungsanleitung – 1aWG.de

Stand: Mai 2026  
Für: Alexander Goerke

---

## Die wichtigste Aufgabe: Zimmer als vergeben markieren

Das ist die einzige Aufgabe, die Sie regelmäßig erledigen müssen.

**So geht's:**

1. Öffnen Sie Google Sheets (sheets.google.com)
2. Öffnen Sie das Tabellenblatt **„zimmer"**
3. Suchen Sie das Zimmer in der Liste
4. Ändern Sie in der Spalte **`status`** den Wert von `frei` auf `vergeben`
5. Speichern (passiert automatisch in Google Sheets)

**Das war's.** Die Website aktualisiert sich beim nächsten Seitenbesuch automatisch.

> **Wichtig:** Schreiben Sie `vergeben` immer klein und ohne Leerzeichen.  
> `Frei` → `frei`, `Vergeben` → `vergeben` – alles kleingeschrieben!

---

## Zimmer wieder als frei markieren

Genauso wie oben – nur andersherum:

1. Google Sheets öffnen → Tabellenblatt „zimmer"
2. `vergeben` zurück auf `frei` ändern

Das Zimmer erscheint sofort wieder auf der Website.

---

## Neues Zimmer hinzufügen

1. Google Sheets → Tabellenblatt **„zimmer"**
2. Eine neue Zeile am Ende einfügen
3. Alle Spalten ausfüllen:

| Spalte | Was eintragen | Beispiel |
|---|---|---|
| `wg_name` | WG-Kürzel (klein, kein Leerzeichen) | `sunshine-wg` |
| `zimmer_nr` | Nummer oder Name | `Zimmer 3` |
| `groesse` | Größe mit m² | `14 m²` |
| `preis` | Preis als Zahl | `480 €` |
| `status` | `frei` oder `vergeben` | `frei` |
| `beschreibung` | Kurze Beschreibung | `Helles Zimmer im 2. OG` |
| `ausstattung` | Kommagetrennt | `Bett,Schrank,Schreibtisch,W-Lan` |
| `bild_urls` | Bild-URLs kommagetrennt | `https://...` |
| `video_url` | YouTube-Link (optional) | leer lassen |

**WG-Kürzel (wg_name) – bitte exakt so schreiben:**

| Seite | wg_name |
|---|---|
| Sunshine-WG | `sunshine-wg` |
| WSS-WG | `wss-wg` |
| Kappel-WG (Untertürkheim) | `kappel-wg` |
| Gnesener-WG (Bad Cannstatt) | `gnesener-wg` |
| Apartments Fellbach | `apartments-fellbach` |
| Garagen Schwäbisch Gmünd | `garagen-gmuend` |

---

## Fotos hochladen und verlinken

### Option A: Google Drive (einfachste Methode)

1. Foto in Google Drive hochladen
2. Rechtsklick auf das Foto → **„Freigeben"**
3. Auf **„Eingeschränkt"** klicken → **„Jeder mit dem Link"** wählen
4. Den Link kopieren: `https://drive.google.com/file/d/DATEI_ID/view`
5. Die DATEI_ID aus dem Link kopieren (der lange Buchstaben-Zahlen-Code)
6. Direkten Bildlink zusammenbauen: `https://drive.google.com/uc?id=DATEI_ID`
7. Diesen Direktlink in die Spalte `bild_urls` im Sheet eintragen

**Beispiel:**
- Drive-Link: `https://drive.google.com/file/d/1AbCdEfGhIjK/view`
- Direktlink: `https://drive.google.com/uc?id=1AbCdEfGhIjK`

Mehrere Fotos pro Zimmer: Links durch Komma trennen (kein Leerzeichen davor/dahinter):
```
https://drive.google.com/uc?id=ID1,https://drive.google.com/uc?id=ID2
```

### Option B: Fotos ins GitHub-Repo hochladen

1. github.com öffnen → Repository `andi-1302/meine-website` → Ordner `bilder/`
2. Unterordner anlegen: `bilder/sunshine-wg/` oder `bilder/sunshine-wg/zimmer1/`
3. **„Add file" → „Upload files"** → Foto hochladen
4. URL des Fotos: `https://andi-1302.github.io/meine-website/bilder/sunshine-wg/foto1.jpg`
5. Diese URL in die Spalte `bild_urls` eintragen

---

## WG-Beschreibung oder Lage ändern

1. Google Sheets → Tabellenblatt **„wg_info"**
2. Die Zeile der entsprechenden WG finden
3. Den gewünschten Text in der entsprechenden Spalte ändern

Spalten im wg_info-Sheet:
- `beschreibung_allgemein` – allgemeiner Beschreibungstext
- `lage` – Lagebeschreibung / Anbindung
- `kueche` – Küchenausstattung
- `bad` – Bad-Beschreibung
- `besonderheiten` – Besonderheiten (Terrasse, Balkon, etc.)

---

## Kontaktdaten ändern (Telefon, E-Mail, Name)

Öffnen Sie die Datei `data.js` im Repository und ändern Sie die entsprechenden Werte:

```javascript
kontakt: {
  name:    "Alexander Goerke",
  strasse: "Hangstr. 14",
  plz:     "70327",
  ort:     "Stuttgart",
  telefon: "0179-8755863",   // ← hier ändern
  mobil:   "0179-8755863",
  email:   "Alex.Goerke@gmx.de"  // ← hier ändern
}
```

Danach `data.js` ins GitHub hochladen (über die alte Datei drüberziehen).

---

## Dateien auf GitHub hochladen (Änderungen veröffentlichen)

Wenn Sie eine Datei lokal geändert haben:

1. github.com → Repository `andi-1302/meine-website`
2. Die entsprechende Datei öffnen (z.B. `kontakt.html`)
3. Auf den **Bleistift-Icon** (✏️) oben rechts klicken
4. Änderungen direkt im Browser bearbeiten
5. Unten auf **„Commit changes"** klicken

Oder: **„Add file" → „Upload files"** → neue Version hochladen (überschreibt die alte).

---

## Etwas funktioniert nicht – was tun?

**Die Zimmer werden nicht angezeigt:**
- Prüfen Sie ob das Google Sheet öffentlich geteilt ist (Teilen → Jeder mit dem Link)
- Prüfen Sie ob `status` exakt `frei` steht (kleingeschrieben)
- Prüfen Sie ob `wg_name` exakt stimmt (z.B. `sunshine-wg`)
- Warten Sie 5 Minuten und laden Sie die Seite neu (Cache)

**Die Bilder werden nicht angezeigt:**
- Prüfen Sie ob die Google Drive Datei öffentlich freigegeben ist
- Verwenden Sie den `uc?id=` Link, nicht den normalen Drive-Link

**Das Kontaktformular funktioniert nicht:**
- Prüfen Sie ob die Formspree Form-ID korrekt in `kontakt.html` eingetragen ist
- Prüfen Sie ob Sie die Bestätigungs-E-Mail von Formspree bestätigt haben

**Die Seite lädt gar nicht:**
- Prüfen Sie ob GitHub Pages in den Repository-Settings aktiviert ist
- Warten Sie 2-5 Minuten nach dem Hochladen von Dateien

**Technische Hilfe benötigt:**
Kontaktieren Sie den Webentwickler oder schreiben Sie eine E-Mail an hagen.ehrmann05@gmail.com

---

## Wichtige Links

| Was | Link |
|---|---|
| Google Sheets (Zimmerdaten) | sheets.google.com → „1aWG Zimmer" |
| GitHub Repository | github.com/andi-1302/meine-website |
| Live-Website | https://andi-1302.github.io/meine-website/ |
| Später: eigene Domain | https://www.1awg.de/ |
| Formspree Dashboard | formspree.io |
