const test = require("node:test");
const assert = require("node:assert/strict");
const { extractOutputText, fallback, normalize } = require("../apps/api/module-agent");

function context(overrides = {}) {
  return {
    orgScope: "verified-org",
    metrics: { openCases: 1, totalExposure: 12500, pendingApproval: 0 },
    caseQueue: [{ id: "case-1", title: "Freight margin pressure", status: "under-review" }],
    selectedCase: null,
    allowedTransitions: [],
    humanApprovalRequired: true,
    ...overrides,
  };
}

test("Iris extracts structured text from a raw Responses API payload", () => {
  const text = '{"response":"Review exposure","evidence":[],"suggestedPrompts":[],"actionDraft":null}';
  assert.equal(extractOutputText({ output: [{ content: [{ type: "output_text", text }] }] }), text);
});

test("Iris fallback identifies organization-scoped open cases", () => {
  const result = fallback("What is the name of the open case?", context());
  assert.match(result.response, /Freight margin pressure \(under-review\)/);
});

test("Iris normalizes provider proposals into governed non-executing drafts", () => {
  const result = normalize({ response: "Prepare approval.", evidence: [], suggestedPrompts: [], actionDraft: { nextStatus: "approved", rationale: "Evidence reviewed." }, provider: "OPENAI", model: "gpt-5.6-terra" }, context({ selectedCase: { id: "case-1" }, allowedTransitions: ["approved", "rejected"] }));
  assert.equal(result.actionDraft.actionType, "IRIS_FINANCE_CASE_STATUS_TRANSITION");
  assert.equal(result.actionDraft.requiredDisposition, "HUMAN_APPROVAL_REQUIRED");
  assert.equal(result.requiresApproval, true);
});
