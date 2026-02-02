---
description: Permanently delete persona skill directories from storage
argument-hint: "[archetype...]"
disable-model-invocation: true
---

# Delete Persona

Permanently delete persona skill directories from storage. Unlike `clear` which only clears session state, this removes the skill directories entirely.

## Arguments

`$ARGUMENTS` = optional archetype name(s) to delete (space-separated)

## Storage Locations

Personas are stored as skills in (do NOT search recursively from home):

- **Local**: `<cwd>/.claude/skills/assume-persona--<archetype>/`
- **User**: `$HOME/.claude/skills/assume-persona--<archetype>/`

State file: `$HOME/.claude/plugin-data/assume-persona/state.json`

## Instructions

1. **List all available personas** by globbing both skill directories:
   - Glob `assume-persona--*` in `<cwd>/.claude/skills/`
   - Glob `assume-persona--*` in `$HOME/.claude/skills/`
   - Extract archetype from directory name (strip `assume-persona--` prefix)
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
   - Find the persona skill directory (check local first, then user)
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
   | react-expert | local | <cwd>/.claude/skills/assume-persona--react-expert/ |

   This action is permanent and cannot be undone.

   Confirm deletion? (yes/no)
   ```
   Wait for user confirmation. If not confirmed, stop here.

6. **Delete each confirmed persona skill directory**
   - Remove the entire `assume-persona--<archetype>/` directory (SKILL.md + persona.md)

7. **If deleted persona was in session state**, update state:
   - Read `$HOME/.claude/plugin-data/assume-persona/state.json`
   - Remove the archetype from current session's `loadedPersonas` array
   - Write updated state (or delete session entry if empty)

8. **Confirm deletion**:
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
- Use `/assume-persona:clear` to clear session state without deleting
- Use `/assume-persona:list` to see available personas before deleting
