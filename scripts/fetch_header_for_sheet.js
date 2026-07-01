const https = require('https');
const url = 'https://docs.google.com/spreadsheets/d/1te-4NxFomA1QhfOgjIDrbbZNOq7ZP3YB/gviz/tq?tqx=out:csv&sheet=wg_info';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const normalized = data.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
    const lines = normalized.split('\n').filter(l=>l.trim()!=='');
    if (lines.length === 0) { console.error('Keine Daten'); process.exit(2); }
    const headerLine = lines[0].trim();
    console.log('CSV-URL:', url);
    console.log('Roh-Kopfzeile:', headerLine);
    // Einfaches Parsen: Trenne auf Komma, respektiere Anführungszeichen
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let i=0;i<headerLine.length;i++){
      const ch = headerLine[i];
      if (ch==='"'){
        if (inQuotes && headerLine[i+1]==='"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch===',' && !inQuotes){ cols.push(cur); cur=''; }
      else cur += ch;
    }
    if (cur!==''||headerLine.endsWith(',')) cols.push(cur);
    console.log('\nKopfzeile Spalten (1:1, exakte Schreibweise, Reihenfolge):');
    cols.forEach((c, i) => console.log(`${i+1}. ${c}`));
  });
}).on('error', (e) => { console.error('Fehler:', e.message); process.exit(1); });
