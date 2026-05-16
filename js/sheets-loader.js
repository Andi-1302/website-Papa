// js/sheets-loader.js
// =====================================================================
// Lädt Zimmer- und WG-Daten live aus Google Sheets.
// Kein API-Key erforderlich – nutzt den öffentlichen CSV-Export.
//
// VERWENDUNG auf einer HTML-Seite:
//   <script src="js/sheets-loader.js"></script>
//   <script>
//     ladeWGZimmer('sunshine-wg', 'zimmerContainer', 'full');
//     ladeWGInfo('sunshine-wg', 'wgInfoContainer');
//     zeigeFreeZimmerZaehler('zimmerZaehler'); // nur Startseite
//   </script>
//
// WG-Namen (wg_name im Sheet → Seite):
//   sunshine-wg        → sunshine-wg.html
//   wss-wg             → wss-wg.html
//   kappel-wg          → wg-untertuerkheim.html
//   gnesener-wg        → gnesener-wg.html
//   apartments-fellbach → apartments-fellbach.html
//   garagen-gmuend     → garagen-gmuend.html
// =====================================================================

// =====================================================================
// KONFIGURATION
// Nur diese Zeile muss angepasst werden, wenn das Sheet wechselt.
// =====================================================================
var SHEET_ID   = '1mV55PDMTyF4pp367H0pREY0yXPj3U4jVZ1U0HJRRrY0';
var CSV_ZIMMER  = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=zimmer';
var CSV_WG_INFO = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=wg_info';

// =====================================================================
// CSV-PARSER
// Liest den CSV-Text aus Google Sheets und wandelt ihn in ein
// JavaScript-Array von Objekten um.
// Unterstützt: Kommas in Anführungszeichen, doppelte Anführungszeichen,
// Zeilenumbrüche CRLF und LF, Umlaute (UTF-8).
// =====================================================================

/**
 * Zerlegt eine einzelne CSV-Zeile in ein Array von Feldern.
 * Berücksichtigt Anführungszeichen korrekt (RFC 4180).
 */
function _parseCSVZeile(zeile) {
  var felder = [];
  var aktuell = '';
  var inAnfuehrung = false;

  for (var i = 0; i < zeile.length; i++) {
    var z = zeile[i];

    if (z === '"') {
      if (inAnfuehrung && zeile[i + 1] === '"') {
        // Zwei Anführungszeichen hintereinander = ein echtes " im Text
        aktuell += '"';
        i++;
      } else {
        inAnfuehrung = !inAnfuehrung;
      }
    } else if (z === ',' && !inAnfuehrung) {
      felder.push(aktuell);
      aktuell = '';
    } else {
      aktuell += z;
    }
  }
  felder.push(aktuell); // letztes Feld
  return felder;
}

/**
 * Wandelt einen vollständigen CSV-Text in ein Array von Objekten um.
 * Erste Zeile = Spaltenüberschriften, alle weiteren = Datenzeilen.
 */
function _parseCSV(text) {
  // Windows-Zeilenenden normalisieren
  var zeilen = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (zeilen.length < 2) return [];

  var kopfzeile = _parseCSVZeile(zeilen[0]);
  var ergebnis = [];

  for (var i = 1; i < zeilen.length; i++) {
    if (!zeilen[i].trim()) continue; // Leerzeilen überspringen
    var werte = _parseCSVZeile(zeilen[i]);
    var obj = {};
    kopfzeile.forEach(function (spalte, idx) {
      obj[spalte.trim()] = (werte[idx] || '').trim();
    });
    // Zeile nur übernehmen wenn mindestens ein Wert vorhanden ist
    if (Object.keys(obj).some(function (k) { return obj[k] !== ''; })) {
      ergebnis.push(obj);
    }
  }
  return ergebnis;
}

// =====================================================================
// CACHE (sessionStorage)
// Speichert geladene Daten für 5 Minuten im Sitzungsspeicher.
// So wird das Sheet bei mehreren Seitenwechseln nicht immer neu geladen.
// =====================================================================
var CACHE_DAUER_MS = 5 * 60 * 1000; // 5 Minuten

