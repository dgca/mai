/**
 * Persona discovery and loading for assume-persona OpenCode plugin
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { PersonaInfo, PersonaFrontmatter, ListResult } from "./types";
import { PERSONA_SKILL_PREFIX } from "./types";
import {
  getLoadedPersonas,
  getAutoLoadPersonas,
  isPersonaLoaded,
  markPersonaLoaded,
} from "./state";

// Persona storage locations (using ~/.claude/skills for cross-tool compatibility)
const USER_SKILLS = join(homedir(), ".claude/skills");

function getLocalSkills(cwd: string): string {
  return join(cwd, ".claude/skills");
}

/**
 * Parse YAML frontmatter from persona.md
 */
function parseFrontmatter(content: string): PersonaFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result: PersonaFrontmatter = {
    archetype: "",
    created: "",
  };

  // Simple YAML parsing for known fields
  for (const line of yaml.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();

    if (key === "archetype") result.archetype = value;
    if (key === "created") result.created = value;
    if (key === "category") result.category = value;
  }

  return result;
}

/**
 * Parse description from SKILL.md
 */
function parseSkillDescription(skillPath: string): string {
  try {
    const content = readFileSync(skillPath, "utf8");
    const match = content.match(/description:\s*\|?\s*\n?\s*([^\n]+)/);
    if (match) {
      return match[1].trim();
    }
    // Try single-line description
    const singleMatch = content.match(/description:\s*([^\n]+)/);
    if (singleMatch) {
      return singleMatch[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    // Ignore
  }
  return "";
}

/**
 * Find a persona by archetype name
 * Local (project) takes precedence over user
 */
export function findPersona(
  archetype: string,
  cwd: string
): { path: string; scope: "local" | "user" } | null {
  const skillDirName = `${PERSONA_SKILL_PREFIX}${archetype}`;

  // Check local first
  const localPath = join(getLocalSkills(cwd), skillDirName, "persona.md");
  if (existsSync(localPath)) {
    return { path: localPath, scope: "local" };
  }

  // Check user
  const userPath = join(USER_SKILLS, skillDirName, "persona.md");
  if (existsSync(userPath)) {
    return { path: userPath, scope: "user" };
  }

  return null;
}

/**
 * Read persona content
 */
export function readPersonaContent(archetype: string, cwd: string): string | null {
  const found = findPersona(archetype, cwd);
  if (!found) return null;

  try {
    return readFileSync(found.path, "utf8");
  } catch {
    return null;
  }
}

/**
 * Load a persona with deduplication
 * Returns the content if loaded, null if already loaded or not found
 */
export function loadPersona(
  sessionId: string,
  archetype: string,
  cwd: string
): { content: string; alreadyLoaded: boolean } | { error: string } {
  // Check if already loaded
  if (isPersonaLoaded(sessionId, archetype)) {
    return { content: "", alreadyLoaded: true };
  }

  // Find and read persona
  const content = readPersonaContent(archetype, cwd);
  if (!content) {
    return { error: `Persona '${archetype}' not found` };
  }

  // Mark as loaded
  markPersonaLoaded(sessionId, archetype);

  return { content, alreadyLoaded: false };
}

/**
 * Discover all personas in a directory
 */
function discoverPersonasInDir(
  dir: string,
  scope: "local" | "user",
  sessionId: string,
  autoLoadList: string[]
): PersonaInfo[] {
  const personas: PersonaInfo[] = [];

  if (!existsSync(dir)) return personas;

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (!entry.startsWith(PERSONA_SKILL_PREFIX)) continue;

      const archetype = entry.replace(PERSONA_SKILL_PREFIX, "");
      const skillDir = join(dir, entry);
      const personaPath = join(skillDir, "persona.md");
      const skillPath = join(skillDir, "SKILL.md");

      if (!existsSync(personaPath)) continue;

      try {
        const content = readFileSync(personaPath, "utf8");
        const frontmatter = parseFrontmatter(content);
        const lineCount = content.split("\n").length;
        const description = parseSkillDescription(skillPath);

        personas.push({
          archetype,
          description: description || `${archetype} persona`,
          category: frontmatter?.category || "uncategorized",
          scope,
          path: skillDir,
          created: frontmatter?.created || "",
          lineCount,
          loaded: isPersonaLoaded(sessionId, archetype),
          autoLoad: autoLoadList.includes(archetype),
        });
      } catch {
        // Skip on error
      }
    }
  } catch {
    // Ignore directory read errors
  }

  return personas;
}

/**
 * List all available personas
 */
export function listPersonas(sessionId: string, cwd: string): ListResult {
  const autoLoadList = getAutoLoadPersonas(cwd);
  const seenArchetypes = new Set<string>();
  const personas: PersonaInfo[] = [];

  // Local personas first (higher precedence)
  const localPersonas = discoverPersonasInDir(
    getLocalSkills(cwd),
    "local",
    sessionId,
    autoLoadList
  );
  for (const p of localPersonas) {
    seenArchetypes.add(p.archetype);
    personas.push(p);
  }

  // User personas (skip if already found locally)
  const userPersonas = discoverPersonasInDir(
    USER_SKILLS,
    "user",
    sessionId,
    autoLoadList
  );
  for (const p of userPersonas) {
    if (!seenArchetypes.has(p.archetype)) {
      personas.push(p);
    }
  }

  // Sort by archetype name
  personas.sort((a, b) => a.archetype.localeCompare(b.archetype));

  return {
    personas,
    summary: {
      total: personas.length,
      loaded: personas.filter((p) => p.loaded).length,
      autoLoad: personas.filter((p) => p.autoLoad).length,
    },
  };
}

/**
 * Check if a persona exists
 */
export function personaExists(archetype: string, cwd: string): boolean {
  return findPersona(archetype, cwd) !== null;
}
