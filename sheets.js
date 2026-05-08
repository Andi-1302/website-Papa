// sheets.js – Zimmerdaten aus Google Sheets laden (kein API-Key erforderlich)
// Spalten im Sheet: wg_name | zimmer_nr | groesse | preis | status | beschreibung | ausstattung | bild_urls | video_url

const SHEET_ID = '1nRm5mYuvCuDNylftKAhFN8OrZBelQCoCdomdA__a-LE';

// Rohdaten holen und als Array von Objekten zurückgeben
async function fetchSheetRows() {
  const url =
    'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
    '/gviz/tq?tqx=out:json&t=' + Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const text = await res.text();
  // JSONP-Wrapper entfernen: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);?\s*$/);
  if (!match) throw new Error('Unerwartetes Antwortformat');
  const payload = JSON.parse(match[1]);
  if (payload.status !== 'ok') throw new Error('Sheets-Fehler: ' + JSON.stringify(payload.errors));
  const cols = payload.table.cols.map(function(c) { return c.label || c.id; });
  return payload.table.rows
    .filter(function(row) { return row.c && row.c.some(function(cell) { return cell && cell.v !== null; }); })
    .map(function(row) {
      var obj = {};
      row.c.forEach(function(cell, i) {
        obj[cols[i]] = (cell !== null && cell.v !== null) ? String(cell.v).trim() : '';
      });
      return obj;
    });
}

// Hauptfunktion: Zimmer einer WG laden und rendern
// wgName  → muss exakt dem Wert in Spalte "wg_name" entsprechen
// containerId → ID des Container-Elements
// layout  → 'full' (ausführliche Karten) | 'grid' (kompaktes 3-Spalten-Raster für Gnesener-WG)
async function loadWGZimmer(wgName, containerId, layout) {
  layout = layout || 'full';
  var container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML =
    '<div class="text-center py-5 text-muted">' +
    '<div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>' +
    'Zimmerdaten werden geladen…</div>';

  var rows;
  try {
    rows = await fetchSheetRows();
  } catch (e) {
    container.innerHTML =
      '<div class="alert py-3 fade-up" style="background:rgba(220,53,69,.07);border-left:4px solid #dc3545;border-radius:0 8px 8px 0">' +
      '<i class="bi bi-exclamation-triangle me-2"></i>' +
      'Zimmerdaten konnten gerade nicht geladen werden. Bitte versuchen Sie es später oder ' +
      '<a href="kontakt.html">schreiben Sie uns direkt</a>.</div>';
    return;
  }

  var zimmer = rows.filter(function(r) { return r.wg_name === wgName && r.status === 'frei'; });

  if (zimmer.length === 0) {
    container.innerHTML =
      '<div class="text-center py-5">' +
      '<i class="bi bi-house-check" style="font-size:2.5rem;color:var(--color-accent);opacity:.5;display:block;margin-bottom:1rem"></i>' +
      '<h4 style="color:var(--color-muted)">Aktuell sind alle Zimmer vergeben.</h4>' +
      '<p class="text-muted mb-4">Schreiben Sie uns gerne – es werden laufend Zimmer frei,<br>' +
      'wir setzen Sie auf unsere <strong>Warteliste</strong>.</p>' +
      '<a href="kontakt.html" class="btn-accent btn">Auf Warteliste setzen</a>' +
      '</div>';
    return;
  }

  if (layout === 'grid') {
    container.innerHTML =
      '<div class="row g-3">' +
      zimmer.map(function(z, i) { return renderZimmerGrid(z, i); }).join('') +
      '</div>' +
      '<div class="text-center mt-5 fade-up">' +
      '<a href="kontakt.html" class="btn-accent btn"><i class="bi bi-envelope me-2"></i>Zimmer anfragen</a>' +
      '</div>';
  } else {
    container.innerHTML = zimmer.map(function(z, i) { return renderZimmerFull(z, i); }).join('');
  }

  if (typeof GLightbox !== 'undefined') {
    GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true });
  }
}

/* ===== Hilfsfunktionen ===== */

function parseBilder(bild_urls) {
  if (!bild_urls || !bild_urls.trim()) return [];
  return bild_urls.split(',').map(function(u) { return u.trim(); }).filter(Boolean);
}

