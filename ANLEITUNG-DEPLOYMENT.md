# Deployment-Anleitung: 1aWG.de auf GitHub Pages

Stand: Mai 2026

---

## Schritt 1 – GitHub-Repository vorbereiten

1. Gehen Sie zu **github.com** und melden Sie sich mit dem Account `andi-1302` an.
2. Öffnen Sie das Repository **`andi-1302/meine-website`**.
3. Falls das Repository noch nicht existiert: Klicken Sie auf „New Repository", nennen Sie es `meine-website`, wählen Sie „Public" und bestätigen.

---

## Schritt 2 – Diese Dateien hochladen

Laden Sie **alle folgenden Dateien** aus dem Ordner `Webseiten\1awg\` in das Repository hoch.

### Pflichtdateien (alle notwendig):

| Datei | Beschreibung |
|---|---|
| `index.html` | Startseite |
| `kontakt.html` | Kontaktseite mit Formular |
| `datenschutz.html` | Datenschutzerklärung |
| `wg-fellbach.html` | Übersichtsseite Fellbach |
| `sunshine-wg.html` | Sunshine-WG Detailseite |
| `wss-wg.html` | WSS-WG Detailseite |
| `wg-untertuerkheim.html` | Kappel-WG Detailseite |
| `gnesener-wg.html` | Gnesener-WG Detailseite |
| `apartments-fellbach.html` | Apartments Detailseite |
| `garagen-gmuend.html` | Garagen Detailseite |
| `style.css` | Stylesheet (Design) |
| `data.js` | Basisdaten (Name, Kontakt, Slider) |
| `main.js` | Hauptlogik |
| `sheets.js` | Google Sheets Integration |
| `.nojekyll` | Wichtig! Verhindert Jekyll-Fehler |
| `CNAME` | Enthält `www.1awg.de` für eigene Domain |

### NICHT hochladen:
- ❌ `admin.html` — Diese Datei bitte weglassen (Adminpanel entfernt)
- ❌ `ANLEITUNG-DEPLOYMENT.md` — Diese Datei (nur für Sie)

---

## Schritt 3 – Bilder-Ordner anlegen und Fotos hochladen

Die Website erwartet Bilder im Ordner `bilder/`.

### So legen Sie den Ordner in GitHub an:
1. Klicken Sie im Repository auf **„Add file" → „Create new file"**
2. Tippen Sie als Dateiname: `bilder/.gitkeep`
3. Klicken Sie auf „Commit new file"

Der Ordner `bilder/` existiert jetzt.

### Fotos hochladen:
1. Klicken Sie auf den Ordner `bilder/`
2. Klicken Sie auf **„Add file" → „Upload files"**
3. Ziehen Sie Ihre Fotos per Drag & Drop hinein
4. Klicken Sie auf „Commit changes"

### Welche Bilder werden benötigt:

| Dateiname | Verwendung |
|---|---|
| `bilder/slide1.jpg` | Hero-Slider Bild 1 (Startseite) |
| `bilder/slide2.jpg` | Hero-Slider Bild 2 |
| `bilder/slide3.jpg` | Hero-Slider Bild 3 |
| `bilder/slide4.jpg` | Hero-Slider Bild 4 |

Zimmerfoto-URLs kommen direkt aus Google Sheets (Spalte `bild_urls`), müssen also nicht lokal gespeichert werden. Empfehlung: Fotos bei Google Drive hochladen und direkte Bild-Links verwenden (siehe Schritt 5).

---

## Schritt 4 – GitHub Pages aktivieren

1. Im Repository oben auf **„Settings"** klicken
2. Links im Menü auf **„Pages"** klicken
3. Unter „Source": Branch `main`, Ordner `/ (root)` wählen
4. Auf **„Save"** klicken
5. Nach ca. 2 Minuten ist die Seite erreichbar unter:
   `https://andi-1302.github.io/meine-website/`

---

## Schritt 5 – Google Sheets für Zimmerdaten einrichten

Die Zimmer werden live aus einem Google Sheets geladen.

### Sheet-ID eintragen:
In der Datei `sheets.js` (Zeile 1) steht bereits eine Sheet-ID:
```javascript
const SHEET_ID = '1te-4NxFomA1QhfOgjIDrbbZNOq7ZP3YB';
```
Ersetzen Sie diesen Wert durch die ID Ihres eigenen Google Sheets (die lange Zeichenkette aus der URL Ihres Sheets).

### Sheet öffentlich machen:
1. Öffnen Sie Ihr Google Sheets
2. Klicken Sie oben rechts auf **„Teilen"**
3. Ändern Sie die Freigabe auf: **„Jeder mit dem Link kann anzeigen"**
4. Klicken Sie auf „Fertig"

### Spaltenüberschriften (erste Zeile im Sheet):
Die erste Zeile muss **exakt** diese Spaltenbezeichnungen enthalten:

| Spalte | Inhalt |
|---|---|
| `wg_name` | Interner Name der WG (klein, keine Umlaute) |
| `zimmer_nr` | Zimmernummer oder Bezeichnung |
| `groesse` | Größe des Zimmers |
| `preis` | Mietpreis pro Monat |
| `status` | `frei` oder `vergeben` |
| `beschreibung` | Kurzbeschreibung des Zimmers |
| `ausstattung` | Ausstattung (kommagetrennt) |
| `bild_urls` | Bild-URLs (kommagetrennt, direkte Bildlinks) |
| `video_url` | YouTube-Link (optional, kann leer bleiben) |

