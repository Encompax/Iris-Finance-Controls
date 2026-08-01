const test = require("node:test");
const assert = require("node:assert/strict");
const { approvalRoute } = require("../apps/api/finance-controls");

test("approval routing escalates financial exposure by threshold", () => {
  assert.equal(approvalRoute(500), "finance-review");
  assert.equal(approvalRoute(10000), "manager");
  assert.equal(approvalRoute(50000), "controller");
  assert.equal(approvalRoute(250000), "executive");
});
