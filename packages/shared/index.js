module.exports = {
  domainTypes: {
    finance: 'finance',
    capex: 'capex',
    costCenter: 'costCenter',
    pl: 'pl',
    governance: 'governance'
  },
  createAgentMessage: (payload) => ({
    kind: 'agent.request',
    timestamp: new Date().toISOString(),
    payload
  })
};

module.exports.schemas = {
  CostCenter: {
    id: 'string',
    code: 'string',
    name: 'string',
    budget: 'number',
    manager: 'string',
    metadata: 'object'
  },
  CapexProject: {
    id: 'string',
    name: 'string',
    description: 'string',
    costCenterId: 'string',
    requestedAmount: 'number',
    approvedAmount: 'number',
    status: 'string',
    createdAt: 'string'
  },
  PLEntry: {
    id: 'string',
    costCenterId: 'string',
    account: 'string',
    amount: 'number',
    period: 'string',
    variance: 'number',
    metadata: 'object'
  }
};
