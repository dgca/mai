---
name: audit
description: Audit persona for quality and offer improvements
argument-hint: "[archetype]"
---

# Audit Persona

Audit a persona for structure and content quality, then offer to apply improvements.

## Arguments

`$ARGUMENTS` = optional specific archetype to audit

## Storage Locations

Check these directories directly (do NOT search recursively from home):

1. **Local/project**: `<cwd>/.claude/plugin-data/assume-persona/personas/`
2. **User**: `$HOME/.claude/plugin-data/assume-persona/personas/`

## Instructions

1. **Parse `$ARGUMENTS`**:
   - If archetype provided, audit that one
   - If empty, list available personas and let user pick:

     ```
     Available personas:
     - loud-guy (user)
     - my-persona (local)

     Which one would you like to audit?
     ```

2. **Find the persona file** (in precedence order):
   - `<cwd>/.claude/plugin-data/assume-persona/personas/<archetype>.md` (local)
   - `$HOME/.claude/plugin-data/assume-persona/personas/<archetype>.md` (user)

3. **If NOT found**:
   ```
   Persona '<archetype>' not found.

   Create it with: /assume-persona:create <archetype>
   ```
   Stop here.

4. **Read the persona file**

5. **Run structural checks**:

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
   - Required fields: archetype, created, triggers, category, tags
   - Note which are present/missing

6. **Spawn agent** to analyze content quality:
   ```
   Analyze this persona for completeness, currency, and actionability.
   Return specific improvement recommendations.

   <persona>
   {persona content}
   </persona>
   ```

7. **Present combined output**:

   ```
   ## Persona Audit: <archetype>
   **Location**: local/user

   ### Structure
   | Check | Status | Details |
   |-------|--------|---------|
   | Age | ✓ Fresh | Created 2 weeks ago |
   | Sections | ⚠ Partial | Missing: Mental Models |
   | Length | ✓ Good | 245 lines |
   | Frontmatter | ✓ Complete | All fields present |

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
   - Edit the persona file with selected improvements
   - Update `created` date to today

10. **Confirm**:
    ```
    Persona '<archetype>' updated.
    ```

## Notes

- If no improvements are needed, skip the "Apply improvements?" prompt
- User must explicitly approve changes before any edits are made
- The `created` date updates to reflect the edit
