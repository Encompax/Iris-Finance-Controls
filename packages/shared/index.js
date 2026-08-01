const moduleAgentSeatTemplates = {
  fusion: {
    moduleKey: 'fusion',
    moduleLabel: 'Fusion',
    seatId: 'fusion-planner-seat',
    seatLabel: 'Fusion Planner Seat',
    panelTitle: 'Governed planning lane',
    modelVersion: 'Fusion-v01',
    reviewLane: 'Planning Review Desk',
    executionMode: 'advisory_only',
    chatEnabled: true,
    capabilities: [
      'Summarize material readiness for a single workspace',
      'Highlight shortages, reservation pressure, and work-order blockers',
      'Route elevated exceptions into governance review before release'
    ]
  },
  iris: {
    moduleKey: 'iris',
    moduleLabel: 'Iris',
    seatId: 'iris-finance-seat',
    seatLabel: 'Iris Finance Seat',
    panelTitle: 'Governed finance review lane',
    modelVersion: 'Iris-v01',
    reviewLane: 'Finance Review Desk',
    executionMode: 'advisory_only',
    chatEnabled: true,
    capabilities: [
      'Summarize finance request posture for a single workspace',
      'Highlight CAPEX pressure, cost-center drift, and approval blockers',
      'Route elevated finance exceptions into governance review before release'
    ]
  },
  sil: {
    moduleKey: 'sil',
    moduleLabel: 'SIL',
    seatId: 'sil-ops-seat',
    seatLabel: 'SIL Operations Seat',
    panelTitle: 'Governed shipment review lane',
    modelVersion: 'SIL-v01',
    reviewLane: 'Transportation Review Desk',
    executionMode: 'advisory_only',
    chatEnabled: true,
    capabilities: [
      'Summarize transportation command posture',
      'Highlight routing pressure and release blockers',
      'Route governed shipment exceptions before execution'
    ]
  }
};

function createModuleAgentSeat(moduleKey, overrides = {}) {
  const template = moduleAgentSeatTemplates[moduleKey] || {
    moduleKey,
    moduleLabel: moduleKey,
    seatId: `${moduleKey}-seat`,
    seatLabel: `${moduleKey} governed seat`,
    panelTitle: 'Governed agent lane',
    modelVersion: `${moduleKey}-v01`,
    reviewLane: 'Governance Review Desk',
    executionMode: 'advisory_only',
    chatEnabled: true,
    capabilities: []
  };

  return {
    ...template,
    ...overrides
  };
}

function buildWorkspaceAgentSeat(moduleKey, options = {}) {
  const pendingGovernanceCount = Number(options.pendingGovernanceCount || 0);
  const requestCount = Number(options.requestCount || 0);
  const openRequestCount = Number(options.openRequestCount || 0);
  const elevatedRequestCount = Number(options.elevatedRequestCount || 0);
  const categoryCount = Number(options.categoryCount || 0);

  let statusLabel = 'Workspace context connected';
  let governanceState = 'operator_safe';
  let postureTone = 'ready';
  let operatorSummary = 'The governed seat is attached to the workspace and ready to summarize finance control posture.';
  let recommendedActions = [
    'Use the seat to summarize current finance request posture before widening approvals.',
    'Keep finance advice visible to operators before enabling deeper automation.'
  ];

  if (pendingGovernanceCount > 0) {
    statusLabel = 'Governance review active';
    governanceState = 'pending_review';
    postureTone = 'warning';
    operatorSummary = 'Open finance governance cases are waiting for review, so the seat should keep recommendations advisory and escalation-safe.';
    recommendedActions = [
      'Review pending CAPEX or control exceptions before advancing approvals.',
      'Use the seat to summarize current risk queue for operators and reviewers.'
    ];
  } else if (elevatedRequestCount > 0 || openRequestCount > 0) {
    statusLabel = 'Control pressure visible';
    governanceState = 'watch';
    postureTone = 'warning';
    operatorSummary = 'Active finance requests are carrying pressure, so the seat should keep teams focused on review posture before release.';
    recommendedActions = [
      'Ask the seat to summarize elevated request posture for the current workspace.',
      'Validate control and approval pressure before advancing spend or labor changes.'
    ];
  } else if (requestCount > 0) {
    statusLabel = 'Finance lane active';
    governanceState = 'advisory';
    postureTone = 'ready';
    operatorSummary = 'The workspace already has finance control activity, so the seat can summarize active requests, categories, and next-safe actions.';
    recommendedActions = [
      'Use the seat to summarize the current finance review lane for this workspace.',
      'Confirm category posture before broadening cross-module or approval scope.'
    ];
  }

  return createModuleAgentSeat(moduleKey, {
    workspaceKey: options.workspaceKey || null,
    organizationName: options.organizationName || null,
    ownerUid: options.ownerUid || null,
    statusLabel,
    governanceState,
    postureTone,
    operatorSummary,
    recommendedActions,
    snapshot: {
      requestCount,
      openRequestCount,
      elevatedRequestCount,
      pendingGovernanceCount,
      categoryCount
    },
    lastSnapshotAt: options.lastSnapshotAt || new Date().toISOString()
  });
}

module.exports = {
  moduleAgentSeatTemplates,
  createModuleAgentSeat,
  buildWorkspaceAgentSeat
};
