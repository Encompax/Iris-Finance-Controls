const crypto = require('crypto');

function createGovernanceCase(input = {}) {
  const id = input.id || crypto.randomUUID();
  const riskLevel = input.riskLevel || 'medium';
  const route = input.route || (riskLevel === 'high' ? 'council_review' : 'autonomous_review');
  const reviewRequiredRoutes = new Set(['council_review', 'governed_review']);
  const createdAt = input.createdAt || new Date().toISOString();

  return {
    id,
    title: input.title || 'Iris finance governance review',
    category: input.category || 'finance_exception',
    reviewLane: input.reviewLane || 'Finance Review Desk',
    userId: input.userId || 'unknown',
    message: input.message || '',
    riskLevel,
    route,
    context: input.context || {},
    createdAt,
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
    status: reviewRequiredRoutes.has(route) ? 'pending_review' : 'ready_for_agent'
  };
}

const cases = new Map();

function saveGovernanceCase(caseData) {
  cases.set(caseData.id, caseData);
  return caseData;
}

function submitCouncilReview(caseId, review, existingCase = null) {
  const councilCase = existingCase || cases.get(caseId);
  if (!councilCase) throw new Error('governance case not found');

  councilCase.reviews.push({
    seat: review.seat,
    decision: review.decision,
    rationale: review.rationale || '',
    timestamp: new Date().toISOString()
  });

  councilCase.status = review.decision === 'reject' ? 'requires_human_override' : 'approved';
  cases.set(caseId, councilCase);
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
