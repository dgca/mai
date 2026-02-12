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
  consumeHandoff,
  pruneStaleState,
  isPersonaLoaded,
} from "./lib/state";
import {
  listPersonas,
  loadPersona,
  readPersonaContent,
  personaExists,
  findPersona,
} from "./lib/personas";

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
        currentSessionId = event.properties?.id as string;

        if (!currentSessionId) return;

        // Prune stale sessions
        pruneStaleState();

        // Get auto-load personas from project config
        const autoLoadArchetypes = getAutoLoadPersonas(cwd);

        // Check for handoff from /clear or /new
        const handoffArchetypes = consumeHandoff();

        // Combine (deduplicated)
        const allArchetypes = [...new Set([...autoLoadArchetypes, ...handoffArchetypes])];

        if (allArchetypes.length === 0) return;

        // Load personas and build output
        const loaded: Array<{ archetype: string; content: string; reason: "auto" | "restored" }> = [];
        const autoLoadSet = new Set(autoLoadArchetypes);

        for (const archetype of allArchetypes) {
          const content = readPersonaContent(archetype, cwd);
          if (content) {
            loaded.push({
              archetype,
              content,
              reason: autoLoadSet.has(archetype) ? "auto" : "restored",
            });
          }
        }

        if (loaded.length === 0) return;

        // Mark all as loaded in state
        markPersonasLoaded(
          currentSessionId,
          loaded.map((p) => p.archetype)
        );

        // Build notification
        const autoLoaded = loaded.filter((p) => p.reason === "auto").map((p) => p.archetype);
        const restored = loaded.filter((p) => p.reason === "restored").map((p) => p.archetype);

        const lines: string[] = [];
        if (autoLoaded.length > 0) {
          lines.push(`Personas loaded from project config: ${autoLoaded.join(", ")}`);
        }
        if (restored.length > 0) {
          lines.push(`Personas restored from session: ${restored.join(", ")}`);
        }

        // TODO: Inject persona content into context
        // OpenCode doesn't have a direct way to inject content on session start
        // The personas will need to be re-loaded via the tool or command
        console.log(`[assume-persona] ${lines.join("; ")}`);
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
        },
        async execute(args, context) {
          const sessionId = currentSessionId;
          if (!sessionId) {
            return "Error: No active session. Please try again.";
          }

          const result = loadPersona(sessionId, args.archetype, cwd);

          if ("error" in result) {
            return `Error: ${result.error}\n\nUse persona_list to see available personas.`;
          }

          if (result.alreadyLoaded) {
            return `Persona '${args.archetype}' is already loaded in this session.`;
          }

          return `# Persona Loaded: ${args.archetype}\n\n${result.content}`;
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
          const sessionId = currentSessionId || "unknown";
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
          const sessionId = currentSessionId;
          if (!sessionId) {
            return "No active session.";
          }

          const loadedPersonas = getLoadedPersonas(sessionId);
          const autoLoad = getAutoLoadPersonas(cwd);
          const configPath = getConfigPath(cwd);

          if (loadedPersonas.length === 0) {
            return `# Persona Status

No personas loaded this session.

- Load one: \`persona_load\` tool or \`/assume-persona:load <name>\`
- List available: \`persona_list\` tool or \`/assume-persona:list\``;
          }

          const lines = ["# Persona Status\n", "## Loaded Personas"];

          for (const archetype of loadedPersonas) {
            const isAuto = autoLoad.includes(archetype);
            lines.push(`- ${archetype}${isAuto ? " (auto-loaded)" : ""}`);
          }

          lines.push("\n## Quick Actions");
          lines.push("- Clear session state: `/assume-persona:clear`");
          lines.push("- Load another: `/assume-persona:load <name>`");
          lines.push("- List all: `/assume-persona:list`");

          if (autoLoad.length > 0) {
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
          const sessionId = currentSessionId;
          if (!sessionId) {
            return "No active session.";
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
          const content = readPersonaContent(args.archetype, cwd);

          if (!content) {
            return `Persona '${args.archetype}' not found.\n\nUse persona_list to see available personas.`;
          }

          const found = findPersona(args.archetype, cwd);
          const sessionId = currentSessionId || "unknown";
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
          const exists = personaExists(args.archetype, cwd);
          const found = findPersona(args.archetype, cwd);

          if (exists && found) {
            return `Persona '${args.archetype}' exists at ${found.scope} scope (${found.path})`;
          }

          return `Persona '${args.archetype}' not found.`;
        },
      }),
    },
  };
};

export default AssumePersonaPlugin;
