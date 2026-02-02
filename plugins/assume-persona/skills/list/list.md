---
description: List available personas from all storage locations
argument-hint: "[category]"
disable-model-invocation: true
---

# List Personas

List all available personas from all storage locations with quality indicators.

## Arguments

`$ARGUMENTS` = optional category to filter by (e.g., "web-development")

## Storage Locations

Personas are stored as skills in (do NOT search recursively from home):

1. **Local/project**: `<cwd>/.claude/skills/assume-persona--*/`
2. **User**: `$HOME/.claude/skills/assume-persona--*/`

State file: `$HOME/.claude/plugin-data/assume-persona/state.json`
Config file: `<cwd>/.claude/plugin-data/assume-persona/config.json`

## Instructions

1. **List skill directories in each location**:
   - Glob for `assume-persona--*` directories in `<cwd>/.claude/skills/`
   - Glob for `assume-persona--*` directories in `$HOME/.claude/skills/`
   - Extract archetype from directory name (strip `assume-persona--` prefix)

2. **For each persona skill found**, read `persona.md` and parse YAML frontmatter:
   - `archetype`: The persona identifier (required)
   - `created`: Creation date (required)
   - `category`: Category grouping (optional, default "uncategorized")

3. **Also extract from content**:
   - **Description**: First line of the Role section (the line starting with "You are...")
   - **Line count**: For quality indicator

4. **Determine which personas are loaded** by checking:
   - **State file**: Current session's `loadedPersonas` array (use `${CLAUDE_SESSION_ID}`)
   - **Config file**: `autoLoad` array (project-config personas)
   - A persona is "loaded" if it appears in the current session's state
   - A persona is "auto-load" if it appears in config's autoLoad array

5. **Calculate quality indicators** for each:
   - **Age**: "fresh" (<3 months), "ok" (3-6 months), "stale" (>6 months)
   - **Completeness**: Check for required sections (Role, Core Expertise, Mental Models, Best Practices, Pitfalls, Tools)
   - **Length**: "short" (<100 lines), "good" (100-500), "long" (>500)

6. **If `$ARGUMENTS` provided**, filter to only show personas matching that category

7. **Display results** with one persona per block, blank line between each:
   - Show `(loaded)` for personas in current session's state
   - Show `(auto-load)` for personas in config's autoLoad array
   - If in both, show `(loaded, auto-load)`

```
Available Personas:

Name: typescript-fullstack (auto-load)
Description: Expert TypeScript fullstack developer...
Category: web-development
Location: local
Quality: ✓ fresh, complete

Name: django-backend (loaded)
Description: Expert Django backend developer...
Category: uncategorized
Location: user
Quality: ⚠ stale (8mo)

Total: 2 personas (1 loaded, 1 auto-load)
```

8. **If no personas found**:
```
No personas found.

Create one with: /assume-persona:create <archetype>
```

## Notes

- Local personas override user personas with the same archetype
- Only show unique archetypes (highest precedence wins if duplicate)
- Quality indicators help identify personas that may need updating
- **Auto-load** personas are configured in project config and load at session start
- **Loaded** personas were loaded this session (manually or via auto-invoke)
- This is a read-only operation
