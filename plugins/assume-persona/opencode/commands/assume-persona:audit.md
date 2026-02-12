---
description: Audit persona for quality and offer improvements
subtask: true
---

# Audit Persona

Audit a persona for structure, content quality, and SKILL.md description quality, then offer to apply improvements.

## Arguments

`$ARGUMENTS` = optional specific archetype to audit

## Storage Locations

Personas are stored as skills in:

1. **Local/project**: `.claude/skills/assume-persona--<archetype>/`
2. **User**: `~/.claude/skills/assume-persona--<archetype>/`

Each persona skill contains:
- `SKILL.md` - Metadata and loader (description quality matters for auto-invocation)
- `persona.md` - Full persona content

## Instructions

### 1. Parse Arguments

- If archetype provided in `$ARGUMENTS`, audit that one
- If empty, list available personas and ask user to pick:

  !`for dir in ~/.claude/skills/assume-persona--*/ .claude/skills/assume-persona--*/ 2>/dev/null; do [ -d "$dir" ] || continue; name=$(basename "$dir" | sed 's/assume-persona--//'); scope="user"; [[ "$dir" == .claude/* ]] && scope="local"; echo "- $name ($scope)"; done`

  Ask: "Which persona would you like to audit?"

### 2. Locate the Persona

Check both locations (local takes precedence):
- `.claude/skills/assume-persona--<archetype>/`
- `~/.claude/skills/assume-persona--<archetype>/`

If not found:
```
Persona '<archetype>' not found.

Create it with: /assume-persona:create <archetype>
```
Stop here.

### 3. Structural Audit

Read both `persona.md` and `SKILL.md` and check these requirements:

**persona.md requirements:**
- [ ] Has YAML frontmatter with: archetype, created, category, keywords
- [ ] Line count between 200-400 lines (current: X lines)
- [ ] Contains required sections:
  - Role description (opening paragraph)
  - Core Expertise
  - Mental Models
  - Best Practices
  - Pitfalls to Avoid
  - Tools & Technologies
- [ ] Uses tables for comparisons and quick-reference content
- [ ] Code examples use generic patterns, not project-specific code
- [ ] Created date is present (for staleness calculation)

**SKILL.md requirements:**
- [ ] Has frontmatter with: name, description (only these two fields required)
- [ ] No deprecated fields (remove `user-invocable` if present)
- [ ] Description contains comma-separated trigger keywords
- [ ] Keywords cover the domain comprehensively
- [ ] Body format: `Read and adopt the persona from <path>/persona.md`

Standard SKILL.md format:
```markdown
---
name: assume-persona--<archetype>
description: |
  <Role> persona for <domain>. Invoke when discussing: <keyword1>, <keyword2>, ...
---

Read and adopt the persona from <location>/assume-persona--<archetype>/persona.md
```

### 4. Content Staleness Check

Calculate persona age from the `created` frontmatter date.

**For personas older than 6 months**, perform web research to check for:
- New major tool versions or paradigm shifts
- Deprecated practices or tools
- New industry-standard tools that should be mentioned
- Changed best practices

Use WebFetch to research:
- Official documentation for major tools mentioned
- Recent blog posts or articles about the domain (search for "{domain} best practices 2026")
- Changelog or release notes for primary tools

### 5. Generate Audit Report

Present findings in this format:

```
## Persona Audit: <archetype>
**Location**: local/user

### Structure (persona.md)
| Check | Status | Details |
|-------|--------|---------|
| Age | ✓ Fresh | Created 2 weeks ago |
| Sections | ⚠ Partial | Missing: Mental Models |
| Length | ✓ Good | 245 lines |
| Frontmatter | ✓ Complete | All fields present |

### Auto-Invocation (SKILL.md)
| Check | Status | Details |
|-------|--------|---------|
| Found | ✓/✗ | Yes/No |
| Description | ✓ Good / ⚠ Short / ✗ Missing | X chars |
| Keywords | ✓/⚠ | Has tech keywords / No specific keywords |

### Content Analysis
<assessment of content quality and actionability>

### Suggested Improvements
1. <improvement 1>
2. <improvement 2>
...

### Keywords Coverage
Current keywords: [list from frontmatter]
Suggested additions: [list any missing relevant keywords]
```

### 6. Offer to Apply Updates

If improvements are needed, ask:

```
Apply improvements?
1. All of them
2. Let me choose specific ones
3. None - keep as is
```

If user wants to choose specific ones, let them specify (e.g., "1, 3, 5" or "all except 2").

### 7. Apply Approved Changes

- Make edits incrementally, explaining each change
- Update the `created` date to today if content was refreshed
- Preserve the persona's voice and structure
- Keep within the 200-400 line target
- Update SKILL.md description if keywords need improvement

### 8. Confirm

```
Persona '<archetype>' updated.
```

## Notes

- If no improvements are needed, skip the "Apply improvements?" prompt
- User must explicitly approve changes before any edits are made
- The `created` date updates to reflect the edit
- Description quality is important for auto-invocation matching
