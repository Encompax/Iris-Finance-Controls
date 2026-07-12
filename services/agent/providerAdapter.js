function getProviderStatus(provider = 'stub') {
  return {
    provider,
    enabled: true,
    mode: provider === 'stub' ? 'dry-run' : 'live',
    available: true
  };
}

function dispatchReview(input = {}) {
  const provider = input.provider || 'stub';
  const riskLevel = input.riskLevel || 'medium';
  const decision = riskLevel === 'high' ? 'review_required' : 'approve';

  return {
    provider,
    decision,
    rationale: `Provider ${provider} reviewed ${input.context?.controlId || 'unknown'} at ${riskLevel} risk.`,
    recommendedAction: decision === 'review_required' ? 'send_to_council' : 'proceed'
  };
}

module.exports = { getProviderStatus, dispatchReview };
