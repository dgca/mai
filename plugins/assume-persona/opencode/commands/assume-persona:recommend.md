---
description: Recommend personas based on current conversation context
---

## Available Personas

!`for dir in ~/.claude/skills/assume-persona--*/ .claude/skills/assume-persona--*/ 2>/dev/null; do [ -d "$dir" ] || continue; name=$(basename "$dir" | sed 's/assume-persona--//'); keywords=$(sed -n '/^keywords:/,/^[a-z]/p' "$dir/persona.md" 2>/dev/null | grep "^  - " | sed 's/^  - //' | tr '\n' ', ' | sed 's/, $//'); echo "- **$name**: $keywords"; done`

Based on our conversation so far, which of these personas would be most helpful? Analyze the topics we've discussed and recommend the top 1-2 matches with a brief explanation of why.
