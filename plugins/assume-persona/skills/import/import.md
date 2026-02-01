---
description: Import a persona from a file path or URL with validation
argument-hint: "<path-or-url>"
disable-model-invocation: true
---

# Import Persona

Import a persona from a local file path or URL, with validation before saving.

## Arguments

`$ARGUMENTS` = file path or URL to import from (e.g., "./my-persona.md" or "https://example.com/persona.md")

## Storage Locations

Imported personas can be saved to (use exact paths, do NOT search recursively):

1. **Local/project**: `<cwd>/.claude/plugin-data/assume-persona/personas/`
2. **User** (global): `$HOME/.claude/plugin-data/assume-persona/personas/`

## Instructions

1. **Parse the source** from `$ARGUMENTS`
   - If empty, show error: "Usage: /assume-persona:import <path-or-url>"
   - Detect if it's a URL (starts with http:// or https://) or a file path

2. **Fetch the content**:
   - If URL: fetch via HTTP
   - If file path: read the file
   - If fetch fails, show error and stop

3. **Validate the persona** with the following checks:

   ### Required Frontmatter
   - Must have valid YAML frontmatter (between `---` markers)
   - Required fields:
     - `archetype` (string, kebab-case)
     - `created` (date, YYYY-MM-DD format)
     - `triggers` (array of strings, at least 1)
   - Optional but recommended:
     - `category` (string)
     - `tags` (array of strings)

   ### Required Sections
   Check for these headings (case-insensitive):
   - Role description (first paragraph after frontmatter, starts with "You are")
   - `## Core Expertise`
   - `## Mental Models`
   - `## Best Practices`
   - `## Pitfalls` (or "Pitfalls to Avoid")
   - `## Tools` (or "Tools & Technologies")

   ### Length Check
   - Minimum: 100 lines
   - Maximum: 500 lines
   - Warn if outside range but don't block

4. **Report validation results**:

   ```
   ## Import Validation: <archetype>

   ### Frontmatter
   ✓ archetype: <value>
   ✓ created: <value>
   ✓ triggers: <list>
   ⚠ category: missing (optional)
   ⚠ tags: missing (optional)

   ### Required Sections
   ✓ Role description
   ✓ Core Expertise
   ✗ Mental Models (missing)
   ✓ Best Practices
   ✓ Pitfalls to Avoid
   ✓ Tools & Technologies

   ### Quality
   ✓ Length: 245 lines (good)

   ### Issues Found
   - Missing required section: Mental Models

   Import anyway?
   1. Yes - save despite issues
   2. No - cancel import
   ```

5. **If user chooses to import**:

   ```
   Where should I save this persona?

   1. **Local** (.claude/plugin-data/assume-persona/personas/) - Specific to this project
   2. **User** (~/.claude/plugin-data/assume-persona/personas/) - Available globally
   ```

6. **Check for conflicts**:
   - If a persona with the same archetype exists in the target location:
     ```
     Persona '<archetype>' already exists at <location>.

     1. Overwrite existing
     2. Save with different name
     3. Cancel
     ```

7. **Save the persona**:
   - Create directory if needed
   - Write the file as `<archetype>.md`

8. **Confirm**:
   ```
   Persona '<archetype>' imported successfully.

   Load it with: /assume-persona:load <archetype>
   ```

## Notes

- Validation helps ensure imported personas follow the expected format
- Users can import despite validation issues (their choice)
- URLs must be publicly accessible (no authentication support)
- Source URL/path is not stored in the persona
