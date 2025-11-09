// Back/src/models/dataStore.js
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.resolve(__dirname, './data');
const FILE = path.join(DATA_DIR, 'schedules.json');

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

async function readAll() {
  await ensureFile();
  const raw = await fs.readFile(FILE, 'utf8');
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    await fs.writeFile(FILE, JSON.stringify([], null, 2), 'utf8');
    return [];
  }
}

async function saveAll(arr) {
  await ensureFile();
  await fs.writeFile(FILE, JSON.stringify(arr, null, 2), 'utf8');
}

module.exports = { readAll, saveAll, FILE, DATA_DIR };
