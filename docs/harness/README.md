# TruthLens AI — Antigravity CLI Harness

Version: 1.0 · Updated: 2026-11-24

This package is a build specification for a deployable media verification product. Start with `MASTER_HARNESS.md`; it directs the autonomous build and links the supporting specifications. The docs describe intended product behavior and architecture, not claims that models can conclusively determine truth.

## Package

- `MASTER_HARNESS.md` — copy-ready autonomous build prompt and execution protocol.
- `PRD.md` — users, scope, workflows, and product requirements.
- `UI_UX.md` — information architecture, visual system, interaction and accessibility requirements.
- `ARCHITECTURE.md` — services, provider routing, SKM vault, forensics and news verification.
- `API_DATA.md` — API contracts and persistence model.
- `OPERATIONS.md` — agent roles, skills/MCP discovery, testing, security, deployment, CI/CD and acceptance.

## Run

Place this folder in the project repository, then launch Antigravity CLI at the repository root and paste `MASTER_HARNESS.md` into the agent. The agent should discover repository-specific instructions first and execute the plan without asking routine questions. Credentials are supplied by the operator through the deployment secret manager; this package contains no real keys.

Official references consulted: [Antigravity CLI features](https://antigravity.google/docs/features), [CLI MCP](https://antigravity.google/docs/cli/mcp/), [Agent skills](https://antigravity.google/docs/skills), [Changelog](https://antigravity.google/docs/changelog). CLI capabilities evolve; verify current command syntax and supported configuration against official docs at build time.
