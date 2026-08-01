const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = process.env.IRIS_SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'iris-finance.sqlite');

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

async function init() {
  await run(`
    CREATE TABLE IF NOT EXISTS finance_requests (
      id TEXT PRIMARY KEY,
      workspaceKey TEXT,
      organizationName TEXT,
      ownerUid TEXT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      amount REAL,
      priority TEXT,
      status TEXT,
      reviewLane TEXT,
      requestDate TEXT,
      metadata TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `);
}

module.exports = { db, run, all, get, init };
