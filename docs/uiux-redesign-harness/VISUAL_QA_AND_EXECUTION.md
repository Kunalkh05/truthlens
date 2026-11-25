# Visual QA and Execution Protocol

This guide gives Antigravity a concrete sequence for redesigning and checking the existing interface. Follow the steps in order and report any real limitation with evidence.

## A. Baseline inventory

Before editing:

1. Confirm the repository root and read AGENTS.md, GEMINI.md, README.md, package.json, and local design instructions.
2. Read the page shell, all UI components, global styles, and the handlers/API calls those components use.
3. Identify whether localhost is already serving this repository. Reuse it when possible. Otherwise start the existing development server; do not start duplicate processes.
4. Capture the initial desktop and mobile screens. Use a browser screenshot or equivalent visual browser tool, not code inspection alone.
5. Build a matrix of views, actions, real data, and states.

### Required view/state matrix

| Area | Inspect the real interface and behavior |
| --- | --- |
| App shell | Analyze/History/Settings selection, theme toggle, new analysis, narrow navigation |
| Intake | Media/link/claim modes; upload preview, file errors, form validation, consent, retention, disabled/submitting, sample report |
| Progress | Waiting, active stages, completion transition, cancellation, polling/network error |
| Result | Each assessment label, evidence summary, confidence/coverage, provenance, media findings, claim findings, sources, methodology, report ready, delete confirmation |
| History | Populated, empty, loading, error, refresh, open, delete, new analysis |
| Settings | Provider status, key set/replace/revoke, write-only warning, retention/data lifecycle controls, save/error/success |
| Sample report | Load the labeled sample, inspect its result state, and return to a new analysis |

Use local mock mode or safe fixtures. Do not create false data in the product to fill an empty view. If a state cannot be reached safely, inspect its code and report the limitation.

## B. Design plan checkpoint

Write a compact design note before implementation. Include:

- Product-specific design concept and audience.
- Primary user journey and the visual hierarchy that supports it.
- Four to six named colors with actual hex values and semantic roles.
- Type roles, spacing scale, page widths, grid, component surfaces and interaction states.
- One useful visual signature tied to provenance, evidence comparison, or source traceability.
- A short self-critique: identify at least three generic defaults that were considered and explain how the chosen concept avoids them.

Do not ask for approval. The design note is an internal implementation artifact. Keep it concise and use it to check consistency as work proceeds.

## C. Implementation order

1. Establish design tokens and global type/spacing rules.
2. Redesign app shell and navigation.
3. Redesign intake modes and form states.
4. Redesign progress and error states.
5. Redesign result information hierarchy and evidence details.
6. Redesign History, Settings, and the labeled sample report state.
7. Refine small-screen layouts, keyboard interactions, motion, and all component states.
8. Review the diff for accidental changes outside the frontend scope.

Use shared components/tokens where they reduce inconsistency. Avoid one-off hardcoded colors and spacing throughout the component tree. Do not force unrelated parts into the same card pattern.

## D. Browser review matrix

Take after screenshots at the same sizes as the baseline:

- Desktop: 1440×900.
- Tablet/small laptop: 1024×768.
- Narrow mobile: 390×844.

Review these actual routes or app states at minimum:

- Analyze initial state and each input mode.
- Upload selected/preview and validation state if available.
- Progress active state and error/cancel path.
- A real local result with media and claim evidence sections.
- History populated and empty state when safely available.
- Settings including provider status and a safe key-entry state without entering a real key.
- Load the labeled sample report, inspect its result state, and return to a new analysis.

Check full-page scroll, horizontal overflow, sticky elements, long citations, long filenames, hashes, tables, dialog bounds where dialogs exist, and content zoom/reflow. Compare screenshots side by side. Make another correction pass if repeated alignment, density, or hierarchy issues remain.

## E. Interaction and accessibility checks

Use keyboard only to:

- Move through navigation and every primary action.
- Switch input modes and submit a valid local fixture.
- Trigger and dismiss errors.
- Open and dismiss any existing dialog and verify focus return; verify the sample-report action and sample label.
- Expand evidence details, open citations, export/download reports, and confirm or cancel deletion where safe.
- Navigate Settings controls without exposing or entering credentials.

Also check:

- Visible focus never clipped or hidden.
- Logical tab order, heading order, landmarks, labels, descriptions, and error announcements.
- Dialog semantics, focus management, Escape behavior, and background inertness where applicable.
- Contrast for text, status colors, borders, focus, and icons.
- Statuses remain understandable without color.
- Text zoom and reflow without overlap.
- Reduced-motion preference.
- Touch target sizing and mobile control spacing.

Treat WCAG 2.2 AA as the target. Document any item that cannot be checked in the available browser environment.

## F. Functional and build verification

Run existing repository checks only after the UI pass. Inspect scripts before invoking them. At minimum, use the existing lint/build and relevant test scripts if they are available and safe. Do not create a new testing framework just for this redesign.

Exercise the real app behavior through local APIs or browser flow:

- Submit each supported input with safe local data.
- Follow actual progress and cancellation behavior.
- Load result details and inspect evidence/source links.
- Generate and download a report if local mock mode supports it.
- Delete only a disposable local test analysis and confirm expected history behavior.
- Refresh/open history records.
- Check provider status and form behavior without entering a credential.
- Confirm theme switching and persistence.

Never use a real API key, upload private user media, point to production, or send project data to an external service. Avoid destructive operations against existing user records; use disposable local test data only. Record pre-existing failures separately from redesign regressions.

## G. Final pass and evidence

Before declaring done:

- Compare before/after screenshots at the same viewport.
- Revisit every accepted requirement in UI_UX_REQUIREMENTS.md.
- Run the installed web interface review skill on changed frontend code and fix actionable findings.
- Read the diff and confirm that server, API, database, auth, provider, SKM, and forensic logic were not changed inadvertently.
- Remove temporary credentials, private media, or unwanted generated files from screenshots/evidence.
- Save screenshots under artifacts/uiux/before and artifacts/uiux/after where supported.
- Ensure any package-installed skills are project-local and no global configuration changed.

## Completion report template

State:

- Design direction chosen and why it fits TruthLens.
- Screens and interactions redesigned.
- Functional flows and viewport sizes checked.
- Accessibility checks completed and any remaining issue.
- Existing commands run and their actual pass/fail results.
- Exact before/after screenshot paths.
- Changed files and reviewed skill sources.
- Any concrete blocker that could not be resolved locally.

A plan, a source diff, or a successful build alone is not proof that the interface looks correct. Verify the rendered interface.
