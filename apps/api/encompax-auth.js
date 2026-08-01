const crypto = require("crypto");
const { getApps, initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { FieldValue, Timestamp, getFirestore } = require("firebase-admin/firestore");

const MODULE_KEY = "iris";
const CODE_TTL_SECONDS = 60;
const COLLECTION = "moduleLaunchCodes";

class AuthenticationError extends Error {}
class AuthorizationError extends Error {}

function getServices() {
  const app = getApps()[0] || initializeApp({ credential: applicationDefault() });
  return { auth: getAuth(app), db: getFirestore(app) };
}

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

async function authenticateRequest(req, services = getServices()) {
  const [scheme, token] = String(req.headers.authorization || "").split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) throw new AuthenticationError("Authentication required.");
  let decoded;
  try { decoded = await services.auth.verifyIdToken(token); }
  catch (error) { throw new AuthenticationError("Invalid authentication token.", { cause: error }); }
  const uid = String(decoded.uid || decoded.sub || "").trim();
  if (!uid) throw new AuthenticationError("The authentication token has no user identity.");
  const snapshot = await services.db.doc(`users/${uid}`).get();
  const profile = snapshot.data() || {};
  const access = String(profile.moduleAccess?.[MODULE_KEY] || "").toLowerCase();
  const orgScope = String(profile.orgScope || "").trim();
  if (!snapshot.exists || access !== "active") throw new AuthorizationError("Active Iris access is required for this account.");
  if (!orgScope) throw new AuthorizationError("The Encompax profile has no organization scope.");
  return { uid, orgScope, profile, token: decoded };
}

async function createLaunchCode(context, services = getServices()) {
  const code = crypto.randomBytes(32).toString("base64url");
  await services.db.collection(COLLECTION).doc(hashCode(code)).set({
    uid: context.uid, module: MODULE_KEY, orgScope: context.orgScope,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + CODE_TTL_SECONDS * 1000), consumedAt: null,
  });
  return code;
}

async function redeemLaunchCode(code, services = getServices()) {
  const reference = services.db.collection(COLLECTION).doc(hashCode(code));
  const launch = await services.db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference); const data = snapshot.data() || {};
    if (!snapshot.exists || data.module !== MODULE_KEY || data.consumedAt || (data.expiresAt?.toMillis?.() || 0) <= Date.now()) return null;
    transaction.update(reference, { consumedAt: FieldValue.serverTimestamp() }); return data;
  });
  if (!launch) throw new AuthenticationError("The launch code is invalid, expired, or already used.");
  const snapshot = await services.db.doc(`users/${launch.uid}`).get(); const profile = snapshot.data() || {};
  if (!snapshot.exists || String(profile.moduleAccess?.iris || "").toLowerCase() !== "active" || profile.orgScope !== launch.orgScope) {
    throw new AuthorizationError("Active Iris access is required for this account.");
  }
  return services.auth.createCustomToken(launch.uid, { encompaxModule: MODULE_KEY, orgScope: launch.orgScope });
}

module.exports = { AuthenticationError, AuthorizationError, CODE_TTL_SECONDS, authenticateRequest, createLaunchCode, getServices, redeemLaunchCode };
