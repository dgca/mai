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

Check these directories directly in order (do NOT search recursively from home):

1. **Local/project**: `<cwd>/.claude/plugin-data/assume-persona/personas/`
2. **User**: `$HOME/.claude/plugin-data/assume-persona/personas/`

## Instructions

1. **Parse the archetype** from `$ARGUMENTS`
   - If empty, list available personas and let user pick:
     ```
     Available personas:
     - loud-guy (local)
     - security-expert (user)

     Which persona to preview?
     ```
     Wait for user response, then continue.

2. **Check for the persona file directly** (in precedence order):
   - `<cwd>/.claude/plugin-data/assume-persona/personas/<archetype>.md` (local)
   - `$HOME/.claude/plugin-data/assume-persona/personas/<archetype>.md` (user)

3. **If NOT found**:
   ```
   Persona '$ARGUMENTS' not found.

   List available: /assume-persona:list
   Create new: /assume-persona:create $ARGUMENTS
   ```
   Stop here.

4. **Read and display the persona file**:

   ```
   ## Persona Preview: $ARGUMENTS

   **Source**: <local|user>
   **Created**: <date from frontmatter>
   **Category**: <category if present>
   **Keywords**: <keywords if present>
   **Lines**: <line count>

   ---

   <full persona content including frontmatter>

   ---

   ### Actions

   - Load this persona: `/assume-persona:load $ARGUMENTS`
   - Audit this persona: `/assume-persona:audit $ARGUMENTS`
   ```

## Notes

- This is a read-only preview - no state changes occur
- The persona is NOT injected into context
- Useful for reviewing before deciding to load
- Shows the raw file including YAML frontmatter
