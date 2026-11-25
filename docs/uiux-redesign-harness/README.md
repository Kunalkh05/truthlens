# TruthLens AI — Antigravity UI/UX Redesign Harness

This package is for improving the **existing** TruthLens AI interface. It is not a product rebuild brief. The application already exists in the sibling project folder, with Analyze, progress, results, History, Settings, and sample report flows. The harness tells Antigravity CLI to inspect that app, redesign its interface with professional product-design judgment, preserve working behavior, and verify the result locally.

## Package contents

- MASTER_UIUX_REDESIGN.md — copy-ready autonomous execution prompt for Antigravity CLI.
- UI_UX_REQUIREMENTS.md — product-specific interaction, visual, content, accessibility, and responsive requirements.
- SKILLS_AND_REPOSITORY_GUIDE.md — repository map and careful project-local skill discovery/install workflow.
- VISUAL_QA_AND_EXECUTION.md — execution sequence, screen/state checklist, and completion gates.
- antigravity-addon/AGENTS.md — small project-level guardrails to merge into an existing AGENTS.md.
- antigravity-addon/.agents/skills/truthlens-ui-ux-redesign/SKILL.md — ready-to-install project skill for ongoing UI work.

## Start Antigravity CLI

The target project is at:

    /Users/kunalkhande/Project /TruthLens

The individual guides are installed in that project at docs/uiux-redesign-harness. The project root AGENTS.md points Antigravity to the guides, and the TruthLens UI/UX skill is installed at .agents/skills/truthlens-ui-ux-redesign/SKILL.md. You do not need to attach each file manually.

Open a terminal in the project and start Antigravity CLI:

    cd "/Users/kunalkhande/Project /TruthLens"
    agy

Then tell Antigravity to read docs/uiux-redesign-harness/MASTER_UIUX_REDESIGN.md and follow it. The workspace instructions will direct it to the other guides and the project skill. Use /agy-customizations and /skills reload if you need to refresh customization discovery.

## Safety and scope

The agent should work inside the existing truthlens-ai project. It should not recreate the product, replace the framework, rewrite APIs, change provider or vault behavior, use real credentials, or contact production services. Use existing local fixtures and mock mode. The only expected credentials are none for a local UI redesign.

## Official references

The skill folder and reload instructions follow [Google Antigravity skill documentation](https://antigravity.google/docs/skills) and [customization discovery](https://antigravity.google/docs/customization-discovery?tab=cli). The skill discovery/install commands follow the [Vercel Skills CLI documentation](https://github.com/vercel-labs/skills/blob/main/docs/commands.md). The recommended design and UI audit skills are described in the official [Anthropic skills repository](https://github.com/anthropics/skills/tree/main/skills/frontend-design) and [Vercel agent-skills repository](https://github.com/vercel-labs/agent-skills).

References checked 25 November 2026. Skill catalog contents and CLI versions can change; always inspect the live catalog before installing. 
