import { test, expect } from '@playwright/test';

const wgPages = [
  { name: 'Sunshine-WG', path: 'sunshine-wg.html', wgName: 'sunshine-wg' },
  { name: 'WSS-WG', path: 'wss-wg.html', wgName: 'wss-wg' },
  { name: 'Kappel-WG', path: 'wg-untertuerkheim.html', wgName: 'kappel-wg' },
  { name: 'Gnesener-WG', path: 'gnesener-wg.html', wgName: 'gnesener-wg' }
];

const expectedHeaders = {
  zimmer: [
    'wg_name',
    'status',
    'zimmer_nr',
    'preis'
  ],
  wg_info: [
    'wg_name',
    'preis_anzeige',
    'beschreibung_allgemein',
    'lage',
    'kueche',
    'bad',
    'besonderheiten',
    'bilder_kueche',
    'bilder_bad',
    'bilder_wohnzimmer',
    'bilder_terrasse_balkon',
    'bilder_flur',
    'bilder_sonstiges',
    'vorschau_bild'
  ]
};

function looksLikeHtml(text) {
  return /^\s*<!doctype html/i.test(text)
    || /^\s*<html/i.test(text)
    || /<title>/i.test(text)
    || /<body/i.test(text);
}

function parseCsv(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  if (!lines.length) return [];

  const parseLine = (line) => {
    const cols = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cols.push(field);
        field = '';
      } else {
        field += char;
      }
    }
    cols.push(field);
    return cols.map((value) => value.trim());
  };

  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    rows.push(parseLine(line));
  }
  return rows;
}

function headerDiff(actual, expected) {
  const missing = expected.filter((col) => !actual.includes(col));
  const extra = actual.filter((col) => !expected.includes(col));
  return { missing, extra };
}

function countOccurrences(text, substring) {
  if (!substring) return 0;
  return text.split(substring).length - 1;
}

