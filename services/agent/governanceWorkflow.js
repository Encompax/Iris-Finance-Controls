const crypto = require('crypto');

function createGovernanceCase(input = {}) {
  const id = input.id || crypto.randomUUID();
  const riskLevel = input.riskLevel || 'medium';
  const route = riskLevel === 'high' ? 'council_review' : 'autonomous_review';

  return {
    id,
    userId: input.userId || 'unknown',
    message: input.message || '',
    riskLevel,
    route,
    context: input.context || {},
    councilSeats: [
      { seat: 'ethos', role: 'policy' },
      { seat: 'sentinel', role: 'risk' },
      { seat: 'architect', role: 'design' },
      { seat: 'meridian', role: 'operations' }
    ],
    reviewPlan: [
      { seat: 'ethos', action: 'policy_review' },
      { seat: 'sentinel', action: 'risk_review' },
      { seat: 'architect', action: 'impact_review' },
      { seat: 'meridian', action: 'operational_review' }
    ],
    reviews: [],
    status: route === 'council_review' ? 'pending_review' : 'ready_for_agent'
  };
}

const cases = new Map();

function saveGovernanceCase(caseData) {
  cases.set(caseData.id, caseData);
  return caseData;
}

function submitCouncilReview(caseId, review) {
  const councilCase = cases.get(caseId);
  if (!councilCase) throw new Error('governance case not found');

  councilCase.reviews.push({
    seat: review.seat,
    decision: review.decision,
    rationale: review.rationale || '',
    timestamp: new Date().toISOString()
  });

  councilCase.status = review.decision === 'reject' ? 'requires_human_override' : 'approved';
  return councilCase;
}

function getGovernanceCase(caseId) {
  return cases.get(caseId);
}

module.exports = {
  createGovernanceCase: (input = {}) => saveGovernanceCase(createGovernanceCase(input)),
  submitCouncilReview,
  getGovernanceCase
};
