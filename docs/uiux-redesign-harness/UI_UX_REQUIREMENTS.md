# TruthLens AI — UI/UX Requirements

## 1. Product and audience

TruthLens AI is a decision-support workspace for people examining suspicious images, videos, audio, links, and circulating factual claims. Its interface should feel like a careful investigative tool: precise, calm, transparent about uncertainty, and quick to learn.

The product must help a user answer:

1. What did I submit, and what is the system examining?
2. What did the technical media checks find?
3. What evidence supports or contradicts the claim?
4. How strong and complete is that evidence?
5. What does the system not know?
6. What should I inspect next?

Keep media forensics, cryptographic provenance, claim corroboration, and the overall assessment visibly distinct. They are related evidence streams, not interchangeable conclusions.

## 2. Product-wide experience rules

- Lead with the user’s task and the next action. Do not make the first screen feel like a generic AI-company landing page.
- Use a distinct visual idea grounded in evidence review, provenance, or source comparison. Express it in information structure, type, and one useful visual motif; do not rely on decorative gradients or a stock “AI lab” skin.
- Establish hierarchy through layout, typography, grouping, and restrained color. Do not wrap every section in the same rounded card.
- Use real application content and real data states. Never invent numbers, citations, quotes, credibility scores, activity, customer logos, or analysis results.
- Preserve all existing behaviors and labels where the behavior depends on them. Improve confusing language only when meaning remains identical.
- Keep specialist detail discoverable without hiding the main finding or overloading a first-time user.
- Explain technical terms at the point they matter. Avoid unexplained acronyms; for example, introduce Coalition for Content Provenance and Authenticity (C2PA) before using the abbreviation alone.
- Treat uncertainty as product information, not as a design flaw. Make limitations and missing evidence visible.
- Use semantic color consistently. Color must never be the sole signal for a status.
- Use motion sparingly and only when it clarifies a user-triggered change. Respect prefers-reduced-motion.

## 3. Screen and state requirements

### Global shell

- Make the product identity, current section, and primary action easy to locate.
- On narrow screens, keep navigation and new-analysis actions accessible without crowding or clipping.
- Theme controls need an accessible name and persistent behavior consistent with the app.
- Use clear active, hover, pressed, disabled, and focus states.

### Analyze / intake

Support the actual inputs implemented by the application: media files, web links, and text claims. Verify exact file types, size limits, and consent/retention fields from source.

- Make mode selection understandable, keyboard operable, and visually distinct.
- For upload, provide a large but restrained drop area, an ordinary browse button, clear format/size limits, selected-file name/size, removable selection, and image preview when applicable.
- Drag-and-drop must have a keyboard-accessible browse equivalent. File errors should identify unsupported format or size and tell the user what to do.
- For URL and claim input, provide persistent labels, examples only when accurate, useful validation, and clear character/format expectations.
- Keep external processing consent and retention controls explicit and readable before submission. Do not hide them behind ambiguous legal copy.
- Make the primary submit action visually clear and accurately named for the selected mode. Prevent duplicate submissions and expose progress to assistive technology.
- Keep sample report and recent-item links secondary to the main task.
- On mobile, controls should not require precision gestures and the drop zone must still provide a simple tap-to-browse path.

### Analysis progress

- Show only real analysis stages and statuses from the application.
- Distinguish completed, active, waiting, and failed stages with text/icon/state semantics.
- Explain what is happening in plain language. Do not fake a percent-complete value or countdown.
- Keep cancel behavior clear and confirm only if the existing behavior or data loss warrants it. Explain what cancellation does.
- Provide a stable error/retry or return path when polling or processing fails.

### Results

- Put the overall assessment and plain-language summary first. Explain confidence and evidence coverage in nearby copy or a definition control.
- Show media signals, provenance, claim evidence, source citations, and methodology as separate sections. Each section should answer a different question.
- Make citation title, publisher/domain, date when provided, excerpt, and source link easy to inspect. Links must retain safe rel behavior when opened in a new tab.
- Do not present an absent provenance manifest as evidence of manipulation. Use neutral labels that accurately reflect status.
- Do not imply that a model score is a probability of truth unless its data contract explicitly says so.
- Keep hashes and technical metadata available and copyable without letting them dominate the page.
- Export status, checksum, download link, and delete confirmation should be perceivable and usable by keyboard and screen readers.
- Empty findings, unavailable sources, low coverage, conflicting evidence, and insufficient evidence need distinct explanations and a sensible next step.
- Reassure through traceability and honest limitations, not unsupported trust badges.

### History

- Make each item distinguishable using real input type, date/status, and available summary.
- Support the existing open, refresh, delete, and new-analysis actions. Keep destructive actions visually distinct and confirm where appropriate.
- Provide useful empty, loading, and error states. Do not fabricate example rows to make the page look populated.
- If filters or sorting already exist, preserve them and make their state visible. Do not add fake controls.

### Settings and secure provider vault

