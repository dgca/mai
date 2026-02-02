---
description: Show currently loaded personas and their status
argument-hint: ""
disable-model-invocation: true
---

# Persona Status

Show personas loaded in the current session and auto-load configuration.

## Storage Locations

Check these paths directly (do NOT search recursively from home):

- **State file**: `$HOME/.claude/plugin-data/assume-persona/state.json`
- **Config file**: `<cwd>/.claude/plugin-data/assume-persona/config.json`

## Instructions

1. **Read state file** from `$HOME/.claude/plugin-data/assume-persona/state.json`
   - Find entry for current session using `${CLAUDE_SESSION_ID}`
   - Extract `loadedPersonas` array

2. **Read config file** from `<cwd>/.claude/plugin-data/assume-persona/config.json`
   - Extract `autoLoad` array (if exists)

3. **If no state and no config (or both empty)**:
   ```
   ## Persona Status

   No personas currently loaded.
   No auto-load personas configured.

   Load one with: /assume-persona:load <archetype>
   List available: /assume-persona:list
   ```
   Stop here.

4. **Display status**:

   ```
   ## Persona Status

   ### Loaded This Session

   | Archetype |
   |-----------|
   | security-expert |
   | typescript-guru |

   ### Auto-Load Configuration

   | Archetype |
   |-----------|
   | claude-plugin-dev |

   Auto-load personas are configured in:
   <cwd>/.claude/plugin-data/assume-persona/config.json

   ### Quick Actions

   - Clear session state: `/assume-persona:clear`
   - Load another: `/assume-persona:load <archetype>`
   - List all available: `/assume-persona:list`
   ```

5. **If only auto-load configured (no session state)**:
   ```
   ## Persona Status

   ### Loaded This Session

   None loaded yet this session.

   ### Auto-Load Configuration

   | Archetype |
   |-----------|
   | claude-plugin-dev |

   Auto-load personas load at session start and auto-invoke when relevant topics are discussed.
   ```

## Notes

- Shows personas from both session state and project config
- Session state tracks what's been loaded this session (for deduplication)
- Auto-load personas are configured per-project and load at session start
- Use `/assume-persona:clear` to reset session state
