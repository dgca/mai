# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**mai** (My AI Toolkit) is a repository for reusable and shareable Claude Code plugins and skills.

Current components:

1. **assume-persona plugin** (`/plugins/assume-persona/`) - Manages subject matter expert personas for domain-specific assistance
2. **lfg plugin** (`/plugins/lfg/`) - Break down large work into manageable pieces and execute with subagents
3. **create-skill skill** (`/.claude/skills/create-skill/`) - Guidance for creating effective Claude Code skills

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

Plugins are versioned independently. Each component has its own version:

| Component | File | When to Bump |
|-----------|------|--------------|
| Marketplace | `.claude-plugin/marketplace.json` | Adding/removing plugins from catalog |
| Each plugin | `plugins/<name>/.claude-plugin/plugin.json` | Changes to that specific plugin |
| Root package.json | `package.json` | Only if publishing npm packages (currently unused) |

**Guidelines:**
- Bump marketplace version (minor) when adding a new plugin to the catalog
- Bump plugin version independently when that plugin changes
- Use semver: MAJOR (breaking), MINOR (new features), PATCH (fixes)

## Maintenance

Update this CLAUDE.md (or nested CLAUDE.md files in plugin/skill directories) when making significant changes to the repo structure, adding new plugins/skills, or changing development patterns.
