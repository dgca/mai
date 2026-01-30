# assume-persona

Load subject matter expert personas to get specialized assistance. Create custom personas based on your tech stack, team conventions, and domain.

## Skills

| Skill | Description |
|-------|-------------|
| `/assume-persona:create <name>` | Research and create a new persona |
| `/assume-persona:load <name>` | Load and activate a persona |
| `/assume-persona:list` | List available personas |
| `/assume-persona:show <name>` | Preview a persona without activating |
| `/assume-persona:audit [name]` | Audit quality and offer improvements |
| `/assume-persona:recommend` | Suggest personas for current context |
| `/assume-persona:status` | Show currently active personas |
| `/assume-persona:clear [name]` | Deactivate persona(s) |
| `/assume-persona:import <path>` | Import persona from file/URL |
| `/assume-persona:help` | Show help |

## Quick Start

```
/assume-persona:create rust-systems
/assume-persona:load rust-systems
/assume-persona:status
/assume-persona:clear
```

## Storage

Personas are stored in:
1. Local: `<project>/.claude/plugin-data/assume-persona/personas/`
2. User: `~/.claude/plugin-data/assume-persona/personas/`

Local takes precedence over user.
