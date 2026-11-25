# UI/UX and Design System

## Direction

Design TruthLens as a credible consumer verification workspace: calm, modern, fast, and legible. Avoid alarmist red verdict screens, sci-fi dashboards, decorative gradients, dense telemetry, and certainty theater. Default to a refined dark theme with a complete light theme; remember preference. Use a compact navigation: Analyze, History, Settings. A clear “New analysis” action remains prominent.

## Layout and screens

- **Home/analyze:** plain-language value statement, tabs for Upload / Link / Claim, supported limits, privacy note, recent analyses, and sample report clearly labeled as sample.
- **Upload:** drag/drop plus browse, filename/type/size, preview where safe, remove/replace, consent/retention notice, submit state, progress, and actionable validation errors.
- **Analysis status:** queued, extracting, checking provenance, searching sources, synthesizing, complete/partial/failed; stage names and elapsed time without fake percentage precision.
- **Result:** assessment band (Supported / Mixed / Unverified / Contradicted / Insufficient evidence), separate media-signal panel, short summary, evidence and counter-evidence, timeline, source cards, methods/limitations, and report export. Every conclusion links to supporting evidence and timestamp.
- **History/settings:** filters, empty/loading/error states, deletion confirmation, retention, provider readiness, and role-specific controls.

## Visual tokens

Use semantic CSS variables, not scattered hex values. Suggested palette: deep ink canvas, elevated slate surfaces, warm-white primary text, muted cool-gray secondary text, restrained cyan/blue action accent, and semantic green/amber/red only with labels/icons. Meet WCAG AA contrast; never rely on color alone. Typography: system or licensed sans with clear 12/14/16/20/28/36 scale, readable line lengths, tabular numerals for metadata. Spacing on an 8px base; consistent 8–16px radii; subtle 1px borders; restrained shadows. Define tokens for color, type, spacing, radius, elevation, focus, motion, and breakpoints.

## Components and interaction

Use the project's existing component system; if none, choose a maintained accessible library such as shadcn/ui with a compatible primitive layer. Create reusable button, field, dropzone, tabs, status badge, evidence card, source citation, confidence/coverage indicator, timeline, toast, dialog, skeleton, and empty/error states. Motion is brief and reduced-motion aware. Preserve focus after dialogs, expose live progress to assistive technology, and provide visible focus rings. Do not block keyboard navigation or use hover-only actions.

## Responsive and accessibility

Mobile-first: one-column result with collapsible evidence sections; tablet two-column where useful; wide desktop readable max-width. Touch targets at least 44px where practical. Semantic headings, labels, error association, alt text, captions/transcripts for media previews, keyboard operation, screen-reader status announcements, and reduced motion. Test at narrow mobile, tablet, and desktop widths plus 200% zoom.

## Content rules

Use “signals suggest,” “we found,” “could not verify,” and “evidence is limited.” Explain that a model score is not probability of truth unless empirically calibrated for the specific task and population. Include evidence date and analysis version. Never use “fake” as a definitive badge based only on one model output.
