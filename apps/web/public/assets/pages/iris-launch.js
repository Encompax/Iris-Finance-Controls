import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDUcr7o-M_4kTyO_wurwzSvASFHvoC-Kc8",
  authDomain: "encompax-prod.firebaseapp.com",
  projectId: "encompax-prod",
  storageBucket: "encompax-prod.firebasestorage.app",
  messagingSenderId: "111381214769",
  appId: "1:111381214769:web:9a4ff0102d924c3c77c710",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const FALLBACK_CATALOG = {
  support: {
    defaultEmail: "support@encompax.com",
    helpHref: "https://www.encompax.com/help.html",
    faqHref: "https://www.encompax.com/faq.html",
    termsHref: "https://www.encompax.com/terms.html",
    privacyHref: "https://www.encompax.com/privacy.html",
    rolloutDeskLabel: "Encompax rollout and workspace desk",
    businessContacts: {
      supportEmail: "support@encompax.com",
      billingEmail: "billing@encompax.com",
      securityEmail: "security@encompax.com",
    },
  },
  modules: {
    iris: {
      key: "iris",
      label: "Iris Finance Controls",
      statusLabel: "Staging prep",
      launchMode: "workspace",
      packageKeys: ["team", "enterprise"],
    },
  },
  packages: [
    {
      key: "team",
      label: "Team finance rollout",
      title: "Team finance rollout",
      description:
        "Governed finance workspace for visibility, request routing, and cost-control review under the shared Encompax identity model.",
    },
    {
      key: "enterprise",
      label: "Enterprise finance network",
      title: "Enterprise finance network",
      description:
        "Broader finance coordination staged for cross-module reporting and reviewed agent guidance after the first finance workflow lanes are trusted.",
    },
  ],
};

const elements = {
  search: document.getElementById("shellSearch"),
  searchableCards: Array.from(document.querySelectorAll(".searchable-card")),
  userGreeting: document.getElementById("userGreeting"),
  moduleStatusLabel: document.getElementById("moduleStatusLabel"),
  launchModeLabel: document.getElementById("launchModeLabel"),
  supportDeskLabel: document.getElementById("supportDeskLabel"),
  signedInPostureLabel: document.getElementById("signedInPostureLabel"),
  primaryLaunchLink: document.getElementById("primaryLaunchLink"),
  accessHeading: document.getElementById("accessHeading"),
  accessBody: document.getElementById("accessBody"),
  accessPill: document.getElementById("accessPill"),
  profilePanel: document.getElementById("profilePanel"),
  profileName: document.getElementById("profileName"),
  profileEmail: document.getElementById("profileEmail"),
  profileOrganization: document.getElementById("profileOrganization"),
  profileModuleAccess: document.getElementById("profileModuleAccess"),
  profilePreferredModule: document.getElementById("profilePreferredModule"),
  orgStatusPill: document.getElementById("orgStatusPill"),
  nextStepList: document.getElementById("nextStepList"),
  supportEmailValue: document.getElementById("supportEmailValue"),
  billingEmailValue: document.getElementById("billingEmailValue"),
  securityEmailValue: document.getElementById("securityEmailValue"),
  rolloutDeskValue: document.getElementById("rolloutDeskValue"),
  helpLink: document.getElementById("helpLink"),
  faqLink: document.getElementById("faqLink"),
  privacyLink: document.getElementById("privacyLink"),
  termsLink: document.getElementById("termsLink"),
  footerSupportLink: document.getElementById("footerSupportLink"),
  footerBillingLink: document.getElementById("footerBillingLink"),
  footerSecurityLink: document.getElementById("footerSecurityLink"),
  packageGrid: document.getElementById("packageGrid"),
};

init().catch((error) => console.error("Iris launch shell failed to initialize", error));

async function init() {
  bindSearch();
  const catalog = await loadCatalog();
  applyCatalogCopy(catalog);
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      renderSignedOutState();
      return;
    }
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      renderSignedInState(user, snap.exists() ? snap.data() : null);
    } catch {
      renderSignedInFallback(user);
    }
  });
}

async function loadCatalog() {
  try {
    const snap = await getDoc(doc(db, "workspace_catalog", "global"));
    if (!snap.exists()) return FALLBACK_CATALOG;
    const raw = snap.data();
    return {
      ...FALLBACK_CATALOG,
      ...raw,
      support: {
        ...FALLBACK_CATALOG.support,
        ...(raw.support || {}),
        businessContacts: {
          ...FALLBACK_CATALOG.support.businessContacts,
          ...(raw.support?.businessContacts || {}),
        },
      },
      modules: {
        ...(raw.modules || {}),
        iris: raw.modules?.iris || FALLBACK_CATALOG.modules.iris,
      },
    };
  } catch {
    return FALLBACK_CATALOG;
  }
}

function bindSearch() {
  elements.search?.addEventListener("input", () => {
    const query = String(elements.search.value || "").trim().toLowerCase();
    elements.searchableCards.forEach((card) => {
      const haystack = `${card.dataset.search || ""} ${card.textContent || ""}`.toLowerCase();
      card.classList.toggle("search-hidden", !!query && !haystack.includes(query));
    });
  });
}

