# assume-persona

Load subject matter expert personas to get specialized assistance. Personas auto-invoke based on conversation topics, providing expertise without manual loading.

## Installation

### Claude Code

```bash
/plugin marketplace add dgca/mai
/plugin install assume-persona@mai
```

Requires Node.js 22.6.0+.

### OpenCode

```bash
curl -fsSL https://raw.githubusercontent.com/dgca/mai/main/plugins/assume-persona/opencode/install.sh | bash
```

Or from a local clone:

```bash
./plugins/assume-persona/opencode/install.sh
```

**Note:** After installing, register the plugin in `~/.config/opencode/config.json`. See [OpenCode Differences](#opencode-differences) for behavioral differences.

## Skills (Claude Code)

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
| `/assume-persona:import <path>` | Import persona from file/URL (with auto-repair/generation) |
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

## Commands (OpenCode)

| Command | Description |
|---------|-------------|
| `/assume-persona:list` | List all available personas |
| `/assume-persona:create <name>` | Research and create a new persona |
| `/assume-persona:load <name?>` | Load and activate a persona |
| `/assume-persona:show <name?>` | Preview a persona without activating |
| `/assume-persona:status` | Show currently loaded personas |
| `/assume-persona:clear [name?]` | Clear persona(s) from session state |
| `/assume-persona:restore` | Restore personas from previous session |
| `/assume-persona:audit <name?>` | Audit quality and suggest improvements |
| `/assume-persona:recommend` | Suggest personas for current context |
| `/assume-persona:import <path>` | Import persona from file/URL |
| `/assume-persona:delete <name?>` | Permanently delete a persona |
| `/assume-persona:help` | Show all commands |

### OpenCode Differences

The OpenCode implementation shares the same persona format and most features, with a few behavioral differences:

| Feature | Claude Code | OpenCode |
|---------|-------------|----------|
| Session tracking | Yes | Yes |
| Deduplication | Per-session state | Per-session state |
| Auto-invocation | Via skill descriptions | Via skill descriptions |
| Post-compaction restore | Automatic | Manual (skill triggers on "resuming session" phrases) |
| Persona format | `~/.claude/skills/assume-persona--*/` | Same (compatible) |

**Post-compaction restore**

In Claude Code, personas automatically restore after context compaction. In OpenCode, the `session-restore` skill triggers on conversational phrases like "resuming session", "where were we", or "continuing work" — but context compaction is a silent event that doesn't produce these phrases.

If you notice degraded responses after a long session, run `/assume-persona:restore` to reload your personas.

## Architecture (Claude Code)

The plugin uses a session-aware loader script to prevent duplicate loading:

1. **SessionStart hook**: Runs `restore-personas.ts` to load auto-load personas and restore any handoff state
2. **SKILL.md dynamic context**: Invokes loader with session ID for deduplication
3. **state.json**: Tracks loaded personas per session at `~/.claude/plugin-data/assume-persona/state.json`
4. **SessionEnd hook**: Runs `save-handoff.ts` on clear (preserves state) or `cleanup-session.ts` otherwise
