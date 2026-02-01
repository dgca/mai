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

Check these directories directly (do NOT search recursively from home):

1. **Local/project**: `<cwd>/.claude/plugin-data/assume-persona/personas/`
2. **User**: `$HOME/.claude/plugin-data/assume-persona/personas/`

State file: `<cwd>/.claude/plugin-data/assume-persona/.state.local.json`
Config file: `<cwd>/.claude/plugin-data/assume-persona/config.json`

## Instructions

1. **List files in each storage directory directly**:
   - Check if each directory exists, then list `*.md` files in it
   - Do NOT use recursive search from parent directories

2. **For each `*.md` file found**, parse the YAML frontmatter to extract:
   - `archetype`: The persona identifier (required)
   - `created`: Creation date (required)
   - `category`: Category grouping (optional, default "uncategorized")

3. **Also extract from content**:
   - **Description**: First line of the Role section (the line starting with "You are...")
   - **Line count**: For quality indicator

4. **Determine which personas are active** by checking BOTH:
   - **State file**: `activePersonas` array (manually loaded personas)
   - **Config file**: `autoLoad` array (project-config personas loaded at session start)
   - A persona is active if it appears in either list
   - If either file doesn't exist, treat its array as empty

5. **Calculate quality indicators** for each:
   - **Age**: "fresh" (<3 months), "ok" (3-6 months), "stale" (>6 months)
   - **Completeness**: Check for required sections (Role, Core Expertise, Mental Models, Best Practices, Pitfalls, Tools)
   - **Length**: "short" (<100 lines), "good" (100-500), "long" (>500)

6. **If `$ARGUMENTS` provided**, filter to only show personas matching that category

7. **Display results** with one persona per block, blank line between each:
   - Show `(active)` for personas in state file's activePersonas
   - Show `(auto-loaded)` for personas in config file's autoLoad array
   - If in both, show `(active, auto-loaded)`

```
Available Personas:

Name: typescript-fullstack (auto-loaded)
Description: Expert TypeScript fullstack developer...
Category: web-development
Location: local
Quality: ✓ fresh, complete

Name: django-backend (active)
Description: Expert Django backend developer...
Category: uncategorized
Location: user
Quality: ⚠ stale (8mo)

Total: 2 personas (2 active)
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
- **Auto-loaded** personas are configured in project config and load at session start
- **Active** personas were manually loaded via `/assume-persona:load`
- Both count toward the active total
- This is a read-only operation
