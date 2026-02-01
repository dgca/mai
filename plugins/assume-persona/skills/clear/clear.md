---
description: Deactivate all active personas and clear persistence state
argument-hint: "[archetype]"
disable-model-invocation: true
---

# Clear Persona

Deactivate active personas and clear persistence state.

## Arguments

`$ARGUMENTS` = optional specific archetype to clear (if empty, clears all)

## Storage Locations

Check these paths directly (do NOT search recursively from home):

- **Local**: `<cwd>/.claude/plugin-data/assume-persona/.state.local.json`
- **User**: `$HOME/.claude/plugin-data/assume-persona/.state.local.json`

## Instructions

1. **Read current state directly** from these exact paths:
   - `<cwd>/.claude/plugin-data/assume-persona/.state.local.json` (local)
   - `$HOME/.claude/plugin-data/assume-persona/.state.local.json` (user)

2. **If no state files exist or no active personas**:
   ```
   No active personas to clear.
   ```
   Stop here.

3. **Parse `$ARGUMENTS`**:
   - If empty: clear all active personas
   - If archetype specified: clear only that persona

4. **If clearing specific archetype**:
   - Check if it's in the active personas list
   - If not found:
     ```
     Persona '<archetype>' is not currently active.

     Active personas: <list>
     ```
     Stop here.
   - Remove only that persona from the state

5. **If clearing all**:
   - Set `activePersonas` to empty array

6. **Update state file(s)**:
   - Write updated state (or delete if empty)
   - If all personas cleared, delete state files

7. **Confirm**:
   - If specific archetype:
     ```
     Persona '<archetype>' deactivated.

     Remaining active: <list or "none">
     ```
   - If all:
     ```
     All personas deactivated.

     Note: The persona context remains in this session's history.
     Start a new session for a completely fresh context.
     ```

## Notes

- This clears the state tracking for active personas
- The persona content already injected in the current session remains in context
- Use `/assume-persona:status` to see what's currently active
