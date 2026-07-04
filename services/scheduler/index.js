const CostCenters = require('../repo/costcenters');
const Projects = require('../repo/projects');

async function plan(request) {
  if (!request || !request.costCenterId || !request.period) {
    throw new Error('missing costCenterId or period');
  }

  const costCenter = await CostCenters.getCostCenter(request.costCenterId);
  if (!costCenter) {
    throw new Error('cost center not found');
  }

  const project = request.capexProjectId ? await Projects.getProject(request.capexProjectId) : null;
  const recommendedAction = project ? 'review-capex' : 'review-budget';

  return {
    request,
    costCenter,
    project,
    recommendedAction,
    schedule: [
      { step: 'validate_financials', earliestStart: new Date().toISOString() },
      { step: 'prepare_governance_packet', estimatedHours: 4 },
      { step: 'finalize_review', dueDate: request.dueDate || null }
    ]
  };
}

module.exports = { plan };
