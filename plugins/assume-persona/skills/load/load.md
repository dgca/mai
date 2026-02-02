---
description: Load and activate an existing persona by archetype name
argument-hint: "<archetype?> [archetype2] ..."
disable-model-invocation: false
---

# Load Persona

Load one or more personas and activate them for the current session.

## Arguments

`$ARGUMENTS` = one or more archetypes to load (e.g., "typescript-fullstack" or "typescript-fullstack rust-systems")

## Instructions

1. **If archetypes provided in `$ARGUMENTS`**, skip to step 4

2. **Get available personas**:
   ```bash
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/list-personas.ts" \
     --scope all --format json --session "${CLAUDE_SESSION_ID}"
   ```

3. **Present selection using AskUserQuestion**:
   - Parse the JSON output to get the personas array
   - If any personas have `loaded: true`, show them as informational text: "Already loaded: persona1, persona2"
   - Create options from personas with `loaded: false` only
   - Each option:
     - `label`: the archetype name
     - `description`: combine the persona description with scope in parentheses, e.g., "Expert TypeScript developer... (local)"
   - Set `multiSelect: true` to allow loading multiple personas
   - If no unloaded personas available, inform user "All available personas are already loaded" and stop
   - If no personas exist at all, inform user "No personas found. Create one with /assume-persona:create" and stop

4. **Load each selected persona** via script:
   For each archetype (from `$ARGUMENTS` or user selection):
   ```bash
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/load-persona.ts" \
     "${CLAUDE_SESSION_ID}" "<archetype>"
   ```
   - The script outputs the persona content directly - display it to inject into context
   - The script handles deduplication (outputs nothing if already loaded)
   - The script updates state.json automatically
   - If script exits with error (persona not found), offer to create it with `/assume-persona:create <archetype>`

5. **Confirm**: "Persona(s) activated: <list of loaded archetypes>"

## Notes

- Multiple personas can be active simultaneously
- Personas auto-invoke based on their SKILL.md description
- The loader script prevents duplicate loading within a session
- Use `/assume-persona:clear` to reset session state
- Use `/assume-persona:status` to see loaded personas
- Local personas take precedence over user personas
