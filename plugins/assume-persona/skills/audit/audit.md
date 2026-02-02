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
   - If empty, list available personas and let user pick:

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

4. **Read both files**:
   - `SKILL.md` for description quality check
   - `persona.md` for content quality check

5. **Run structural checks on persona.md**:

   ### Age Check
   - Parse `created` date from frontmatter
   - Calculate age in months
   - Status:
     - ✓ Fresh: < 3 months old
     - ⚠ Aging: 3-6 months old
     - ✗ Stale: > 6 months old

   ### Required Sections Check

   Look for these headings (case-insensitive):
   - Role description (paragraph starting with "You are")
   - `## Core Expertise`
   - `## Mental Models`
   - `## Best Practices`
   - `## Pitfalls` (or "Pitfalls to Avoid")
   - `## Tools` (or "Tools & Technologies")

   ### Length Check
   - Count total lines
   - Status:
     - ✗ Too short: < 100 lines
     - ✓ Good: 100-500 lines
     - ⚠ Too long: > 500 lines

   ### Frontmatter Check
   - Required fields: `archetype`, `created`
   - Optional fields: `category`, `keywords`
   - Note which are present/missing

6. **Run description quality check on SKILL.md**:

   ### Description Quality
   - Is description present and non-empty?
   - Does it include specific keywords/topics? (good for auto-invocation matching)
   - Is it under 200 characters? (overly brief)
   - Does it mention concrete technologies, tools, or scenarios?
   - Status:
     - ✓ Good: Specific keywords, reasonable length
     - ⚠ Vague: Generic description that won't match well
     - ✗ Missing: No description

7. **Spawn agent** to analyze content quality:
   ```
   Analyze this persona for completeness, currency, and actionability.
   Return specific improvement recommendations.

   <persona>
   {persona.md content}
   </persona>
   ```

8. **Present combined output**:

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

9. **If user wants to choose specific ones**:
   - Let them specify (e.g., "1, 3, 5" or "all except 2")

10. **Apply approved changes**:
    - Edit persona.md with selected content improvements
    - Edit SKILL.md description if improvements were suggested
    - Update `created` date in persona.md to today

11. **Confirm**:
    ```
    Persona '<archetype>' updated.
    ```

## Notes

- If no improvements are needed, skip the "Apply improvements?" prompt
- User must explicitly approve changes before any edits are made
- The `created` date updates to reflect the edit
- Description quality is important for auto-invocation matching
