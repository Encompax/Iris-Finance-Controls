const http = require('http');
const url = require('url');
const shared = require('../../packages/shared');
const Financials = require('../../services/repo/financials');
const Projects = require('../../services/repo/projects');
const CostCenters = require('../../services/repo/costcenters');
const Scheduler = require('../../services/scheduler');
const DB = require('../../services/db');

const port = process.env.PORT || 3001;

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

  if (parsed.pathname === '/api/finance/summary' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ summary: 'Finance controls module scaffold ready', modules: ['pl', 'capex', 'cost-centers', 'governance'] }));
    return;
  }

  if (parsed.pathname === '/api/agent/intent' && req.method === 'POST') {
    const payload = await parseBody(req).catch(() => ({}));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ accepted: true, intent: 'Governance-aware finance request received', payload, nextSteps: ['review budget', 'check cost center', 'prepare recommendation'] }));
    return;
  }

  if (parsed.pathname === '/api/costcenters' && req.method === 'GET') {
    const items = await CostCenters.listAll();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ costCenters: items }));
    return;
  }

  if (parsed.pathname === '/api/costcenters' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const item = await CostCenters.createCostCenter(body);
      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ costCenter: item }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'invalid body', details: String(err) }));
    }
    return;
  }

  if (parsed.pathname === '/api/capex' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const project = await Projects.createProject(body);
      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ project }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'invalid body', details: String(err) }));
    }
    return;
  }

  if (parsed.pathname === '/api/capex' && req.method === 'GET') {
    const list = await Projects.listProjects();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ projects: list }));
    return;
  }

  if (parsed.pathname === '/api/pl' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const plan = await Scheduler.plan(body);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ plan }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'planning error', details: String(err) }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
