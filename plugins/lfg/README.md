# LFG - Let's Fucking Go

Break down large work into manageable pieces and execute efficiently with AI subagents.

LFG is a [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin that brings structured project management to AI-assisted development. It helps you plan work systematically, execute tasks in parallel where possible, and accumulate learnings across your project.

## Why LFG?

AI coding assistants excel at focused, well-defined tasks but can struggle with large, ambiguous work. LFG bridges that gap by:

- **Breaking work into right-sized pieces** — Epics become milestones become tasks that AI can execute reliably
- **Parallelizing where safe** — Independent tasks run concurrently; dependent tasks wait their turn
- **Verifying independently** — A separate QA agent checks completed work, never trusting claims
- **Learning as you go** — Insights from earlier tasks inform later ones

## Installation

```bash
claude plugin install https://github.com/dgca/mai
```

Or for local development:

```bash
claude --plugin-dir ./plugins/lfg
```

## Quick Start

### 1. Initialize your project

```
/lfg:init
```

LFG detects whether you're starting fresh (greenfield) or working with existing code (brownfield), then gathers context about your project.

### 2. Plan your work

```
/lfg:plan
```

Describe what you want to build. LFG creates an **epic** with requirements and **milestones**. Run `/lfg:plan` again to break the first milestone into executable **tasks**.

### 3. Execute

```
/lfg:execute
```

LFG explores the codebase, executes tasks in waves, verifies each one, and accumulates learnings. You stay in control with configurable checkpoints.

### 4. Check progress

```
/lfg:status
```

See where you are, what's done, what's next.

## How It Works

### Work Hierarchy

```
Epic (e.g., "user-authentication")
├── Milestone 1: "basic login"
│   ├── Task 001: setup database schema
│   ├── Task 002: create login endpoint
│   └── Task 003: add session middleware
└── Milestone 2: "password reset"
    ├── Task 001: email service integration
    └── ...
```

- **Epics** define a body of work with requirements (REQ-01, REQ-02, etc.)
- **Milestones** group requirements into shippable increments
- **Tasks** are atomic units of work (5-30 minutes of Claude work each)

### Execution Phases

When you run `/lfg:execute`, LFG proceeds through four phases:

1. **Exploration** — Fast agents map affected files and identify patterns to follow
2. **Wave Execution** — Tasks execute in waves; tasks within a wave run in parallel
3. **Verification** — A QA agent independently verifies each completed task
4. **Learning** — Insights are captured for future tasks

### Agents

LFG uses specialized agents for different jobs:

| Agent | Model | Purpose |
|-------|-------|---------|
| Explorer | Haiku | Fast, read-only codebase mapping |
| PM | Sonnet | Break epics into milestones and tasks |
| Researcher | Sonnet | Deep research before planning |
| Developer | Sonnet | Execute tasks with atomic commits |
| QA | Sonnet | Independent verification |

## Commands

| Command | Purpose |
|---------|---------|
| `/lfg:init` | Initialize project, detect greenfield/brownfield, create `.lfg/` structure |
| `/lfg:plan` | Create epics with milestones, or break milestones into tasks |
| `/lfg:execute` | Run exploration → wave execution → verification → learning |
| `/lfg:status` | Show current state, progress, and suggested next action |
| `/lfg:map` | Map codebase structure (stack, architecture, patterns, concerns) |
| `/lfg:help` | Show command reference |

## Configuration

LFG stores configuration in `.lfg/config.json`:

```json
{
  "approval_level": "checkpoint",
  "research_depth": "light",
  "model_profile": "balanced",
  "auto_commit": true,
  "parallel_exploration": true
}
```

### Options

#### `approval_level`

Controls when LFG pauses for your input.

| Value | Behavior |
|-------|----------|
| `task` | Pause after every task |
| `checkpoint` | Pause only at flagged checkpoints (default) |
| `milestone` | Pause only after milestone completes |
| `auto` | Run everything, report at end |

#### `research_depth`

Controls research before milestone planning.

| Value | Behavior |
|-------|----------|
| `skip` | No research phase |
| `light` | Quick verification of APIs and syntax (default) |
| `deep` | Comprehensive research with multiple sources |

#### `model_profile`

Adjusts model selection for agents.

| Value | Behavior |
|-------|----------|
| `quality` | Prefer capable models (Opus/Sonnet) |
| `balanced` | Mix of capability and speed (default) |
| `budget` | Prefer fast models (Haiku) where possible |

#### `auto_commit`

- `true` (default): Agents commit their work automatically
- `false`: Changes are staged but not committed

#### `parallel_exploration`

- `true` (default): Run multiple explorer agents concurrently
- `false`: Run explorers sequentially

## Project Structure

After initialization, LFG creates:

```
.lfg/
├── PROJECT.md          # Vision, users, key features
├── STATE.md            # Current position, active work
├── config.json         # Settings
├── session.json        # Execution state (for resume)
├── codebase/           # Codebase mapping
│   ├── STACK.md
│   ├── ARCHITECTURE.md
│   ├── PATTERNS.md
│   └── CONCERNS.md
├── epics/
│   └── {epic-slug}/
│       ├── EPIC.md
│       └── m1/
│           ├── MILESTONE.md
│           └── tasks/
│               ├── 001-task-name.md
│               └── 002-task-name.md
└── learnings/
    └── {epic-slug}/
        └── m1.md
```

## Workflow Examples

### Starting a new feature

```
> /lfg:init
  ✓ LFG initialized for my-project
    Type: brownfield

> /lfg:plan
  What do you want to build?
  > Add user authentication with email/password login

  ✓ Epic "user-authentication" created with 3 milestones

> /lfg:plan
  ✓ Milestone 1 planned with 5 tasks in 2 waves

> /lfg:execute
  Phase 1: Exploration...
  Phase 2: Executing Wave 1 (3 tasks)...
  Phase 2: Executing Wave 2 (2 tasks)...
  Phase 3: Verification...
  ✓ Milestone 1 complete (5/5 tasks)
```

### Resuming interrupted work

```
> /lfg:status
  Active: user-authentication / Milestone 1
  Status: Executing (paused)
  Progress: 3/5 tasks

> /lfg:execute
  Resume from where you left off? [y/n]
```

### Mapping an existing codebase

```
> /lfg:map
  Spawning 4 explorer agents...
  ✓ Codebase mapped

  Files created:
  - .lfg/codebase/STACK.md
  - .lfg/codebase/ARCHITECTURE.md
  - .lfg/codebase/PATTERNS.md
  - .lfg/codebase/CONCERNS.md
```

## Design Principles

LFG is built on these ideas:

1. **Never trust subagents** — Always verify. The QA agent independently checks that tasks meet their acceptance criteria.

2. **Right-sized tasks** — Each task should be completable in one focused session (5-30 minutes of Claude work). Too small wastes overhead; too large risks confusion.

3. **Explicit dependencies** — Tasks declare what they depend on. LFG computes execution waves automatically.

4. **Accumulated learning** — Insights from earlier tasks help later ones. Patterns discovered in task 1 inform task 5.

5. **Human in the loop** — You control the pace. Checkpoints let you review progress and course-correct.

## Troubleshooting

### "No LFG project found"

Run `/lfg:init` first to create the `.lfg/` directory.

### Tasks failing verification

Check the task file in `.lfg/epics/{slug}/m{N}/tasks/` for QA feedback. The failure report includes specific issues and suggested fixes.

### Execution stuck

Check `.lfg/session.json` for the current state. You can delete this file to reset execution state (completed tasks remain marked complete in MILESTONE.md).

### Want to change the plan

Edit the task files directly in `.lfg/epics/`. LFG reads these files fresh on each execution.

## License

MIT
