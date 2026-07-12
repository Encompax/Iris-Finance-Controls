const http = require('http');
const url = require('url');
const GovernanceWorkflow = require('../../services/agent/governanceWorkflow');
const { authenticateRequest } = require('../../services/agent/auth');
const { saveGovernanceCase, getGovernanceCase } = require('../../services/agent/governanceStore');
const { getProviderStatus, dispatchReview } = require('../../services/agent/providerAdapter');

const port = process.env.PORT || 3002;

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);

  if (parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', service: 'iris-finance-controls-api' }));
    return;
  }

  authenticateRequest(req, res, () => {});
  if (res.writableEnded) return;

  if (parsed.pathname === '/api/agent/intent' && req.method === 'POST') {
    const payload = await parseBody(req).catch(() => ({}));
    const caseData = GovernanceWorkflow.createGovernanceCase({
      userId: payload.userId || 'unknown',
      message: payload.message || '',
      riskLevel: payload.riskLevel || 'medium',
      context: payload.context || {}
    });
    const providerReview = dispatchReview({
      provider: payload.provider || 'stub',
      riskLevel: caseData.riskLevel,
      context: caseData.context
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      accepted: true,
      intent: 'Finance governance request received',
      governanceCase: caseData,
      providerReview,
      providerStatus: getProviderStatus(payload.provider || 'stub')
    }));
    return;
  }

  if (parsed.pathname === '/api/governance/cases' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const caseData = GovernanceWorkflow.createGovernanceCase(body);
      await saveGovernanceCase(caseData);
      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ case: caseData }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'invalid governance case', details: String(err) }));
    }
    return;
  }

  const governanceCaseMatch = parsed.pathname.match(/^\/api\/governance\/cases\/([^\/]+)\/review$/);
  if (governanceCaseMatch && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const updated = GovernanceWorkflow.submitCouncilReview(governanceCaseMatch[1], body);
      await saveGovernanceCase(updated);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ case: updated }));
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'governance case not found', details: String(err) }));
    }
    return;
  }

  const governanceCaseGetMatch = parsed.pathname.match(/^\/api\/governance\/cases\/([^\/]+)$/);
  if (governanceCaseGetMatch && req.method === 'GET') {
    const caseData = await getGovernanceCase(governanceCaseGetMatch[1]);
    if (!caseData) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'governance case not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ case: caseData }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log(`Finance governance API listening on http://localhost:${port}`);
});
