# LFG Plugin

"Let's Fucking Go" - Break down large work into manageable pieces and execute efficiently with subagents.

## Commands

| Command | Purpose |
|---------|---------|
| `/lfg:init` | Initialize project, detect greenfield/brownfield, create .lfg/ structure |
| `/lfg:plan` | Context-aware planning - create epics or break down milestones |
| `/lfg:execute` | Execute tasks with exploration, waves, verification, learning |
| `/lfg:status` | Show current state and suggest next action |
| `/lfg:map` | Map codebase structure with parallel explorers |
| `/lfg:help` | Show command reference |

## Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `lfg-explorer` | Haiku | Fast codebase mapping, read-only |
| `lfg-pm` | Sonnet | Break work into milestones and tasks |
| `lfg-researcher` | Sonnet | Deep research before planning |
| `lfg-developer` | Sonnet | Execute tasks, atomic commits |
| `lfg-qa` | Sonnet | Independent verification |

## Work Hierarchy

```
Epic (e.g., "user-authentication")
  └── Milestone 1 (e.g., "basic login")
        └── Task 001 (e.g., "setup database schema")
        └── Task 002 (e.g., "create login endpoint")
  └── Milestone 2 (e.g., "password reset")
        └── ...
```

## Configuration

Edit `.lfg/config.json`:

- `approval_level`: task | milestone | checkpoint | auto
- `research_depth`: skip | light | deep
- `model_profile`: quality | balanced | budget
- `auto_commit`: true | false
- `parallel_exploration`: true | false

## Testing

To test locally:
```bash
claude --plugin-dir ./plugins/lfg
```

Then try:
```
/lfg:help
/lfg:init
```
