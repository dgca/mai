---
description: Context-aware planning. Creates new epics with milestones, or breaks down existing milestones into executable tasks.
user-invocable: true
disable-model-invocation: true
argument-hint: "[epic-name or milestone description]"
---

# LFG Plan

Context-aware planning that adapts based on current state.

## Pre-flight Check

1. Check if `.lfg/` exists. If not, suggest `/lfg:init` first.
2. Read `.lfg/STATE.md` to determine current context.
3. Read `.lfg/config.json` for research_depth setting.

## Context Detection

### Context A: No Active Work
- STATE.md shows no active epic
- **Action**: Start epic planning mode

### Context B: Active Epic, Unplanned Milestone
- STATE.md shows active epic
- Next milestone in EPIC.md has no MILESTONE.md
- **Action**: Start milestone planning mode

### Context C: Active Milestone with Tasks
- STATE.md shows active milestone
- MILESTONE.md exists with tasks
- **Action**: Report status and suggest `/lfg:execute` or `/lfg:status`

---

## Mode A: Epic Planning

### Step 1: Gather Context

Have a conversation to understand the work:

- "What do you want to build?"
- "What problem does this solve?"
- "What are the must-have features?"
- "Are there specific constraints I should know about?"

Keep it to 3-5 questions. Use information from PROJECT.md if available.

### Step 2: Spawn PM Agent

```
Task(subagent_type="lfg-pm", prompt="
You are planning a new epic based on this description:

[USER'S DESCRIPTION]

Project context:
[Contents of PROJECT.md if exists]

Codebase context:
[Brief summary from .lfg/codebase/ if exists]

Create an EPIC.md with:
1. Clear title and slug (kebab-case)
2. Overview of what we're building
3. Requirements list (REQ-01, REQ-02, etc.) with priorities
4. Milestones that group requirements logically
5. Success criteria for the epic

Output the complete EPIC.md content.
")
```

### Step 3: Create Epic Structure

1. Create directory: `.lfg/epics/{slug}/`
2. Write EPIC.md from PM agent output
3. Create milestone directories: `.lfg/epics/{slug}/m1/`, `m2/`, etc.

### Step 4: Update State

Update `.lfg/STATE.md`:
```markdown
## Active Work

- **Epic**: {slug}
- **Milestone**: 1
- **Status**: planning
```

### Step 5: Offer Next Steps

```
✓ Epic "{title}" created with {N} milestones

Milestone 1: {milestone-1-title}
Requirements: {REQ-IDs}

Next steps:
  /lfg:plan  — Break Milestone 1 into tasks
  /lfg:help  — See all commands
```

---

## Mode B: Milestone Planning

### Step 1: Load Context

Read:
- `.lfg/epics/{slug}/EPIC.md` — requirements and milestone goals
- `.lfg/codebase/` files — patterns and architecture
- `.lfg/learnings/{slug}/` — learnings from previous milestones

### Step 2: Research Phase (Optional)

Based on `research_depth` in config.json:

**If "skip"**: Proceed directly to planning.

**If "light"**:
```
Task(subagent_type="lfg-researcher", prompt="
Quick research for Milestone {N}: {title}

Requirements to address:
{REQ-IDs and descriptions}

Do a quick verification:
- Are there any API/syntax changes we should know about?
- Any obvious gotchas for this type of work?

Keep it brief — just flag anything important.
")
```

**If "deep"**:
```
Task(subagent_type="lfg-researcher", prompt="
Deep research for Milestone {N}: {title}

Requirements to address:
{REQ-IDs and descriptions}

Existing codebase patterns:
{Summary from PATTERNS.md}

Research:
1. Best practices for implementing these requirements
2. Common pitfalls and how to avoid them
3. Security and performance considerations
4. Alternative approaches and trade-offs

Provide a comprehensive research summary.
")
```

### Step 3: Spawn PM Agent for Task Breakdown

```
Task(subagent_type="lfg-pm", prompt="
You are breaking down Milestone {N} into tasks.

Epic: {slug}
Milestone: {N} - {title}

Requirements to address:
{REQ-IDs and descriptions from EPIC.md}

Codebase patterns:
{Summary from PATTERNS.md if exists}

Research findings:
{Research output if research was done}

Previous learnings:
{Learnings from previous milestones if any}

Create:
1. Individual task files (001-description.md, 002-description.md, etc.)
2. Each task should be 5-30 min of Claude work
3. Group tasks into waves based on dependencies
4. Flag tasks that need checkpoints

Output each task file's content, then a MILESTONE.md summarizing all tasks.
")
```

### Step 4: Write Files

1. Create `.lfg/epics/{slug}/m{N}/tasks/` directory
2. Write each task file
3. Write `.lfg/epics/{slug}/m{N}/MILESTONE.md`

### Step 5: Update State

Update `.lfg/STATE.md`:
```markdown
## Active Work

- **Epic**: {slug}
- **Milestone**: {N}
- **Status**: ready
```

### Step 6: Summary

```
✓ Milestone {N} planned with {X} tasks in {Y} waves

Wave 1: {task-count} tasks (parallel)
Wave 2: {task-count} tasks (depends on Wave 1)
...

Checkpoints flagged: {checkpoint-count}

Next steps:
  /lfg:execute  — Start execution
  /lfg:status   — Review the plan
```

---

## Error Handling

- **PM agent fails**: Report error, suggest retrying with more context
- **Research agent fails**: Warn but continue with planning (research is optional)
- **File write fails**: Report specific error and suggest permission check

## Best Practices

- Let the PM agent do the heavy lifting — it's trained for this
- Include all relevant context — codebase maps, learnings, requirements
- Don't rush past research for complex milestones
- Review wave structure — tasks in Wave 1 should truly have no dependencies
