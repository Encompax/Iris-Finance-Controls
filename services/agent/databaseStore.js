const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function getStoreBackend() {
  return process.env.IRIS_GOVERNANCE_STORE_BACKEND || 'json';
}

function getSqliteDbPath() {
  return process.env.IRIS_SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'governance.sqlite');
}

function initSqlite() {
  const dbPath = getSqliteDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS governance_cases (
        id TEXT PRIMARY KEY,
        payload TEXT NOT NULL
      )
    `);
  });
  return db;
}

function saveGovernanceCase(caseData) {
  if (getStoreBackend() !== 'sqlite') return Promise.resolve(caseData);

  const db = initSqlite();
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO governance_cases (id, payload) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload',
      [caseData.id, JSON.stringify(caseData)],
      (err) => {
        db.close();
        if (err) return reject(err);
        resolve(caseData);
      }
    );
  });
}

function getGovernanceCase(caseId) {
  if (getStoreBackend() !== 'sqlite') return Promise.resolve(null);

  const db = initSqlite();
  return new Promise((resolve, reject) => {
    db.get('SELECT payload FROM governance_cases WHERE id = ?', [caseId], (err, row) => {
      db.close();
      if (err) return reject(err);
      resolve(row ? JSON.parse(row.payload) : null);
    });
  });
}

function listGovernanceCases() {
  if (getStoreBackend() !== 'sqlite') return Promise.resolve([]);

  const db = initSqlite();
  return new Promise((resolve, reject) => {
    db.all('SELECT payload FROM governance_cases', [], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve((rows || []).map((row) => JSON.parse(row.payload)));
    });
  });
}

module.exports = { saveGovernanceCase, getGovernanceCase, listGovernanceCases };