function _ausCache(schluessel) {
  try {
    var json = sessionStorage.getItem('sl_' + schluessel);
    if (!json) return null;
    var eintrag = JSON.parse(json);
    // Abgelaufene Einträge entfernen
    if (Date.now() - eintrag.ts > CACHE_DAUER_MS) {
      sessionStorage.removeItem('sl_' + schluessel);
      return null;
    }
    return eintrag.daten;
  } catch (e) {
    return null; // sessionStorage nicht verfügbar (z.B. privater Modus)
  }
}

function _inCache(schluessel, daten) {
  try {
    sessionStorage.setItem('sl_' + schluessel, JSON.stringify({ ts: Date.now(), daten: daten }));
  } catch (e) {
    // Cache ist optional – kein Fehler wenn nicht verfügbar
  }
}

// =====================================================================
// DATEN LADEN
// =====================================================================

async function _ladeCSV(url) {
  // Zeitstempel-Parameter verhindert Browser-Cache (wichtig für aktuelle Sheet-Daten)
  var res = await fetch(url + '&_t=' + Date.now());
  if (!res.ok) throw new Error('Netzwerkfehler ' + res.status);
  return res.text();
}

async function _ladeZimmerDaten() {
  var cache = _ausCache('zimmer');
  if (cache) return cache;
  var text = await _ladeCSV(CSV_ZIMMER);
  var daten = _parseCSV(text);
  _inCache('zimmer', daten);
  return daten;
}

async function _ladeWGInfoDaten() {
  var cache = _ausCache('wg_info');
  if (cache) return cache;
  var text = await _ladeCSV(CSV_WG_INFO);
  var daten = _parseCSV(text);
  _inCache('wg_info', daten);
  return daten;
}

// =====================================================================
// ÖFFENTLICHE DATENFUNKTIONEN
// Können direkt aus HTML-Seiten aufgerufen werden.
// =====================================================================

/**
 * Gibt alle freien Zimmer einer WG zurück.
 * Nur Zeilen mit status="frei" werden zurückgegeben.
 *
 * Beispiel: var zimmer = await getZimmerForWg('sunshine-wg');
 *
 * @param  {string} wgName – Wert aus Spalte "wg_name" im Sheet
 * @return {Promise<Array>} – Array mit Zimmer-Objekten
 */
async function getZimmerForWg(wgName) {
  var zeilen = await _ladeZimmerDaten();
  return zeilen.filter(function (z) {
    return z.wg_name === wgName && z.status === 'frei';
  });
}

/**
 * Gibt die allgemeinen Infos einer WG zurück (aus dem wg_info-Sheet).
 *
 * @param  {string} wgName – Wert aus Spalte "wg_name"
 * @return {Promise<Object|null>} – Objekt mit WG-Infos oder null
 */
async function getWgInfo(wgName) {
  var zeilen = await _ladeWGInfoDaten();
  return zeilen.find(function (z) { return z.wg_name === wgName; }) || null;
}

/**
 * Zählt alle aktuell freien Zimmer über alle WGs zusammen.
 * Für den Live-Zähler auf der Startseite.
 *
 * @return {Promise<number>}
 */
async function countAlleFreienZimmer() {
  var zeilen = await _ladeZimmerDaten();
  return zeilen.filter(function (z) { return z.status === 'frei'; }).length;
}

// =====================================================================
// HILFSFUNKTIONEN FÜR DIE HTML-AUSGABE
// =====================================================================

/** Schützt Texte vor XSS-Angriffen (HTML-Sonderzeichen escapen) */
function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Bild-URLs aus einem kommagetrenuten String in ein Array umwandeln */
function _parseBilder(bild_urls) {
  if (!bild_urls || !bild_urls.trim()) return [];
  return bild_urls.split(',')
    .map(function (u) { return u.trim(); })
    .filter(function (u) { return u.length > 0; });
}

/**
 * Bild-Galerie für ein Zimmer rendern.
 * Erstes Bild wird groß angezeigt (klickbar → öffnet GLightbox-Galerie).
 * Alle weiteren Bilder sind als versteckte Links für die Lightbox-Navigation.
 * Keyboard-Navigation (← →) und Touch-Gesten werden von GLightbox übernommen.
 */
