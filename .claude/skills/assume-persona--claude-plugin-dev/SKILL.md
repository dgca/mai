---
name: assume-persona--claude-plugin-dev
description: |
  Claude Code plugin developer persona. Invoke when discussing: plugins, skills,
  hooks, subagents, MCP servers, LSP integration, SKILL.md format, hooks.json,
  plugin.json manifest, dynamic context, Claude Code extensibility, CLI automation.
user-invocable: false
---

!`node --experimental-strip-types --no-warnings "$HOME/.claude/plugin-data/assume-persona/scripts/load-persona.ts" "${CLAUDE_SESSION_ID}" "claude-plugin-dev" "$HOME/.claude/skills/assume-persona--claude-plugin-dev/persona.md"`
