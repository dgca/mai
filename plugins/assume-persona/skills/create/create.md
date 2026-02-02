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

2. **Check if persona already exists** by checking each skill directory:
   - `<cwd>/.claude/skills/assume-persona--<archetype>/` (local)
   - `$HOME/.claude/skills/assume-persona--<archetype>/` (user)
   - If found: "Persona '$ARGUMENTS' already exists. Use `/assume-persona:audit $ARGUMENTS` to review or `/assume-persona:load $ARGUMENTS` to activate."
   - Stop here if exists

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

5. **Create the SKILL.md file** (lightweight loader):

   Generate a good description that captures when Claude should auto-invoke this persona. Include:
   - Key topics and domains
   - Technologies and tools
   - Problem types and scenarios

   ```yaml
   ---
   name: assume-persona--<archetype>
   description: |
     <Archetype> persona. Invoke when discussing: <topic1>, <topic2>,
     <technology1>, <technology2>, <scenario1>, <scenario2>.
   user-invocable: false
   ---

   !`node --experimental-strip-types --no-warnings "$HOME/.claude/plugin-data/assume-persona/scripts/load-persona.ts" "${CLAUDE_SESSION_ID}" "<archetype>" "<persona-path>/persona.md"`
   ```

   Where `<persona-path>` depends on the storage location chosen:
   - Local: `$PWD/.claude/skills/assume-persona--<archetype>`
   - User: `$HOME/.claude/skills/assume-persona--<archetype>`

6. **Distill research into persona.md** (200-400 lines max):

```yaml
---
archetype: <archetype>
created: <YYYY-MM-DD>
category: <category> # optional, e.g., web-development, data-engineering, systems
keywords: # optional, helps /assume-persona:recommend find this persona
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

7. **Ask storage preference**:
```
Where should I save this persona?

1. **Local** (.claude/skills/assume-persona--<archetype>/) - Specific to this project
2. **User** (~/.claude/skills/assume-persona--<archetype>/) - Available globally
3. **Session only** - Don't save, just apply now
```

8. **Save** (unless session-only):
   - Create the skill directory: `assume-persona--<archetype>/`
   - Save `SKILL.md` (with correct path for the chosen location)
   - Save `persona.md`

9. **Apply the persona** by outputting its full content, then confirm:
```
Persona '<archetype>' created and activated.

The persona will auto-invoke when Claude detects relevant topics.
Load manually: /assume-persona:load <archetype>
```
