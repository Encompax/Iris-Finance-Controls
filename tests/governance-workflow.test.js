const test = require('node:test');
const assert = require('node:assert/strict');
const { createGovernanceCase, submitCouncilReview } = require('../services/agent/governanceWorkflow');
const { saveGovernanceCase, getGovernanceCase, listGovernanceCases } = require('../services/agent/governanceStore');
const { authenticateRequest } = require('../services/agent/auth');
const { getProviderStatus, dispatchReview } = require('../services/agent/providerAdapter');

test('createGovernanceCase routes high-risk finance requests to council review', () => {
  const caseData = createGovernanceCase({
    userId: 'user-1',
    message: 'Authorize a high-risk treasury wire exception',
    riskLevel: 'high',
    context: { controlId: 'SOX-100', amount: 500000 }
  });

  assert.equal(caseData.status, 'pending_review');
  assert.equal(caseData.councilSeats.length, 4);
  assert.ok(caseData.reviewPlan.some((item) => item.seat === 'sentinel'));
  assert.equal(caseData.route, 'council_review');
});

test('submitCouncilReview marks a case for human override when a council seat rejects it', () => {
  const caseData = createGovernanceCase({
    userId: 'user-2',
    message: 'Approve a ledger adjustment',
    riskLevel: 'medium',
    context: { controlId: 'SOX-200' }
  });

  const updated = submitCouncilReview(caseData.id, {
    seat: 'sentinel',
    decision: 'reject',
    rationale: 'Policy conflict on expense threshold'
  });

  assert.equal(updated.status, 'requires_human_override');
  assert.equal(updated.reviews[0].decision, 'reject');
});

test('saveGovernanceCase persists a case and reloads it', async () => {
  const caseData = await saveGovernanceCase({
    id: 'persisted-case',
    userId: 'user-3',
    message: 'Persist my finance governance review',
    riskLevel: 'high',
    context: { controlId: 'SOX-300' }
  });

  const loaded = await getGovernanceCase(caseData.id);
  assert.ok(loaded);
  assert.equal(loaded.message, 'Persist my finance governance review');
});

test('authenticateRequest rejects requests without a valid API key when auth is required', () => {
  process.env.IRIS_REQUIRE_AUTH = 'true';
  const req = { headers: {} };
  const res = {
    statusCode: 200,
    body: '',
    writeHead(code) { this.statusCode = code; },
    end(payload) { this.body = payload; }
  };

  authenticateRequest(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(res.statusCode, 401);
  delete process.env.IRIS_REQUIRE_AUTH;
});

test('dispatchReview returns a provider-backed review payload', () => {
  const status = getProviderStatus('stub');
  const review = dispatchReview({ provider: 'stub', riskLevel: 'high', context: { controlId: 'SOX-400' } });

  assert.equal(status.provider, 'stub');
  assert.equal(review.provider, 'stub');
  assert.ok(review.decision);
});

test('sqlite backend persists governance cases to a database file', async () => {
  process.env.IRIS_GOVERNANCE_STORE_BACKEND = 'sqlite';
  process.env.IRIS_SQLITE_DB_PATH = 'data/test-governance.sqlite';

  const caseData = await saveGovernanceCase({
    id: 'sqlite-case',
    userId: 'user-4',
    message: 'Persist to sqlite',
    riskLevel: 'high',
    context: { controlId: 'SOX-500' }
  });

  const loaded = await getGovernanceCase(caseData.id);
  assert.equal(loaded.message, 'Persist to sqlite');
  delete process.env.IRIS_GOVERNANCE_STORE_BACKEND;
  delete process.env.IRIS_SQLITE_DB_PATH;
});

test('persisted governance cases can be reloaded and reviewed after storage round-trip', async () => {
  const created = createGovernanceCase({
    id: 'reloaded-review-case',
    userId: 'user-5',
    title: 'CAPEX review after reload',
    category: 'capex',
    reviewLane: 'CAPEX Review Desk',
    message: 'Reload this governance case before approving it',
    riskLevel: 'high',
    route: 'council_review',
    context: { workspaceKey: 'org-alpha', amount: 175000 }
  });

  await saveGovernanceCase(created);
  const loaded = await getGovernanceCase(created.id);
  const reviewed = submitCouncilReview(created.id, {
    seat: 'meridian',
    decision: 'approve',
    rationale: 'Approved after persisted reload.'
  }, loaded);

  await saveGovernanceCase(reviewed);
  const cases = await listGovernanceCases();
  const finalCase = cases.find((item) => item.id === created.id);

  assert.ok(finalCase);
  assert.equal(finalCase.status, 'approved');
  assert.equal(finalCase.reviews[0].decision, 'approve');
});
