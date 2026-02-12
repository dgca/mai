---
description: Import a persona from a file path or URL, with automatic repair or generation
subtask: true
---

# Import Persona

Import a persona from a local file path or URL. Handles three cases:
- **Valid persona** → import directly
- **Invalid persona** → offer to fix issues automatically
- **Raw content** → generate a full persona from the content

## Arguments

`$ARGUMENTS` = file path or URL to import from (e.g., "./my-persona.md" or "https://example.com/persona.md")

## Storage Locations

Imported personas are saved as skills in:

1. **Local/project**: `.claude/skills/assume-persona--<archetype>/`
2. **User** (global): `~/.claude/skills/assume-persona--<archetype>/`

Each persona skill contains:
- `SKILL.md` - Lightweight loader with description for auto-invocation
- `persona.md` - Full persona content

## Instructions

### Step 1: Parse and Fetch Content

1. **Parse the source** from `$ARGUMENTS`
   - If empty, show error: "Usage: /assume-persona:import <path-or-url>"
   - Detect if it's a URL (starts with http:// or https://) or a file path

2. **Fetch the content**:
   - If URL: use WebFetch tool
   - If file path: read the file
   - If fetch fails, show error and stop

### Step 2: Validate and Detect Content Type

Check if the content has valid persona structure:

**Valid persona has:**
- YAML frontmatter with `archetype:` field
- `created:` date in frontmatter
- Required sections: Core Expertise, Mental Models, Best Practices, Pitfalls, Tools

**Determine content type:**
- Has `archetype:` in frontmatter → treat as persona (valid or invalid)
- No `archetype:` → treat as raw content

### Step 3: Branch Based on Content Type

---

#### Branch A: Valid Persona (has archetype, all required sections)

Proceed directly to **Step 4: Save Persona**.

---

#### Branch B: Invalid Persona (has archetype but missing required parts)

1. **Show validation report**:
   ```
   ## Import Validation: <archetype>

   ### Frontmatter
   ✓ archetype: <value>
   ✓ created: <value>
   ⚠ category: missing (optional)
   ⚠ keywords: missing (optional)

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
   ```

2. **Offer choices**:
   ```
   This persona has validation issues.

   1. **Fix issues automatically** - I'll repair the content
   2. **Import anyway** - Save despite the issues
   3. **Cancel** - Don't import
   ```

3. **If "Fix issues automatically"**:
   - Add missing frontmatter fields:
     - `archetype`: infer from content or filename if missing
     - `created`: use today's date (YYYY-MM-DD)
     - `category`: infer from content
     - `keywords`: extract from content
   - Generate missing required sections based on existing content
   - Keep existing valid content intact
   - Show summary of changes made
   - Continue to **Step 4: Save Persona**

4. **If "Import anyway"**: Continue to **Step 4** with original content

5. **If "Cancel"**: Stop here

---

#### Branch C: Raw Content (no archetype in frontmatter)

1. **Ask user**:
   ```
   This doesn't look like a persona file. Would you like me to create a persona from this content?

   1. **Yes** - Generate a full persona based on this content
   2. **No** - Cancel import
   ```

2. **If "No"**: Stop here

3. **If "Yes"**:

   a. **Ask for archetype name**:
      ```
      What archetype name should I use for this persona?

      Suggested: <inferred-name-from-content>

      (Enter a name in kebab-case, e.g., "data-engineer")
      ```

   b. **Ask for additional context** (optional):
      ```
      Any additional context to consider when creating this persona?

      Examples:
      - Specific tools or frameworks to emphasize
      - Team conventions or constraints
      - Particular focus areas

      (Press enter to skip)
      ```

   c. **Research and generate**: Use web searches to supplement the imported content, then compose a full persona following the standard structure:
      ```markdown
      ---
      archetype: <archetype>
      created: <YYYY-MM-DD>
      category: <category>
      keywords:
        - <keyword1>
        - <keyword2>
      ---

      # <Archetype Title>

      You are an expert <role description>...

      ## Core Expertise
      <distilled from research and reference content>

      ## Mental Models
      <distilled from research and reference content>

      ## Best Practices
      <distilled from research and reference content>

      ## Pitfalls to Avoid
      <distilled from research and reference content>

      ## Tools & Technologies
      <distilled from research and reference content>
      ```
      Target length: 200-400 lines

   d. Continue to **Step 4: Save Persona**

---

### Step 4: Save Persona

1. **Ask storage preference**:
   ```
   Where should I save this persona?

   1. **Local** (.claude/skills/assume-persona--<archetype>/) - Specific to this project
   2. **User** (~/.claude/skills/assume-persona--<archetype>/) - Available globally
   ```

2. **Check for conflicts**:
   If a persona with the same archetype exists at that location:
   ```
   Persona '<archetype>' already exists at <location>.

   1. Overwrite existing
   2. Save with different name
   3. Cancel
   ```

3. **Generate SKILL.md**:
   - Extract keywords from persona content (frontmatter keywords, section topics, technologies)
   - Create description that captures when to auto-invoke
   - Example: "Security expert persona. Invoke when discussing: security, authentication, authorization, OWASP, vulnerabilities, penetration testing."
   
   SKILL.md format:
   ```markdown
   ---
   name: assume-persona--<archetype>
   description: |
     <keyword-rich description for auto-invocation>
   ---

   Read and adopt the persona from [location]/assume-persona--<archetype>/persona.md
   ```
   
   Note: Only `name` and `description` are required in frontmatter.

4. **Save both files**:
   - `[location]/assume-persona--[archetype]/persona.md`
   - `[location]/assume-persona--[archetype]/SKILL.md`

5. **Load and confirm**:
   Load the persona into the current session (display the persona.md content to inject into context).

   ```
   Persona '<archetype>' imported and activated.

   The persona will auto-invoke when relevant topics are detected.
   ```

## Notes

- Valid personas are imported directly without modification
- Invalid personas can be repaired automatically or imported as-is
- Raw content (documentation, articles, notes) can be transformed into full personas
- URLs must be publicly accessible (no authentication support)
- The SKILL.md is generated with a description based on the persona content
