---
description: Show available commands and usage guide
argument-hint: ""
disable-model-invocation: true
---

# Assume Persona Help

Output the following help content verbatim to the user (preserve markdown formatting):

```
## Assume Persona Plugin

Load subject matter expert personas to get specialized assistance. Personas auto-invoke based on conversation topics.

### Commands

| Command | Description |
|---------|-------------|
| /assume-persona:create \<name> | Research and create a new persona |
| /assume-persona:load \<name?> | Load and activate a persona |
| /assume-persona:list \<category?> | List all available personas |
| /assume-persona:recommend | Suggest personas for current context |
| /assume-persona:show \<name?> | Preview a persona without activating |
| /assume-persona:status | Show loaded personas and config |
| /assume-persona:clear \<name?> | Clear session state for persona(s) |
| /assume-persona:delete \<name?> | Permanently delete persona file(s) |
| /assume-persona:import \<path> | Import persona from file/URL |
| /assume-persona:audit \<name?> | Audit quality and offer improvements |
| /assume-persona:help | Show this help |

\<arg> = required, \<arg?> = optional (shows list to choose from)

### Quick Start

1. List available personas:
   /assume-persona:list

2. Load a persona:
   /assume-persona:load accessibility-expert

3. Check what's loaded:
   /assume-persona:status

4. Clear session state:
   /assume-persona:clear

### Features

- **Auto-invocation**: Personas automatically load when Claude detects relevant topics
- **Session deduplication**: Each persona loads once per session (no duplicates)
- **Multiple personas**: Load several at once with `/assume-persona:load persona1 persona2`
- **Project config**: Auto-load personas for all contributors (see below)
- **Quality auditing**: Check persona freshness and completeness

### How Auto-Invocation Works

Personas are stored as Claude Code skills with descriptions that enable auto-invocation:

1. When you discuss a topic (e.g., "security vulnerabilities")
2. Claude matches the topic against persona skill descriptions
3. The relevant persona loads automatically (once per session)
4. You get specialized expertise without manual loading

### Project Config

Auto-load personas when entering a directory by creating:

`<project>/.claude/plugin-data/assume-persona/config.json`

#### Example:

```json
{
  "autoLoad": ["claude-plugin-dev", "typescript-expert"]
}
```

This file can be committed to share personas across the team.

### Storage Locations

Personas are stored as skills (precedence order):
1. Local: `<project>/.claude/skills/assume-persona--<archetype>/`
2. User: `$HOME/.claude/skills/assume-persona--<archetype>/`

Each persona skill contains:
- `SKILL.md` - Metadata and auto-invocation description
- `persona.md` - Full persona content
```
