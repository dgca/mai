# assume-persona

Load subject matter expert personas to get specialized assistance. Personas auto-invoke based on conversation topics, providing expertise without manual loading.

## Skills

| Skill | Description |
|-------|-------------|
| `/assume-persona:create <name>` | Research and create a new persona |
| `/assume-persona:load <name?>` | Load and activate a persona |
| `/assume-persona:list <category?>` | List all available personas |
| `/assume-persona:recommend` | Suggest personas for current context |
| `/assume-persona:show <name?>` | Preview a persona without activating |
| `/assume-persona:status` | Show loaded personas and config |
| `/assume-persona:clear <name?>` | Clear session state for persona(s) |
| `/assume-persona:delete <name?>` | Permanently delete persona file(s) |
| `/assume-persona:import <path>` | Import persona from file/URL |
| `/assume-persona:audit <name?>` | Audit quality and offer improvements |
| `/assume-persona:help` | Show help |

`<arg>` = required, `<arg?>` = optional (shows list to choose from)

## Quick Start

```
/assume-persona:create accessibility-expert
/assume-persona:load accessibility-expert
/assume-persona:status
/assume-persona:clear
/assume-persona:help
```

## Features

- **Auto-invocation**: Personas automatically load when Claude detects relevant topics
- **Session deduplication**: Each persona loads once per session (no duplicates in context)
- **Multiple personas**: Load several at once with `/assume-persona:load persona1 persona2`
- **Project config**: Auto-load personas for all contributors
- **Quality auditing**: Check persona freshness and completeness

## How Auto-Invocation Works

Personas are stored as Claude Code skills with descriptions that enable auto-invocation:

1. When you discuss a topic (e.g., "security vulnerabilities")
2. Claude matches the topic against persona skill descriptions
3. The relevant persona loads automatically (once per session)
4. You get specialized expertise without manual loading

## Project Config

Auto-load personas for all contributors by creating:

`<project>/.claude/plugin-data/assume-persona/config.json`

```json
{
  "autoLoad": ["claude-plugin-dev", "typescript-expert"]
}
```

Commit this file to share persona settings with your team.

## Storage

Personas are stored as skills:
1. Local: `<project>/.claude/skills/assume-persona--<archetype>/`
2. User: `~/.claude/skills/assume-persona--<archetype>/`

Each persona skill contains:
- `SKILL.md` - Metadata and auto-invocation description
- `persona.md` - Full persona content

Local takes precedence over user.

## Architecture

The plugin uses a session-aware loader script to prevent duplicate loading:

1. **SessionStart hook**: Installs loader script, prunes stale state, loads auto-load personas
2. **SKILL.md dynamic context**: Invokes loader with session ID for deduplication
3. **state.json**: Tracks loaded personas per session at `~/.claude/plugin-data/assume-persona/state.json`
4. **SessionEnd hook**: Cleans up session state
