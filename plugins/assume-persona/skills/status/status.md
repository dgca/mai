---
description: Show currently loaded personas and their status
argument-hint: ""
disable-model-invocation: true
---

# Persona Status

Show personas loaded in the current session and auto-load configuration.

## Instructions

1. **Get status** using get-status.ts:

   ```bash
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/get-status.ts" \
     --session "${CLAUDE_SESSION_ID}"
   ```

   The script returns JSON:
   ```json
   {
     "loadedPersonas": ["archetype1", "archetype2"],
     "autoLoad": ["archetype3"],
     "configPath": "<cwd>/.claude/plugin-data/assume-persona/config.json"
   }
   ```

2. **If no personas loaded (loadedPersonas empty)**:
   ```
   ## Persona Status

   No personas loaded this session.

   Load one with: /assume-persona:load <archetype>
   List available: /assume-persona:list
   ```
   Stop here.

3. **Display status** as a simple list with annotations:

   For each persona in `loadedPersonas`:
   - If also in `autoLoad` array → show `- archetype (auto-loaded)`
   - Otherwise → show `- archetype`

   ```
   ## Persona Status

   ### Loaded Personas
   - claude-plugin-dev (auto-loaded)
   - ux-designer

   ### Quick Actions

   - Clear session state: `/assume-persona:clear`
   - Load another: `/assume-persona:load <archetype>`
   - List all available: `/assume-persona:list`
   ```

4. **If autoLoad has personas not yet loaded**, add a note after the list:
   ```
   Auto-load config: {configPath}
   ```

## Notes

- Shows loaded personas with "(auto-loaded)" annotation where applicable
- Auto-load personas are configured per-project in `config.json`
- Use `/assume-persona:clear` to reset session state
