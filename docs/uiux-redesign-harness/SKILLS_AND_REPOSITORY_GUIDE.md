# Skills and Repository Guide

## 1. Existing application map

The target project is the existing application at:

    /Users/kunalkhande/Project /TruthLens

Open Antigravity CLI from this folder so it receives the project instructions and can discover the local skill. The app uses Next.js 15, React 19, Tailwind CSS 3, TypeScript, and lucide-react. Keep the existing stack.

Primary UI entry points in this project:

- src/app/page.tsx — app shell, Analyze/History/Settings tabs, state transitions, and the labeled sample report fixture.
- src/app/globals.css — global typography, theme tokens, focus, and reduced-motion styling.
- src/components/layout/Navbar.tsx — navigation and theme controls.
- src/components/analyze/AnalysisForm.tsx — media, URL, and claim intake, consent, retention, and the load-sample action.
- src/components/analyze/ProgressViewer.tsx — real analysis stage progress and cancellation.
- src/components/results/ResultView.tsx — assessment, evidence, provenance, sources, methodology, and report actions.
- src/components/history/HistoryView.tsx — saved analyses and deletion.
- src/components/settings/SettingsView.tsx — Gemini/OpenRouter status, secure provider vault, and data lifecycle controls.
- src/types/domain.ts — frontend domain and API response types.

Related server and domain behavior is under src/app/api and src/lib, including pipeline, providers, security, database, storage, and report generation. Treat these areas as read-only during a visual redesign unless a minimal UI adapter is genuinely necessary. Read current code before assuming what a control does.

This folder already contains older product-wide documents in docs/harness. Use them only as background on existing product capabilities. The UI-only scope and guardrails in this package control the redesign; do not interpret the older full-build harness as permission to rebuild the app.

The specified project folder currently has no .git directory. Do not assume the project is clean, run git commands as if it were a repository, or initialize git. Before changing any existing source file, create a temporary backup of the exact files you plan to edit and preserve all unrelated files.

## 2. How Antigravity finds skills

Google’s current Antigravity docs describe project skills at:

    .agents/skills/<skill-name>/SKILL.md

Workspace skills are shared with the project. Antigravity CLI also reads skills from documented personal directories, but this task should install project skills only. After changing the workspace skill list, run:

    /skills reload

Antigravity rereads rules and skills before turns. Use /agy-customizations to load the official customization guide before creating or changing an agent skill.

## 3. Discover and install targeted skills

The current Vercel Skills CLI supports catalog listing, repository-specific listing, source installs, agent selection, and project-local installs. Inspect its current help and your Node version first. Use only the exact skill slug displayed by the live catalog.

Inspect the curated repositories:

    npx skills add anthropics/skills --list
    npx skills add vercel-labs/agent-skills --list

Install these known design skills when they appear in the catalog:

    npx skills add anthropics/skills --skill frontend-design --agent antigravity-cli --yes
    npx skills add vercel-labs/agent-skills --skill web-design-guidelines --agent antigravity-cli --yes

The Vercel repository also contains React/Next.js implementation guidance. Inspect its live list and add the relevant React best-practice skill using the exact displayed slug. Do not guess a renamed slug.

Search the wider catalog for distinct, relevant coverage:

    npx skills find accessibility
    npx skills find WCAG
    npx skills find design system
    npx skills find UX writing
    npx skills find responsive web design
    npx skills find browser testing
    npx skills find React components

For each result, review the publisher, source repository, last activity, license, skill instructions, external URLs, and requested commands before adding it. Prefer official or well-maintained repositories with clear provenance and narrow scope. Install all clearly relevant, non-duplicative skills that pass review; there is no arbitrary small cap, but skip unrelated skills, overlapping skill bundles, unclear licenses, stale instructions, and anything that asks to expose secrets or send local data elsewhere. Avoid --all and '*' against broad repositories.

Install with --agent antigravity-cli and without --global. Keep a skills-lock.json if the CLI creates one. If the CLI version or Node runtime does not support current skill installation, do not change global tools or weaken security; use the included project skill and consult the official docs directly.

After installation:

    npx skills list
    /skills reload

Inspect the installed .agents/skills folders and invoke the best-matching skills deliberately. Autonomous matching alone is not enough: use frontend design while planning, web-design-guidelines after implementation, and relevant accessibility/UX-writing/design-system skills at the matching stage.

## 4. Recommended skill roles

| Skill role | Why it matters here | Use it for |
| --- | --- | --- |
| Distinctive frontend design | Establishes a product-specific visual concept instead of template defaults | Audit, visual direction, component styling, self-critique |
| Web interface guidelines | Reviews accessibility, forms, focus, motion, semantics, and performance details | Audit changed UI and fix findings |
| Accessibility/WCAG | Adds systematic keyboard, contrast, screen-reader, reflow, and target-size review | Before and after implementation |
| Design system | Creates reusable tokens and component states instead of one-off CSS | Token and component audit |
| UX writing | Improves labels, helper text, errors, consent, and uncertainty language | Intake/results/settings copy |
| React/Next.js patterns | Helps keep existing React work modular and efficient | Implementation review only |
| Browser QA | Checks actual interactions and responsive presentation | Final UI verification |

Do not let a skill overrule the product requirements or the user's request. Skills are reference guidance, not authorization to modify backend behavior or install unrelated tools.

## 5. Included TruthLens skill

The package includes a project-ready skill at:

    antigravity-addon/.agents/skills/truthlens-ui-ux-redesign/SKILL.md

Copy that skill folder into the existing project’s .agents/skills directory. Merge antigravity-addon/AGENTS.md with an existing project AGENTS.md instead of overwriting instructions. Then run /skills reload.

## 6. Multi-agent review

If Antigravity supports parallel agents, use separate read-only roles:

- Product UX reviewer: identify unclear user journeys, decision points, and missing states.
- Accessibility reviewer: inspect semantics, keyboard flow, contrast, focus, and responsive reflow.
- Visual critic: review baseline and proposed/implemented screenshots for generic patterns and weak hierarchy.

Ask reviewers for findings and file/element references. One lead agent owns code changes. Reviewers should not edit the same UI files in parallel. If subagents are not available, do the reviews sequentially.

## 7. Source references

- [Antigravity skills](https://antigravity.google/docs/skills)
- [Antigravity customization discovery and reload behavior](https://antigravity.google/docs/customization-discovery?tab=cli)
- [Antigravity customization command](https://antigravity.google/docs/commands/agy-customizations)
- [Vercel Skills CLI command reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md)
- [Supported agent targets](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)
- [Anthropic frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- [Vercel agent skills](https://github.com/vercel-labs/agent-skills)

Skill catalogs evolve. Confirm each name and supported target with the live source before installing.
