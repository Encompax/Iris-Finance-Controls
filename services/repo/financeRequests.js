const crypto = require('crypto');
const { run, all, get } = require('../db');

async function createFinanceRequest(input = {}) {
  const id = input.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const record = {
    id,
    workspaceKey: input.workspaceKey || 'legacy-default',
    organizationName: input.organizationName || null,
    ownerUid: input.ownerUid || null,
    category: input.category || 'pnl_visibility',
    title: input.title || 'Finance review request',
    summary: input.summary || '',
    amount: Number(input.amount || 0),
    priority: input.priority || 'watch',
    status: input.status || 'submitted',
    reviewLane: input.reviewLane || deriveReviewLane(input.category),
    requestDate: input.requestDate || now.slice(0, 10),
    metadata: JSON.stringify(input.metadata || {}),
    createdAt: now,
    updatedAt: now
  };

  await run(
    `INSERT INTO finance_requests
      (id, workspaceKey, organizationName, ownerUid, category, title, summary, amount, priority, status, reviewLane, requestDate, metadata, createdAt, updatedAt)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      record.id,
      record.workspaceKey,
      record.organizationName,
      record.ownerUid,
      record.category,
      record.title,
      record.summary,
      record.amount,
      record.priority,
      record.status,
      record.reviewLane,
      record.requestDate,
      record.metadata,
      record.createdAt,
      record.updatedAt
    ]
  );

  return getFinanceRequest(record.id);
}

async function getFinanceRequest(id) {
  const row = await get('SELECT * FROM finance_requests WHERE id = ?', [id]);
  return hydrate(row);
}

async function listFinanceRequests(workspaceKey = null) {
  const rows = workspaceKey
    ? await all('SELECT * FROM finance_requests WHERE workspaceKey = ? ORDER BY datetime(updatedAt) DESC, datetime(createdAt) DESC', [workspaceKey])
    : await all('SELECT * FROM finance_requests ORDER BY datetime(updatedAt) DESC, datetime(createdAt) DESC');
  return rows.map(hydrate);
}

async function updateFinanceRequestStatus(id, status) {
  const updatedAt = new Date().toISOString();
  await run('UPDATE finance_requests SET status = ?, updatedAt = ? WHERE id = ?', [status, updatedAt, id]);
  return getFinanceRequest(id);
}

function hydrate(row) {
  if (!row) return null;
  return {
    ...row,
    amount: Number(row.amount || 0),
    metadata: safeJson(row.metadata)
  };
}

function safeJson(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function deriveReviewLane(category) {
  if (category === 'capex') return 'CAPEX Review Desk';
  if (category === 'labor_plan') return 'Labor Controls Desk';
  if (category === 'cost_center') return 'Cost Posture Desk';
  return 'Finance Visibility Desk';
}

module.exports = {
  createFinanceRequest,
  getFinanceRequest,
  listFinanceRequests,
  updateFinanceRequestStatus
};
