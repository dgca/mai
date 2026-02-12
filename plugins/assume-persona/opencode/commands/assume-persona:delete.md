---
description: Permanently delete persona skill directories from storage
subtask: true
---

# Delete Persona

Permanently delete persona skill directories from storage. Unlike `clear` which only clears session state, this removes the skill directories entirely.

## Arguments

`$ARGUMENTS` = archetype name(s) to delete (space-separated)

The user invoked: `/assume-persona:delete $ARGUMENTS`

## Instructions

### 1. Check if argument provided

If "$ARGUMENTS" is not empty, skip to Step 3 with that archetype.

If "$ARGUMENTS" is empty, list available personas and ask which to delete:

!`for dir in ~/.claude/skills/persona-*/ .claude/skills/persona-*/ 2>/dev/null; do [ -d "$dir" ] || continue; name=$(basename "$dir" | sed 's/persona-//'); scope="user"; [[ "$dir" == .claude/* ]] && scope="local"; echo "- $name ($scope)"; done`

If no personas found:
```
No personas found to delete.
```
Stop here.

Ask user:
```
Which persona(s) would you like to delete? (You can specify multiple, space-separated)
```

### 2. Storage Locations

Personas are stored as skills in:

- **Local**: `.claude/skills/persona-<archetype>/`
- **User**: `~/.claude/skills/persona-<archetype>/`

### 3. Validate Each Archetype

For each archetype to delete:
- Check if it exists in local or user location
- If not found, report and continue to next:
  ```
  Persona '<archetype>' not found.
  ```

### 4. Show Confirmation (Destructive Operation)

Output the personas to be deleted:

```
Delete the following persona(s)?

| Archetype | Scope | Path |
|-----------|-------|------|
| react-expert | local | .claude/skills/persona-react-expert/ |

This action is permanent and cannot be undone.

Reply "yes" to confirm deletion, or "cancel" to abort.
```

Then STOP and wait for the user's response. If user does not confirm with "yes", stop here.

### 5. Delete Each Confirmed Persona

For each confirmed persona:

```bash
rm -rf "[path to skill directory]"
```

Also clear from session state using persona_clear tool if the persona was loaded.

### 6. Confirm Deletion

```
Deleted:
- react-expert (local)

Note: If this persona was loaded, it has been removed from session state.
Run /assume-persona:list to see remaining personas.
```

## Notes

- This permanently deletes skill directories - use with caution
- Local personas are checked first (higher precedence)
- If a persona exists in both scopes, only the higher-precedence one is deleted
- Use `/assume-persona:clear` to clear session state without deleting files
- Use `/assume-persona:show` to preview before deleting
