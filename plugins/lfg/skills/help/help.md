---
description: Show available LFG commands, their purposes, and current project state
user-invocable: true
disable-model-invocation: true
---

# LFG Help

Display the LFG command reference and current project state.

## Commands

| Command | Purpose |
|---------|---------|
| `/lfg:init` | Initialize a new LFG project. Detects greenfield vs brownfield, gathers project context, creates `.lfg/` directory structure. |
| `/lfg:plan` | Context-aware planning. Creates new epics with milestones, or breaks down existing milestones into executable tasks. |
| `/lfg:execute` | Execute planned tasks. Runs exploration, wave-based execution, verification, and learning accumulation. |
| `/lfg:status` | Show current state, progress on active work, recent learnings, and suggested next action. |
| `/lfg:map` | Map the codebase structure. Creates STACK.md, ARCHITECTURE.md, PATTERNS.md, and CONCERNS.md in `.lfg/codebase/`. |
| `/lfg:help` | Show this help message. |

## Workflow

```
/lfg:init          → Initialize project, optionally map codebase
    ↓
/lfg:plan          → Describe work → Creates epic with milestones
    ↓
/lfg:plan          → Break milestone into tasks with dependencies
    ↓
/lfg:execute       → Explore → Execute waves → Verify → Learn
    ↓
/lfg:status        → Check progress, get next suggested action
```

## Project Structure

```
.lfg/
├── PROJECT.md          # Vision, users, key features
├── STATE.md            # Current position, active work
├── config.json         # Settings (approval_level, research_depth)
├── session.json        # Execution state for resume
├── codebase/           # Codebase mapping (from /lfg:map)
├── epics/              # Epic definitions and tasks
└── learnings/          # Accumulated learnings per epic/milestone
```

## Configuration Options

Edit `.lfg/config.json` to customize behavior:

- **approval_level**: `task` | `milestone` | `checkpoint` | `auto`
- **research_depth**: `skip` | `light` | `deep`
- **model_profile**: `quality` | `balanced` | `budget`
- **auto_commit**: `true` | `false`
- **parallel_exploration**: `true` | `false`

## Instructions

1. Check if `.lfg/` directory exists
2. If it exists, read and display:
   - Current state from STATE.md
   - Active epic/milestone progress
   - Configuration from config.json
3. Always display the command reference above
4. Suggest the most appropriate next command based on current state
