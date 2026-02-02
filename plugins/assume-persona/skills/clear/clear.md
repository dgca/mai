---
description: Clear session state for loaded personas
argument-hint: "[archetype]"
disable-model-invocation: true
---

# Clear Persona State

Clear session state to allow personas to be re-loaded. This does not delete persona files.

## Arguments

`$ARGUMENTS` = optional specific archetype to clear (if empty, clears all from session)

## Storage Locations

State file: `$HOME/.claude/plugin-data/assume-persona/state.json`

## Instructions

1. **Read current state** from `$HOME/.claude/plugin-data/assume-persona/state.json`
   - Find entry for current session using `${CLAUDE_SESSION_ID}`
   - Extract `loadedPersonas` array

2. **If no state file exists or session has no loaded personas**:
   ```
   No personas loaded in current session.
   ```
   Stop here.

3. **Parse `$ARGUMENTS`**:
   - If empty: clear all personas from current session
   - If archetype specified: clear only that persona

4. **If clearing specific archetype**:
   - Check if it's in the session's `loadedPersonas` list
   - If not found:
     ```
     Persona '<archetype>' is not loaded in current session.

     Loaded personas: <list>
     ```
     Stop here.
   - Remove only that archetype from `loadedPersonas`

5. **If clearing all**:
   - Remove the entire session entry from state

6. **Update state file**:
   - If session entry is now empty, remove it
   - If state file is now empty (no sessions), delete it
   - Otherwise, write updated state

7. **Confirm**:
   - If specific archetype:
     ```
     Cleared '<archetype>' from session state.

     Remaining loaded: <list or "none">

     The persona can now be re-loaded via auto-invocation or /assume-persona:load.
     ```
   - If all:
     ```
     Cleared all personas from session state.

     Note: The persona content already in this session's context remains.
     Personas can now be re-loaded via auto-invocation or /assume-persona:load.
     ```

## Notes

- This clears session state used for deduplication
- The persona content already injected in the current session remains in context
- After clearing, the persona's auto-invocation can trigger again
- Use `/assume-persona:status` to see what's currently loaded
- Use `/assume-persona:delete` to permanently remove persona files