for (const pageInfo of wgPages) {
  test.describe(`Google Sheets Anbindung / ${pageInfo.name}`, () => {
    test(`prüft Verbindung, CSV, Spalten und adaptive Werte für ${pageInfo.name}`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          sessionStorage.clear();
        } catch (e) {
          // Wenn sessionStorage nicht verfügbar ist, trotzdem weitermachen.
        }
      });

      const zimmerResponsePromise = page.waitForResponse(
        (response) => response.url().startsWith('https://docs.google.com/spreadsheets/')
          && response.url().includes('gviz/tq?tqx=out:csv')
          && response.url().includes('sheet=zimmer')
          && response.status() === 200,
        { timeout: 15000 }
      );

      const wgInfoResponsePromise = page.waitForResponse(
        (response) => response.url().startsWith('https://docs.google.com/spreadsheets/')
          && response.url().includes('gviz/tq?tqx=out:csv')
          && response.url().includes('sheet=wg_info')
          && response.status() === 200,
        { timeout: 15000 }
      );

      await page.goto(pageInfo.path, { waitUntil: 'load' });

      const [zimmerResponse, wgInfoResponse] = await Promise.all([
        zimmerResponsePromise,
        wgInfoResponsePromise
      ]);

      expect(zimmerResponse).toBeTruthy();
      expect(wgInfoResponse).toBeTruthy();

      const zimmerCsv = await zimmerResponse.text();
      const wgInfoCsv = await wgInfoResponse.text();

      expect(looksLikeHtml(zimmerCsv)).toBeFalsy();
      expect(looksLikeHtml(wgInfoCsv)).toBeFalsy();

      const zimmerHeaderRow = parseCsv(zimmerCsv)[0] || [];
      const wgInfoHeaderRow = parseCsv(wgInfoCsv)[0] || [];

      const zimmerDiff = headerDiff(zimmerHeaderRow, expectedHeaders.zimmer);
      const wgInfoDiff = headerDiff(wgInfoHeaderRow, expectedHeaders.wg_info);

      console.log('--- Spaltenübersicht für Seite:', pageInfo.name);
      console.log('Zimmer-Tabelle erwartet:', expectedHeaders.zimmer);
      console.log('Zimmer-Tabelle aktuell:', zimmerHeaderRow);
      console.log('Zimmer fehlende Spalten:', zimmerDiff.missing);
      console.log('Zimmer zusätzliche Spalten:', zimmerDiff.extra);
      console.log('wg_info-Tabelle erwartet:', expectedHeaders.wg_info);
      console.log('wg_info-Tabelle aktuell:', wgInfoHeaderRow);
      console.log('wg_info fehlende Spalten:', wgInfoDiff.missing);
      console.log('wg_info zusätzliche Spalten:', wgInfoDiff.extra);

      expect(zimmerDiff.missing.length).toBe(0);
      expect(wgInfoDiff.missing.length).toBe(0);

      const directWgInfoUrl = await page.evaluate(() => window.CSV_WG_INFO);
      expect(directWgInfoUrl).toBeTruthy();
      expect(directWgInfoUrl).toContain('docs.google.com/spreadsheets');
      expect(directWgInfoUrl).toContain('gviz/tq?tqx=out:csv');

      const directZimmerUrl = await page.evaluate(() => window.CSV_ZIMMER);
      expect(directZimmerUrl).toBeTruthy();
      expect(directZimmerUrl).toContain('docs.google.com/spreadsheets');
      expect(directZimmerUrl).toContain('gviz/tq?tqx=out:csv');

      const directResponse = await page.request.get(`${directWgInfoUrl}&_t=${Date.now()}`);
      expect(directResponse.ok()).toBe(true);
      const directCsv = await directResponse.text();
      expect(looksLikeHtml(directCsv)).toBeFalsy();

      const directZimmerResponse = await page.request.get(`${directZimmerUrl}&_t=${Date.now()}`);
      expect(directZimmerResponse.ok()).toBe(true);
      const directZimmerCsv = await directZimmerResponse.text();
      expect(looksLikeHtml(directZimmerCsv)).toBeFalsy();

      const directZimmerHeaderRow = parseCsv(directZimmerCsv)[0] || [];
      const directWgInfoHeaderRow = parseCsv(directCsv)[0] || [];

      const directZimmerDiff = headerDiff(directZimmerHeaderRow, expectedHeaders.zimmer);
      const directWgInfoDiff = headerDiff(directWgInfoHeaderRow, expectedHeaders.wg_info);

      console.log('--- Direkter CSV-Kopfzeilenvergleich für Seite:', pageInfo.name);
      console.log('Direkte Zimmer-Kopfzeile aktuell:', directZimmerHeaderRow);
      console.log('Direkte wg_info-Kopfzeile aktuell:', directWgInfoHeaderRow);
      console.log('Direkte Zimmer fehlende Spalten:', directZimmerDiff.missing);
      console.log('Direkte wg_info fehlende Spalten:', directWgInfoDiff.missing);

      expect(directZimmerDiff.missing.length).toBe(0);
      expect(directWgInfoDiff.missing.length).toBe(0);

      const directRows = parseCsv(directCsv);
      const header = directRows[0] || [];
      const dataRows = directRows.slice(1).map((row) => {
        const obj = {};
        header.forEach((column, index) => {
          obj[column] = row[index] || '';
        });
        return obj;
      });

      const sheetRow = dataRows.find((row) => row.wg_name === pageInfo.wgName);
      expect(sheetRow, `Keine Zeile für wg_name=${pageInfo.wgName} im öffentlichen wg_info-Sheet gefunden`).toBeTruthy();

      const description = (sheetRow.beschreibung_allgemein || '').trim();
      const price = (sheetRow.preis_anzeige || '').trim();

      expect(description).toBeTruthy();
      expect(price).toBeTruthy();

      const bodyText = await page.locator('body').innerText();
      const descriptionCount = countOccurrences(bodyText, description);
      expect(descriptionCount).toBe(1);

      if (price) {
        const priceCount = countOccurrences(bodyText, price);
        expect(priceCount).toBeGreaterThan(0);
      }

      const detailFields = ['lage', 'kueche', 'bad', 'besonderheiten'];
      for (const field of detailFields) {
        const fieldValue = (sheetRow[field] || '').trim();
        if (!fieldValue) continue;
        const fieldCount = countOccurrences(bodyText, fieldValue);
        expect(fieldCount).toBe(1);
      }

      console.log(`✔ ${pageInfo.name}: Verbindung, CSV, Spalten, adaptive Werte und Doppelprüfung erfolgreich.`);
    });
  });
}
