# Iris Finance Controls

Iris Finance Controls is an Encompax module for managing P&L drivers, cost centers, CAPEX projects, and financial controls.

## Repository structure

- `apps/web`: lightweight static web interface
- `apps/api`: API surface for finance control planning and governance workflows
- `services/agent`: governance-aware assistant service stub
- `services/repo`: persistence and business logic for financial entities
- `services/db`: SQLite initialization and helper functions
- `packages/shared`: shared domain contracts and schema definitions

## Quick start

1. Install Node.js 20+
2. Run the API server:
   - `npm run dev:api`
3. In a second terminal, run the web server:
   - `npm run dev:web`
4. Open `http://localhost:3000`

The API health endpoint is available at `http://localhost:3001/health`.

## Focus areas

- P&L and cost center planning
- CAPEX project tracking and approvals
- budgeting and variance monitoring
- embedded governance review workflows
