const test = require('node:test');
const assert = require('node:assert/strict');
const { createModuleAgentSeat, buildWorkspaceAgentSeat } = require('../packages/shared');

test('Iris governed seat exposes a reusable module-family contract', () => {
  const seat = createModuleAgentSeat('iris');

  assert.equal(seat.moduleKey, 'iris');
  assert.equal(seat.seatLabel, 'Iris Finance Seat');
  assert.equal(seat.modelVersion, 'Iris-v01');
  assert.equal(seat.executionMode, 'advisory_only');
  assert.equal(seat.chatEnabled, true);
});

test('workspace seat snapshot strengthens posture when governance pressure is present', () => {
  const seat = buildWorkspaceAgentSeat('iris', {
    workspaceKey: 'acme-finance',
    organizationName: 'Acme Finance',
    requestCount: 6,
    openRequestCount: 4,
    elevatedRequestCount: 2,
    pendingGovernanceCount: 1,
    categoryCount: 3
  });

  assert.equal(seat.workspaceKey, 'acme-finance');
  assert.equal(seat.organizationName, 'Acme Finance');
  assert.equal(seat.statusLabel, 'Governance review active');
  assert.equal(seat.governanceState, 'pending_review');
  assert.equal(seat.snapshot.pendingGovernanceCount, 1);
});
