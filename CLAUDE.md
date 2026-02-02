# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mai** (My AI Toolkit) is a repository for reusable and shareable Claude Code plugins and skills.

Current components:

1. **assume-persona plugin** (`/plugins/assume-persona/`) - Manages subject matter expert personas for domain-specific assistance
2. **create-skill skill** (`/.claude/skills/create-skill/`) - Guidance for creating effective Claude Code skills

This repo will grow over time as new plugins and skills are added.

## Commands

```bash
# Run TypeScript directly (no compilation needed)
node --experimental-strip-types script.ts

# Test a plugin locally
claude --plugin-dir ./plugins/<plugin-name>
```

No test suite exists yet.

## Versioning

Version must be updated in all three locations:

- `package.json`
- `.claude-plugin/marketplace.json`
- `plugins/<plugin-name>/.claude-plugin/plugin.json` (for each plugin being released)

## Maintenance

Update this CLAUDE.md (or nested CLAUDE.md files in plugin/skill directories) when making significant changes to the repo structure, adding new plugins/skills, or changing development patterns.
