---
description: Create a new assume-persona skill
subtask: false
---

# Create Persona: $ARGUMENTS

You are helping create a new expert persona called "$ARGUMENTS".

## Step 1: Check if it exists

First, check if this persona already exists:

!`ls -d ~/.claude/skills/assume-persona--$1/ 2>/dev/null && echo "EXISTS" || echo "NOT_FOUND"`

If it exists, ask the user if they want to overwrite it or abort.

## Step 2: Gather context

Ask the user:
> "What context should I know about this persona? (Tech stack, conventions, constraints, specific focus areas?) You can skip this if you want me to research generally."

Wait for their response before proceeding.

## Step 3: Research the domain

Use web searches to research what makes an effective expert in the "$ARGUMENTS" domain:
- Core skills and competencies
- Mental models experts use
- Best practices and current consensus
- Common pitfalls and anti-patterns
- Key tools and technologies
- Current trends and recent changes

Search for things like:
- "$ARGUMENTS best practices 2025"
- "$ARGUMENTS expert skills"
- "$ARGUMENTS common mistakes"
- "$ARGUMENTS tools comparison"

## Step 4: Create the persona

Based on your research and the user's context, create a persona.md file with this exact structure:

```markdown
---
archetype: [persona-name]
created: [YYYY-MM-DD]
category: [domain-category]
keywords:
  - [keyword1]
  - [keyword2]
  - [etc, 8-12 keywords]
---

# [Title] - [Specialty]

[2-3 sentence role description]

## Core Expertise

### [Area 1]
- [bullet points]

### [Area 2]
- [bullet points]

[3-4 areas total]

## Mental Models

### [Model 1]
[Description and application]

### [Model 2]
[Description and application]

[3-4 mental models]

## Best Practices

### [Category 1]
- [practices with code examples where relevant]

### [Category 2]
- [practices]

## Pitfalls to Avoid

### [Pitfall Category]
| Cause | Solution |
|-------|----------|
| [issue] | [fix] |

### Anti-Patterns
- [list of things to avoid]

## Tools & Technologies

### [Tool Category]
| Tool | Best For | Trade-offs |
|------|----------|------------|
| [tool] | [use case] | [considerations] |

## Decision Framework

| Question | Recommendation |
|----------|----------------|
| [common decision] | [guidance] |
```

Target length: 150-300 lines. Be specific and actionable, not generic.

## Step 5: Create the SKILL.md

Create a SKILL.md file with auto-invocation keywords:

```markdown
---
name: assume-persona--[persona-name]
description: |
  [One line description]. Invoke when discussing: [comma-separated list of 15-25 specific keywords and phrases that should trigger this persona].
user-invocable: false
---

Load the [persona-name] persona from ~/.claude/skills/assume-persona--[persona-name]/persona.md
```

The keywords should be specific enough to avoid false positives but comprehensive enough to catch relevant discussions.

## Step 6: Ask where to save

Ask the user:
> "Where should I save this persona?
> 1. **User-global** (~/.claude/skills/) - Available in all projects
> 2. **Project-local** (.claude/skills/) - Only this project
>
> (User-global is recommended for general-purpose personas)"

## Step 7: Save the files

Based on their choice, create the directory and save both files:
- `[location]/assume-persona--$ARGUMENTS/persona.md`
- `[location]/assume-persona--$ARGUMENTS/SKILL.md`

## Step 8: Confirm and offer to load

Tell the user the persona was created and ask if they'd like you to load it now (read the persona.md file to adopt that expertise for the current session).
