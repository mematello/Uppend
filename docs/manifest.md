# Documentation Manifest

This manifest tracks the repository's documentation files (the memory layer), their purpose, and their approximate token footprint to help manage context windows.
(Note: Token sizes are estimated as byte count divided by 4).

| File Path | Purpose | Rough Token Size | Last Updated |
| :--- | :--- | :--- | :--- |
| `README.md` | Main project entry point and setup instructions. | ~2,959 | 2026-10-04 (Session 24) |
| `AGENTS.md` | System prompt rules and constraints for AI agents. | ~946 | 2026-10-23 (Session 29 close) |
| `docs/current_state.md` | Single source of truth for current project status and active tasks. | ~4,960 | 2026-10-31 (Session 33 close) |
| `docs/manifest.md` | This file; index and token budget of all documentation. | ~510 | 2026-10-31 (Session 33 close) |
| `docs/project_overview.md` | High-level summary of the product and its goals. | ~355 | 2026-08-25 |
| `docs/architecture.md` | System architecture, tech stack, and core patterns. | ~3,275 | 2026-10-31 (Session 33 close) |
| `docs/design.md` | Single source of truth for Uppend's visual language and tokens. | ~14,520 | 2026-10-31 (Session 33 close) |
| `docs/schema.md` | Database schemas, RLS policies, and Postgres functions. | ~2,439 | 2026-10-09 (Session 26 close) |
| `docs/changelog.md` | Append-only log of shipped work and resolved issues. | ~14,540 | 2026-10-31 (Session 33 close) |
| `docs/decisions.md` | Append-only log of architectural and technical trade-offs. | ~26,260 | 2026-10-31 (Session 33 close) |
| `docs/prompts.md` | AI extraction and matching prompt templates. | ~981 | 2026-08-19 |
| `docs/archive/sessions/2026-08-19-context_handoff.md` | Archived context from previous sessions. | ~270 | 2026-08-19 |

## New files added in Session 33

| File Path | Purpose |
| :--- | :--- |
| `components/onboarding/OnboardingBackdrop.tsx` | Purely decorative ruled-paper backdrop (faint 32px grid on `--paper` using `--hairline-subtle`). `aria-hidden`, no state, no data fetching, no focusable children. `absolute inset-0 overflow-hidden pointer-events-none select-none`. |
