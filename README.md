# My AI Toolkit

Plugins and skills that make [Claude Code](https://docs.anthropic.com/en/docs/claude-code) more effective for real work.

## What's Here

| Component | Type | What It Does |
|-----------|------|--------------|
| [assume-persona](#assume-persona) | plugin | Load expert personas for domain-specific assistance |
| [lfg](#lfg) | plugin | Break down large work into tasks and execute with subagents |
| [create-skill](#create-skill) | skill | Guide for building your own Claude Code skills |

## Installation

Add the marketplace, then install individual plugins:

```bash
# Add the marketplace
/plugin marketplace add dgca/mai

# Install plugins you want
/plugin install assume-persona@mai
/plugin install lfg@mai
```

Requires Node.js 22.6.0+.

## Plugins

### assume-persona

Create and load expert personas for domain-specific assistance. Define a React architect, security auditor, or any specialist—Claude adopts their expertise and perspective.

**Key features:**
- Personas auto-invoke when you discuss relevant topics
- Import existing content (docs, articles, notes) and generate personas from it
- Share project-specific personas with your team

See [plugins/assume-persona](./plugins/assume-persona) for full documentation.

### lfg

*Let's Fucking Go* — structured project management for AI-assisted development. Break large, ambiguous work into right-sized pieces that Claude can execute reliably.

**Key features:**
- Epics → milestones → tasks hierarchy
- Parallel execution with dependency awareness
- Independent QA verification of completed work
- Accumulated learnings across tasks

See [plugins/lfg](./plugins/lfg) for full documentation.

## Skills

### create-skill

A guide for building skills that extend Claude's capabilities. Covers skill structure, YAML frontmatter, bundled resources (scripts, references, assets), and best practices.

See [.claude/skills/create-skill](./.claude/skills/create-skill).
