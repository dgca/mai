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

1. **Local/project**: `.claude/skills/persona-<archetype>/`
2. **User** (global): `~/.claude/skills/persona-<archetype>/`

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

2. **Output the validation report and prompt**:

   Output the report and end your response with:
   ```
   What would you like to do?
   - "fix" - Repair automatically
   - "import" - Save anyway
   - "cancel" - Don't import
   ```
   
   Then STOP and wait for the user's response.

3. **If user says "fix"**:
   - Add missing frontmatter fields:
     - `archetype`: infer from content or filename if missing
     - `created`: use today's date (YYYY-MM-DD)
     - `category`: infer from content
     - `keywords`: extract from content
   - Generate missing required sections based on existing content
   - Keep existing valid content intact
   - Show summary of changes made
   - Continue to **Step 4: Save Persona**

4. **If user says "import"**: Continue to **Step 4** with original content

5. **If user says "cancel"**: Stop here

---

#### Branch C: Raw Content (no archetype in frontmatter)

1. **Ask user**:

   Output:
   ```
   This doesn't look like a persona file.
   
   Reply "yes" to generate a full persona from this content, or "no" to cancel.
   ```
   
   Then STOP and wait for the user's response.

2. **If user says "no"**: Stop here

3. **If user says "yes"**:

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

   d. **Validate the generated persona** before saving:
      - Check frontmatter: `archetype:` (kebab-case), `created:` (YYYY-MM-DD), `category:`, `keywords:`
      - Check required sections: Role description ("You are"), Core Expertise, Mental Models, Best Practices, Pitfalls, Tools
      - Check length: 100-500 lines recommended
      
      If validation fails, show report and end your response with:
      ```
      What would you like to do?
      - "fix" - Repair automatically
      - "save" - Save anyway
      - "cancel" - Don't save
      ```
      
      Then STOP and wait for the user's response.

   e. Continue to **Step 4: Save Persona**

---

### Step 4: Save Persona

1. **Ask storage preference**:

   Output:
   ```
   Where should I save this persona?
   - "local" - .claude/skills/ in this project
   - "user" - ~/.claude/skills/ for global access
   ```
   
   Then STOP and wait for the user's response.

2. **Check for conflicts**:
   If a persona with the same archetype exists at that location, output:
   ```
   Persona '<archetype>' already exists at <location>.
   
   Reply "overwrite" to replace, "rename" to use a different name, or "cancel" to abort.
   ```
   
   Then STOP and wait for the user's response.

3. **Generate SKILL.md**:
   - Extract keywords from persona content (frontmatter keywords, section topics, technologies)
   - Create description that captures when to auto-invoke
   - Example: "Security expert persona. Invoke when discussing: security, authentication, authorization, OWASP, vulnerabilities, penetration testing."
   
   SKILL.md format:
   ```markdown
   ---
   name: persona-<archetype>
   description: |
     <keyword-rich description for auto-invocation>
   ---

   Read and adopt the persona from [location]/persona-<archetype>/persona.md
   ```
   
   Note: Only `name` and `description` are required in frontmatter.

4. **Save both files**:
   - `[location]/persona-[archetype]/persona.md`
   - `[location]/persona-[archetype]/SKILL.md`

5. **Return for loading**:
   Return a response that includes:
   - Confirmation message
   - Instruction for main session to load
   
   Example:
   ```
   Persona '<archetype>' imported to [location].

   ACTION_REQUIRED: Load this persona with persona_load tool using archetype "<archetype>"
   ```

## Notes

- Valid personas are imported directly without modification
- Invalid personas can be repaired automatically or imported as-is
- Raw content (documentation, articles, notes) can be transformed into full personas
- URLs must be publicly accessible (no authentication support)
- The SKILL.md is generated with a description based on the persona content
