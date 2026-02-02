---
description: Audit persona for quality and offer improvements
argument-hint: "[archetype]"
---

# Audit Persona

Audit a persona for structure, content quality, and SKILL.md description quality, then offer to apply improvements.

## Arguments

`$ARGUMENTS` = optional specific archetype to audit

## Storage Locations

Personas are stored as skills in (do NOT search recursively from home):

1. **Local/project**: `<cwd>/.claude/skills/assume-persona--<archetype>/`
2. **User**: `$HOME/.claude/skills/assume-persona--<archetype>/`

Each persona skill contains:
- `SKILL.md` - Metadata and loader (description quality matters for auto-invocation)
- `persona.md` - Full persona content

## Instructions

1. **Parse `$ARGUMENTS`**:
   - If archetype provided, audit that one
   - If empty, run list-personas.ts and let user pick:

     ```bash
     node --experimental-strip-types --no-warnings \
       "${CLAUDE_PLUGIN_ROOT}/scripts/list-personas.ts" --scope all --format json
     ```

     Then show:
     ```
     Available personas:
     - security-expert (user)
     - typescript-guru (local)

     Which one would you like to audit?
     ```

2. **Find the persona skill directory** (in precedence order):
   - `<cwd>/.claude/skills/assume-persona--<archetype>/` (local)
   - `$HOME/.claude/skills/assume-persona--<archetype>/` (user)

3. **If NOT found**:
   ```
   Persona '<archetype>' not found.

   Create it with: /assume-persona:create <archetype>
   ```
   Stop here.

4. **Run audit-persona.ts** for structural analysis:

   ```bash
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/audit-persona.ts" \
     "<path-to-persona.md>" --check-age
   ```

   The script returns JSON:
   ```json
   {
     "archetype": "typescript-fullstack",
     "location": "local",
     "age": {
       "created": "2024-01-15",
       "months": 3,
       "status": "fresh"
     },
     "frontmatter": {
       "archetype": { "present": true, "valid": true },
       "created": { "present": true, "valid": true },
       "category": { "present": true },
       "keywords": { "present": false }
     },
     "sections": {
       "roleDescription": { "present": true, "lineCount": 5 },
       "coreExpertise": { "present": true, "lineCount": 45 },
       "mentalModels": { "present": false, "lineCount": 0 },
       ...
     },
     "quality": {
       "totalLines": 245,
       "lengthStatus": "good",
       "completeness": 0.83
     },
     "suggestions": [
       "Add ## Mental Models section",
       "Consider updating - persona is 8 months old"
     ]
   }
   ```

5. **Read SKILL.md** and check description quality:
   - Is description present and non-empty?
   - Does it include specific keywords/topics?
   - Is it under 200 characters? (overly brief)
   - Does it mention concrete technologies, tools, or scenarios?

6. **Spawn agent** to analyze content quality:
   ```
   Analyze this persona for completeness, currency, and actionability.
   Return specific improvement recommendations.

   <persona>
   {persona.md content}
   </persona>
   ```

7. **Present combined output**:

   ```
   ## Persona Audit: <archetype>
   **Location**: local/user

   ### Structure (persona.md)
   | Check | Status | Details |
   |-------|--------|---------|
   | Age | ✓ Fresh | Created 2 weeks ago |
   | Sections | ⚠ Partial | Missing: Mental Models |
   | Length | ✓ Good | 245 lines |
   | Frontmatter | ✓ Complete | All fields present |

   ### Auto-Invocation (SKILL.md)
   | Check | Status | Details |
   |-------|--------|---------|
   | Description | ✓ Good | Includes specific keywords |

   ### Content Analysis
   <agent assessment>

   ### Suggested Improvements
   1. <improvement 1>
   2. <improvement 2>
   ...

   Apply improvements?
   1. All of them
   2. Let me choose specific ones
   3. None - keep as is
   ```

8. **If user wants to choose specific ones**:
   - Let them specify (e.g., "1, 3, 5" or "all except 2")

9. **Apply approved changes**:
    - Edit persona.md with selected content improvements
    - Edit SKILL.md description if improvements were suggested
    - Update `created` date in persona.md to today

10. **Confirm**:
    ```
    Persona '<archetype>' updated.
    ```

## Notes

- If no improvements are needed, skip the "Apply improvements?" prompt
- User must explicitly approve changes before any edits are made
- The `created` date updates to reflect the edit
- Description quality is important for auto-invocation matching
