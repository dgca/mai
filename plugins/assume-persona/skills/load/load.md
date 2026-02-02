---
description: Load and activate an existing persona by archetype name
argument-hint: "<archetype?> [archetype2] ..."
disable-model-invocation: false
---

# Load Persona

Load one or more personas and activate them for the current session.

## Arguments

`$ARGUMENTS` = one or more archetypes to load (e.g., "typescript-fullstack" or "typescript-fullstack rust-systems")

## Storage Locations

Personas are stored as skills in (do NOT search recursively from home):

1. **Local/project**: `<cwd>/.claude/skills/assume-persona--<archetype>/`
2. **User**: `$HOME/.claude/skills/assume-persona--<archetype>/`

Each persona skill contains:
- `SKILL.md` - Metadata and loader
- `persona.md` - Full persona content

State file: `$HOME/.claude/plugin-data/assume-persona/state.json`

## Instructions

1. **Parse archetypes** from `$ARGUMENTS`
   - Split on spaces to support multiple personas
   - Normalize each to kebab-case for matching
   - If empty, list available personas and let user pick:
     ```
     Available personas:
     - security-expert (local)
     - typescript-guru (user)

     Which persona(s) to load?
     ```
     Wait for user response, then continue.

2. **For each archetype, find the persona skill directory** (in precedence order):
   - `<cwd>/.claude/skills/assume-persona--<archetype>/persona.md` (local)
   - `$HOME/.claude/skills/assume-persona--<archetype>/persona.md` (user)

3. **If any persona NOT found**:
   ```
   Persona '<archetype>' not found.

   Would you like to create it? [yes/no]
   ```
   - If yes: run `/assume-persona:create <archetype>`
   - If no: skip this persona, continue with others

4. **For each found persona, read and evaluate quality**:
   - Is `created` date > 6 months old?
   - Is content < 100 lines or > 500 lines?
   - Missing major sections (Core Expertise, Best Practices, etc.)?

5. **If quality concerns exist for any persona**:
   ```
   Persona '<archetype>' loaded but may benefit from updates:
   - <concern1>
   - <concern2>

   Options:
   1. Activate anyway
   2. Audit first (/assume-persona:audit <archetype>)
   ```
   If user chooses 1 or no concerns, proceed.

6. **Apply the persona(s)**:
   - Read and output the full content from `persona.md` for each
   - This injects the persona(s) into context for the session

7. **Update state file** for deduplication:
   - Read existing state from `$HOME/.claude/plugin-data/assume-persona/state.json`
   - Add the loaded archetype(s) to the current session's `loadedPersonas` array
   - Format:
     ```json
     {
       "<session-id>": {
         "loadedPersonas": ["archetype1", "archetype2"],
         "lastAccess": "<ISO timestamp>"
       }
     }
     ```
   - Create directories if needed
   - This enables deduplication (auto-invoked skills won't re-load)

8. **Confirm**:
   ```
   Persona(s) activated: <archetype1>, <archetype2>

   I'll now approach problems with this expertise and these practices.
   ```

## Notes

- Multiple personas can be active simultaneously
- Personas auto-invoke based on their SKILL.md description
- The loader script prevents duplicate loading within a session
- Use `/assume-persona:clear` to reset session state
- Use `/assume-persona:status` to see loaded personas
- Local personas take precedence over user personas
