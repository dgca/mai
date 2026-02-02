---
description: Preview a persona's content without activating it
argument-hint: "<archetype?>"
disable-model-invocation: true
---

# Show Persona

Preview a persona's full content without activating it or changing state.

## Arguments

`$ARGUMENTS` = the archetype to preview (e.g., "typescript-fullstack")

## Storage Locations

Personas are stored as skills in (do NOT search recursively from home):

1. **Local/project**: `<cwd>/.claude/skills/assume-persona--<archetype>/`
2. **User**: `$HOME/.claude/skills/assume-persona--<archetype>/`

Each persona skill contains:
- `SKILL.md` - Metadata and loader
- `persona.md` - Full persona content

## Instructions

1. **Parse the archetype** from `$ARGUMENTS`
   - If empty, list available personas and let user pick:
     ```
     Available personas:
     - security-expert (local)
     - typescript-guru (user)

     Which persona to preview?
     ```
     Wait for user response, then continue.

2. **Find the persona skill directory** (in precedence order):
   - `<cwd>/.claude/skills/assume-persona--<archetype>/persona.md` (local)
   - `$HOME/.claude/skills/assume-persona--<archetype>/persona.md` (user)

3. **If NOT found**:
   ```
   Persona '$ARGUMENTS' not found.

   List available: /assume-persona:list
   Create new: /assume-persona:create $ARGUMENTS
   ```
   Stop here.

4. **Read and display the persona.md file**:

   ```
   ## Persona Preview: $ARGUMENTS

   **Source**: <local|user>
   **Created**: <date from frontmatter>
   **Category**: <category if present>
   **Keywords**: <keywords if present>
   **Lines**: <line count>

   ---

   <full persona.md content including frontmatter>

   ---

   ### Actions

   - Load this persona: `/assume-persona:load $ARGUMENTS`
   - Audit this persona: `/assume-persona:audit $ARGUMENTS`
   ```

## Notes

- This is a read-only preview - no state changes occur
- The persona is NOT injected into context
- Useful for reviewing before deciding to load
- Shows the raw persona.md file including YAML frontmatter
