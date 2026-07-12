# Iris Finance Controls

Iris Finance Controls is the Encompax family module for governed finance visibility, labor planning controls, CAPEX request routing, cost center review, and future reviewed operating guidance.

## Current repo state

Iris is currently in scaffold normalization.

The local repo already includes:

- a runnable web shell
- a runnable governance API
- governance-case support services
- a local admin surface

The current goal is to bring Iris onto the same Encompax federation shell contract as SIL, Marengo, Kardia, and Fusion before deeper finance workflow buildout begins.

## Initial rollout direction

Iris should begin with a narrow first release posture:

- P&L visibility
- labor planning controls
- CAPEX request review
- cost center management

That gives Encompax a finance module that is rollout-safe without pretending the entire finance system is feature-complete on day one.

## Local runtime

- web shell: `http://localhost:3003`
- API health: `http://localhost:3002/health`

## Next implementation steps

1. Apply the shared Encompax shell, support, and workspace identity contract
2. Add Firebase hosting config for `iris.encompax.io`
3. Replace placeholder package metadata and test scripts
4. Define the first operator-facing finance workflow lanes
