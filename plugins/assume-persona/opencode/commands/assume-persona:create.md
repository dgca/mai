---
description: Research and create a new subject matter expert persona
subtask: true
---

# Create Persona: $ARGUMENTS

You are helping create a new expert persona called "$ARGUMENTS".

## Step 1: Parse and validate archetype

- Normalize to kebab-case (e.g., "Rust Systems Programmer" → "rust-systems-programmer")
- If empty, show error: "Usage: /assume-persona:create <archetype>"

## Step 2: Check if it exists

Check both local and user locations:

!`ls -d .claude/skills/assume-persona--$1/ ~/.claude/skills/assume-persona--$1/ 2>/dev/null | head -1`

If found, tell the user:
> "Persona '$ARGUMENTS' already exists. Use `/assume-persona:audit $ARGUMENTS` to review or `/assume-persona:load $ARGUMENTS` to activate."

Stop here if exists.

## Step 3: Gather context

Ask the user:
> "What context should I know about this persona?
>
> Examples:
> - Tech stack, frameworks, or tools you use
> - Team conventions or constraints
> - Specific domains or problem types
> - Anything else that would make this persona more useful
>
> (Press enter to skip if the name is self-explanatory)"

Wait for their response before proceeding.

## Step 4: Research the domain

Use web searches to research what makes an effective expert in the "$ARGUMENTS" domain:
- Core skills and competencies
- Mental models experts use
- Best practices and current consensus
- Common pitfalls and anti-patterns
- Key tools and technologies
- Current trends and recent changes

Search for things like:
- "$ARGUMENTS best practices 2026"
- "$ARGUMENTS expert skills"
- "$ARGUMENTS common mistakes"
- "$ARGUMENTS tools comparison"

Focus on practical knowledge that helps write better code and make better decisions.

## Step 5: Create the persona

Based on your research and the user's context, create a persona.md file with this exact structure:

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

Target length: 200-400 lines. Be specific and actionable, not generic.

## Step 6: Generate SKILL.md description

Create a description for SKILL.md that captures when to auto-invoke this persona:
- Include specific keywords, technologies, tools, and scenarios
- Keep it concise but comprehensive for matching
- Example: "TypeScript fullstack persona. Invoke when discussing: React, Next.js, Node.js, TypeScript, API design, frontend architecture, server-side rendering."

## Step 7: Validate the persona

Before saving, validate the generated persona content:

**Check frontmatter:**
- `archetype:` present and kebab-case
- `created:` present and valid YYYY-MM-DD format
- `category:` present (optional but recommended)
- `keywords:` present with at least one entry (optional but recommended)

**Check required sections:**
- Role description paragraph containing "You are"
- `## Core Expertise`
- `## Mental Models`
- `## Best Practices`
- `## Pitfalls to Avoid` (or `## Pitfalls`)
- `## Tools & Technologies` (or `## Tools`)

**Check quality:**
- Length: 100-500 lines recommended

**If validation passes:** Continue to Step 8.

**If validation fails:** Show the validation report:

```
## Validation Report

### Frontmatter
✓ archetype: <value>
✓ created: <value>
⚠ category: missing (optional)

### Required Sections
✓ Role description
✓ Core Expertise
✗ Mental Models (missing)
✓ Best Practices
✓ Pitfalls to Avoid
✓ Tools & Technologies

### Issues Found
- Missing required section: Mental Models
```

Then output the validation report and end your response with:

```
What would you like to do?
- "fix" - Repair automatically
- "save" - Save anyway
- "cancel" - Don't save
```

Then STOP and wait for the user's response.

- **If user says "fix"**: Fix the identified issues (add missing sections, correct frontmatter), show summary of changes, then continue to Step 8.
- **If user says "save"**: Continue to Step 8 with original content.
- **If user says "cancel"**: Stop here.

## Step 8: Ask where to save

Output:

```
Where should I save this persona?
- "local" - .claude/skills/ in this project
- "user" - ~/.claude/skills/ for global access  
- "session" - Don't save, just apply now
```

Then STOP and wait for the user's response.

## Step 9: Save the files (unless session-only)

If user chose Local or User, create the directory and save both files:
- `[location]/assume-persona--$ARGUMENTS/persona.md`
- `[location]/assume-persona--$ARGUMENTS/SKILL.md`

The SKILL.md should contain:
```markdown
---
name: assume-persona--<archetype>
description: |
  [The description from step 6]
---

Read and adopt the persona from [location]/assume-persona--<archetype>/persona.md
```

Note: Only `name` and `description` are required in frontmatter. The description should be keyword-rich for auto-invocation matching.

## Step 10: Return for loading

After saving (or for session-only), return a response that includes:
1. Confirmation message
2. Instruction for main session to load

Example:
```
Persona 'archetype' created and saved to [location].

ACTION_REQUIRED: Load this persona with persona_load tool using archetype "<archetype>"
```

For session-only, include the full persona content in your response so the main session can use it directly.
