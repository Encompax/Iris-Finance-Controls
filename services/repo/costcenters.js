const { run, get, all } = require('../db');
const { v4: uuidv4 } = require('uuid');

async function createCostCenter(body) {
  const id = uuidv4();
  await run('INSERT INTO cost_centers (id, code, name, budget, manager, metadata) VALUES (?,?,?,?,?,?)', [
    id,
    body.code,
    body.name,
    body.budget || 0,
    body.manager || null,
    body.metadata ? JSON.stringify(body.metadata) : null
  ]);
  return { id, ...body };
}

async function listAll() {
  return all('SELECT * FROM cost_centers ORDER BY code ASC', []);
}

async function getCostCenter(id) {
  return get('SELECT * FROM cost_centers WHERE id = ?', [id]);
}

module.exports = { createCostCenter, listAll, getCostCenter };
