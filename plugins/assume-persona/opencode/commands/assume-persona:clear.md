---
description: Clear persona(s) from session state to allow re-loading
---

Use the `persona_clear` tool to clear persona state.

If "$ARGUMENTS" is provided, clear only that specific persona. Otherwise, clear all loaded personas from the session.

Note: This clears the session state tracking, allowing personas to be re-loaded. The content already in the conversation context remains.
