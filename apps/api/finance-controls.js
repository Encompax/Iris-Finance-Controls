function serverTimestamp() { return require("firebase-admin/firestore").serverTimestamp(); }

const STATUSES = ["new", "under-review", "pending-approval", "approved", "rejected", "committed", "closed"];
const TRANSITIONS = {
  new: ["under-review"], "under-review": ["pending-approval", "rejected", "closed"],
  "pending-approval": ["approved", "rejected"], approved: ["committed", "closed"],
  rejected: ["under-review", "closed"], committed: ["closed"], closed: [],
};
const DEFAULT_THRESHOLDS = { manager: 10000, controller: 50000, executive: 250000 };
class ValidationError extends Error {} class ConflictError extends Error {} class NotFoundError extends Error {}
function text(value, field, required = true, max = 2000) { const result = String(value || "").trim(); if (required && !result) throw new ValidationError(`${field} is required.`); if (result.length > max) throw new ValidationError(`${field} is too long.`); return result; }
function money(value) { const result = Number(value || 0); if (!Number.isFinite(result) || result < 0) throw new ValidationError("Exposure must be a non-negative number."); return Math.round(result * 100) / 100; }
function approvalRoute(exposure, thresholds = DEFAULT_THRESHOLDS) { if (exposure >= thresholds.executive) return "executive"; if (exposure >= thresholds.controller) return "controller"; if (exposure >= thresholds.manager) return "manager"; return "finance-review"; }
function serialize(snapshot) { const data = snapshot.data(); const iso = (v) => v?.toDate?.()?.toISOString?.() || v || null; return { id: snapshot.id, ...data, createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt) }; }

class FinanceRepository {
  constructor(db) { this.db = db; }
  org(scope) { return this.db.collection("organizations").doc(scope); }
  async list(scope, name, limit = 100) { const snap = await this.org(scope).collection(name).orderBy("updatedAt", "desc").limit(limit).get(); return snap.docs.map(serialize); }
  listCases(scope) { return this.list(scope, "financeControlCases"); }
  listEvidence(scope) { return this.list(scope, "financeEvidence", 150); }
  listAudit(scope) { return this.list(scope, "financeAudit", 200); }
  async createCase(context, input, integration = null, id = null) {
    const exposure = money(input.exposureAmount); const ref = id ? this.org(context.orgScope).collection("financeControlCases").doc(id) : this.org(context.orgScope).collection("financeControlCases").doc();
    const record = { title: text(input.title, "Title", true, 160), description: text(input.description, "Description"), caseType: text(input.caseType || "financial-control", "Case type", true, 60), sourceModule: text(input.sourceModule || integration || "iris", "Source module", true, 30), sourceEventId: text(input.sourceEventId, "Source event ID", false, 180), exposureAmount: exposure, exposureKind: text(input.exposureKind || "financial", "Exposure kind", true, 60), owner: text(input.owner || context.profile.displayName || context.profile.email || context.uid, "Owner", true, 160), dueDate: text(input.dueDate, "Due date", false, 10), status: "new", approvalRoute: approvalRoute(exposure), humanApprovalRequired: true, commitmentBlocked: true, orgScope: context.orgScope, createdBy: context.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    await ref.set(record); await this.audit(context, "finance-case", ref.id, integration ? "integration-received" : "created", null, "new", { sourceModule: record.sourceModule, exposureAmount: exposure });
    return { id: ref.id, ...record };
  }
  async createIntegratedCase(context, sourceModule, input) {
    const sourceEventId = text(input.sourceEventId, "Source event ID", true, 180); const id = Buffer.from(`${sourceModule}:${sourceEventId}`).toString("base64url");
    const ref = this.org(context.orgScope).collection("financeControlCases").doc(id); const found = await ref.get();
    if (found.exists) return { duplicate: true, case: serialize(found) };
    const created = await this.createCase(context, { ...input, sourceModule }, sourceModule, id);
    return { duplicate: false, case: created };
  }
  async transition(context, id, next, note = "", evidenceIds = []) {
    if (!STATUSES.includes(next)) throw new ValidationError("Case status is invalid."); const ref = this.org(context.orgScope).collection("financeControlCases").doc(id); const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError("Finance-control case was not found."); const before = snap.data().status;
    if (!TRANSITIONS[before]?.includes(next)) throw new ConflictError(`Invalid case transition from ${before} to ${next}.`);
    const isApprover = context.token.platformOwner === true || context.token.admin === true || context.profile.platformOwner === true || context.profile.roles?.includes?.("admin");
    if (["approved", "committed"].includes(next) && !isApprover) throw new ConflictError("A human finance approver is required for this transition.");
    if (next === "approved" && !evidenceIds.length) throw new ConflictError("Approval requires at least one evidence record.");
    const update = { status: next, commitmentBlocked: !["approved", "committed", "closed"].includes(next), updatedAt: serverTimestamp() };
    if (["approved", "rejected"].includes(next)) Object.assign(update, { decisionBy: context.uid, decisionAt: serverTimestamp(), decisionNote: text(note, "Decision note", true, 1000), evidenceIds });
    await ref.update(update); await this.audit(context, "finance-case", id, "status-changed", before, next, { note, evidenceIds }); return { id, ...snap.data(), ...update };
  }
  async addEvidence(context, caseId, input) {
    const caseRef = this.org(context.orgScope).collection("financeControlCases").doc(caseId); if (!(await caseRef.get()).exists) throw new NotFoundError("Finance-control case was not found.");
    const ref = this.org(context.orgScope).collection("financeEvidence").doc(); const record = { caseId, label: text(input.label, "Evidence label", true, 160), evidenceType: text(input.evidenceType || "note", "Evidence type", true, 40), uri: text(input.uri, "Evidence URI", false, 1000), note: text(input.note, "Evidence note", false), addedBy: context.uid, orgScope: context.orgScope, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    await ref.set(record); await this.audit(context, "finance-case", caseId, "evidence-added", null, null, { evidenceId: ref.id, label: record.label }); return { id: ref.id, ...record };
  }
  async audit(context, entityType, entityId, action, fromStatus, toStatus, details) { await this.org(context.orgScope).collection("financeAudit").add({ entityType, entityId, action, fromStatus, toStatus, details, actorUid: context.uid, actorEmail: context.profile.email || context.token.email || "", orgScope: context.orgScope, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); }
}
module.exports = { ConflictError, FinanceRepository, NotFoundError, TRANSITIONS, ValidationError, approvalRoute };
