---
description: Permanently delete a persona
---

# Delete Persona: $ARGUMENTS

Permanently delete a persona skill directory. This cannot be undone.

## Instructions

1. **If no archetype provided in `$ARGUMENTS`**, list available personas and ask user to pick:

   ```bash
   ls -d ~/.claude/skills/assume-persona--*/ .claude/skills/assume-persona--*/ 2>/dev/null | while read dir; do
     name=$(basename "$dir" | sed 's/assume-persona--//')
     scope="user"
     [[ "$dir" == .claude/* ]] && scope="local"
     echo "- $name ($scope)"
   done
   ```

   Ask: "Which persona would you like to delete?"

2. **Locate the persona** (local takes precedence over user):

   - Check `.claude/skills/assume-persona--$ARGUMENTS/` first
   - Then check `~/.claude/skills/assume-persona--$ARGUMENTS/`

3. **If not found**:
   ```
   Persona '$ARGUMENTS' not found.

   List available: /assume-persona:list
   ```
   Stop here.

4. **Show confirmation** (this is destructive):

   ```
   Delete persona '$ARGUMENTS'?

   Location: [full path to the skill directory]

   This will permanently delete:
   - persona.md
   - SKILL.md

   This action cannot be undone. Confirm? (yes/no)
   ```

   **Wait for explicit confirmation before proceeding.**

5. **If confirmed**, delete the skill directory:

   ```bash
   rm -rf "[path to skill directory]"
   ```

6. **Confirm deletion**:
   ```
   Persona '$ARGUMENTS' deleted.

   Run /assume-persona:list to see remaining personas.
   ```

## Notes

- This permanently deletes the persona files
- Local personas are checked first (higher precedence)
- Use `/assume-persona:show` to preview before deleting
- There is no undo - consider backing up important personas