function applyCatalogCopy(catalog) {
  const moduleConfig = catalog.modules.iris || FALLBACK_CATALOG.modules.iris;
  const support = catalog.support || FALLBACK_CATALOG.support;
  const contacts = support.businessContacts || FALLBACK_CATALOG.support.businessContacts;
  document.title = `Iris | ${moduleConfig.label || "Encompax Finance Controls"}`;
  elements.moduleStatusLabel.textContent = moduleConfig.statusLabel || "Staging prep";
  elements.launchModeLabel.textContent = moduleConfig.launchMode === "roadmap" ? "Roadmap and rollout preparation" : "Workspace-routed release";
  elements.supportDeskLabel.textContent = support.rolloutDeskLabel || FALLBACK_CATALOG.support.rolloutDeskLabel;
  elements.rolloutDeskValue.textContent = support.rolloutDeskLabel || FALLBACK_CATALOG.support.rolloutDeskLabel;
  elements.supportEmailValue.textContent = contacts.supportEmail || support.defaultEmail;
  elements.billingEmailValue.textContent = contacts.billingEmail || "billing@encompax.com";
  elements.securityEmailValue.textContent = contacts.securityEmail || "security@encompax.com";
  elements.helpLink.href = support.helpHref || FALLBACK_CATALOG.support.helpHref;
  elements.faqLink.href = support.faqHref || FALLBACK_CATALOG.support.faqHref;
  elements.privacyLink.href = support.privacyHref || FALLBACK_CATALOG.support.privacyHref;
  elements.termsLink.href = support.termsHref || FALLBACK_CATALOG.support.termsHref;
  setMailLink(elements.footerSupportLink, contacts.supportEmail || support.defaultEmail);
  setMailLink(elements.footerBillingLink, contacts.billingEmail || "billing@encompax.com");
  setMailLink(elements.footerSecurityLink, contacts.securityEmail || "security@encompax.com");
  renderPackageCopy(catalog.packages || [], moduleConfig.packageKeys || ["team", "enterprise"]);
}

function renderPackageCopy(packages, keys) {
  const packageMap = new Map(packages.map((item) => [item.key, item]));
  const html = keys.map((key) => packageMap.get(key)).filter(Boolean).map((item) => `
    <div class="package-card">
      <span class="package-label">${escapeHtml(item.label || item.key)}</span>
      <strong>${escapeHtml(item.title || item.label || "Governed package")}</strong>
      <p>${escapeHtml(item.description || "")}</p>
    </div>
  `);
  if (html.length) elements.packageGrid.innerHTML = html.join("");
}

function renderSignedOutState() {
  elements.userGreeting.textContent = "Hello, operator";
  elements.signedInPostureLabel.textContent = "Profile required";
  elements.accessHeading.textContent = "Start in the shared Encompax identity layer, then open the Iris workflow desk";
  elements.accessBody.textContent = "Iris should use the same shared Encompax identity layer as the rest of the platform so finance access, rollout posture, support routing, and future governed seat versions stay attached to one account.";
  elements.accessPill.textContent = "Auth required";
  elements.accessPill.className = "pill";
  elements.profilePanel.classList.add("hidden");
  elements.primaryLaunchLink.href = "/workflow.html";
  elements.primaryLaunchLink.textContent = "Open Iris workflow desk";
}

function renderSignedInState(user, profile) {
  const moduleAccess = String(profile?.moduleAccess?.iris || "pending").toLowerCase();
  const active = moduleAccess === "active";
  elements.userGreeting.textContent = `Hello, ${getFirstName(user.displayName || profile?.displayName || user.email || "Operator")}`;
  elements.signedInPostureLabel.textContent = active ? "Workspace connected" : "Workspace review pending";
  elements.profilePanel.classList.remove("hidden");
  elements.profileName.textContent = user.displayName || profile?.displayName || "Encompax operator";
  elements.profileEmail.textContent = user.email || profile?.email || "No email available";
  elements.profileOrganization.textContent = profile?.organization || "Pending organization";
  elements.profileModuleAccess.textContent = active ? "Active workspace access" : "Pending rollout review";
  elements.profilePreferredModule.textContent = profile?.preferredModule || "iris";
  elements.orgStatusPill.textContent = active ? "Module active" : "Module pending";
  elements.orgStatusPill.className = active ? "pill success" : "pill warning";
  elements.accessHeading.textContent = active ? "Your Iris workspace is connected and the finance desk is ready" : "Your Encompax account is active and Iris is still in controlled rollout";
  elements.accessBody.textContent = active
    ? "Use the shared Encompax workspace to keep finance posture, support routing, governed seat history, and cross-module expansion attached to one account layer."
    : "Iris is attached to your Encompax profile, but the finance workflow lane is still maturing before broad live access should open.";
  elements.accessPill.textContent = active ? "Workspace ready" : "Staging prep";
  elements.accessPill.className = active ? "pill success" : "pill warning";
  elements.primaryLaunchLink.href = "/workflow.html";
  elements.primaryLaunchLink.textContent = active ? "Open Iris workflow desk" : "Review Iris workflow posture";
}

function renderSignedInFallback(user) {
  elements.userGreeting.textContent = `Hello, ${getFirstName(user.displayName || user.email || "Operator")}`;
  elements.signedInPostureLabel.textContent = "Workspace connected";
  elements.accessHeading.textContent = "Your Encompax account is signed in";
  elements.accessBody.textContent = "We could not load the full workspace profile right now, but Iris should still begin from the shared Encompax workspace where approvals and support routing live.";
  elements.accessPill.textContent = "Profile partial";
  elements.accessPill.className = "pill warning";
  elements.primaryLaunchLink.href = "/workflow.html";
  elements.primaryLaunchLink.textContent = "Open Iris workflow desk";
}

function setMailLink(element, value) {
  if (!element || !value) return;
  element.href = `mailto:${value}`;
  element.textContent = value;
}

function getFirstName(value) {
  return String(value || "Operator").trim().split(/\s+/)[0];
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
