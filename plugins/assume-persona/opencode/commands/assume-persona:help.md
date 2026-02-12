---
description: Show available persona commands and usage guide
---

## Persona Commands

Load subject matter expert personas to get specialized assistance.

### Commands

| Command | Description |
|---------|-------------|
| `/assume-persona:list` | List all available personas |
| `/assume-persona:create <name>` | Research and create a new persona |
| `/assume-persona:load <name?>` | Load and activate a persona |
| `/assume-persona:show <name?>` | Preview a persona without activating |
| `/assume-persona:status` | Show currently loaded personas |
| `/assume-persona:clear [name?]` | Clear persona(s) from session state |
| `/assume-persona:audit <name?>` | Audit quality and suggest improvements |
| `/assume-persona:recommend` | Suggest personas for current context |
| `/assume-persona:import <path>` | Import persona from file/URL |
| `/assume-persona:delete <name?>` | Permanently delete a persona |
| `/assume-persona:help` | Show this help |

`<arg>` = required, `<arg?>` = optional (shows list to choose from)

### Quick Start

1. List available personas:
   `/assume-persona:list`

2. Load a persona:
   `/assume-persona:load accessibility-expert`

3. Create a new one:
   `/assume-persona:create rust-systems-programmer`

### How It Works

Personas are stored as skills in `~/.claude/skills/assume-persona--<name>/`:
- `SKILL.md` - Metadata and auto-invocation description
- `persona.md` - Full persona content

When you load a persona, its content is read into the conversation context, giving you access to that expertise.

### Session State

Personas are tracked per session:
- Loaded personas won't re-inject content if loaded again (deduplication)
- Use `/assume-persona:status` to see what's loaded
- Use `/assume-persona:clear` to allow re-loading
- Session state persists across `/sessions` resume

### Storage Locations

1. **User-global**: `~/.claude/skills/assume-persona--<name>/`
   - Available in all projects

2. **Project-local**: `.claude/skills/assume-persona--<name>/`
   - Only available in the current project
   - Takes precedence over user-global

### Tips

- Load multiple personas for complex tasks that span domains
- Use `/assume-persona:recommend` when unsure which persona would help
- Run `/assume-persona:audit` periodically to keep personas current
- Create project-local personas for team-specific conventions
