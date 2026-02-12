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

**Note:** After installing, register the plugin in `~/.config/opencode/config.json`. See [Platform Differences](#platform-differences) for behavioral differences.

## Commands

| Command | Description |
|---------|-------------|
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

- **Auto-invocation**: Personas automatically load when relevant topics are detected
- **Session deduplication**: Each persona loads once per session (no duplicates in context)
- **Multiple personas**: Load several at once with `/assume-persona:load persona1 persona2`
- **Project config**: Auto-load personas for all contributors
- **Quality auditing**: Check persona freshness and completeness

## How Auto-Invocation Works

Personas are stored as skills with descriptions that enable auto-invocation:

1. When you discuss a topic (e.g., "security vulnerabilities")
2. The agent matches the topic against persona skill descriptions
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
- **Claude Code**: `~/.claude/skills/assume-persona--<archetype>/`
- **OpenCode**: `~/.claude/skills/persona-<archetype>/` (also reads `assume-persona--*`)

Project-local personas:
- `<project>/.claude/skills/<prefix><archetype>/`

Each persona skill contains:
- `SKILL.md` - Metadata and auto-invocation description
- `persona.md` - Full persona content

Local takes precedence over user.

## Platform Differences

Both implementations are functionally equivalent and share the same persona format. Key differences:

| Aspect | Claude Code | OpenCode |
|--------|-------------|----------|
| Skill prefix | `assume-persona--*` | `persona-*` (reads both for compatibility) |
| Post-compaction restore | Automatic (hooks) | Automatic (compaction hook) |
| Implementation | Skills + bash scripts | TypeScript plugin |

**Note:** OpenCode cannot use `assume-persona--` prefix because its skill system disallows `--` in directory names. OpenCode reads from both prefixes but creates new personas with `persona-` prefix.

## Architecture

### Claude Code

The plugin uses a session-aware loader script to prevent duplicate loading:

1. **SessionStart hook**: Runs `restore-personas.ts` to load auto-load personas and restore any handoff state
2. **SKILL.md dynamic context**: Invokes loader with session ID for deduplication
3. **state.json**: Tracks loaded personas per session at `~/.claude/plugin-data/assume-persona/state.json`
4. **SessionEnd hook**: Runs `save-handoff.ts` on clear (preserves state) or `cleanup-session.ts` otherwise

### OpenCode

The plugin is a TypeScript module with event hooks:

1. **`session.created` hook**: Loads auto-load personas and warns about missing ones
2. **Tool calls**: `persona_load`, `persona_list`, `persona_status`, etc.
3. **`experimental.session.compacting` hook**: Preserves loaded personas through context compaction
4. **Session state**: Tracks loaded personas in memory per session ID

## Contributing

The plugin has separate implementations for Claude Code (`scripts/`) and OpenCode (`opencode/`). 

**TypeScript logic** is currently duplicated but could be refactored into a shared `lib/` directory.

**Command instructions** (markdown) are duplicated because the platforms have different execution models:
- Claude Code: Commands instruct the model to run bash scripts using `${CLAUDE_PLUGIN_ROOT}` variables
- OpenCode: Commands trigger plugin tools defined in `plugin.ts`

The instructions can't be shared directly, but some content within them (persona templates, validation rules, SKILL.md format) could be extracted into shared reference files.
