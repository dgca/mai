---
description: Import a persona from a file path or URL
---

# Import Persona: $ARGUMENTS

Import a persona from a local file or URL. Handles valid personas, invalid personas (offers to fix), and raw content (offers to generate a persona from it).

## Arguments

`$ARGUMENTS` = file path or URL to import (e.g., "./my-persona.md" or "https://example.com/persona.md")

## Instructions

### Step 1: Fetch the content

1. **If `$ARGUMENTS` is empty**, show error:
   ```
   Usage: /assume-persona:import <path-or-url>

   Examples:
   - /assume-persona:import ./my-persona.md
   - /assume-persona:import https://example.com/persona.md
   ```
   Stop here.

2. **Fetch the content**:
   - If URL (starts with http:// or https://): use WebFetch
   - If file path: read the file

3. **If fetch fails**, show error and stop.

### Step 2: Validate the content

Check if the content has valid persona structure:

**Valid persona has:**
- YAML frontmatter with `archetype:` field
- `created:` date in frontmatter
- Required sections: Core Expertise, Mental Models, Best Practices, Pitfalls, Tools

**Determine content type:**
- Has `archetype:` in frontmatter → treat as persona (valid or invalid)
- No `archetype:` → treat as raw content

### Step 3: Handle based on content type

#### If Valid Persona:
Proceed directly to Step 4 (Save).

#### If Invalid Persona (has archetype but missing required parts):

Show what's missing:
```
## Import Validation: [archetype]

### Issues Found
- [list missing sections or frontmatter fields]

Options:
1. **Fix issues automatically** - I'll add missing sections
2. **Import anyway** - Save despite issues
3. **Cancel**
```

If "Fix issues automatically":
- Generate missing sections based on existing content
- Add missing frontmatter fields (created: today's date, category: inferred)
- Continue to Step 4

#### If Raw Content (no archetype):

```
This doesn't look like a persona file. Would you like me to create a persona from this content?

1. **Yes** - Generate a full persona based on this content
2. **No** - Cancel import
```

If "Yes":
1. Ask for archetype name (suggest one based on content)
2. Ask for optional additional context
3. Research the domain and generate a full persona using the content as reference
4. Continue to Step 4

### Step 4: Save the persona

1. **Ask where to save**:
   ```
   Where should I save this persona?

   1. **User-global** (~/.claude/skills/) - Available in all projects
   2. **Project-local** (.claude/skills/) - Only this project
   ```

2. **Check for conflicts**:
   If a persona with the same archetype exists at that location:
   ```
   Persona '[archetype]' already exists.

   1. Overwrite existing
   2. Save with different name
   3. Cancel
   ```

3. **Generate SKILL.md** with auto-invocation description:
   - Extract keywords from persona content
   - Create description that captures when to invoke

4. **Save both files**:
   - `[location]/assume-persona--[archetype]/persona.md`
   - `[location]/assume-persona--[archetype]/SKILL.md`

5. **Confirm and offer to load**:
   ```
   Persona '[archetype]' imported successfully.

   Would you like to load it now? (yes/no)
   ```

## Notes

- Valid personas are imported directly without modification
- Invalid personas can be auto-repaired or imported as-is
- Raw content (docs, articles, notes) can be transformed into full personas
- URLs must be publicly accessible
