---
name: load
description: Load and activate an existing persona by archetype name
argument-hint: "<archetype> [archetype2] ..."
disable-model-invocation: false
---

# Load Persona

Load one or more personas and activate them for the current session.

## Arguments

`$ARGUMENTS` = one or more archetypes to load (e.g., "typescript-fullstack" or "typescript-fullstack rust-systems")

## Storage Locations

Check these directories directly in order (do NOT search recursively from home):

1. **Local/project**: `<cwd>/.claude/plugin-data/assume-persona/personas/`
2. **User**: `$HOME/.claude/plugin-data/assume-persona/personas/`

State file: `<cwd>/.claude/plugin-data/assume-persona/.state.json`

## Instructions

1. **Parse archetypes** from `$ARGUMENTS`
   - Split on spaces to support multiple personas
   - Normalize each to kebab-case for matching
   - If empty, show error: "Usage: /assume-persona:load <archetype> [archetype2] ..."

2. **For each archetype, check for the persona file directly** (in precedence order):
   - `<cwd>/.claude/plugin-data/assume-persona/personas/<archetype>.md` (local)
   - `$HOME/.claude/plugin-data/assume-persona/personas/<archetype>.md` (user)

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
   - Output the full persona content (everything after YAML frontmatter) for each
   - This injects the persona(s) into context for the session

7. **Update state file** for persistence:
   - Write to `.claude/plugin-data/assume-persona/.state.json`:
     ```json
     {
       "activePersonas": [
         {
           "archetype": "<archetype>",
           "loadedAt": "<ISO timestamp>",
           "source": "local|user"
         }
       ]
     }
     ```
   - Create directories if needed
   - This enables auto-restore on next session start

8. **Confirm**:
   ```
   Persona(s) activated: <archetype1>, <archetype2>

   I'll now approach problems with this expertise and these practices.
   ```

## Notes

- Multiple personas can be active simultaneously
- Personas are automatically restored on new sessions (condensed summary injected)
- Use `/assume-persona:clear` to deactivate personas and stop auto-restore
- Use `/assume-persona:status` to see active personas
- Local personas take precedence over user personas
