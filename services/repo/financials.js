const { run, get, all } = require('../db');
const { v4: uuidv4 } = require('uuid');

async function createPLEntry(body) {
  const id = uuidv4();
  await run('INSERT INTO pl_entries (id, costCenterId, account, amount, period, variance, metadata) VALUES (?,?,?,?,?,?,?)', [
    id,
    body.costCenterId,
    body.account,
    body.amount || 0,
    body.period,
    body.variance || 0,
    body.metadata ? JSON.stringify(body.metadata) : null
  ]);
  return { id, ...body };
}

async function listEntries(costCenterId) {
  if (costCenterId) {
    return all('SELECT * FROM pl_entries WHERE costCenterId = ? ORDER BY period DESC', [costCenterId]);
  }
  return all('SELECT * FROM pl_entries ORDER BY period DESC', []);
}

async function getEntry(id) {
  return get('SELECT * FROM pl_entries WHERE id = ?', [id]);
}

module.exports = { createPLEntry, listEntries, getEntry };
