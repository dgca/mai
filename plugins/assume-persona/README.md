# assume-persona

Load subject matter expert personas to get specialized assistance. Create custom personas based on your tech stack, team conventions, and domain.

## Skills

| Skill | Description |
|-------|-------------|
| `/assume-persona:create <name>` | Research and create a new persona |
| `/assume-persona:load <name?>` | Load and activate a persona |
| `/assume-persona:list <category?>` | List all available personas |
| `/assume-persona:recommend` | Suggest personas for current context |
| `/assume-persona:show <name?>` | Preview a persona without activating |
| `/assume-persona:status` | Show currently active personas |
| `/assume-persona:clear <name?>` | Deactivate persona(s) |
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

- **Multiple personas**: Load several at once with `/assume-persona:load persona1 persona2`
- **Auto-restore**: Active personas are restored on new sessions
- **Quality auditing**: Check persona freshness and completeness

## Storage

Personas are stored in:
1. Local: `<project>/.claude/plugin-data/assume-persona/personas/`
2. User: `~/.claude/plugin-data/assume-persona/personas/`

Local takes precedence over user.
