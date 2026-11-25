---
name: truthlens-ui-ux-redesign
description: Redesign and review the existing TruthLens AI frontend with a distinct professional visual system while preserving its real flows, evidence semantics, accessibility, and local safety boundaries.
---

# TruthLens AI UI/UX Redesign

Use this skill whenever changing or reviewing the TruthLens AI frontend, design system, UX copy, responsive behavior, or accessibility.

## Required workflow

1. Inspect the real app, current styles, repository instructions, and every relevant action before changing code.
2. Map existing screen states and trace key controls to their handlers. Treat source behavior as authoritative.
3. Capture browser screenshots before editing when possible.
4. Define a product-specific design concept, semantic tokens, type roles, layout rules, and component states before implementation.
5. Apply the smallest frontend-focused change that achieves the design. Preserve handlers, API payloads, data, security, and server behavior.
6. Review the rendered app at desktop, tablet, and mobile sizes. Correct the UI based on screenshots.
7. Audit keyboard operation, semantic markup, focus, contrast, status semantics, reduced motion, and responsive reflow.
8. Review the final diff for unrelated changes and report the real verification performed.

## Product facts and semantic boundaries

TruthLens examines media and factual claims using distinct evidence sources: technical media signals, provenance, claim corroboration, and source citations. Keep those evidence streams distinct in the interface. Represent only values actually returned by the application.

- Absence of a C2PA/content provenance record does not prove manipulation.
- A model confidence band or coverage score is not automatically a probability that the claim is true.
- “Insufficient evidence,” “unverified,” “mixed,” “supported,” and “contradicted” must retain the meaning defined in the existing code.
- State what was checked and what was unavailable.
- Never fabricate citations, evidence, confidence, progress, providers, or metrics.
- Label sample reports as samples.
- Provider keys are write-only secrets: never show them, prefill them, log them, or put them in local storage.

## Visual direction

- Make deliberate visual choices grounded in careful evidence review and source traceability.
- Establish hierarchy with type, alignment, spacing, and selective emphasis.
- Use color semantically and include readable non-color status cues.
- Build a consistent set of tokens and shared component patterns.
- Avoid using generic SaaS cards, decorative gradients, glow effects, glass surfaces, purple/blue AI motifs, oversized marketing hero sections, or repeated animation by default.
- Keep one memorable visual detail only when it helps users understand provenance, sources, or evidence relationships.
- Use motion only when it clarifies a user action and respect prefers-reduced-motion.

## Interaction and accessibility

- Preserve every existing control and make it operable by keyboard and touch.
- Give inputs persistent labels, useful errors, and visible states.
- Keep focus visible and logical; manage modal focus entry, dismissal, and return.
- Target WCAG 2.2 AA contrast, semantics, reflow, and target-size requirements.
- Never rely on color alone for meaning.
- Ensure long citations, filenames, identifiers, and evidence text wrap or scroll safely on mobile.

## Source and scope safety

- Prefer project-local changes in src/app, src/components, and existing style/assets.
- Do not rewrite backend APIs, database, auth, forensic logic, provider routing, or SKM vault.
- Do not use production services, real credentials, or private media for UI verification.
- Install third-party skills only when their publisher, source, license, instructions, and scope are clear; keep installs project-local.
- Preserve pre-existing user changes and explain any necessary scope exception.

## Review checklist

Before completion, check:

- Analyze, History, Settings, progress, results, and sample report states.
- Desktop, tablet, and narrow-mobile screenshots.
- Upload/link/claim controls and consent/retention information.
- Result evidence hierarchy, sources, limitations, export, and deletion.
- Provider status and write-only credential interaction without a real key.
- Keyboard flow, focus, semantics, form errors, dialogs, contrast, reduced motion, and zoom/reflow.
- Existing app lint/build and relevant checks when available.
- Final diff and any remaining issue.
