---
name: delete
description: Permanently delete persona files from storage
argument-hint: "[archetype...]"
disable-model-invocation: true
---

# Delete Persona

Permanently delete persona files from storage. Unlike `clear` which only deactivates, this removes the `.md` files entirely.

## Arguments

`$ARGUMENTS` = optional archetype name(s) to delete (space-separated)

## Storage Locations

Check these directories directly (do NOT search recursively from home):

- **Local**: `<cwd>/.claude/plugin-data/assume-persona/personas/`
- **User**: `$HOME/.claude/plugin-data/assume-persona/personas/`

State files:
- **Local**: `<cwd>/.claude/plugin-data/assume-persona/.state.json`
- **User**: `$HOME/.claude/plugin-data/assume-persona/.state.json`

## Instructions

1. **List all available personas** by checking both storage directories:
   - List `*.md` files in each directory
   - Track which scope (local/user) each persona belongs to

2. **If no personas found**:
   ```
   No personas found to delete.
   ```
   Stop here.

3. **If `$ARGUMENTS` is empty**, show all personas and ask which to delete:
   ```
   Available personas:

   | Archetype | Scope |
   |-----------|-------|
   | react-expert | local |
   | security-auditor | user |

   Which persona(s) to delete? (Enter archetype names, space-separated)
   ```
   Wait for user response.

4. **For each archetype to delete**:
   - Find the persona file (check local first, then user)
   - If not found:
     ```
     Persona '<archetype>' not found.
     ```
     Continue to next archetype.

5. **Show confirmation before deleting** (destructive operation):
   ```
   Delete the following persona(s)?

   | Archetype | Scope | Path |
   |-----------|-------|------|
   | react-expert | local | <cwd>/.claude/plugin-data/assume-persona/personas/react-expert.md |

   This action is permanent and cannot be undone.

   Confirm deletion? (yes/no)
   ```
   Wait for user confirmation. If not confirmed, stop here.

6. **Delete each confirmed persona file**

7. **If deleted persona was active**, update state:
   - Read relevant `.state.json` file
   - Remove the archetype from `activePersonas` array
   - Write updated state (or delete state file if empty)

8. **Confirm deletion**:
   ```
   Deleted:
   - react-expert (local)

   Note: If this persona was active, it has been deactivated.
   Run /assume-persona:list to see remaining personas.
   ```

## Notes

- This permanently deletes files - use with caution
- Local personas are checked first (higher precedence)
- If a persona exists in both scopes, only the higher-precedence one is deleted
- Use `/assume-persona:clear` to deactivate without deleting
- Use `/assume-persona:list` to see available personas before deleting
