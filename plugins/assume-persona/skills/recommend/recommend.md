---
description: Recommend personas based on current conversation context
argument-hint: ""
disable-model-invocation: false
---

# Recommend Persona

Analyze the current conversation context and recommend relevant personas.

## Storage Locations

Personas are stored as skills in (do NOT search recursively from home):

1. **Local/project**: `<cwd>/.claude/skills/assume-persona--*/`
2. **User**: `$HOME/.claude/skills/assume-persona--*/`

## Instructions

1. **Scan all available persona skills** using list-personas.ts with keywords:

   ```bash
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/list-personas.ts" --scope all --format json --include-keywords
   ```

   This returns JSON with each persona's archetype, description, category, scope, path, and keywords array from frontmatter.

2. **Analyze current conversation context**:
   - What topics have been discussed?
   - What technologies/tools are mentioned?
   - What type of task is the user working on?
   - What expertise would be most helpful?

3. **Match personas to context**:
   - Compare conversation topics against persona `keywords`
   - Consider `category` relevance
   - Assess how well the persona's expertise fits the task

4. **Rank and select top recommendations** (1-3 personas max)

5. **Present recommendations**:

   ```
   ## Recommended Personas

   Based on your current context, these personas might help:

   ### 1. <archetype> (best match)
   <brief role description>
   **Why**: <1-2 sentence explanation of why this fits>

   ### 2. <archetype>
   <brief role description>
   **Why**: <explanation>

   ---

   Load a persona?
   - `/assume-persona:load <archetype>`
   - `/assume-persona:show <archetype>` to preview first
   ```

6. **If no good matches found**:
   ```
   No strong persona matches for your current context.

   Available options:
   - `/assume-persona:list` to browse all personas
   - `/assume-persona:create <archetype>` to create a custom one
   ```

7. **If user confirms a persona**, load it with `/assume-persona:load`

## Notes

- This analyzes the full conversation context, not just the last message
- Recommendations are suggestions only - user must confirm before loading
- Multiple personas can be loaded if user wants several recommendations
