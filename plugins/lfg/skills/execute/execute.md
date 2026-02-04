---
description: Execute planned tasks through exploration, wave-based execution, QA verification, and learning accumulation.
user-invocable: true
disable-model-invocation: true
---

# LFG Execute

Execute the active milestone's tasks with proper exploration, wave-based execution, verification, and learning accumulation.

## Pre-flight Check

1. Check if `.lfg/` exists. If not, suggest `/lfg:init`.
2. Read `.lfg/STATE.md` — must have active epic and milestone.
3. Read `.lfg/config.json` for execution settings.
4. Read `.lfg/epics/{slug}/m{N}/MILESTONE.md` — must have tasks.
5. Check/create `.lfg/session.json` for resume capability.

If milestone status is "planning" or no tasks exist, suggest `/lfg:plan`.

## Session Management

### Starting Fresh

Create `.lfg/session.json`:
```json
{
  "epic": "{slug}",
  "milestone": {N},
  "phase": "exploration",
  "current_wave": 0,
  "completed_tasks": [],
  "failed_tasks": [],
  "learnings": [],
  "started": "{timestamp}"
}
```

### Resuming

If session.json exists with same epic/milestone:
- Report current progress
- Ask: "Resume from where you left off, or start fresh?"
- If resume, skip completed phases/waves

---

## Phase 1: Exploration

Before executing, explore the codebase in context of the milestone.

### Launch Parallel Explorers (2-3)

```
Task(subagent_type="lfg-explorer", run_in_background=true, prompt="
Focus: TASK

Milestone context:
{MILESTONE.md summary}

Tasks to be executed:
{List of tasks with brief descriptions}

Codebase patterns:
{PATTERNS.md if exists}

Map:
1. Files that will likely be affected by these tasks
2. Existing code patterns we should follow
3. Potential conflicts or complications
4. Test files we'll need to update

Be specific — these findings inform execution.
")
```

Optionally run a second explorer for related areas.

### Collect Exploration Results

- Wait for all explorers to complete
- Synthesize findings into execution context
- Flag any concerns that should pause execution

### Update Session

```json
{
  "phase": "execution",
  "exploration_summary": "{findings}",
  "concerns": ["{any flags}"]
}
```

### Handle Concerns

If exploration surfaces concerns:
```
⚠ Exploration found potential issues:
- {concern 1}
- {concern 2}

Continue with execution? [y/n]
```

---

## Phase 2: Wave Execution

Execute tasks wave by wave, with parallelization within waves.

### For Each Wave

1. **Identify wave tasks** — All tasks with this wave number
2. **Check dependencies** — Verify previous wave is complete
3. **Check for checkpoints** — If any task in wave is a checkpoint, pause after

### Execute Wave Tasks (Parallel)

For each task in the wave, spawn a developer agent:

```
Task(subagent_type="lfg-developer", run_in_background=true, prompt="
Execute task: {task-id}

{Full task file content}

Codebase patterns:
{PATTERNS.md if exists}

Exploration findings:
{Relevant findings from Phase 1}

Accumulated learnings:
{Learnings from previous tasks in this milestone}

Execute the task and report completion with learnings.
")
```

### Collect Wave Results

For each developer agent:
1. Wait for completion
2. Parse completion report
3. Update task status in MILESTONE.md
4. Collect learnings
5. Update session.json

### Handle Failures

If a task fails:
- Mark as failed in MILESTONE.md
- Add to failed_tasks in session.json
- Decide based on dependencies:
  - If blocking later tasks → pause and report
  - If not blocking → continue, note for later

### Checkpoint Handling

If wave contains a checkpoint task:
```
⏸ Checkpoint reached after Wave {N}

Completed tasks:
{list with brief status}

Checkpoint reason:
{reason from task}

Continue to Wave {N+1}? [y/n]
```

### Approval Level Handling

Based on `approval_level` in config:

- **task**: Pause after every task
- **checkpoint**: Pause only at flagged checkpoints (default)
- **milestone**: No pauses within milestone
- **auto**: Run everything, report at end

---

## Phase 3: Verification

After all wave tasks complete, verify with QA agent.

### Launch QA Agents

For each completed task (can parallelize):

```
Task(subagent_type="lfg-qa", run_in_background=true, prompt="
Verify task: {task-id}

{Full task file content}

Developer's completion report:
{Developer's report}

Independently verify that all acceptance criteria are met.
Run tests if they exist.
Check for regressions.
")
```

### Collect QA Results

For each QA agent:
1. Wait for completion
2. Parse verification report
3. Update task status based on verdict

### Handle Verification Failures

If QA fails a task:

1. Add failure context to task file
2. Create re-execution context:
```
Task(subagent_type="lfg-developer", prompt="
Re-execute task: {task-id}

Original task:
{task file content}

Previous attempt:
{Developer's report}

QA Failure:
{QA report with specific failures and fix suggestions}

Fix the issues and re-submit.
")
```

3. After re-execution, verify again (max 2 retries)
4. If still failing after retries, mark as failed and flag for human review

---

## Phase 4: Completion

Wrap up the milestone execution.

### Update MILESTONE.md

```markdown
## Progress

- **Started**: {date}
- **Completed**: {date}
- **Tasks**: {completed}/{total}
- **Status**: completed | partial
```

### Persist Learnings

Write to `.lfg/learnings/{slug}/m{N}.md`:
```markdown
# Learnings: {epic-slug} Milestone {N}

## Task Learnings

### Task 001: {title}
- {learning 1}
- {learning 2}

### Task 002: {title}
- {learning 1}

## Patterns Discovered

- {pattern}

## Gotchas

- {gotcha}

## Recommendations for Future

- {recommendation}
```

### Update STATE.md

If milestone complete:
```markdown
## Active Work

- **Epic**: {slug}
- **Milestone**: {N+1} or "completed"
- **Status**: idle | planning
```

### Clean Up Session

Delete or archive `.lfg/session.json`

### Final Report

```
✓ Milestone {N} execution complete

Tasks: {completed}/{total}
Passed QA: {passed}/{total}
Failed: {failed} (requires attention)

Learnings captured: .lfg/learnings/{slug}/m{N}.md

{If more milestones exist}
Next milestone: {N+1} - {title}
Run /lfg:plan to break it down.

{If epic complete}
Epic "{title}" complete!
All success criteria should be verified.
```

---

## Error Handling

### Agent Failures
- If developer agent crashes, retry once
- If still fails, mark task as "agent_error" and continue
- Report agent errors at end

### File System Errors
- If can't write to .lfg/, stop and report
- If can't read task files, stop and report

### Git Errors
- If commits fail, report but continue execution
- Tasks can be committed manually later

---

## Configuration Reference

From `.lfg/config.json`:

| Setting | Effect |
|---------|--------|
| `approval_level: task` | Pause after every task |
| `approval_level: checkpoint` | Pause only at checkpoints |
| `approval_level: milestone` | No pauses, report at end |
| `approval_level: auto` | Full auto-pilot |
| `parallel_exploration: false` | Run explorers sequentially |
| `auto_commit: false` | Don't auto-commit |
