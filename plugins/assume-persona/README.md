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

**Note:** OpenCode uses a simplified implementation without session state tracking. See [OpenCode Differences](#opencode-differences) for details.

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
| `/assume-persona:audit <name?>` | Audit quality and suggest improvements |
| `/assume-persona:recommend` | Suggest personas for current context |
| `/assume-persona:import <path>` | Import persona from file/URL |
| `/assume-persona:delete <name?>` | Permanently delete a persona |
| `/assume-persona:help` | Show all commands |

### OpenCode Differences

The OpenCode implementation shares the same persona format but differs in a few ways:

| Feature | Claude Code | OpenCode |
|---------|-------------|----------|
| Command prefix | `/assume-persona:*` | `/assume-persona:*` |
| Session tracking | Yes (`status`, `clear`) | No |
| Auto-invocation | Via skill descriptions | Not yet supported |
| Deduplication | Per-session state file | None (manual) |
| Persona format | `~/.claude/skills/assume-persona--*/` | Same (compatible) |

**Why no `status` or `clear`?**

Claude Code exposes `$CLAUDE_SESSION_ID` to plugins, enabling per-session state tracking. OpenCode doesn't expose a session ID to commands, so we can't track which personas have been loaded in the current session.

**Why is deduplication less important in OpenCode?**

In Claude Code, personas auto-invoke based on keyword matching in skill descriptions. Without deduplication, discussing "testing" multiple times could load the same QA persona repeatedly, bloating context.

OpenCode handles this differently:
- Skills are loaded via the `skill` tool, which the agent calls explicitly
- The agent sees the skill name and description, and decides whether to load
- Once loaded, the agent knows the content is in context and won't re-load
- This is "agent-managed deduplication" vs "state-file deduplication"

In practice, you're unlikely to accidentally load the same persona twice in OpenCode because the agent is making deliberate tool calls, not reacting to keyword triggers.

If OpenCode adds session ID support in the future, we can add `status`/`clear` commands for parity.

## Architecture (Claude Code)

The plugin uses a session-aware loader script to prevent duplicate loading:

1. **SessionStart hook**: Runs `restore-personas.ts` to load auto-load personas and restore any handoff state
2. **SKILL.md dynamic context**: Invokes loader with session ID for deduplication
3. **state.json**: Tracks loaded personas per session at `~/.claude/plugin-data/assume-persona/state.json`
4. **SessionEnd hook**: Runs `save-handoff.ts` on clear (preserves state) or `cleanup-session.ts` otherwise
