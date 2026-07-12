# Iris Rollout Readiness Audit

Last updated: July 12, 2026

## Current repo posture

- Local path: `D:\projects\Iris-Finance-Controls`
- Remote: `https://github.com/Encompax/Iris-Finance-Controls.git`
- Current local branch: `iris-finance-scaffold-base`
- Remote tracking: `origin/iris-finance-scaffold-base`
- Published default branch on remote: `main`
- Recent commit shared by the visible branches: `0f94a58` (`Initial commit`)
- Local working tree: not clean

## Evidence gathered

- Top-level local structure exists: `apps`, `services`, `data`, `tests`
- Local runtime smoke test passed:
  - `http://127.0.0.1:3003/` returned `200`
  - `http://127.0.0.1:3002/health` returned `{"status":"ok","service":"iris-finance-controls-api"}`
- Basic UI files exist:
  - `apps/web/public/index.html`
  - `apps/web/public/admin.html`
- Basic governance API exists:
  - `apps/api/server.js`
- Governance support files exist:
  - `services/agent/governanceWorkflow.js`
  - `services/agent/governanceStore.js`
  - `services/agent/databaseStore.js`
  - `services/agent/auth.js`
  - `services/agent/providerAdapter.js`

## Current gaps

- The public GitHub repo still looks nearly empty from the default branch perspective
- No local `README.md` exists in this scaffold branch
- `package.json` is still placeholder-quality
  - no real metadata
  - no working test script
- No Firebase hosting files were found locally during this audit
- No shared Encompax shell contract is present
- No signed-in Encompax workspace identity is wired into the module
- No financial workflow depth exists yet beyond governance-case scaffolding

## Local branch and publication posture

Visible branches:

- `main`
- `iris-finance-scaffold`
- `iris-finance-scaffold-base`
- `master`

Important interpretation:

- Iris is more real locally than the public repo landing page suggests
- The rollout risk is not that Iris has nothing at all
- The real risk is branch confusion and a weak publication baseline

## Test posture

- `npm test` currently fails by design because the script is still the default placeholder:
  - `echo "Error: no test specified" && exit 1`

## Readiness assessment

### What is real today

- Iris has a runnable local scaffold
- Iris already has an API shell, admin page, and governance-case mechanics
- The repo can be shaped into a finance rollout surface without starting from zero

### What is not ready yet

- Branch normalization
- Public documentation
- Shared shell and branding contract
- Financial module workflow definition
- Package posture and support language
- Deploy manifests
- Meaningful tests

## Recommended rollout order

1. Fusion first
2. Iris second

Reason:

- Iris needs one cleanup pass just to establish a trustworthy baseline
- Fusion is ready for direct shell hardening now
- Iris should follow once its scaffold branch is normalized and turned into a clear rollout surface

## Recommended next implementation pass

1. Keep Iris on the current scaffold branch for now and treat it as the working base
2. Add shared Encompax federation shell, support, and workspace identity contract
3. Define first finance workflow lanes before deeper backend expansion:
   - P&L visibility
   - labor planning controls
   - CAPEX request routing
   - cost center review
4. Add Firebase hosting files for `iris.encompax.io`
5. Replace placeholder package/test metadata with rollout-safe project metadata
