---
name: list
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

State file: `<cwd>/.claude/plugin-data/assume-persona/.state.json`

## Instructions

1. **List files in each storage directory directly**:
   - Check if each directory exists, then list `*.md` files in it
   - Do NOT use recursive search from parent directories

2. **For each `*.md` file found**, parse the YAML frontmatter to extract:
   - `archetype`: The persona identifier
   - `created`: Creation date
   - `triggers`: Keywords that suggest this persona
   - `category`: Category grouping (if present)
   - `tags`: Tags for filtering (if present)

3. **Also extract from content**:
   - **Description**: First line of the Role section (the line starting with "You are...")
   - **Line count**: For quality indicator

4. **Read state file** to determine which personas are currently active

5. **Calculate quality indicators** for each:
   - **Age**: "fresh" (<3 months), "ok" (3-6 months), "stale" (>6 months)
   - **Completeness**: Check for required sections (Role, Core Expertise, Mental Models, Best Practices, Pitfalls, Tools)
   - **Length**: "short" (<100 lines), "good" (100-500), "long" (>500)

6. **If `$ARGUMENTS` provided**, filter to only show personas matching that category

7. **Group by category** (if categories exist) and **display results**:

```
## Available Personas

### web-development
| Archetype | Description | Quality | Active | Location |
|-----------|-------------|---------|--------|----------|
| typescript-fullstack | Expert TypeScript fullstack developer... | ✓ fresh, complete | ★ | user |

### uncategorized
| Archetype | Description | Quality | Active | Location |
|-----------|-------------|---------|--------|----------|
| django-backend | Expert Django backend developer... | ⚠ stale (8mo) | | local |

Total: 2 personas (1 active)

Legend: ★ = active, ✓ = good quality, ⚠ = needs attention
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
- This is a read-only operation
