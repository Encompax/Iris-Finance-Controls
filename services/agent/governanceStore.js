const fs = require('fs');
const path = require('path');
const { saveGovernanceCase: saveDbCase, getGovernanceCase: getDbCase, listGovernanceCases: listDbCases } = require('./databaseStore');

const storePath = process.env.IRIS_GOVERNANCE_STORE || path.join(process.cwd(), 'data', 'governance-cases.json');

function ensureStore() {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(storePath)) fs.writeFileSync(storePath, '{}');
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(storePath, 'utf8'));
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

function saveGovernanceCase(caseData) {
  const backend = process.env.IRIS_GOVERNANCE_STORE_BACKEND || 'json';
  if (backend === 'sqlite') return saveDbCase(caseData);

  return new Promise((resolve) => {
    const store = readStore();
    store[caseData.id] = caseData;
    writeStore(store);
    resolve(caseData);
  });
}

function getGovernanceCase(caseId) {
  const backend = process.env.IRIS_GOVERNANCE_STORE_BACKEND || 'json';
  if (backend === 'sqlite') return getDbCase(caseId);

  return new Promise((resolve) => {
    const store = readStore();
    resolve(store[caseId] || null);
  });
}

function listGovernanceCases() {
  const backend = process.env.IRIS_GOVERNANCE_STORE_BACKEND || 'json';
  if (backend === 'sqlite') return listDbCases();

  return new Promise((resolve) => {
    const store = readStore();
    resolve(Object.values(store));
  });
}

module.exports = { saveGovernanceCase, getGovernanceCase, listGovernanceCases };