### Welche `wg_name`-Werte werden verwendet:

| Seite | wg_name im Sheet |
|---|---|
| Sunshine-WG (sunshine-wg.html) | `sunshine-wg` |
| WSS-WG (wss-wg.html) | `wss-wg` |
| Kappel-WG (wg-untertuerkheim.html) | `kappel-wg` |
| Gnesener-WG (gnesener-wg.html) | `gnesener-wg` |

### Beispielzeilen:

```
wg_name      | zimmer_nr | groesse | preis  | status   | beschreibung                        | ausstattung                           | bild_urls                             | video_url
sunshine-wg  | Zimmer 1  | 14 m²   | 480 €  | frei     | Helles Zimmer im 2. OG mit Balkon.  | Bett,Schrank,Schreibtisch,W-Lan       | https://drive.google.com/...bild1.jpg |
sunshine-wg  | Zimmer 2  | 16 m²   | 520 €  | vergeben | Ruhiges Zimmer zur Hofseite.        | Bett,Schreibtisch,W-Lan               | https://drive.google.com/...bild2.jpg | https://youtu.be/abc123
wss-wg       | Zimmer 1  | 18 m²   | 550 €  | frei     | Großes Zimmer mit eigenem Eingang.  | Bett,Schrank,Tisch,Stuhl,W-Lan       | https://drive.google.com/...bild3.jpg |
```

**Wichtig:** Nur Zimmer mit `status = frei` werden auf der Website angezeigt. Vergeben bedeutet nicht sichtbar.

### Bilder-URLs aus Google Drive:
1. Bild in Google Drive hochladen
2. Rechtsklick → „Freigeben" → „Jeder mit dem Link"
3. Link kopieren: `https://drive.google.com/file/d/DATEI_ID/view`
4. Umwandeln in direkten Bildlink: `https://drive.google.com/uc?id=DATEI_ID`

Beispiel:
- Drive-Link: `https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUv/view`
- Direkter Bildlink: `https://drive.google.com/uc?id=1AbCdEfGhIjKlMnOpQrStUv`

Mehrere Bilder pro Zimmer kommagetrennt in eine Zelle eintragen:
```
https://drive.google.com/uc?id=ID1,https://drive.google.com/uc?id=ID2
```

---

## Schritt 6 – Formspree Kontaktformular einrichten

Das Kontaktformular in `kontakt.html` sendet E-Mails über Formspree.

### Einrichtung:
1. Gehen Sie auf **formspree.io** und erstellen Sie einen kostenlosen Account
2. Klicken Sie auf **„New Form"**
3. Geben Sie Ihre E-Mail-Adresse `Alex.Goerke@gmx.de` ein
4. Bestätigen Sie die E-Mail (Formspree sendet eine Bestätigungs-E-Mail)
5. Kopieren Sie die **Form-ID** (sieht aus wie: `xvgojpkz`)

### Form-ID eintragen:
Öffnen Sie `kontakt.html` und suchen Sie diese Zeile (ca. Zeile 134):
```html
<form action="https://formspree.io/f/DEINE_FORMULAR_ID" method="POST" id="contactForm">
```
Ersetzen Sie `DEINE_FORMULAR_ID` durch Ihre echte Form-ID:
```html
<form action="https://formspree.io/f/xvgojpkz" method="POST" id="contactForm">
```
Dann die geänderte Datei wieder ins GitHub-Repository hochladen.

---

## Schritt 7 – Eigene Domain www.1awg.de einrichten (optional)

Die Datei `CNAME` im Repository enthält bereits `www.1awg.de`.

### Beim Domain-Anbieter:
Legen Sie einen **CNAME-Eintrag** an:
- Name/Host: `www`
- Ziel/Value: `andi-1302.github.io`

Und für die Apex-Domain (1awg.de ohne www) vier **A-Einträge**:
- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

DNS-Änderungen können bis zu 48 Stunden dauern.

---

## Zusammenfassung – Was wann zu tun ist

```
[ ] 1. GitHub-Repo öffnen / anlegen
[ ] 2. Alle HTML/CSS/JS-Dateien hochladen (ohne admin.html)
[ ] 3. .nojekyll und CNAME hochladen
[ ] 4. bilder/-Ordner anlegen, Slider-Bilder hochladen
[ ] 5. GitHub Pages in Settings aktivieren
[ ] 6. Google Sheets anlegen, Spalten einrichten, Sheet-ID in sheets.js eintragen
[ ] 7. Formspree-Account anlegen, Form-ID in kontakt.html eintragen
[ ] 8. Seite testen: andi-1302.github.io/meine-website/
[ ] 9. (Optional) Domain www.1awg.de beim Anbieter einrichten
```

---

## Häufige Fragen

**Zimmer erscheinen nicht auf der Website?**
→ Prüfen Sie ob `status` exakt `frei` geschrieben ist (kleingeschrieben)
→ Prüfen Sie ob `wg_name` exakt übereinstimmt (z.B. `sunshine-wg`)
→ Prüfen Sie ob das Sheet öffentlich geteilt ist

**Fotos werden nicht angezeigt?**
→ Stellen Sie sicher, dass die Google Drive Datei öffentlich freigegeben ist
→ Verwenden Sie den `uc?id=` Link, nicht den normalen Drive-Link

**Kontaktformular funktioniert nicht?**
→ Kontrollieren Sie ob die Formspree Form-ID korrekt eingetragen wurde
→ Prüfen Sie ob die Bestätigungs-E-Mail von Formspree angekommen ist und bestätigt wurde
