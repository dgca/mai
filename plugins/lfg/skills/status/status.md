---
description: Show current LFG state, progress on active work, recent learnings, and suggested next action.
user-invocable: true
disable-model-invocation: true
---

# LFG Status

Display current project state, progress, and suggest the next action.

## Pre-flight Check

1. Check if `.lfg/` exists
2. If not, output:
   ```
   No LFG project found in this directory.

   Run /lfg:init to get started.
   ```

## Gather State

Read the following files:
- `.lfg/STATE.md` — Current position
- `.lfg/PROJECT.md` — Project context
- `.lfg/config.json` — Settings
- `.lfg/session.json` — Active execution (if exists)

If there's an active epic:
- `.lfg/epics/{slug}/EPIC.md` — Epic details
- `.lfg/epics/{slug}/m{N}/MILESTONE.md` — Active milestone

If learnings exist:
- `.lfg/learnings/{slug}/` — Recent learnings

## Output Format

### No Active Work

```
📋 LFG Status: {project-name}

No active work.

Epics:
  - {epic-1}: {status} ({completed}/{total} milestones)
  - {epic-2}: {status}
  (or "No epics created yet")

Configuration:
  - Approval level: {level}
  - Research depth: {depth}
  - Model profile: {profile}

Next action:
  /lfg:plan — Start planning new work
```

### Active Epic, Planning Phase

```
📋 LFG Status: {project-name}

Active Epic: {epic-title}
Status: Planning Milestone {N}

Requirements:
  ✓ REQ-01: {description}
  ○ REQ-02: {description}
  ○ REQ-03: {description}

Milestones:
  ✓ M1: {title}
  → M2: {title} (planning)
  ○ M3: {title}

Next action:
  /lfg:plan — Break down Milestone {N} into tasks
```

### Active Milestone, Ready to Execute

```
📋 LFG Status: {project-name}

Active: {epic-title} / Milestone {N}
Status: Ready for execution

Tasks:
  Wave 1: {count} tasks
  Wave 2: {count} tasks
  Checkpoints: {count}

Estimated complexity: {low|medium|high}

Next action:
  /lfg:execute — Start execution
```

### Execution In Progress

```
📋 LFG Status: {project-name}

Active: {epic-title} / Milestone {N}
Status: Executing

Phase: {exploration|execution|verification}
Current wave: {N} of {total}

Progress:
  ✓ Task 001: {title}
  ✓ Task 002: {title}
  ⟳ Task 003: {title} (in progress)
  ○ Task 004: {title}
  ✗ Task 005: {title} (failed)

{If session.json exists with concerns}
⚠ Flagged concerns:
  - {concern}

Next action:
  /lfg:execute — Resume execution
```

### Milestone Complete

```
📋 LFG Status: {project-name}

Active: {epic-title}
Status: Milestone {N} complete

Results:
  Tasks completed: {count}/{total}
  QA passed: {count}/{total}
  Failed: {count}

Recent learnings:
  - {learning 1}
  - {learning 2}

{If more milestones}
Next milestone: M{N+1} - {title}

Next action:
  /lfg:plan — Plan next milestone

{If epic complete}
Epic complete! All milestones finished.

Next action:
  /lfg:plan — Start a new epic
```

## Progress Visualization

For milestone progress, show a simple bar:

```
Progress: [████████░░░░░░░░] 50% (5/10 tasks)
```

## Recent Learnings

If learnings exist, show the most recent 3:

```
Recent Learnings:
  • {learning 1}
  • {learning 2}
  • {learning 3}

  See all: .lfg/learnings/{slug}/m{N}.md
```

## Configuration Quick View

Always show current config in footer:

```
─────────────────────────────
Config: approval={level} research={depth} model={profile}
```

## Edge Cases

### Corrupted State
If STATE.md exists but references non-existent epic/milestone:
```
⚠ State inconsistency detected

STATE.md references {slug}/m{N} which doesn't exist.

This can happen if files were manually deleted.

Options:
  1. Run /lfg:init to reinitialize
  2. Manually fix STATE.md
```

### Failed Tasks Needing Attention
```
⚠ {count} tasks need attention

Failed tasks:
  - Task {id}: {brief reason}

Options:
  /lfg:execute — Retry failed tasks
  Manually review task files in .lfg/epics/{slug}/m{N}/tasks/
```

### Paused at Checkpoint
```
⏸ Paused at checkpoint

Last completed: Task {id}
Checkpoint reason: {reason}

Review the changes, then:
  /lfg:execute — Continue execution
```
