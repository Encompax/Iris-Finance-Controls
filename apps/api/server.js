const http = require("http");
const { URL } = require("url");
const { AuthenticationError, AuthorizationError, CODE_TTL_SECONDS, authenticateRequest, createLaunchCode, getServices, redeemLaunchCode } = require("./encompax-auth");
const { ConflictError, FinanceRepository, NotFoundError, ValidationError } = require("./finance-controls");

const MODULE = { key: "iris", label: "Iris Finance Controls", service: "encompax-iris-api", contractVersion: "2026-08-01", humanApprovalRequired: true };
const ORIGINS = new Set(["https://www.encompax.com", "https://encompax.com", "https://iris.encompax.io", "https://encompax-iris.web.app"]);
function send(req, res, status, payload) { const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }; if (ORIGINS.has(req.headers.origin)) { headers["access-control-allow-origin"] = req.headers.origin; headers.vary = "Origin"; } res.writeHead(status, headers); res.end(JSON.stringify(payload)); }
async function body(req) { const chunks = []; for await (const chunk of req) chunks.push(chunk); try { return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; } catch { throw new ValidationError("Request body must be valid JSON."); } }
async function overview(context, repo) { const [cases, evidence, audit] = await Promise.all([repo.listCases(context.orgScope), repo.listEvidence(context.orgScope), repo.listAudit(context.orgScope)]); const open = cases.filter((item) => item.status !== "closed"); return { module: MODULE, workspace: { orgScope: context.orgScope, organizationName: context.profile.organization || "", ownerUid: context.uid }, metrics: { openCases: open.length, pendingApproval: cases.filter((item) => item.status === "pending-approval").length, blockedCommitments: cases.filter((item) => item.commitmentBlocked).length, totalExposure: open.reduce((sum, item) => sum + Number(item.exposureAmount || 0), 0), freightMarginExposure: open.filter((item) => item.sourceModule === "sil").reduce((sum, item) => sum + Number(item.exposureAmount || 0), 0), customerRevenueExposure: open.filter((item) => item.sourceModule === "marengo").reduce((sum, item) => sum + Number(item.exposureAmount || 0), 0), capaCostExposure: open.filter((item) => item.sourceModule === "kardia").reduce((sum, item) => sum + Number(item.exposureAmount || 0), 0) }, cases, evidence, audit } }

function createServer(options = {}) {
  const services = options.services || getServices(); const repo = options.repository || new FinanceRepository(services.db);
  return http.createServer(async (req, res) => { const requestUrl = new URL(req.url || "/", "http://localhost"); try {
    if (req.method === "OPTIONS") { const h = { "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "Authorization,Content-Type", "access-control-max-age": "3600" }; if (ORIGINS.has(req.headers.origin)) h["access-control-allow-origin"] = req.headers.origin; res.writeHead(204, h); res.end(); return; }
    if (req.method === "GET" && requestUrl.pathname === "/health") return send(req, res, 200, { status: "ok", service: MODULE.service, moduleKey: MODULE.key });
    if (req.method === "GET" && requestUrl.pathname === "/api/module/status") return send(req, res, 200, { module: MODULE });
    if (req.method === "POST" && requestUrl.pathname === "/api/auth/encompax/launch") { const context = await authenticateRequest(req, services); return send(req, res, 201, { code: await createLaunchCode(context, services), expiresInSeconds: CODE_TTL_SECONDS }); }
    if (req.method === "POST" && requestUrl.pathname === "/api/auth/encompax/redeem") { const data = await body(req); return send(req, res, 200, { customToken: await redeemLaunchCode(String(data.code || ""), services) }); }
    const context = await authenticateRequest(req, services);
    if (req.method === "GET" && requestUrl.pathname === "/api/dashboard/overview") return send(req, res, 200, await overview(context, repo));
    if (req.method === "GET" && requestUrl.pathname === "/api/finance/cases") return send(req, res, 200, { cases: await repo.listCases(context.orgScope) });
    if (req.method === "POST" && requestUrl.pathname === "/api/finance/cases") return send(req, res, 201, { case: await repo.createCase(context, await body(req)) });
    let match = requestUrl.pathname.match(/^\/api\/finance\/cases\/([^/]+)\/status$/);
    if (req.method === "POST" && match) { const data = await body(req); return send(req, res, 200, { case: await repo.transition(context, decodeURIComponent(match[1]), String(data.status || "").toLowerCase(), data.note, Array.isArray(data.evidenceIds) ? data.evidenceIds : []) }); }
    match = requestUrl.pathname.match(/^\/api\/finance\/cases\/([^/]+)\/evidence$/);
    if (req.method === "POST" && match) return send(req, res, 201, { evidence: await repo.addEvidence(context, decodeURIComponent(match[1]), await body(req)) });
    if (req.method === "GET" && requestUrl.pathname === "/api/finance/evidence") return send(req, res, 200, { evidence: await repo.listEvidence(context.orgScope) });
    if (req.method === "GET" && requestUrl.pathname === "/api/finance/audit") return send(req, res, 200, { audit: await repo.listAudit(context.orgScope) });
    match = requestUrl.pathname.match(/^\/api\/integrations\/(sil|marengo|kardia)\/finance-cases$/);
    if (req.method === "POST" && match) { const result = await repo.createIntegratedCase(context, match[1], await body(req)); return send(req, res, result.duplicate ? 200 : 201, result); }
    return send(req, res, 404, { error: "Not found" });
  } catch (error) { if (error instanceof AuthenticationError) return send(req, res, 401, { error: error.message }); if (error instanceof AuthorizationError) return send(req, res, 403, { error: error.message }); if (error instanceof ValidationError) return send(req, res, 400, { error: error.message }); if (error instanceof ConflictError) return send(req, res, 409, { error: error.message }); if (error instanceof NotFoundError) return send(req, res, 404, { error: error.message }); console.error("Iris API request failed", error); return send(req, res, 500, { error: "Internal server error." }); } });
}
if (require.main === module) createServer().listen(Number(process.env.PORT || 3004), () => console.log("Iris finance API listening"));
module.exports = { MODULE, createServer, overview };
