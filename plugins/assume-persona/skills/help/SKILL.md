---
name: help
description: Show available commands and usage guide
argument-hint: ""
disable-model-invocation: true
---

# Assume Persona Help

Display the help guide below:

```
## Assume Persona Plugin

Load subject matter expert personas to get specialized assistance.

### Commands

| Command | Description |
|---------|-------------|
| /assume-persona:create \<name> | Research and create a new persona |
| /assume-persona:load \<name?> | Load and activate a persona |
| /assume-persona:list \<category?> | List all available personas |
| /assume-persona:recommend | Suggest personas for current context |
| /assume-persona:show \<name?> | Preview a persona without activating |
| /assume-persona:status | Show currently active personas |
| /assume-persona:clear \<name?> | Deactivate persona(s) |
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

3. Check what's active:
   /assume-persona:status

4. Clear when done:
   /assume-persona:clear

### Features

- **Multiple personas**: Load several at once with `/assume-persona:load persona1 persona2`
- **Auto-restore**: Active personas are restored on new sessions
- **Quality auditing**: Check persona freshness and completeness

### Storage Locations

Personas are stored in (precedence order):
1. Local: `<project>/.claude/plugin-data/assume-persona/personas/`
2. User: `$HOME/.claude/plugin-data/assume-persona/personas/`
```