- Clearly label Gemini as primary and OpenRouter as secondary only if that is what the existing provider configuration actually does.
- Show provider setup status without exposing a credential. A saved key is write-only: never prefill, echo, reveal, log, or store it in browser storage.
- Explain what happens when a provider is enabled or unavailable and which provider is used for fallback, based on actual code.
- Keep save/revoke actions explicit, scoped to a provider, and confirm state changes.
- Explain retention/data lifecycle settings in plain terms, matching existing behavior.
- Do not add a key field to global navigation or onboarding before the user understands why it is needed.

### Labeled sample report

- Preserve the existing action that loads the sample result into the result view.
- Keep the sample label visible while the sample is displayed; make it unmistakable that the data is illustrative, not a real analysis.
- Keep sample loading reversible through the app's existing new-analysis action. Do not add a modal unless the current product behavior calls for one.
- Keep sample citations and fixture content clearly identified as sample content; do not present them as newly retrieved evidence.

## 4. Visual system requirements

Before implementation, produce a compact, written design direction specific to this product.

### Tokens

Define and use semantic tokens for:

- Canvas, primary surface, secondary/elevated surface, border, primary text, secondary text, muted text.
- Primary action, focus, information, positive, caution, negative, and neutral statuses.
- Typography roles and a deliberate type scale.
- Spacing, content widths, grid/gutter, control heights, radii, and elevation.
- Responsive breakpoints aligned with content needs rather than framework defaults alone.

Give the core palette 4–6 named values with hex codes and document contrast checks. Avoid a palette made only of saturated blue/cyan/purple on near-black. Avoid using the same accent for every status.

### Typography and density

- Use no more than two type families without a strong product-specific reason. Prefer reliable bundled/local fonts or system fonts; do not make the interface depend on a third-party font request.
- Use a readable body size and line length. Use tabular numerals for aligned metrics where helpful.
- Use monospace only where characters themselves matter, such as hashes or identifiers.
- Align labels, values, units, and confidence definitions consistently.
- Fit evidence content at desktop without excessive blank space, while preserving breathing room and mobile readability.

### Components

Define consistent patterns for buttons, icon buttons, tabs, fields, notices, status labels, tables/lists, progress stages, accordions/details, dialogs, and evidence/source rows. Every pattern needs hover, focus, active, disabled, and error states where relevant.

Use lucide-react only as a visual aid. Icons need labels or accessible names and should not replace the words that convey meaning.

### Anti-template review

Before coding, inspect the design concept for these default-looking patterns:

- Generic centered marketing hero with a slogan, gradient wash, and floating statistic cards.
- Every data group in the same rounded card with the same shadow.
- Decorative charts or “live” metrics with no backing data.
- Purple/blue/cyan gradients, glass panels, glow borders, or sparkle motifs used as generic AI shorthand.
- Repeated all-caps eyebrow headings, monospace labels for everything, or fake editorial numbering.
- Uniform fade/slide animation on page load and hover movement on every component.
- One-size typography and spacing copied from a generic dashboard template.

Remove any element that does not clarify a task, evidence, status, or navigation.

## 5. Accessibility and responsive requirements

Target WCAG 2.2 AA for the redesigned interface.

- Semantic landmarks and a logical heading order.
- Full keyboard access; visible focus that is not hidden by sticky headers or clipped containers.
- Name, role, state, and instructions available to screen readers for controls.
- Form labels remain visible; errors associate with fields and announce when useful.
- Normal text contrast at least 4.5:1, large text at least 3:1, and meaningful non-text UI contrast at least 3:1.
- Statuses use text and/or shape in addition to color.
- Minimum 24×24 CSS px target size under WCAG 2.2 AA; prefer 44×44 CSS px for primary touch targets when layout permits.
- Support text zoom/reflow and narrow viewports without horizontal page scrolling.
- Respect reduced motion, high contrast settings, and browser zoom.
- Do not auto-play audio/video or force motion that could distract from inspecting media.

Check at minimum 1440×900, 1024×768, and 390×844 viewports, plus keyboard-only navigation.

## 6. Copy standards

- Use sentence case, direct verbs, and short, concrete explanations.
- Keep each message to one job: identify the state, explain what it means, give the next action.
- Use consistent terms for an action throughout its lifecycle (for example, the same verb on a button and success message).
- Replace vague errors with the cause when known and a safe recovery action.
- Do not market the model as an authority. Prefer evidence-oriented language: “Signals found,” “Sources reviewed,” or “Evidence is limited.”
- State what the system did and did not inspect. Never imply comprehensive verification if only some sources or media checks ran.

## 7. Acceptance criteria

The redesign is acceptable when:

1. Every existing screen and important state listed above has a deliberate, consistent, responsive design.
2. A first-time user can select an input, understand processing consent/retention, submit, follow progress, and interpret the result without guessing.
3. Evidence sources and technical forensic signals remain distinct, traceable, and correctly qualified.
4. All existing user actions still work against the same application handlers and APIs.
5. No fabricated result, source, metric, or UI control has been introduced.
6. Keyboard, screen-reader labels, focus, color contrast, and reduced-motion behavior pass the stated checks.
7. Screenshots at the required widths show no clipping, overlap, unreadable density, or accidental horizontal scrolling.
8. Existing lint/build and relevant tests pass, or any unrelated pre-existing failure is clearly identified with evidence.
