---
name: create
description: Research and create a new subject matter expert persona
argument-hint: "<archetype>"
disable-model-invocation: true
---

# Create Persona

Research and create a new subject matter expert persona.

## Arguments

`$ARGUMENTS` = the archetype to create (e.g., "rust-systems-programmer", "data-engineer")

## Storage Locations

Personas can be saved to (do NOT search recursively from home):

1. **Local/project**: `<cwd>/.claude/plugin-data/assume-persona/personas/`
2. **User** (global): `$HOME/.claude/plugin-data/assume-persona/personas/`

## Instructions

1. **Parse the archetype** from `$ARGUMENTS`
   - Normalize to kebab-case (e.g., "Rust Systems Programmer" → "rust-systems-programmer")
   - If empty, show error: "Usage: /assume-persona:create <archetype>"

2. **Check if persona already exists** by checking each path directly:
   - `<cwd>/.claude/plugin-data/assume-persona/personas/<archetype>.md` (local)
   - `$HOME/.claude/plugin-data/assume-persona/personas/<archetype>.md` (user)
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

5. **Distill research into persona** (200-400 lines max):

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

6. **Ask storage preference**:
```
Where should I save this persona?

1. **Local** (.claude/plugin-data/assume-persona/personas/) - Specific to this project
2. **User** (~/.claude/plugin-data/assume-persona/personas/) - Available globally
3. **Session only** - Don't save, just apply now
```

7. **Save** (unless session-only):
   - Create the chosen directory if needed
   - Save as `<archetype>.md`

8. **Apply the persona** by outputting its full content, then confirm:
```
Persona '<archetype>' created and activated.
```
