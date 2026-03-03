/**
 * Persona discovery and loading for assume-persona OpenCode plugin
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { PersonaInfo, PersonaFrontmatter, ListResult, ValidationResult, SectionChecks } from "./types";
import { PERSONA_SKILL_PREFIX } from "./types";
import {
  getLoadedPersonas,
  getAutoLoadPersonas,
  isPersonaLoaded,
  markPersonaLoaded,
} from "./state";

// Persona storage locations (using ~/.claude/skills for cross-tool compatibility)
const USER_SKILLS = join(homedir(), ".claude/skills");

// Legacy prefix used by Claude Code - we read from both for compatibility
const LEGACY_SKILL_PREFIX = "assume-persona--";

// All prefixes to check when reading (order matters - new prefix first)
const READ_PREFIXES = [PERSONA_SKILL_PREFIX, LEGACY_SKILL_PREFIX];

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
 * Checks both new (persona-) and legacy (assume-persona--) prefixes for compatibility
 */
export function findPersona(
  archetype: string,
  cwd: string
): { path: string; scope: "local" | "user" } | null {
  // Check each prefix (new prefix first, then legacy)
  for (const prefix of READ_PREFIXES) {
    const skillDirName = `${prefix}${archetype}`;

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
 * Scans for both new (persona-) and legacy (assume-persona--) prefixes
 */
function discoverPersonasInDir(
  dir: string,
  scope: "local" | "user",
  sessionId: string,
  autoLoadList: string[]
): PersonaInfo[] {
  const personas: PersonaInfo[] = [];
  const seenArchetypes = new Set<string>();

  if (!existsSync(dir)) return personas;

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      // Check if entry matches any of our prefixes
      let archetype: string | null = null;
      for (const prefix of READ_PREFIXES) {
        if (entry.startsWith(prefix)) {
          archetype = entry.replace(prefix, "");
          break;
        }
      }
      
      if (!archetype) continue;
      
      // Skip if we've already seen this archetype (new prefix takes precedence)
      if (seenArchetypes.has(archetype)) continue;
      seenArchetypes.add(archetype);

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

/**
 * Check if string is kebab-case
 */
function isKebabCase(str: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
}

/**
 * Check if string is valid YYYY-MM-DD date
 */
function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Check for required sections in persona body
 */
function checkSections(body: string): SectionChecks {
  // Role description: paragraph containing "You are"
  const hasRoleDescription =
    body.includes("You are") ||
    body.match(/^#[^#].*\n+You are/m) !== null;

  // Check for required section headings (case-insensitive)
  const hasCoreExpertise = /##\s*core\s+expertise/i.test(body);
  const hasMentalModels = /##\s*mental\s+models/i.test(body);
  const hasBestPractices = /##\s*best\s+practices/i.test(body);
  const hasPitfalls = /##\s*(pitfalls|pitfalls\s+to\s+avoid)/i.test(body);
  const hasTools = /##\s*(tools|tools\s*(&|and)\s*technologies)/i.test(body);

  return {
    roleDescription: hasRoleDescription,
    coreExpertise: hasCoreExpertise,
    mentalModels: hasMentalModels,
    bestPractices: hasBestPractices,
    pitfalls: hasPitfalls,
    tools: hasTools,
  };
}

/**
 * Validate persona content structure
 */
export function validatePersonaContent(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const frontmatter = parseFrontmatter(content);
  const lineCount = content.split("\n").length;

  // Extract body (content after frontmatter)
  const bodyMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : content;

  const sections = checkSections(body);

  // Frontmatter validation
  if (!content.startsWith("---\n")) {
    errors.push("Missing YAML frontmatter");
  }

  // Required: archetype
  if (!frontmatter?.archetype) {
    errors.push("Missing required frontmatter field: archetype");
  } else if (!isKebabCase(frontmatter.archetype)) {
    errors.push(`Archetype must be kebab-case: "${frontmatter.archetype}"`);
  }

  // Required: created
  if (!frontmatter?.created) {
    errors.push("Missing required frontmatter field: created");
  } else if (!isValidDate(frontmatter.created)) {
    errors.push(
      `Invalid date format for created (expected YYYY-MM-DD): "${frontmatter.created}"`
    );
  }

  // Optional but recommended
  if (!frontmatter?.category) {
    warnings.push("Missing optional frontmatter field: category");
  }

  // Section validation
  if (!sections.roleDescription) {
    errors.push('Missing role description (paragraph containing "You are")');
  }
  if (!sections.coreExpertise) {
    errors.push("Missing required section: ## Core Expertise");
  }
  if (!sections.mentalModels) {
    errors.push("Missing required section: ## Mental Models");
  }
  if (!sections.bestPractices) {
    errors.push("Missing required section: ## Best Practices");
  }
  if (!sections.pitfalls) {
    errors.push("Missing required section: ## Pitfalls (or ## Pitfalls to Avoid)");
  }
  if (!sections.tools) {
    errors.push("Missing required section: ## Tools (or ## Tools & Technologies)");
  }

  // Length checks
  if (lineCount < 100) {
    warnings.push(`Persona is short (${lineCount} lines, recommended: 100-500)`);
  } else if (lineCount > 500) {
    warnings.push(`Persona is long (${lineCount} lines, recommended: 100-500)`);
  }

  return {
    valid: errors.length === 0,
    frontmatter: frontmatter || { archetype: "", created: "" },
    sections,
    lineCount,
    errors,
    warnings,
  };
}
