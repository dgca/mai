---
description: Research and create a new subject matter expert persona
argument-hint: "<archetype>"
disable-model-invocation: true
---

# Create Persona

Research and create a new subject matter expert persona as an auto-invocable skill.

## Arguments

`$ARGUMENTS` = the archetype to create (e.g., "rust-systems-programmer", "data-engineer")

## Storage Locations

Personas are stored as skills in (do NOT search recursively from home):

1. **Local/project**: `<cwd>/.claude/skills/assume-persona--<archetype>/`
2. **User** (global): `$HOME/.claude/skills/assume-persona--<archetype>/`

Each persona skill contains:
- `SKILL.md` - Lightweight loader with description for auto-invocation
- `persona.md` - Full persona content

## Instructions

1. **Parse the archetype** from `$ARGUMENTS`
   - Normalize to kebab-case (e.g., "Rust Systems Programmer" → "rust-systems-programmer")
   - If empty, show error: "Usage: /assume-persona:create <archetype>"

2. **Check if persona already exists** using check-exists.ts:

   ```bash
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/check-exists.ts" "<archetype>"
   ```

   The script returns JSON:
   - `{ "exists": true, "scope": "local", "path": "..." }` - persona found
   - `{ "exists": false }` - persona not found

   If exists: "Persona '$ARGUMENTS' already exists. Use `/assume-persona:audit $ARGUMENTS` to review or `/assume-persona:load $ARGUMENTS` to activate."
   Stop here if exists

3. **Ask for additional context**:
   ```
   What context should I know about this persona?

   Examples:
   - Tech stack, frameworks, or tools you use
   - Team conventions or constraints
   - Specific domains or problem types
   - Anything else that would make this persona more useful

   (Press enter to skip if the name is self-explanatory)
   ```

4. **Spawn `persona-researcher` agent**:
   ```
   Research what makes an effective $ARGUMENTS.
   Focus on practical knowledge that helps write better code and make better decisions.
   Return structured findings (not a persona).

   <additional-context>
   {user's context, or "None provided" if skipped}
   </additional-context>
   ```

5. **Generate a description** for SKILL.md that captures when Claude should auto-invoke this persona:
   - Include specific keywords, technologies, tools, and scenarios
   - Keep it concise but comprehensive for matching
   - Example: "TypeScript fullstack persona. Invoke when discussing: React, Next.js, Node.js, TypeScript, API design, frontend architecture, server-side rendering."

6. **Compose the persona.md content** from research findings:

   The content must follow this exact structure:

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
   <distilled from research>

   ## Mental Models
   <distilled from research>

   ## Best Practices
   <distilled from research>

   ## Pitfalls to Avoid
   <distilled from research>

   ## Tools & Technologies
   <distilled from research>
   ```

   Target length: 200-400 lines

7. **Ask storage preference**:
   ```
   Where should I save this persona?

   1. **Local** (.claude/skills/assume-persona--<archetype>/) - Specific to this project
   2. **User** (~/.claude/skills/assume-persona--<archetype>/) - Available globally
   3. **Session only** - Don't save, just apply now
   ```

8. **Save using create-persona.ts** (unless session-only):

   Pipe the persona.md content to the script:

   ```bash
   echo '<persona.md content>' | node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/create-persona.ts" \
     --archetype "<archetype>" \
     --scope "<local|user>" \
     --description "<the description from step 5>"
   ```

   The script:
   - Validates the persona content (frontmatter, required sections)
   - Generates SKILL.md with the correct loader command
   - Writes both files atomically
   - Returns JSON: `{ "success": true, "path": "..." }` or `{ "success": false, "error": "..." }`

   If validation fails, show the error and offer to fix the issues.

9. **Load the persona** using load-persona.ts:

   ```bash
   node --experimental-strip-types --no-warnings \
     "${CLAUDE_PLUGIN_ROOT}/scripts/load-persona.ts" \
     "${CLAUDE_SESSION_ID}" "<archetype>"
   ```

   The script outputs the persona content (display it to inject into context) and updates state.json.

   Then confirm:
   ```
   Persona '<archetype>' created and activated.

   The persona will auto-invoke when Claude detects relevant topics.
   ```
