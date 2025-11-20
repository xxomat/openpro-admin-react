// Regenerate stock days for 2025-01-01 → 2026-12-31
// Usage: node stub-server/scripts/regenerate-stock.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'stub-data.json');

function pad2(n) {
  return String(n).padStart(2, '0');
}

function generateDays(startISO, endISO, dispo) {
  const out = [];
  const start = new Date(startISO);
  const end = new Date(endISO);
  let d = new Date(start);
  while (d <= end) {
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    out.push({ date: `${y}-${m}-${day}`, dispo });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const db = JSON.parse(raw);
  db.stock = db.stock || {};

  const RANGE = ['2025-01-01', '2026-12-31'];
  const specs = [
    ['47186:1', 1],
    ['47186:2', 1],
    ['47186:3', 1],
    ['55123:1', 1],
    ['99999:1', 0]
  ];

  for (const [key, dispo] of specs) {
    db.stock[key] = { jours: generateDays(RANGE[0], RANGE[1], dispo) };
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`Regenerated stock for keys: ${specs.map(s => s[0]).join(', ')}`);
}

main();