function renderBilderGallery(bilder, zimmerNr) {
  if (bilder.length === 0) {
    return '<div style="min-height:180px;border-radius:8px;background:#f5f3ee;display:flex;flex-direction:column;' +
           'align-items:center;justify-content:center;gap:.5rem">' +
           '<i class="bi bi-image" style="font-size:2rem;color:#ccc"></i>' +
           '<span style="font-size:.82rem;color:#aaa">Foto folgt</span></div>';
  }
  var haupt = bilder[0];
  var weitere = bilder.slice(1);
  var zusatz = weitere.map(function(b) {
    return '<a href="' + b + '" class="glightbox" data-gallery="zimmer-' + zimmerNr + '" aria-label="Weiteres Foto"></a>';
  }).join('');
  var count = bilder.length > 1 ? '<span style="margin-left:.3rem;font-size:.8rem">+' + bilder.length + '</span>' : '';
  return '<div class="room-mini-gallery">' +
    '<a href="' + haupt + '" class="gallery-item glightbox" data-gallery="zimmer-' + zimmerNr + '" ' +
    'data-glightbox="title: Zimmer ' + zimmerNr + '">' +
    '<img src="' + haupt + '" alt="Zimmer ' + zimmerNr + '" loading="lazy">' +
    '<div class="overlay"><i class="bi bi-zoom-in"></i>' + count + '</div>' +
    '</a>' + zusatz + '</div>';
}

function renderVideoEmbed(video_url) {
  if (!video_url || !video_url.trim()) return '';
  var yt = video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) {
    return '<div class="video-embed mt-3">' +
      '<iframe src="https://www.youtube-nocookie.com/embed/' + yt[1] + '" ' +
      'allowfullscreen loading="lazy" title="Zimmer-Video"></iframe></div>';
  }
  return '';
}

// Ausführliche Karte – für kleine WGs (sunshine, wss, kappel)
function renderZimmerFull(z, i) {
  var bilder   = parseBilder(z.bild_urls);
  var videoHtml = renderVideoEmbed(z.video_url);
  var groesse  = z.groesse  ? ' – ca. ' + z.groesse + ' m²' : '';
  var preis    = z.preis    ? '<p class="mb-1"><strong>Miete:</strong> ' + z.preis + ' € warm</p>' : '';
  var desc     = z.beschreibung ? '<p>' + z.beschreibung + '</p>' : '';
  var ausstatt = z.ausstattung
    ? '<p class="mb-1" style="font-size:.88rem;color:var(--color-muted)">' +
      '<i class="bi bi-check2-circle me-1"></i>' + z.ausstattung + '</p>'
    : '';

  return '<div class="room-card fade-up delay-' + (i % 4) + '">' +
    '<div class="room-card-header">' +
    '<h4><i class="bi bi-door-open me-2"></i>Zimmer ' + z.zimmer_nr + groesse + '</h4>' +
    '<span class="badge-status badge-frei">Frei</span></div>' +
    '<div class="room-card-body"><div class="row g-3">' +
    '<div class="col-md-6">' + desc + preis + ausstatt +
    '<a href="kontakt.html" class="btn-accent btn btn-sm mt-3">Zimmer anfragen</a></div>' +
    '<div class="col-md-6">' + renderBilderGallery(bilder, z.zimmer_nr) + videoHtml + '</div>' +
    '</div></div></div>';
}

// Kompakte Karte – für Gnesener-WG (viele Zimmer)
function renderZimmerGrid(z, i) {
  var bilder = parseBilder(z.bild_urls);
  var haupt  = bilder[0] || '';
  var groesse = z.groesse ? ' · ' + z.groesse + ' m²' : '';
  var preis   = z.preis   ? z.preis + ' € warm' : 'Auf Anfrage';
  var bildHtml = haupt
    ? '<a href="' + haupt + '" class="glightbox" data-gallery="zimmer-' + z.zimmer_nr + '">' +
      '<img src="' + haupt + '" alt="Zimmer ' + z.zimmer_nr + '" loading="lazy" ' +
      'style="width:100%;border-radius:6px;margin-bottom:.7rem;aspect-ratio:4/3;object-fit:cover"></a>'
    : '<div style="height:100px;background:#f5f3ee;border-radius:6px;margin-bottom:.7rem;' +
      'display:flex;align-items:center;justify-content:center">' +
      '<i class="bi bi-image" style="color:#ccc;font-size:1.5rem"></i></div>';

  return '<div class="col-sm-6 col-md-4 fade-up delay-' + (i % 4) + '">' +
    '<div class="room-card" style="margin-bottom:0">' +
    '<div class="room-card-header" style="padding:.8rem 1rem">' +
    '<h4 style="font-size:1rem"><i class="bi bi-door-open me-2"></i>Zimmer ' + z.zimmer_nr + groesse + '</h4>' +
    '<span class="badge-status badge-frei">Frei</span></div>' +
    '<div class="room-card-body" style="padding:1rem">' + bildHtml +
    '<p class="mb-2" style="font-size:.88rem">' + (z.beschreibung || '<em style="color:#aaa">Beschreibung folgt</em>') + '</p>' +
    '<div class="d-flex align-items-center justify-content-between">' +
    '<span style="font-size:.85rem;color:var(--color-accent);font-weight:600">' + preis + '</span>' +
    '<a href="kontakt.html" class="btn btn-sm btn-accent">Anfragen</a>' +
    '</div></div></div></div>';
}
