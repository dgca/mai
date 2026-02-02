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
   - If empty, get list and let user pick using AskUserQuestion:

     ```bash
     node --experimental-strip-types --no-warnings \
       "${CLAUDE_PLUGIN_ROOT}/scripts/list-personas.ts" --scope all --format json
     ```

     Use `AskUserQuestion` tool with:
     - question: "Which persona would you like to audit?"
     - header: "Persona"
     - options: list of available personas (archetype + scope as description)

     Continue with selected archetype.

2. **Check if persona exists** using check-exists.ts:

   ```bash
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/check-exists.ts" "<archetype>"
   ```

   If `{ "exists": false }`:
   ```
   Persona '<archetype>' not found.

   Create it with: /assume-persona:create <archetype>
   ```
   Stop here.

3. **Run audit-persona.ts** for structural analysis:

   Use the path from check-exists.ts result. The script accepts skill directory paths:

   ```bash
   # For local scope
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/audit-persona.ts" \
     ".claude/skills/assume-persona--<archetype>" --check-age

   # For user scope
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/audit-persona.ts" \
     "$HOME/.claude/skills/assume-persona--<archetype>" --check-age
   ```

   The script returns JSON including SKILL.md info:
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
     "skillMd": {
       "found": true,
       "description": "TypeScript fullstack persona. Invoke when...",
       "descriptionLength": 120,
       "hasKeywords": true
     },
     "suggestions": [
       "Add ## Mental Models section",
       "Consider updating - persona is 8 months old"
     ]
   }
   ```

4. **Spawn agent** to analyze content quality:
   ```
   Analyze this persona for completeness, currency, and actionability.
   Return specific improvement recommendations.

   <persona>
   {persona.md content}
   </persona>
   ```

5. **Present combined output** (use data from audit-persona.ts):

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
   | Found | ✓/✗ | {skillMd.found} |
   | Description | ✓ Good / ⚠ Short / ✗ Missing | {skillMd.descriptionLength} chars |
   | Keywords | ✓/⚠ | {skillMd.hasKeywords ? "Has tech keywords" : "No specific keywords"} |

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

6. **If user wants to choose specific ones**:
   - Let them specify (e.g., "1, 3, 5" or "all except 2")

7. **Apply approved changes** using update-persona.ts:

   Get the persona content (use show-persona.ts), apply improvements, then save:

   ```bash
   echo '<improved persona.md content>' | node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/update-persona.ts" \
     --archetype "<archetype>" \
     --scope "<local|user>" \
     --update-date \
     --description "<new description if SKILL.md needs updating>"
   ```

   The script updates persona.md and optionally SKILL.md description.

8. **Confirm**:
    ```
    Persona '<archetype>' updated.
    ```

## Notes

- If no improvements are needed, skip the "Apply improvements?" prompt
- User must explicitly approve changes before any edits are made
- The `created` date updates to reflect the edit
- Description quality is important for auto-invocation matching
