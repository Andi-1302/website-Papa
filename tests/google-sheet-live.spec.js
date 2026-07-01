const { test, expect } = require('@playwright/test');

const wgPages = [
  { name: 'Sunshine-WG', path: 'sunshine-wg.html', wgName: 'sunshine-wg' },
  { name: 'WSS-WG', path: 'wss-wg.html', wgName: 'wss-wg' },
  { name: 'Kappel-WG', path: 'wg-untertuerkheim.html', wgName: 'kappel-wg' },
  { name: 'Gnesener-WG', path: 'gnesener-wg.html', wgName: 'gnesener-wg' }
];

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const parseLine = (line) => {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current);
    return fields;
  };

  const headers = parseLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = parseLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] || '').trim();
    });
    return row;
  });
}

function countOccurrences(text, substring) {
  if (!substring) return 0;
  return text.split(substring).length - 1;
}

function looksLikeHtml(text) {
  return /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text) || /<title>/i.test(text);
}

for (const pageInfo of wgPages) {
  test.describe(`WG-Seite ${pageInfo.name}`, () => {
    test(`lädt Live-Daten aus dem Google Sheet`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          sessionStorage.clear();
        } catch (e) {
          // sessionStorage kann in manchen Umgebungen nicht verfügbar sein
        }
      });

      const sheetResponses = [];
      page.on('response', (response) => {
        const url = response.url();
        if (url.startsWith('https://docs.google.com/spreadsheets/') && url.includes('gviz/tq?tqx=out:csv')) {
          sheetResponses.push(response);
        }
      });

      const pageUrl = `${pageInfo.path}`;
      const csvResponsePromise = page.waitForResponse(
        (response) => response.url().startsWith('https://docs.google.com/spreadsheets/') && response.url().includes('gviz/tq?tqx=out:csv') && response.status() === 200,
        { timeout: 15000 }
      );
      await page.goto(pageUrl, { waitUntil: 'networkidle' });
      const csvResponse = await csvResponsePromise;
      expect(csvResponse).toBeTruthy();

      const csvTextFromPageRequest = await csvResponse.text();
      expect(csvTextFromPageRequest.trim().length).toBeGreaterThan(0);
      expect(looksLikeHtml(csvTextFromPageRequest)).toBeFalsy();

      const csvInfoUrl = await page.evaluate(() => window.CSV_WG_INFO);
      expect(csvInfoUrl).toBeTruthy();
      expect(csvInfoUrl).toContain('docs.google.com/spreadsheets');
      expect(csvInfoUrl).toContain('gviz/tq?tqx=out:csv');

      const infoResponse = await page.request.get(`${csvInfoUrl}&_t=${Date.now()}`);
      expect(infoResponse.ok()).toBe(true);
      const infoCsvText = await infoResponse.text();
      expect(infoCsvText.trim().length).toBeGreaterThan(0);
      if (looksLikeHtml(infoCsvText)) {
        throw new Error('Sheet ist nicht öffentlich freigegeben: Google antwortet mit HTML statt CSV');
      }

      const rows = parseCSV(infoCsvText);
      const sheetRow = rows.find((row) => row.wg_name === pageInfo.wgName);
      expect(sheetRow, `Keine Zeile für wg_name=${pageInfo.wgName} im wg_info-Sheet gefunden`).toBeTruthy();

      const description = (sheetRow.beschreibung_allgemein || '').trim();
      expect(description).toBeTruthy();
      const price = (sheetRow.preis_anzeige || '').trim();

      const infoParagraph = page.locator('#wgInfoContainer .wg-info-text');
      await expect(infoParagraph).toHaveText(description, { timeout: 15000 });

      const pageText = await page.locator('body').innerText();
      const descriptionCount = countOccurrences(pageText, description);
      expect(descriptionCount).toBe(1);

      if (price) {
        expect(pageText).toContain(price);
        const priceCount = countOccurrences(pageText, price);
        expect(priceCount).toBeGreaterThan(0);
      }

      expect(sheetResponses.length).toBeGreaterThan(0);
      for (const response of sheetResponses) {
        const text = await response.text();
        expect(looksLikeHtml(text)).toBeFalsy();
      }
    });
  });
}