function _renderGalerie(bilder, zimmerNr) {
  if (bilder.length === 0) {
    return '<div class="zimmer-foto-platzhalter" aria-hidden="true">' +
      '<i class="bi bi-image"></i><span>Foto folgt</span></div>';
  }

  var galerieId = 'gal-' + _esc(String(zimmerNr).replace(/[\s/\\]/g, '-'));

  // Hauptbild – groß, klickbar, öffnet Galerie
  var hauptbild =
    '<a href="' + _esc(bilder[0]) + '" ' +
    'class="glightbox zimmer-hauptfoto" ' +
    'data-gallery="' + galerieId + '" ' +
    'aria-label="Zimmer ' + _esc(zimmerNr) + ' – Foto vergrößern">' +
    '<img src="' + _esc(bilder[0]) + '" ' +
    'alt="Zimmer ' + _esc(zimmerNr) + '" loading="lazy">' +
    '<div class="zimmer-foto-overlay" aria-hidden="true">' +
    '<i class="bi bi-zoom-in"></i>' +
    (bilder.length > 1
      ? '<span>' + bilder.length + ' Foto' + (bilder.length > 1 ? 's' : '') + '</span>'
      : '') +
    '</div></a>';

  // Weitere Bilder – unsichtbar im DOM, nur für die Lightbox-Navigation
  var weitereLinks = bilder.slice(1).map(function (url, idx) {
    return '<a href="' + _esc(url) + '" class="glightbox" ' +
      'data-gallery="' + galerieId + '" ' +
      'aria-label="Foto ' + (idx + 2) + ' – Zimmer ' + _esc(zimmerNr) + '" ' +
      'style="display:none" tabindex="-1"></a>';
  }).join('');

  return '<div class="zimmer-galerie-wrap">' + hauptbild + weitereLinks + '</div>';
}

/** YouTube-Video datenschutzfreundlich einbetten (youtube-nocookie.com) */
function _renderVideo(video_url) {
  if (!video_url || !video_url.trim()) return '';
  var match = video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?#]+)/);
  if (!match) return '';
  return '<div class="video-embed mt-3">' +
    '<iframe src="https://www.youtube-nocookie.com/embed/' + _esc(match[1]) + '" ' +
    'allowfullscreen loading="lazy" title="Zimmervideo" ' +
    'referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
}

/** Ausstattungs-Tags aus kommagetrentem String als Badge-Reihe rendern */
function _renderAusstattung(ausstattung) {
  if (!ausstattung || !ausstattung.trim()) return '';
  var eintraege = ausstattung.split(',')
    .map(function (a) { return a.trim(); })
    .filter(Boolean);
  if (!eintraege.length) return '';
  return '<div class="zimmer-ausstattung">' +
    eintraege.map(function (a) {
      return '<span class="ausstattung-tag">' +
        '<i class="bi bi-check2" aria-hidden="true"></i>' + _esc(a) + '</span>';
    }).join('') +
    '</div>';
}

// =====================================================================
// ZIMMER-KARTEN
// =====================================================================

/**
 * Ausführliche Zimmerkarte – für kleine WGs (Sunshine, WSS, Kappel, Apartments).
 * Zeigt: Titel, Größe, Beschreibung, Preis, Ausstattung, Foto-Galerie, Video.
 */
function _zimmerKarteFull(zimmer, index, wgName) {
  var bilder  = _parseBilder(zimmer.bild_urls);
  var anfrage = 'kontakt.html?wg=' + encodeURIComponent(wgName) +
                '&zimmer=' + encodeURIComponent(zimmer.zimmer_nr);

  return '<article class="room-card fade-up delay-' + (index % 4) + '" ' +
    'aria-label="Zimmer ' + _esc(zimmer.zimmer_nr) + '">' +

    '<div class="room-card-header">' +
    '<h3 class="room-card-titel">' +
    '<i class="bi bi-door-open me-2" aria-hidden="true"></i>' +
    'Zimmer ' + _esc(zimmer.zimmer_nr) +
    (zimmer.groesse
      ? ' <small class="room-card-groesse">– ca. ' + _esc(zimmer.groesse) + '</small>'
      : '') +
    '</h3>' +
    '<span class="badge-status badge-frei" role="status">Frei</span>' +
    '<a href="' + anfrage + '" class="zimmer-anfrage-icon ms-2" ' +
    'title="Zimmer ' + _esc(zimmer.zimmer_nr) + ' anfragen" ' +
    'aria-label="Zimmer ' + _esc(zimmer.zimmer_nr) + ' anfragen">' +
    '<i class="bi bi-envelope-fill" aria-hidden="true"></i></a>' +
    '</div>' +

    '<div class="room-card-body"><div class="row g-4">' +

    '<div class="col-md-6">' +
    (zimmer.beschreibung ? '<p>' + _esc(zimmer.beschreibung) + '</p>' : '') +
    (zimmer.preis
      ? '<p class="zimmer-preis">' +
        '<i class="bi bi-currency-euro me-1" aria-hidden="true"></i>' +
        _esc(zimmer.preis) + '&thinsp;€ warm / Monat</p>'
      : '') +
    _renderAusstattung(zimmer.ausstattung) +
    '</div>' +

    // Rechte Spalte: Foto-Galerie + Video
    '<div class="col-md-6">' +
    _renderGalerie(bilder, zimmer.zimmer_nr) +
    _renderVideo(zimmer.video_url) +
    '</div>' +

    '</div></div></article>';
}

