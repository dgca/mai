# My AI Toolkit

A collection of Claude Code plugins and skills.

## Requirements

```
node@^22.6.0
```

## Installation

```
/plugin marketplace add dgca/mai
```

## Plugins

### assume-persona

Create and load expert personas for domain-specific assistance. Define a React architect, security auditor, or any specialist—Claude adopts their expertise and perspective. Import existing content (docs, articles, notes) and auto-generate personas from it.

```
/plugin install assume-persona@mai
```

See [plugins/assume-persona](./plugins/assume-persona) for usage.

## Skills

### create-skill

A guide for building skills that extend Claude's capabilities. Covers skill structure, YAML frontmatter, bundled resources (scripts, references, assets), and best practices for keeping instructions concise.

See [.claude/skills/create-skill](./.claude/skills/create-skill).
