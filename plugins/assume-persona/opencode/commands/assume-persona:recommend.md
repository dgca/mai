---
description: Recommend personas based on current conversation context
subtask: true
---

# Recommend Persona

Analyze the current conversation context and recommend relevant personas.

## Storage Locations

Personas are stored as skills in:

1. **Local/project**: `.claude/skills/assume-persona--*/`
2. **User**: `~/.claude/skills/assume-persona--*/`

## Instructions

### 1. Scan Available Personas

List all available personas with their descriptions:

!`for dir in ~/.claude/skills/assume-persona--*/ .claude/skills/assume-persona--*/ 2>/dev/null; do [ -d "$dir" ] || continue; name=$(basename "$dir" | sed 's/assume-persona--//'); scope="user"; [[ "$dir" == .claude/* ]] && scope="local"; skill="$dir/SKILL.md"; if [ -f "$skill" ]; then desc=$(grep -A1 "^description:" "$skill" | tail -1 | sed 's/^  //'); echo "### $name ($scope)"; echo "$desc"; echo; fi; done`

### 2. Analyze Current Conversation Context

Consider:
- What topics have been discussed?
- What technologies/tools are mentioned?
- What type of task is the user working on?
- What expertise would be most helpful?

### 3. Match Personas to Context

For each persona:
- Compare conversation topics against the persona's description keywords
- Assess how well the persona's expertise fits the current task
- Consider category relevance

### 4. Present Recommendations (1-3 max)

```
## Recommended Personas

Based on your current context, these personas might help:

### 1. <archetype> (best match)
<brief role description>
**Why**: <1-2 sentence explanation of why this fits>

### 2. <archetype>
<brief role description>
**Why**: <explanation>

---

Load a persona?
- `/assume-persona:load <archetype>`
- `/assume-persona:show <archetype>` to preview first
```

### 5. If No Good Matches

```
No strong persona matches for your current context.

Available options:
- `/assume-persona:list` to browse all personas
- `/assume-persona:create <archetype>` to create a custom one
```

### 6. If User Confirms

If the user wants to load a recommended persona, use the persona_load tool.

## Notes

- This analyzes the full conversation context, not just the last message
- Recommendations are suggestions only - user must confirm before loading
- Multiple personas can be loaded if user wants several recommendations