/**
 * Kompakte Zimmerkarte – für Gnesener-WG und Garagen (viele Einträge).
 * 3-spaltiges Raster. Foto oben, Kurztext + Preis unten.
 */
function _zimmerKarteGrid(zimmer, index, wgName) {
  var bilder  = _parseBilder(zimmer.bild_urls);
  var preis   = zimmer.preis ? _esc(zimmer.preis) + ' warm' : 'Auf Anfrage';
  var anfrage = 'kontakt.html?wg=' + encodeURIComponent(wgName) +
                '&zimmer=' + encodeURIComponent(zimmer.zimmer_nr);
  var galerieId = 'gal-' + _esc(String(zimmer.zimmer_nr).replace(/[\s/\\]/g, '-'));

  var bildHtml;
  if (bilder.length > 0) {
    bildHtml =
      '<a href="' + _esc(bilder[0]) + '" ' +
      'class="glightbox zimmer-grid-foto" ' +
      'data-gallery="' + galerieId + '" ' +
      'aria-label="Zimmer ' + _esc(zimmer.zimmer_nr) + '">' +
      '<img src="' + _esc(bilder[0]) + '" ' +
      'alt="Zimmer ' + _esc(zimmer.zimmer_nr) + '" loading="lazy">' +
      '</a>' +
      bilder.slice(1).map(function (url) {
        return '<a href="' + _esc(url) + '" class="glightbox" ' +
          'data-gallery="' + galerieId + '" style="display:none" tabindex="-1"></a>';
      }).join('');
  } else {
    bildHtml = '<div class="zimmer-grid-foto zimmer-grid-platzhalter" aria-hidden="true">' +
      '<i class="bi bi-image"></i></div>';
  }

  return '<div class="col-sm-6 col-md-4 fade-up delay-' + (index % 4) + '">' +
    '<article class="room-card room-card-kompakt" ' +
    'aria-label="Zimmer ' + _esc(zimmer.zimmer_nr) + '">' +
    '<div class="room-card-header">' +
    '<h4 class="room-card-titel-klein">' +
    '<i class="bi bi-door-open me-1" aria-hidden="true"></i>' +
    'Zimmer ' + _esc(zimmer.zimmer_nr) +
    (zimmer.groesse ? ' · ' + _esc(zimmer.groesse) : '') +
    '</h4>' +
    '<span class="badge-status badge-frei" role="status">Frei</span>' +
    '</div>' +
    '<div class="room-card-body room-card-body-kompakt">' +
    bildHtml +
    '<p class="zimmer-kurzbeschreibung">' +
    (zimmer.beschreibung
      ? _esc(zimmer.beschreibung)
      : '<em class="text-muted">Beschreibung folgt</em>') +
    '</p>' +
    '<div class="zimmer-grid-fusszeile">' +
    '<span class="zimmer-preis-klein">' + preis + '</span>' +
    '<a href="' + anfrage + '" class="zimmer-anfrage-icon" ' +
    'title="Zimmer ' + _esc(zimmer.zimmer_nr) + ' anfragen" ' +
    'aria-label="Zimmer ' + _esc(zimmer.zimmer_nr) + ' anfragen">' +
    '<i class="bi bi-envelope-fill" aria-hidden="true"></i></a>' +
    '</div></div></article></div>';
}

