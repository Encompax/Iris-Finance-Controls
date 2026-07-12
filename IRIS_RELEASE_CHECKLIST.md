# Iris Release Checklist

Last updated: July 12, 2026

## Before first public release

- Confirm `iris.encompax.io` is pointed to the `encompax-iris` hosting site
- Verify the shared Encompax shell loads from `apps/web/public`
- Verify favicon, header, search shell, and support links match platform standards
- Verify signed-out users route into Encompax workspace/account flow
- Verify signed-in users show the correct greeting and finance rollout posture
- Confirm support emails resolve to:
  - `support@encompax.com`
  - `billing@encompax.com`
  - `security@encompax.com`

## Before broader rollout

- Decide the first live finance workflow lane
- Replace placeholder package metadata and default test script
- Confirm which branch should become the clean publication baseline
- Add finance-specific operator workflows before promising broader control coverage
- Decide whether admin/governance-only features stay internal during the first release

## Human go-live review

- Confirm module copy is rollout-safe and not overstating finance completeness
- Confirm package posture matches the live Encompax workspace catalog
- Confirm expansion language aligns with Fusion, SIL, Marengo, Kardia, and later agent rollout
