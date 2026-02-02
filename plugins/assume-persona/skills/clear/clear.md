---
description: Clear session state for loaded personas
argument-hint: "[archetype]"
disable-model-invocation: true
---

# Clear Persona State

Clear session state to allow personas to be re-loaded. This does not delete persona files.

## Arguments

`$ARGUMENTS` = optional specific archetype to clear (if empty, clears all from session)

## Instructions

1. **Clear session state** using clear-session.ts:

   ```bash
   # Clear all personas from session
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/clear-session.ts" "${CLAUDE_SESSION_ID}"

   # OR clear specific archetype
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/clear-session.ts" "${CLAUDE_SESSION_ID}" "<archetype>"
   ```

   The script returns JSON:
   - Success (all): `{ "cleared": "all", "remaining": [] }`
   - Success (specific): `{ "cleared": ["archetype1"], "remaining": ["archetype2"] }`
   - No state: `{ "error": "No personas loaded in current session", "cleared": [], "remaining": [] }`
   - Not found: `{ "error": "Persona 'foo' is not loaded...", "loaded": [...], "cleared": [], "remaining": [] }`

2. **Handle results**:

   - If `error` with "No personas loaded":
     ```
     No personas loaded in current session.
     ```
     Stop here.

   - If `error` with "not loaded in current session":
     ```
     Persona '<archetype>' is not loaded in current session.

     Loaded personas: {loaded array}
     ```
     Stop here.

   - If `cleared` is `"all"`:
     ```
     Cleared all personas from session state.

     Note: The persona content already in this session's context remains.
     Personas can now be re-loaded via auto-invocation or /assume-persona:load.
     ```

   - If `cleared` is an array:
     ```
     Cleared '<archetype>' from session state.

     Remaining loaded: {remaining array or "none"}

     The persona can now be re-loaded via auto-invocation or /assume-persona:load.
     ```

## Notes

- This clears session state used for deduplication
- The persona content already injected in the current session remains in context
- After clearing, the persona's auto-invocation can trigger again
- Use `/assume-persona:status` to see what's currently loaded
- Use `/assume-persona:delete` to permanently remove persona files