// =====================================================================
// STATUS-ANZEIGEN
// =====================================================================

function _zeigeLaden(container) {
  container.innerHTML =
    '<div class="ladeanimation" aria-live="polite" aria-label="Zimmerdaten werden geladen">' +
    '<div class="lade-kreis" role="progressbar"></div>' +
    '<p>Zimmerdaten werden geladen …</p>' +
    '</div>';
}

function _zeigeFehler(container) {
  container.innerHTML =
    '<div class="ladehinweis ladehinweis-fehler" role="alert">' +
    '<i class="bi bi-wifi-off me-2" aria-hidden="true"></i>' +
    'Zimmerdaten konnten nicht geladen werden. ' +
    'Bitte rufen Sie uns an: ' +
    '<a href="tel:01798755863">0179-8755863</a> oder ' +
    '<a href="kontakt.html">schreiben Sie uns</a>.' +
    '</div>';
}

// =====================================================================
// ÖFFENTLICHE RENDERING-FUNKTIONEN
// =====================================================================

/**
 * Zimmerdaten laden und im Container anzeigen.
 *
 * @param {string} wgName      – WG-Name (z.B. "sunshine-wg")
 * @param {string} containerId – ID des HTML-Elements
 * @param {string} layout      – "full" (groß) | "grid" (kompakt, für viele Zimmer)
 */
