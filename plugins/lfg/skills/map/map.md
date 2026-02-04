---
description: Map the codebase structure using parallel Explorer agents. Creates STACK.md, ARCHITECTURE.md, PATTERNS.md, and CONCERNS.md in .lfg/codebase/.
user-invocable: true
disable-model-invocation: true
---

# LFG Map

Map the codebase structure using parallel Explorer agents.

## Pre-flight Check

1. Check if `.lfg/` exists. If not, suggest running `/lfg:init` first.
2. Check if `.lfg/codebase/` exists with files:
   - If exists with recent files (< 7 days), ask: "Codebase map exists. Refresh it?"
   - If exists with old files, suggest refresh
   - If doesn't exist, proceed

## Phase 1: Launch Parallel Explorers

Spawn 4 Explorer agents in parallel, each with a specific focus:

### Agent 1: STACK

```
Task(subagent_type="lfg-explorer", run_in_background=true, prompt="
Focus: STACK

Map the technology stack for this codebase:
- Languages and their versions
- Frameworks and major libraries
- Build tools and package managers
- External services and APIs
- Database and storage systems
- Development tools (linters, formatters, etc.)

Output a structured STACK.md document.
")
```

### Agent 2: ARCHITECTURE

```
Task(subagent_type="lfg-explorer", run_in_background=true, prompt="
Focus: ARCHITECTURE

Map the code architecture:
- Directory layout and organization principles
- Key modules/packages and their responsibilities
- Entry points and main application flows
- Layer boundaries (presentation, business, data, etc.)
- Key abstractions and their relationships
- Data flow patterns

Output a structured ARCHITECTURE.md document.
")
```

### Agent 3: PATTERNS

```
Task(subagent_type="lfg-explorer", run_in_background=true, prompt="
Focus: PATTERNS

Identify coding patterns and conventions:
- Naming conventions (files, functions, variables, classes)
- File organization patterns
- Test patterns and test file locations
- Error handling approaches
- Logging patterns
- Common abstractions and utilities
- Configuration patterns

Output a structured PATTERNS.md document.
")
```

### Agent 4: CONCERNS

```
Task(subagent_type="lfg-explorer", run_in_background=true, prompt="
Focus: CONCERNS

Surface potential issues and concerns:
- Tech debt indicators
- Inconsistent patterns across the codebase
- Missing or inadequate tests
- Missing or outdated documentation
- Security considerations
- Performance concerns
- Deprecated or outdated dependencies
- TODO/FIXME/HACK comments

Output a structured CONCERNS.md document.
")
```

## Phase 2: Collect Results

Wait for all agents to complete, then:

1. Create `.lfg/codebase/` directory if needed
2. Write each agent's output to its respective file:
   - `.lfg/codebase/STACK.md`
   - `.lfg/codebase/ARCHITECTURE.md`
   - `.lfg/codebase/PATTERNS.md`
   - `.lfg/codebase/CONCERNS.md`

## Phase 3: Summary

Create a brief summary of key findings:

```markdown
## Codebase Mapped

**Stack**: [primary language] / [main framework]
**Structure**: [brief architecture note]
**Patterns**: [key pattern identified]
**Concerns**: [# of concerns found]

Files created in `.lfg/codebase/`:
- STACK.md
- ARCHITECTURE.md
- PATTERNS.md
- CONCERNS.md

These will be used during planning and execution to ensure consistency.
```

## Phase 4: Commit (Optional)

If `auto_commit` is enabled in config.json and this is a git repo:

```bash
git add .lfg/codebase/
git commit -m "chore(lfg): map codebase structure"
```

## Error Handling

- If an explorer agent fails, report which one and continue with others
- If all fail, suggest checking file permissions or running again
- Partial results are still useful — save what succeeded
