module.exports = {
  async sendGovernanceRequest(request) {
    return {
      status: 'accepted',
      request,
      nextSteps: ['review documentation', 'check financial controls', 'prepare approval summary']
    };
  }
};
