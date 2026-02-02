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
   - If empty, get list and let user pick using AskUserQuestion:

     ```bash
     node --experimental-strip-types --no-warnings \
       "${CLAUDE_PLUGIN_ROOT}/scripts/list-personas.ts" --scope all --format json
     ```

     Use `AskUserQuestion` tool with:
     - question: "Which persona to preview?"
     - header: "Persona"
     - options: list of available personas (archetype + scope as description)

     Continue with selected archetype.

2. **Get persona content** using show-persona.ts:

   ```bash
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/show-persona.ts" "<archetype>"
   ```

   The script returns JSON:
   ```json
   {
     "found": true,
     "scope": "local",
     "archetype": "typescript-fullstack",
     "created": "2024-01-15",
     "category": "web-development",
     "keywords": ["typescript", "react"],
     "lineCount": 245,
     "content": "---\narchetype: typescript-fullstack\n..."
   }
   ```

   Or if not found: `{ "found": false }`

3. **If NOT found**:
   ```
   Persona '$ARGUMENTS' not found.

   List available: /assume-persona:list
   Create new: /assume-persona:create $ARGUMENTS
   ```
   Stop here.

4. **Display the persona** using data from script output:

   ```
   ## Persona Preview: {archetype}

   **Source**: {scope}
   **Created**: {created}
   **Category**: {category or "uncategorized"}
   **Keywords**: {keywords array or "none"}
   **Lines**: {lineCount}

   ---

   {content}

   ---

   ### Actions

   - Load this persona: `/assume-persona:load {archetype}`
   - Audit this persona: `/assume-persona:audit {archetype}`
   ```

## Notes

- This is a read-only preview - no state changes occur
- The persona is NOT injected into context
- Useful for reviewing before deciding to load
- Shows the raw persona.md file including YAML frontmatter
