const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

function freshRequire(modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

test('finance requests persist and remain workspace-scoped', async () => {
  const dbPath = path.join(process.cwd(), 'data', 'test-iris-finance.sqlite');
  try {
    fs.unlinkSync(dbPath);
  } catch {}

  process.env.IRIS_SQLITE_DB_PATH = dbPath;

  const DB = freshRequire('../services/db');
  const FinanceRequests = freshRequire('../services/repo/financeRequests');
  await DB.init();

  await FinanceRequests.createFinanceRequest({
    workspaceKey: 'org-alpha',
    organizationName: 'Org Alpha',
    category: 'capex',
    title: 'Line automation cell',
    summary: 'Review automation cell spend request',
    amount: 180000,
    priority: 'critical'
  });

  await FinanceRequests.createFinanceRequest({
    workspaceKey: 'org-beta',
    organizationName: 'Org Beta',
    category: 'labor_plan',
    title: 'Shift balancing review',
    summary: 'Review labor redistribution',
    amount: 12000,
    priority: 'watch'
  });

  const alpha = await FinanceRequests.listFinanceRequests('org-alpha');
  const beta = await FinanceRequests.listFinanceRequests('org-beta');

  assert.equal(alpha.length, 1);
  assert.equal(beta.length, 1);
  assert.equal(alpha[0].organizationName, 'Org Alpha');
  assert.equal(beta[0].organizationName, 'Org Beta');
  assert.equal(alpha[0].reviewLane, 'CAPEX Review Desk');

  delete process.env.IRIS_SQLITE_DB_PATH;
});
