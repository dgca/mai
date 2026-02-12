/**
 * assume-persona plugin for OpenCode
 *
 * Provides session-aware persona loading with:
 * - Deduplication (personas load once per session)
 * - Auto-restore on session resume
 * - Auto-load from project config
 * - Custom tools for persona management
 */

import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";

import {
  getLoadedPersonas,
  getAutoLoadPersonas,
  getConfigPath,
  clearPersonaFromSession,
  markPersonasLoaded,
  pruneStaleState,
  isPersonaLoaded,
  setMissingAutoLoad,
  getMissingAutoLoad,
} from "./lib/state";
import {
  listPersonas,
  loadPersona,
  readPersonaContent,
  personaExists,
  findPersona,
  validatePersonaContent,
} from "./lib/personas";
import { PERSONA_SKILL_PREFIX } from "./lib/types";

export const AssumePersonaPlugin: Plugin = async (ctx) => {
  const { directory, worktree } = ctx;
  const cwd = worktree || directory;

  // Track current session ID (set on session.created event)
  let currentSessionId: string | null = null;

  return {
    /**
     * Event handlers for session lifecycle
     */
    event: async ({ event }) => {
      // Handle session creation - restore personas
      if (event.type === "session.created") {

        // Try different property paths for session ID
        // Debug showed structure is: event.properties.info.id
        const props = event.properties as Record<string, any> | undefined;
        currentSessionId = (props?.info?.id ?? props?.id ?? props?.sessionId ?? (event as any).id) as string;
        
        // Fallback: generate a session ID if none found
        if (!currentSessionId) {
          currentSessionId = `session-${Date.now()}`;
        }

        if (!currentSessionId) return;

        // Prune stale sessions
        pruneStaleState();

        // Get auto-load personas from project config
        const autoLoadArchetypes = getAutoLoadPersonas(cwd);

        if (autoLoadArchetypes.length === 0) {
          return;
        }

        // Load personas and build output
        const loaded: Array<{ archetype: string; content: string }> = [];
        const missing: string[] = [];

        for (const archetype of autoLoadArchetypes) {
          const content = readPersonaContent(archetype, cwd);
          if (content) {
            loaded.push({ archetype, content });
          } else {
            missing.push(archetype);
          }
        }

        // Track missing auto-load personas so we can warn in status
        if (missing.length > 0) {
          setMissingAutoLoad(currentSessionId, missing);
        }

        if (loaded.length === 0) return;

        // Mark all as loaded in state
        markPersonasLoaded(
          currentSessionId,
          loaded.map((p) => p.archetype)
        );

        // Note: Personas are marked in state but content injection happens
        // when the agent uses persona_load or the skill tool auto-invokes them.
        // The compaction hook ensures content survives context compaction.
      }

      // Track session ID updates
      if (event.type === "session.updated") {
        const sessionId = event.properties?.id as string;
        if (sessionId) {
          currentSessionId = sessionId;
        }
      }
    },

    /**
     * Intercept skill tool to track persona loading via auto-invocation
     * When OpenCode's skill system loads an assume-persona skill,
     * we mark it as loaded in session state for deduplication and compaction
     */
    "tool.execute.after": async (input, output) => {
      // Only intercept the skill tool
      if (input.tool !== "skill") return;

      // Check if this is an assume-persona skill
      const skillName = input.args?.name as string;
      if (!skillName?.startsWith(PERSONA_SKILL_PREFIX)) return;

      // Extract archetype from skill name
      const archetype = skillName.replace(PERSONA_SKILL_PREFIX, "");

      // Get session ID (may not be available in this context)
      const sessionId = currentSessionId;
      if (!sessionId) return;

      // Check if already loaded to avoid duplicate marking
      if (isPersonaLoaded(sessionId, archetype)) return;

      // Mark as loaded in session state
      markPersonasLoaded(sessionId, [archetype]);
    },

    /**
     * Compaction hook - inject loaded personas into compaction context
     * This ensures persona content survives context compaction
     */
    "experimental.session.compacting": async (input, output) => {
      const sessionId = currentSessionId;
      if (!sessionId) return;

      const loadedPersonas = getLoadedPersonas(sessionId);
      if (loadedPersonas.length === 0) return;

      // Build persona content to inject
      const personaContents: string[] = [];

      for (const archetype of loadedPersonas) {
        const content = readPersonaContent(archetype, cwd);
        if (content) {
          personaContents.push(`## Persona: ${archetype}\n\n${content}`);
        }
      }

      if (personaContents.length > 0) {
        output.context.push(`# Active Personas

The following expert personas were loaded in this session and should be preserved:

${personaContents.join("\n\n---\n\n")}`);
      }
    },

    /**
     * Custom tools for persona management
     */
    tool: {
      /**
       * Load a persona into the current session
       */
      persona_load: tool({
        description:
          "Load an expert persona into the current session. Returns the persona content if not already loaded. Use this to get specialized expertise for the current task.",
        args: {
          archetype: tool.schema.string({
            description: "The persona archetype name (e.g., 'typescript-fullstack', 'qa-engineer')",
          }),
          validate: tool.schema.optional(
            tool.schema.boolean({
              description: "Run validation and include report in output. Use after create/import.",
            })
          ),
        },
        async execute(args, context) {
          const sessionId = context.sessionID || currentSessionId;
          if (!sessionId) {
            return "Error: No active session. Please try again.";
          }
          
          // Update tracked session ID
          if (context.sessionID) {
            currentSessionId = context.sessionID;
          }

          const result = loadPersona(sessionId, args.archetype, cwd);

          if ("error" in result) {
            return `Error: ${result.error}\n\nUse persona_list to see available personas.`;
          }

          if (result.alreadyLoaded) {
            return `Persona '${args.archetype}' is already loaded in this session.`;
          }

          // Build output
          let output = `# Persona Loaded: ${args.archetype}\n\n${result.content}`;

          // Add validation report if requested
          if (args.validate) {
            const validation = validatePersonaContent(result.content);
            const lines: string[] = ["\n\n---\n\n## Validation Report"];

            if (validation.valid) {
              lines.push("\n**Status**: Valid");
            } else {
              lines.push("\n**Status**: Has issues");
            }

            lines.push(`\n**Lines**: ${validation.lineCount}`);

            if (validation.errors.length > 0) {
              lines.push("\n### Errors");
              for (const err of validation.errors) {
                lines.push(`- ${err}`);
              }
            }

            if (validation.warnings.length > 0) {
              lines.push("\n### Warnings");
              for (const warn of validation.warnings) {
                lines.push(`- ${warn}`);
              }
            }

            if (validation.valid && validation.warnings.length === 0) {
              lines.push("\nNo issues found.");
            }

            output += lines.join("\n");
          }

          return output;
        },
      }),

      /**
       * List available personas
       */
      persona_list: tool({
        description:
          "List all available expert personas. Shows which are loaded in the current session and which are configured for auto-load.",
        args: {
          category: tool.schema.optional(
            tool.schema.string({
              description: "Optional category to filter by (e.g., 'web-development')",
            })
          ),
        },
        async execute(args, context) {
          const sessionId = context.sessionID || currentSessionId || "unknown";
          if (context.sessionID) {
            currentSessionId = context.sessionID;
          }
          const result = listPersonas(sessionId, cwd);

          if (result.personas.length === 0) {
            return "No personas found.\n\nCreate one with /assume-persona:create <name>";
          }

          let personas = result.personas;
          if (args.category) {
            personas = personas.filter((p) => p.category === args.category);
          }

          const lines = ["# Available Personas\n"];

          for (const p of personas) {
            const badges: string[] = [];
            if (p.loaded) badges.push("loaded");
            if (p.autoLoad) badges.push("auto-load");
            const badgeStr = badges.length > 0 ? ` (${badges.join(", ")})` : "";

            lines.push(`## ${p.archetype}${badgeStr}`);
            lines.push(`- **Description**: ${p.description}`);
            lines.push(`- **Category**: ${p.category}`);
            lines.push(`- **Location**: ${p.scope}`);
            lines.push(`- **Lines**: ${p.lineCount}`);
            lines.push("");
          }

          lines.push(`**Total**: ${result.summary.total} personas`);
          if (result.summary.loaded > 0) {
            lines.push(`**Loaded this session**: ${result.summary.loaded}`);
          }
          if (result.summary.autoLoad > 0) {
            lines.push(`**Auto-load configured**: ${result.summary.autoLoad}`);
          }

          return lines.join("\n");
        },
      }),

      /**
       * Show status of loaded personas
       */
      persona_status: tool({
        description:
          "Show which personas are currently loaded in this session and auto-load configuration.",
        args: {},
        async execute(args, context) {
          const sessionId = context.sessionID || currentSessionId;
          if (!sessionId) {
            return "No active session.";
          }
          
          // Update tracked session ID
          if (context.sessionID) {
            currentSessionId = context.sessionID;
          }

          const loadedPersonas = getLoadedPersonas(sessionId);
          const autoLoad = getAutoLoadPersonas(cwd);
          const configPath = getConfigPath(cwd);
          const missingAutoLoad = getMissingAutoLoad(sessionId);

          if (loadedPersonas.length === 0 && missingAutoLoad.length === 0) {
            return `# Persona Status

No personas loaded this session.

- Load one: \`persona_load\` tool or \`/assume-persona:load <name>\`
- List available: \`persona_list\` tool or \`/assume-persona:list\``;
          }

          const lines = ["# Persona Status\n"];

          // Show warning about missing auto-load personas first
          if (missingAutoLoad.length > 0) {
            lines.push("## ⚠️ Missing Auto-Load Personas\n");
            lines.push("The following personas are configured for auto-load but were not found:\n");
            for (const archetype of missingAutoLoad) {
              lines.push(`- ${archetype}`);
            }
            lines.push(`\nCreate them with \`/assume-persona:create <name>\` or remove from config.\n`);
            lines.push(`Config: ${configPath}\n`);
          }

          if (loadedPersonas.length > 0) {
            lines.push("## Loaded Personas");

            for (const archetype of loadedPersonas) {
              const isAuto = autoLoad.includes(archetype);
              lines.push(`- ${archetype}${isAuto ? " (auto-loaded)" : ""}`);
            }
          } else {
            lines.push("## Loaded Personas\n");
            lines.push("None loaded this session.");
          }

          lines.push("\n## Quick Actions");
          lines.push("- Clear session state: `/assume-persona:clear`");
          lines.push("- Load another: `/assume-persona:load <name>`");
          lines.push("- List all: `/assume-persona:list`");

          // Only show config path if we have auto-load and didn't already show it in warnings
          if (autoLoad.length > 0 && missingAutoLoad.length === 0) {
            lines.push(`\n**Auto-load config**: ${configPath}`);
          }

          return lines.join("\n");
        },
      }),

      /**
       * Clear persona(s) from session state
       */
      persona_clear: tool({
        description:
          "Clear persona(s) from session state. This allows them to be re-loaded. Does not delete persona files.",
        args: {
          archetype: tool.schema.optional(
            tool.schema.string({
              description: "Specific persona to clear. If omitted, clears all.",
            })
          ),
        },
        async execute(args, context) {
          const sessionId = context.sessionID || currentSessionId;
          if (!sessionId) {
            return "No active session.";
          }
          
          if (context.sessionID) {
            currentSessionId = context.sessionID;
          }

          const result = clearPersonaFromSession(sessionId, args.archetype);

          if (result.cleared === "all") {
            return `Cleared all personas from session state.

Note: The persona content already in this session's context remains.
Personas can now be re-loaded via /assume-persona:load.`;
          }

          if (result.cleared.length === 0) {
            if (args.archetype) {
              return `Persona '${args.archetype}' is not loaded in current session.\n\nLoaded personas: ${result.remaining.join(", ") || "none"}`;
            }
            return "No personas loaded in current session.";
          }

          return `Cleared '${result.cleared[0]}' from session state.

Remaining loaded: ${result.remaining.join(", ") || "none"}

The persona can now be re-loaded via /assume-persona:load.`;
        },
      }),

      /**
       * Show a persona without loading it
       */
      persona_show: tool({
        description:
          "Preview a persona's content without loading it into the session. Use this to inspect a persona before deciding to load it.",
        args: {
          archetype: tool.schema.string({
            description: "The persona archetype name",
          }),
        },
        async execute(args, context) {
          const sessionId = context.sessionID || currentSessionId || "unknown";
          if (context.sessionID) {
            currentSessionId = context.sessionID;
          }

          const content = readPersonaContent(args.archetype, cwd);

          if (!content) {
            return `Persona '${args.archetype}' not found.\n\nUse persona_list to see available personas.`;
          }

          const found = findPersona(args.archetype, cwd);
          const loaded = isPersonaLoaded(sessionId, args.archetype);

          return `# Persona Preview: ${args.archetype}

**Location**: ${found?.scope || "unknown"}
**Status**: ${loaded ? "Loaded in session" : "Not loaded"}

---

${content}

---

**This is a preview only.** Use \`persona_load\` or \`/assume-persona:load ${args.archetype}\` to activate.`;
        },
      }),

      /**
       * Check if a persona exists
       */
      persona_exists: tool({
        description: "Check if a persona exists by archetype name.",
        args: {
          archetype: tool.schema.string({
            description: "The persona archetype name",
          }),
        },
        async execute(args, context) {
          // Update session tracking if available
          if (context.sessionID) {
            currentSessionId = context.sessionID;
          }
          
          const exists = personaExists(args.archetype, cwd);
          const found = findPersona(args.archetype, cwd);

          if (exists && found) {
            return `Persona '${args.archetype}' exists at ${found.scope} scope (${found.path})`;
          }

          return `Persona '${args.archetype}' not found.`;
        },
      }),

      /**
       * Show help for the assume-persona plugin
       */
      persona_help: tool({
        description: "Show help and available commands for the assume-persona plugin. Output the result exactly as returned, without summarizing or paraphrasing.",
        args: {},
        async execute() {
          return `## Assume Persona Plugin

Load subject matter expert personas to get specialized assistance. Personas auto-invoke based on conversation topics.

### Commands

| Command | Description |
|---------|-------------|
| /assume-persona:create <name> | Research and create a new persona |
| /assume-persona:load <name?> | Load and activate a persona |
| /assume-persona:list <category?> | List all available personas |
| /assume-persona:recommend | Suggest personas for current context |
| /assume-persona:show <name?> | Preview a persona without activating |
| /assume-persona:status | Show loaded personas and config |
| /assume-persona:clear <name?> | Clear session state for persona(s) |
| /assume-persona:delete <name?> | Permanently delete persona file(s) |
| /assume-persona:import <path> | Import persona from file/URL |
| /assume-persona:audit <name?> | Audit quality and offer improvements |
| /assume-persona:help | Show this help |

<arg> = required, <arg?> = optional (shows list to choose from)

### Quick Start

1. List available personas: /assume-persona:list
2. Load a persona: /assume-persona:load accessibility-expert
3. Check what's loaded: /assume-persona:status
4. Clear session state: /assume-persona:clear

### Features

- **Auto-invocation**: Personas automatically load when relevant topics are detected
- **Session deduplication**: Each persona loads once per session (no duplicates)
- **Multiple personas**: Load several at once with /assume-persona:load persona1 persona2
- **Project config**: Auto-load personas for all contributors (see below)
- **Quality auditing**: Check persona freshness and completeness

### How Auto-Invocation Works

Personas are stored as skills with descriptions that enable auto-invocation:

1. When you discuss a topic (e.g., "security vulnerabilities")
2. The topic is matched against persona skill descriptions
3. The relevant persona loads automatically (once per session)
4. You get specialized expertise without manual loading

### Project Config

Auto-load personas when entering a directory by creating:

\`<project>/.claude/plugin-data/assume-persona/config.json\`

Example:
\`\`\`json
{
  "autoLoad": ["typescript-expert", "qa-engineer"]
}
\`\`\`

This file can be committed to share personas across the team.

### Storage Locations

Personas are stored as skills (precedence order):
1. Local: .claude/skills/${PERSONA_SKILL_PREFIX}<archetype>/
2. User: ~/.claude/skills/${PERSONA_SKILL_PREFIX}<archetype>/

Each persona skill contains:
- SKILL.md - Metadata and auto-invocation description
- persona.md - Full persona content`;
        },
      }),
    },
  };
};

export default AssumePersonaPlugin;