async function ladeWGZimmer(wgName, containerId, layout) {
  layout = layout || 'full';
  var container = document.getElementById(containerId);
  if (!container) return;

  _zeigeLaden(container);

  var zimmer;
  try {
    zimmer = await getZimmerForWg(wgName);
  } catch (fehler) {
    console.error('[sheets-loader] Fehler beim Laden der Zimmer:', fehler);
    _zeigeFehler(container);
    return;
  }

  // Keine freien Zimmer → Wartelisten-Hinweis
  if (zimmer.length === 0) {
    container.innerHTML =
      '<div class="keine-zimmer-box text-center">' +
      '<i class="bi bi-house-check" aria-hidden="true"></i>' +
      '<h4>Aktuell sind alle Zimmer vermietet</h4>' +
      '<p>Schreiben Sie uns gerne – es werden laufend Zimmer frei.<br>' +
      'Wir tragen Sie auf unsere <strong>Warteliste</strong> ein.</p>' +
      '<a href="kontakt.html?wg=' + encodeURIComponent(wgName) + '&warteliste=1" ' +
      'class="btn-accent btn">' +
      '<i class="bi bi-envelope me-2" aria-hidden="true"></i>Auf Warteliste eintragen</a>' +
      '</div>';
    return;
  }

  // Zimmer-Karten aufbauen
  var html;
  if (layout === 'grid') {
    html =
      '<div class="row g-3">' +
      zimmer.map(function (z, i) { return _zimmerKarteGrid(z, i, wgName); }).join('') +
      '</div>' +
      '<div class="text-center mt-5">' +
      '<a href="kontakt.html?wg=' + encodeURIComponent(wgName) + '" class="btn-accent btn">' +
      '<i class="bi bi-envelope me-2" aria-hidden="true"></i>Zimmer anfragen</a>' +
      '</div>';
  } else {
    html = zimmer.map(function (z, i) { return _zimmerKarteFull(z, i, wgName); }).join('');
  }

  container.innerHTML = html;

  // Fade-in-Animationen für die neu eingefügten Karten aktivieren
  if (window.IntersectionObserver) {
    var beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (eintrag) {
        if (eintrag.isIntersecting) {
          eintrag.target.classList.add('visible');
          beobachter.unobserve(eintrag.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
    container.querySelectorAll('.fade-up').forEach(function (el) {
      beobachter.observe(el);
    });
  } else {
    // Fallback für sehr alte Browser: sofort sichtbar
    container.querySelectorAll('.fade-up').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // GLightbox neu initialisieren (die Bilder sind erst jetzt im DOM)
  if (typeof GLightbox !== 'undefined') {
    GLightbox({
      selector: '.glightbox',
      touchNavigation: true,  // Wischen auf Mobilgeräten
      loop: true,
      keyboardNavigation: true, // Pfeiltasten ← →
      closeButton: true
    });
  }
}

/**
 * WG-Infos aus dem wg_info-Sheet laden und anzeigen.
 * Falls das Sheet keinen Eintrag für diese WG hat, passiert nichts –
 * der statische HTML-Inhalt der Seite bleibt unverändert.
 *
 * @param {string} wgName      – WG-Name
 * @param {string} containerId – ID des HTML-Elements
 */
async function ladeWGInfo(wgName, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var info;
  try {
    info = await getWgInfo(wgName);
  } catch (fehler) {
    return; // Fehler still ignorieren – statischer Inhalt bleibt sichtbar
  }
  if (!info) return;

  // Felder die angezeigt werden sollen (in dieser Reihenfolge)
  var felder = [
    { key: 'beschreibung_allgemein', label: null,            icon: null },
    { key: 'lage',                   label: 'Lage',          icon: 'bi-geo-alt' },
    { key: 'kueche',                 label: 'Küche',         icon: 'bi-cup-hot' },
    { key: 'bad',                    label: 'Bad',           icon: 'bi-droplet' },
    { key: 'besonderheiten',         label: 'Besonderheiten',icon: 'bi-star' }
  ];

  var html = '';
  felder.forEach(function (feld) {
    var wert = info[feld.key];
    if (!wert || !wert.trim()) return;

    if (!feld.label) {
      // Allgemeine Beschreibung – direkt als Fließtext
      html += '<p class="wg-info-text">' + _esc(wert) + '</p>';
    } else {
      html += '<div class="wg-info-zeile">' +
        '<i class="bi ' + feld.icon + ' wg-info-icon" aria-hidden="true"></i>' +
        '<div><strong>' + feld.label + ':</strong> ' + _esc(wert) + '</div>' +
        '</div>';
    }
  });

  if (html) {
    container.innerHTML = html;
    container.classList.add('wg-info-block');
    container.removeAttribute('hidden');
  }
}

/**
 * Zeigt die Gesamtzahl freier Zimmer im angegebenen Element an.
 * Für den Live-Zähler auf der Startseite.
 *
 * @param {string} elementId – ID des HTML-Elements
 */
async function zeigeFreeZimmerZaehler(elementId) {
  var el = document.getElementById(elementId);
  if (!el) return;

  try {
    var anzahl = await countAlleFreienZimmer();
    if (anzahl === 0) {
      el.innerHTML =
        'Aktuell sind alle Zimmer belegt – ' +
        '<a href="kontakt.html">Warteliste anfragen</a>';
      el.classList.add('zaehler-belegt');
    } else {
      el.innerHTML =
        '<strong>' + anzahl + '</strong> freie Zimmer aktuell verfügbar';
      el.classList.add('zaehler-frei');
    }
    el.removeAttribute('hidden');
  } catch (fehler) {
    el.setAttribute('hidden', '');
  }
}

// =====================================================================
// KATEGORIE-GALERIEN (Küche, Bad, Wohnzimmer, Terrasse, Flur …)
// Liest die neuen Bildspalten aus dem wg_info-Sheet und rendert
// pro nicht-leerer Spalte ein Bootstrap-Karussell mit GLightbox.
// =====================================================================

var _KATEGORIE_FELDER = [
  { key: 'bilder_kueche',          label: 'Küche',             icon: 'bi-cup-hot' },
  { key: 'bilder_bad',             label: 'Bad & WC',          icon: 'bi-droplet' },
  { key: 'bilder_wohnzimmer',      label: 'Wohnzimmer',        icon: 'bi-tv' },
  { key: 'bilder_terrasse_balkon', label: 'Terrasse & Balkon', icon: 'bi-tree' },
  { key: 'bilder_flur',            label: 'Flur',              icon: 'bi-door-open' },
  { key: 'bilder_sonstiges',       label: 'Weitere Eindrücke', icon: 'bi-images' }
];

/** Rendert ein Bootstrap-Karussell für eine Bildkategorie */
function _renderKarussell(bilder, karussellId, label, icon) {
  var indikatoren = bilder.length > 1
    ? '<div class="carousel-indicators">' +
      bilder.map(function(_, i) {
        return '<button type="button" data-bs-target="#' + karussellId + '" ' +
          'data-bs-slide-to="' + i + '"' + (i === 0 ? ' class="active"' : '') + '></button>';
      }).join('') + '</div>'
    : '';

  var slides = bilder.map(function(url, i) {
    return '<div class="carousel-item' + (i === 0 ? ' active' : '') + '">' +
      '<a href="' + _esc(url) + '" class="glightbox kat-bild-link" ' +
      'data-gallery="' + karussellId + '" ' +
      'aria-label="' + _esc(label) + ' – Foto ' + (i + 1) + '">' +
      '<img src="' + _esc(url) + '" alt="' + _esc(label) + '" loading="lazy">' +
      '<div class="kat-bild-overlay"><i class="bi bi-arrows-fullscreen" aria-hidden="true"></i></div>' +
      '</a></div>';
  }).join('');

  var steuerung = bilder.length > 1
    ? '<button class="carousel-control-prev" type="button" data-bs-target="#' + karussellId + '" data-bs-slide="prev">' +
      '<span class="carousel-control-prev-icon" aria-hidden="true"></span></button>' +
      '<button class="carousel-control-next" type="button" data-bs-target="#' + karussellId + '" data-bs-slide="next">' +
      '<span class="carousel-control-next-icon" aria-hidden="true"></span></button>'
    : '';

  return '<div class="kat-galerie-card fade-up">' +
    '<div class="kat-galerie-header">' +
    '<i class="bi ' + _esc(icon) + '" aria-hidden="true"></i>' +
    '<span>' + _esc(label) + '</span>' +
    (bilder.length > 1 ? '<span class="kat-foto-count">' + bilder.length + '&thinsp;Fotos</span>' : '') +
    '</div>' +
    '<div id="' + karussellId + '" class="carousel slide" data-bs-touch="true">' +
    indikatoren +
    '<div class="carousel-inner kat-carousel-inner">' + slides + '</div>' +
    steuerung +
    '</div></div>';
}

/**
 * Lädt Kategorie-Galerien für eine WG aus dem wg_info-Sheet
 * und rendert sie in den angegebenen Container.
 * Die übergeordnete <section> wird automatisch sichtbar gemacht.
 *
 * @param {string} wgName      – z.B. 'sunshine-wg'
 * @param {string} containerId – ID des Ziel-Elements
 */
async function ladeKategorieGalerien(wgName, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var info;
  try {
    info = await getWgInfo(wgName);
  } catch (e) { return; }
  if (!info) return;

  var html    = '';
  var anzahl  = 0;

  _KATEGORIE_FELDER.forEach(function(feld) {
    var bilder = _parseBilder(info[feld.key]);
    if (bilder.length === 0) return;
    var id = 'kat-' + wgName.replace(/[^a-z0-9]/g, '-') + '-' + feld.key;
    html += _renderKarussell(bilder, id, feld.label, feld.icon);
    anzahl++;
  });

  if (anzahl === 0) return;

  container.innerHTML = '<div class="kat-galerie-grid">' + html + '</div>';

  // Übergeordnete section sichtbar machen
  var eltern = container.parentElement;
  while (eltern && eltern.tagName !== 'SECTION') eltern = eltern.parentElement;
  if (eltern) eltern.removeAttribute('hidden');

  // IntersectionObserver für Fade-in auf neuen Karten
  if (window.IntersectionObserver) {
    var obs = new IntersectionObserver(function(eintraege) {
      eintraege.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.05 });
    container.querySelectorAll('.fade-up').forEach(function(el) { obs.observe(el); });
  } else {
    container.querySelectorAll('.fade-up').forEach(function(el) { el.classList.add('visible'); });
  }

  // GLightbox neu initialisieren
  if (typeof GLightbox !== 'undefined') {
    GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true, keyboardNavigation: true });
  }
}

// =====================================================================
// FREIE-ZIMMER-BADGES AUF ÜBERSICHTSKARTEN
// Befüllt alle [data-wg-count="wg-name"] Elemente mit einem Live-Badge.
// Mehrere WG-Namen möglich: data-wg-count="sunshine-wg,wss-wg"
// =====================================================================

/**
 * Freie-Zimmer-Badge auf Übersichtskarten anzeigen.
 * Elemente mit data-wg-count werden automatisch gefunden und befüllt.
 */
async function zeigeFreieZimmerBadges() {
  var elemente = document.querySelectorAll('[data-wg-count]');
  if (!elemente.length) return;

  var zeilen;
  try { zeilen = await _ladeZimmerDaten(); }
  catch (e) { return; }

  var zaehler = {};
  zeilen.forEach(function (z) {
    if (z.status === 'frei') zaehler[z.wg_name] = (zaehler[z.wg_name] || 0) + 1;
  });

  elemente.forEach(function (el) {
    var namen = el.getAttribute('data-wg-count').split(',').map(function (s) { return s.trim(); });
    var gesamt = namen.reduce(function (sum, n) { return sum + (zaehler[n] || 0); }, 0);
    if (gesamt > 0) {
      el.innerHTML = '<span class="wg-frei-badge badge-frei">' +
        '<i class="bi bi-check-circle" aria-hidden="true"></i>' + gesamt + '&thinsp;Zimmer frei</span>';
    } else {
      el.innerHTML = '<span class="wg-frei-badge badge-belegt">Aktuell belegt</span>';
    }
  });
}

// =====================================================================
// VORSCHAUBILDER FÜR ÜBERSICHTSKACHELN
// Liest vorschau_bild aus wg_info und ersetzt den Icon-Platzhalter
// durch das echte Bild. Fallback-Kette: vorschau_bild →
// erstes Bild aus bilder_wohnzimmer → bilder_kueche → bilder_sonstiges.
// Elemente mit data-wg-vorschau="wg-name1,wg-name2" werden befüllt.
// Mehrere WG-Namen = Fallback-Reihenfolge (erste WG mit Bild gewinnt).
// =====================================================================

async function ladeVorschauBilder() {
  var elemente = document.querySelectorAll('[data-wg-vorschau]');
  if (!elemente.length) return;

  var zeilen;
  try { zeilen = await _ladeWGInfoDaten(); }
  catch (e) { return; }

  var lookup = {};
  zeilen.forEach(function (z) { lookup[z.wg_name] = z; });

  var _fallbackFelder = ['bilder_wohnzimmer', 'bilder_kueche', 'bilder_sonstiges', 'bilder_bad'];

  elemente.forEach(function (el) {
    var namen = el.getAttribute('data-wg-vorschau').split(',').map(function (s) { return s.trim(); });
    var bildUrl = '';

    for (var i = 0; i < namen.length && !bildUrl; i++) {
      var info = lookup[namen[i]];
      if (!info) continue;
      if (info.vorschau_bild && info.vorschau_bild.trim()) bildUrl = info.vorschau_bild.trim();
    }

    if (!bildUrl) {
      for (var j = 0; j < namen.length && !bildUrl; j++) {
        var info2 = lookup[namen[j]];
        if (!info2) continue;
        for (var f = 0; f < _fallbackFelder.length && !bildUrl; f++) {
          var bilder = _parseBilder(info2[_fallbackFelder[f]]);
          if (bilder.length > 0) bildUrl = bilder[0];
        }
      }
    }

    if (bildUrl) {
      el.innerHTML = '<img src="' + _esc(bildUrl) + '" alt="" loading="lazy" style="width:100%;height:200px;object-fit:cover;border-radius:8px 8px 0 0;display:block;">';
    } else {
      el.innerHTML = '<div style="width:100%;height:200px;background:#e8d5c4;border-radius:8px 8px 0 0;"></div>';
    }
  });
}

// =====================================================================
// PREIS-BADGE (einzelne WG-Seiten)
// Liest preis_anzeige aus wg_info und schreibt den Wert in #preis-badge.
// Falls leer: bestehendes HTML-Fallback bleibt unverändert.
// =====================================================================

/**
 * @param {string} wgName – z.B. 'sunshine-wg'
 */
async function ladePreisBadge(wgName) {
  var el = document.getElementById('preis-badge');
  if (!el) return;
  try {
    var info = await getWgInfo(wgName);
    if (info && info.preis_anzeige && info.preis_anzeige.trim()) {
      el.textContent = info.preis_anzeige.trim();
      el.removeAttribute('hidden');
      el.style.display = '';
    }
  } catch (e) {}
}
