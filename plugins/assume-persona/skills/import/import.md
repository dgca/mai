---
description: Import a persona from a file path or URL with validation
argument-hint: "<path-or-url>"
disable-model-invocation: true
---

# Import Persona

Import a persona from a local file path or URL, converting it to the skill format with validation.

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

1. **Parse the source** from `$ARGUMENTS`
   - If empty, show error: "Usage: /assume-persona:import <path-or-url>"
   - Detect if it's a URL (starts with http:// or https://) or a file path

2. **Fetch the content**:
   - If URL: fetch via HTTP
   - If file path: read the file
   - If fetch fails, show error and stop

3. **Validate using validate-persona.ts**:

   Save the content to a temp file and run validation:

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

4. **Report validation results**:

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

   Import anyway?
   1. Yes - save despite issues
   2. No - cancel import
   ```

5. **If user chooses to import**:

   ```
   Where should I save this persona?

   1. **Local** (.claude/skills/assume-persona--<archetype>/) - Specific to this project
   2. **User** (~/.claude/skills/assume-persona--<archetype>/) - Available globally
   ```

6. **Check for conflicts**:
   - If a persona skill with the same archetype exists in the target location:
     ```
     Persona '<archetype>' already exists at <location>.

     1. Overwrite existing
     2. Save with different name
     3. Cancel
     ```

7. **Generate a description** for SKILL.md:
   - Extract keywords from persona content (frontmatter keywords, section topics, technologies mentioned)
   - Create description that captures when to auto-invoke
   - Example: "Security expert persona. Invoke when discussing: security, authentication, authorization, OWASP, vulnerabilities, penetration testing."

8. **Save using create-persona.ts**:

   ```bash
   echo '<persona.md content>' | node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/create-persona.ts" \
     --archetype "<archetype>" \
     --scope "<local|user>" \
     --description "<generated description>"
   ```

   The script validates, generates SKILL.md with correct loader command, and writes both files.

   Handle the JSON response:
   - On success: `{ "success": true, "path": "..." }`
   - On error: `{ "success": false, "error": "..." }` - show error and offer to fix

9. **Confirm**:
   ```
   Persona '<archetype>' imported successfully.

   The persona will auto-invoke when Claude detects relevant topics.
   Load manually: /assume-persona:load <archetype>
   ```

## Notes

- Validation helps ensure imported personas follow the expected format
- Users can import despite validation issues (their choice)
- URLs must be publicly accessible (no authentication support)
- The SKILL.md is generated with a description based on the persona content
