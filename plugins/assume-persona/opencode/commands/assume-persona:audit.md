---
description: Audit an existing persona for staleness and improvements
allowed-tools: WebFetch, Read, Glob, Edit, Write, Bash
---

# Persona Audit Command

Audit an existing persona skill for structural compliance, content staleness, and improvement opportunities.

## Arguments

$ARGUMENTS - The persona archetype name (e.g., "qa-engineer", "devops-engineer")

## Instructions

### 1. Locate the Persona

Find the persona files at `~/.claude/skills/assume-persona--{archetype}/`:
- `persona.md` - Main persona content (150-300 lines target)
- `SKILL.md` - Auto-invocation configuration

If the persona doesn't exist, inform the user and suggest using `/assume-persona:create` instead.

### 2. Structural Audit

Check these requirements and note any violations:

**persona.md requirements:**
- [ ] Has YAML frontmatter with: archetype, created, category, keywords
- [ ] Line count between 150-300 lines (current: X lines)
- [ ] Contains required sections:
  - Core Expertise (what they know deeply)
  - Mental Models (how they think about problems)
  - Best Practices (what they recommend)
  - Pitfalls to Avoid (what they warn against)
  - Tools & Technologies (what they use, with comparison tables)
  - Decision Framework (quick reference table)
- [ ] Uses tables for comparisons and quick-reference content
- [ ] Code examples use generic patterns, not project-specific code
- [ ] Created date is present (for staleness calculation)

**SKILL.md requirements:**
- [ ] Has frontmatter with: name, description, user-invocable: false
- [ ] Description contains comma-separated trigger keywords
- [ ] Keywords cover the domain comprehensively

### 3. Content Staleness Check

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

### 4. Generate Audit Report

Present findings in this format:

```
## Persona Audit: {archetype}

### Summary
- **Age**: X days/months
- **Line Count**: X lines (target: 150-300)
- **Structural Score**: X/10
- **Staleness Risk**: Low/Medium/High

### Structural Issues
[List any violations from the structural audit]

### Content Staleness Findings
[List any outdated information discovered]

### Recommended Improvements
1. [Specific, actionable improvement]
2. [Another improvement]
...

### Keywords Coverage
Current keywords: [list]
Suggested additions: [list any missing relevant keywords]
```

### 5. Offer to Apply Updates

After presenting the report, ask the user:

"Would you like me to apply these improvements? I can:
1. Fix structural issues only
2. Update stale content with current information
3. Apply all improvements
4. Skip updates"

If the user chooses to update:
- Make edits incrementally, explaining each change
- Update the `created` date to today if content was refreshed
- Preserve the persona's voice and structure
- Keep within the 150-300 line target

## Example Usage

User runs: `/assume-persona:audit qa-engineer`

Output:
```
## Persona Audit: qa-engineer

### Summary
- **Age**: 1 day
- **Line Count**: 166 lines (target: 150-300) ✓
- **Structural Score**: 10/10
- **Staleness Risk**: Low

### Structural Issues
None found.

### Content Staleness Findings
- Persona was just created, no staleness detected.

### Recommended Improvements
None at this time.

### Keywords Coverage
Current: testing, qa, quality-assurance, e2e, playwright, cypress, jest, accessibility, wcag, visual-regression
Suggested additions: vitest, msw, storybook, component-testing
```
