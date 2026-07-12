function authenticateRequest(req, res, next) {
  const requireAuth = process.env.IRIS_REQUIRE_AUTH === 'true';
  if (!requireAuth) return next();

  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.IRIS_API_KEY;
  if (apiKey && expectedKey && apiKey === expectedKey) return next();

  res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'unauthorized' }));
}

module.exports = { authenticateRequest };
