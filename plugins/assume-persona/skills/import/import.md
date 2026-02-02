---
description: Import a persona from a file path or URL, with automatic repair or generation
argument-hint: "<path-or-url>"
disable-model-invocation: true
---

# Import Persona

Import a persona from a local file path or URL. Handles three cases:
- **Valid persona** → import directly
- **Invalid persona** → offer to fix issues automatically
- **Raw content** → generate a full persona from the content

## Arguments

`$ARGUMENTS` = file path or URL to import from (e.g., "./my-persona.md" or "https://example.com/persona.md")

## Storage Locations

Imported personas are saved as skills in (use exact paths, do NOT search recursively):

1. **Local/project**: `<cwd>/.claude/skills/assume-persona--<archetype>/`
2. **User** (global): `$HOME/.claude/skills/assume-persona--<archetype>/`

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
   - If file path: use `cat` to read the file content:
     ```bash
     cat "<path>"
     ```
   - If fetch fails, show error and stop

### Step 2: Validate and Detect Content Type

Run validation to understand what we're working with:

```bash
echo '<content>' | node --experimental-strip-types --no-warnings \
  "${CLAUDE_PLUGIN_ROOT}/scripts/validate-persona.ts" --stdin
```

The script returns JSON:
```json
{
  "valid": true/false,
  "frontmatter": { "archetype": "...", "created": "...", "category": "..." },
  "sections": {
    "roleDescription": true/false,
    "coreExpertise": true/false,
    "mentalModels": true/false,
    "bestPractices": true/false,
    "pitfalls": true/false,
    "tools": true/false
  },
  "lineCount": 245,
  "errors": ["Missing ## Core Expertise section"],
  "warnings": ["Description exceeds recommended length"]
}
```

**Determine content type based on validation results:**
- If `frontmatter.archetype` exists → treat as persona (valid or invalid)
- If no `frontmatter.archetype` → treat as raw content

### Step 3: Branch Based on Content Type

---

#### Branch A: Valid Persona (valid=true, has archetype)

Proceed directly to **Step 4: Save Persona**.

---

#### Branch B: Invalid Persona (valid=false, has archetype)

The content has persona structure but validation errors.

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

   1. **Fix issues automatically** - Claude will repair the content
   2. **Import anyway** - Save despite the issues
   3. **Cancel** - Don't import
   ```

3. **If "Fix issues automatically"**:
   - Fix the identified issues:
     - Add missing frontmatter fields:
       - `archetype`: infer from content or filename if missing
       - `created`: use today's date (YYYY-MM-DD)
       - `category`: infer from content
       - `keywords`: extract from content
     - Generate missing required sections based on existing content:
       - Analyze the existing persona content
       - Generate appropriate content for each missing section
       - Keep existing valid content intact
   - Show summary of changes made
   - Continue to **Step 4: Save Persona**

4. **If "Import anyway"**:
   - Continue to **Step 4: Save Persona** with original content

5. **If "Cancel"**:
   - Stop here

---

#### Branch C: Raw Content (no archetype in frontmatter)

The content doesn't have persona structure.

1. **Ask user**:
   ```
   This doesn't look like a persona file. Would you like me to create a persona from this content?

   1. **Yes** - Generate a full persona based on this content
   2. **No** - Cancel import
   ```

2. **If "No"**:
   - Stop here

3. **If "Yes"**:

   a. **Ask for archetype name**:
      ```
      What archetype name should I use for this persona?

      Suggested: <inferred-name-from-content>

      (Enter a name in kebab-case, e.g., "data-engineer")
      ```
      - Analyze the content to suggest an appropriate archetype name
      - Normalize user input to kebab-case

   b. **Ask for additional context** (optional):
      ```
      Any additional context to consider when creating this persona?

      Examples:
      - Specific tools or frameworks to emphasize
      - Team conventions or constraints
      - Particular focus areas

      (Press enter to skip)
      ```

   c. **Spawn `persona-researcher` agent**:
      ```
      Research what makes an effective <archetype>.
      Focus on practical knowledge that helps write better code and make better decisions.
      Return structured findings (not a persona).

      <reference-content>
      {the imported raw content}
      </reference-content>

      <additional-context>
      {user's context, or "None provided" if skipped}
      </additional-context>
      ```

   d. **Compose persona.md** from research findings and original content:
      - Use the standard persona structure:
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
      - Target length: 200-400 lines

   e. Continue to **Step 4: Save Persona**

---

### Step 4: Save Persona

1. **Ask storage preference**:
   ```
   Where should I save this persona?

   1. **Local** (.claude/skills/assume-persona--<archetype>/) - Specific to this project
   2. **User** (~/.claude/skills/assume-persona--<archetype>/) - Available globally
   ```

2. **Check for conflicts**:
   - If a persona skill with the same archetype exists in the target location:
     ```
     Persona '<archetype>' already exists at <location>.

     1. Overwrite existing
     2. Save with different name
     3. Cancel
     ```

3. **Generate description** for SKILL.md:
   - Extract keywords from persona content (frontmatter keywords, section topics, technologies mentioned)
   - Create description that captures when to auto-invoke
   - Example: "Security expert persona. Invoke when discussing: security, authentication, authorization, OWASP, vulnerabilities, penetration testing."

4. **Save using create-persona.ts**:

   ```bash
   echo '<persona.md content>' | node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/create-persona.ts" \
     --archetype "<archetype>" \
     --scope "<local|user>" \
     --description "<generated description>"
   ```

   Handle the JSON response:
   - On success: `{ "success": true, "path": "..." }`
   - On error: `{ "success": false, "error": "..." }` - show error and offer to fix

5. **Load and confirm**:

   ```bash
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/load-persona.ts" \
     "${CLAUDE_SESSION_ID}" "<archetype>"
   ```

   Output the persona content to inject into context, then:
   ```
   Persona '<archetype>' imported and activated.

   The persona will auto-invoke when Claude detects relevant topics.
   Load manually: /assume-persona:load <archetype>
   ```

## Notes

- Valid personas are imported directly without modification
- Invalid personas can be repaired automatically or imported as-is
- Raw content (documentation, articles, notes) can be transformed into full personas
- URLs must be publicly accessible (no authentication support)
- The SKILL.md is generated with a description based on the persona content
