---
description: List available personas from all storage locations
argument-hint: "[category]"
disable-model-invocation: true
---

# List Personas

List all available personas from all storage locations with quality indicators.

## Arguments

`$ARGUMENTS` = optional category to filter by (e.g., "web-development")

## Instructions

1. **Run list-personas.ts** to discover all personas:

   ```bash
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/list-personas.ts" \
     --scope all --format json
   ```

   The script returns JSON:
   ```json
   {
     "personas": [
       {
         "archetype": "typescript-fullstack",
         "description": "Expert TypeScript fullstack developer...",
         "category": "web-development",
         "scope": "local",
         "path": ".claude/skills/assume-persona--typescript-fullstack/",
         "created": "2024-01-15",
         "lineCount": 245,
         "loaded": true,
         "autoLoad": false
       }
     ],
     "summary": {
       "total": 2,
       "loaded": 1,
       "autoLoad": 1
     }
   }
   ```

2. **If `$ARGUMENTS` provided**, filter results to only show personas matching that category

3. **Calculate quality indicators** for each persona:
   - **Age**: "fresh" (<3 months), "ok" (3-6 months), "stale" (>6 months)
   - **Length**: "short" (<100 lines), "good" (100-500), "long" (>500)

4. **Display results** with one persona per block, blank line between each:
   - Show `(loaded)` for personas in current session's state
   - Show `(auto-load)` for personas in config's autoLoad array
   - If in both, show `(loaded, auto-load)`

   ```
   Available Personas:

   Name: typescript-fullstack (auto-load)
   Description: Expert TypeScript fullstack developer...
   Category: web-development
   Location: local
   Quality: ✓ fresh, complete

   Name: django-backend (loaded)
   Description: Expert Django backend developer...
   Category: uncategorized
   Location: user
   Quality: ⚠ stale (8mo)

   Total: 2 personas (1 loaded, 1 auto-load)
   ```

5. **If no personas found**:
   ```
   No personas found.

   Create one with: /assume-persona:create <archetype>
   ```

## Notes

- Local personas override user personas with the same archetype
- Only show unique archetypes (highest precedence wins if duplicate)
- Quality indicators help identify personas that may need updating
- **Auto-load** personas are configured in project config and load at session start
- **Loaded** personas were loaded this session (manually or via auto-invoke)
- This is a read-only operation
