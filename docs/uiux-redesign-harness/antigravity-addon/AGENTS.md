# TruthLens AI — UI Redesign Guardrails

- This is an existing working product. Redesign its UI; do not rebuild or replace product logic.
- Read UI_UX_REQUIREMENTS.md and VISUAL_QA_AND_EXECUTION.md before editing frontend files.
- Preserve the existing intake types, consent and retention behavior, progress/cancel flow, results, citations, history, provider settings, vault behavior, report export, and deletion.
- Keep API, database, authentication, forensic analysis, provider routing, and SKM code unchanged unless a minimal UI adapter is necessary.
- Never expose, prefill, log, or persist provider secrets in browser storage.
- Never invent analysis findings, sources, confidence, usage metrics, progress percentages, ETAs, or capabilities.
- Use local mock data only. Do not call production services or upload real user media.
- Use a product-specific design system; avoid generic template layouts, decorative AI motifs, repeated identical cards, and color-only status.
- Target WCAG 2.2 AA, keyboard operation, visible focus, mobile reflow, and reduced motion.
- Capture and inspect before/after browser screenshots. Verify the rendered app and real local interactions.
- Install skills only in .agents/skills after checking source, license, scope, and instructions. Never install broad unrelated bundles or modify global config.
- Preserve pre-existing user changes. Keep the final diff focused and explain any exception.
