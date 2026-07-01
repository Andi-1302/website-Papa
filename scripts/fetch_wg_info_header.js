const https = require('https');
const url = 'https://docs.google.com/spreadsheets/d/1te-4NxFomA1QhfOgjIDrbbZNOq7ZP3YB/gviz/tq?tqx=out:csv&sheet=wg_info';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const lines = data.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l=>l.trim()!=='');
    if (lines.length === 0) {
      console.error('LEER');
      process.exit(2);
    }
    console.log('--- vollständige Kopfzeile (exakt, 1:1, Reihenfolge) ---');
    console.log(lines[0]);
    console.log('\n--- gesamte erste 10 Zeilen (Kontext) ---');
    console.log(lines.slice(0,10).join('\n'));
  });
}).on('error', (e) => { console.error('ERR', e.message); process.exit(1); });
