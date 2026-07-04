const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'iris_finance_controls.sqlite3');

const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
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
      resolve(row);
    });
  });
}

async function init() {
  await run(`CREATE TABLE IF NOT EXISTS cost_centers (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT,
    budget REAL,
    manager TEXT,
    metadata TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS capex_projects (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    costCenterId TEXT,
    requestedAmount REAL,
    approvedAmount REAL,
    status TEXT,
    createdAt TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS pl_entries (
    id TEXT PRIMARY KEY,
    costCenterId TEXT,
    account TEXT,
    amount REAL,
    period TEXT,
    variance REAL,
    metadata TEXT
  )`);
}

module.exports = { db, run, all, get, init };
