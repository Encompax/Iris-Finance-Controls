const crypto = require("crypto");

const RESPONSE_CONTRACT_VERSION = "encompax.module-agent.response.v1";
const AGENT_ID = process.env.MODULE_AGENT_IRIS_ID || "iris_finance_manager_v1";
const DEFAULT_MODEL = process.env.IRIS_OPENAI_MODEL || "gpt-5.6-terra";

const INSTRUCTIONS = `You are the Iris Finance Controls Assistant inside Encompax.
Act as the finance business-unit manager for the verified organization scope.
Explain exposure, approval routes, evidence, commitments, and valid case transitions using only supplied context.
You may recommend or draft one valid next transition when a selected case is supplied.
Never claim an action executed. Never authorize spend, bypass human approval, or override Encompax governance.`;

const OUTPUT_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["response", "evidence", "suggestedPrompts", "actionDraft"],
  properties: {
    response: { type: "string" },
    evidence: { type: "array", items: { type: "string" } },
    suggestedPrompts: { type: "array", items: { type: "string" } },
    actionDraft: { anyOf: [
      { type: "null" },
      { type: "object", additionalProperties: false, required: ["nextStatus", "rationale"], properties: { nextStatus: { type: "string" }, rationale: { type: "string" } } },
    ] },
  },
};

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  for (const item of payload?.output || []) for (const content of item?.content || []) {
    if (content?.type === "output_text" && typeof content.text === "string" && content.text.trim()) return content.text;
  }
  throw new Error("OpenAI provider response did not contain output text.");
}

function fallback(message, context) {
  const selected = context.selectedCase;
  const cases = context.caseQueue || [];
  const asksForCase = /(?:name|which|what).*(?:case)|(?:case).*(?:name|open)/i.test(message);
  const asksForDraft = /draft|propose|transition|move|route|approve|reject|commit|close/i.test(message);
  const nextStatus = selected && asksForDraft ? context.allowedTransitions[0] : null;
  return {
    response: selected
      ? `${selected.title} is ${selected.status} with ${selected.exposureAmount} of ${selected.exposureKind} exposure routed to ${selected.approvalRoute}. Review its evidence and commitment boundary before changing state.`
      : asksForCase && cases.length
        ? `Open finance-control cases: ${cases.map((item) => `${item.title} (${item.status})`).join(", ")}. Select one for evidence-specific guidance.`
        : `This organization has ${context.metrics.openCases} open finance-control cases with total exposure of ${context.metrics.totalExposure}. Human approval remains required before financial commitments.`,
    evidence: selected ? [`Source: ${selected.sourceModule}`, `Owner: ${selected.owner || "Unassigned"}`, `Approval route: ${selected.approvalRoute}`] : [`Organization scope: ${context.orgScope}`, "Financial commitments remain blocked until approved."],
    suggestedPrompts: ["What should finance review today?", "Explain the highest exposure", "Help me prepare an approval review"],
    actionDraft: nextStatus ? { nextStatus, rationale: `Advance ${selected.id} only after the operator reviews evidence and approval requirements.` } : null,
    provider: "MANUAL", model: null,
  };
}

async function callOpenAi(message, context, uid) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return null;
  const model = process.env.IRIS_OPENAI_MODEL || DEFAULT_MODEL;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model, reasoning: { effort: "low" }, store: false,
      safety_identifier: crypto.createHash("sha256").update(uid).digest("hex"),
      instructions: INSTRUCTIONS,
      input: JSON.stringify({ operatorMessage: message, scopedFinanceContext: context }),
      text: { verbosity: "low", format: { type: "json_schema", name: "iris_assistant_response", strict: true, schema: OUTPUT_SCHEMA } },
    }),
  });
  if (!response.ok) throw new Error(`OpenAI provider returned ${response.status}.`);
  return { ...JSON.parse(extractOutputText(await response.json())), provider: "OPENAI", model };
}

function normalize(result, context) {
  const proposed = result.actionDraft;
  const nextStatus = proposed && context.allowedTransitions.includes(proposed.nextStatus) ? proposed.nextStatus : null;
  const actionDraft = nextStatus && context.selectedCase ? {
    actionType: "IRIS_FINANCE_CASE_STATUS_TRANSITION", targetId: context.selectedCase.id,
    rationale: String(proposed.rationale || "").trim(), parameters: { nextStatus }, status: "draft",
    requiredDisposition: ["approved", "committed"].includes(nextStatus) ? "HUMAN_APPROVAL_REQUIRED" : "EXECUTE_ALLOWED",
  } : null;
  return {
    contractVersion: RESPONSE_CONTRACT_VERSION, response: String(result.response || ""),
    evidence: Array.isArray(result.evidence) ? result.evidence.map(String) : [],
    suggestedPrompts: Array.isArray(result.suggestedPrompts) ? result.suggestedPrompts.map(String) : [],
    actionDraft, provider: result.provider || "MANUAL", model: result.model || null, agentId: AGENT_ID,
    governanceStatus: actionDraft ? "DRAFT" : "ADVISORY", requiresApproval: Boolean(actionDraft),
  };
}

async function answerOperator({ message, context, uid }) {
  const clean = String(message || "").trim();
  if (!clean) throw new Error("A message is required.");
  if (clean.length > 4000) throw new Error("Messages cannot exceed 4,000 characters.");
  let result;
  try { result = await callOpenAi(clean, context, uid); }
  catch (error) { console.error("Iris assistant provider failed", { message: error.message }); }
  return normalize(result || fallback(clean, context), context);
}

module.exports = { AGENT_ID, RESPONSE_CONTRACT_VERSION, answerOperator, extractOutputText, fallback, normalize };
