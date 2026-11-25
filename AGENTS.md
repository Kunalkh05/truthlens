# TruthLens AI — Workspace Instructions

For UI/UX redesign work, this is an existing application. Read these project-specific instructions before changing the frontend:

1. docs/uiux-redesign-harness/MASTER_UIUX_REDESIGN.md
2. docs/uiux-redesign-harness/UI_UX_REQUIREMENTS.md
3. docs/uiux-redesign-harness/SKILLS_AND_REPOSITORY_GUIDE.md
4. docs/uiux-redesign-harness/VISUAL_QA_AND_EXECUTION.md
5. .agents/skills/truthlens-ui-ux-redesign/SKILL.md

Use the UI-only redesign scope. The older product-wide documents under docs/harness are background on existing capabilities; they do not authorize rebuilding the product. Preserve existing application behavior, API contracts, server code, database, provider routing, forensic pipeline, and secure key vault. Keep changes focused on the frontend and its design system. Do not invent data, citations, progress, or capabilities. Use local data only, never production credentials.

Before editing source, inspect the current implementation and local instructions. This project has no .git directory; do not initialize one. Make a temporary backup of each existing source file before changing it, and preserve unrelated user files. Do not ask the user to choose ordinary design details; complete the redesign and browser QA autonomously.
