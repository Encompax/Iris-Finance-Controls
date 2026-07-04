const { run, get, all } = require('../db');
const { v4: uuidv4 } = require('uuid');

async function createProject(body) {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const status = body.status || 'proposed';
  await run('INSERT INTO capex_projects (id, name, description, costCenterId, requestedAmount, approvedAmount, status, createdAt) VALUES (?,?,?,?,?,?,?,?)', [
    id,
    body.name,
    body.description || null,
    body.costCenterId,
    body.requestedAmount || 0,
    body.approvedAmount || 0,
    status,
    createdAt
  ]);
  return { id, createdAt, status, ...body };
}

async function listProjects() {
  return all('SELECT * FROM capex_projects ORDER BY createdAt DESC', []);
}

async function getProject(id) {
  return get('SELECT * FROM capex_projects WHERE id = ?', [id]);
}

module.exports = { createProject, listProjects, getProject };
