---
name: status
description: Show currently active personas and their status
argument-hint: ""
disable-model-invocation: true
---

# Persona Status

Show currently active personas and session state.

## Storage Locations

Check these paths directly (do NOT search recursively from home):

- **Local**: `<cwd>/.claude/plugin-data/assume-persona/.state.json`
- **User**: `$HOME/.claude/plugin-data/assume-persona/.state.json`

## Instructions

1. **Read state files directly** from these exact paths:
   - `<cwd>/.claude/plugin-data/assume-persona/.state.json` (local - higher precedence)
   - `$HOME/.claude/plugin-data/assume-persona/.state.json` (user)

2. **If no state files exist or no active personas**:
   ```
   ## Persona Status

   No personas currently active.

   Load one with: /assume-persona:load <archetype>
   List available: /assume-persona:list
   ```
   Stop here.

3. **For each active persona**, display:
   - Archetype name
   - When it was loaded (relative time, e.g., "2 hours ago")
   - Source location (local or user)

4. **Display status**:

   ```
   ## Persona Status

   ### Active Personas

   | Archetype | Loaded | Source |
   |-----------|--------|--------|
   | loud-guy | 2 hours ago | user |
   | rust-systems | 30 min ago | local |

   ### Quick Actions

   - Clear all: `/assume-persona:clear`
   - Clear specific: `/assume-persona:clear <archetype>`
   - Load another: `/assume-persona:load <archetype>`
   ```

## Notes

- Shows personas from the state file, not what's in current context
- If state says active but context was reset, the persona may not actually be in context
- Use `/assume-persona:load` to re-inject if needed
