---
description: Initialize a new LFG project. Detects greenfield vs brownfield, gathers project context, and creates the .lfg/ directory structure.
user-invocable: true
disable-model-invocation: true
argument-hint: "[project-name]"
---

# LFG Init

Initialize a new LFG project in the current directory.

## Pre-flight Check

1. Check if `.lfg/` directory already exists
2. If exists, ask user if they want to reinitialize (will preserve existing epics)

## Phase 1: Quick Scan

Use the Explorer agent to determine project type:

```
Task(subagent_type="lfg-explorer", prompt="
Focus: STACK

Quickly scan this directory to determine:
1. Is this a greenfield (empty/new) or brownfield (existing code) project?
2. What's the primary language/framework?
3. Any obvious tech stack indicators?

Be brief — just the essentials.
")
```

## Phase 2: Context Gathering

Have a conversation to understand the project:

**For Greenfield:**
- "What are you building?"
- "Who are the target users?"
- "What are the key features you're planning?"

**For Brownfield:**
- "What does this project do?"
- "What's the current state?"
- "What are you trying to accomplish with LFG?"

Keep it conversational but efficient — 3-5 questions max.

## Phase 3: Create Structure

Create the `.lfg/` directory with:

### .lfg/PROJECT.md

Use the template from `${CLAUDE_PLUGIN_ROOT}/templates/PROJECT.md` and fill in:
- Project name (from argument or conversation)
- Vision (from conversation)
- Target users (from conversation)
- Key features (from conversation)
- Technical context (from scan)

### .lfg/config.json

Copy from `${CLAUDE_PLUGIN_ROOT}/templates/config.json` with defaults:
```json
{
  "approval_level": "checkpoint",
  "research_depth": "light",
  "model_profile": "balanced",
  "auto_commit": true,
  "parallel_exploration": true
}
```

### .lfg/STATE.md

Initialize with:
```markdown
# LFG State

## Active Work

- **Epic**: none
- **Milestone**: none
- **Status**: idle

## Last Activity

- **Action**: Project initialized
- **Timestamp**: [current timestamp]

## Quick Stats

- **Epics**: 0
- **Completed**: 0
- **In Progress**: 0
```

### Create directories

```
.lfg/
├── epics/
├── learnings/
└── codebase/     # Only if brownfield
```

## Phase 4: Codebase Mapping (Brownfield Only)

If brownfield project detected:

1. Ask: "Would you like me to map the codebase structure? This helps with planning but takes a moment."
2. If yes, run `/lfg:map` inline
3. If no, note that they can run `/lfg:map` later

## Completion

Output a summary:
```
✓ LFG initialized for [project-name]
  Type: [greenfield|brownfield]
  Config: .lfg/config.json

Next steps:
  /lfg:plan — Start planning your first epic
  /lfg:map  — Map the codebase structure (if not done)
  /lfg:help — See all available commands
```

## Edge Cases

- **No project name provided**: Ask for one or derive from directory name
- **Existing .lfg/ directory**: Offer to preserve epics and just refresh PROJECT.md
- **Permission issues**: Report clearly and suggest fixes
- **Not a git repo**: Warn but continue (commits won't work without git)
