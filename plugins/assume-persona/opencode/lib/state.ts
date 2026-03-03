/**
 * Session state management for assume-persona OpenCode plugin
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";
import type { State, SessionState, Config } from "./types";

// State file location - use OpenCode's config directory
const STATE_DIR = join(homedir(), ".config/opencode/plugin-data/assume-persona");
const STATE_FILE = join(STATE_DIR, "state.json");

// Config locations (project-level auto-load)
function getLocalConfigPath(cwd: string): string {
  return join(cwd, ".claude/plugin-data/assume-persona/config.json");
}

/**
 * Ensure state directory exists
 */
function ensureStateDir(): void {
  mkdirSync(STATE_DIR, { recursive: true });
}

/**
 * Read the full state file
 */
export function readState(): State {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, "utf8"));
    }
  } catch {
    // Start fresh if corrupted
  }
  return {};
}

/**
 * Write the full state file
 */
export function writeState(state: State): void {
  ensureStateDir();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Get session state for a specific session
 */
function getSessionState(sessionId: string): SessionState | null {
  const state = readState();
  return (state[sessionId] as SessionState) ?? null;
}

/**
 * Get loaded personas for a session
 */
export function getLoadedPersonas(sessionId: string): string[] {
  return getSessionState(sessionId)?.loadedPersonas ?? [];
}

/**
 * Check if a persona is already loaded in this session
 */
export function isPersonaLoaded(sessionId: string, archetype: string): boolean {
  return getLoadedPersonas(sessionId).includes(archetype);
}

/**
 * Mark a persona as loaded in this session
 */
export function markPersonaLoaded(sessionId: string, archetype: string): void {
  const state = readState();

  if (!state[sessionId]) {
    state[sessionId] = { loadedPersonas: [], lastAccess: "" };
  }

  const session = state[sessionId] as SessionState;
  if (!session.loadedPersonas.includes(archetype)) {
    session.loadedPersonas.push(archetype);
  }
  session.lastAccess = new Date().toISOString();

  writeState(state);
}

/**
 * Mark multiple personas as loaded
 */
export function markPersonasLoaded(sessionId: string, archetypes: string[]): void {
  const state = readState();

  if (!state[sessionId]) {
    state[sessionId] = { loadedPersonas: [], lastAccess: "" };
  }

  const session = state[sessionId] as SessionState;
  for (const archetype of archetypes) {
    if (!session.loadedPersonas.includes(archetype)) {
      session.loadedPersonas.push(archetype);
    }
  }
  session.lastAccess = new Date().toISOString();

  writeState(state);
}

/**
 * Clear specific persona(s) from session state
 */
export function clearPersonaFromSession(
  sessionId: string,
  archetype?: string
): { cleared: string[] | "all"; remaining: string[] } {
  const state = readState();
  const session = state[sessionId] as SessionState | undefined;

  if (!session || session.loadedPersonas.length === 0) {
    return { cleared: [], remaining: [] };
  }

  if (!archetype) {
    // Clear all
    const cleared = [...session.loadedPersonas];
    delete state[sessionId];
    writeState(state);
    return { cleared: "all", remaining: [] };
  }

  // Clear specific archetype
  const idx = session.loadedPersonas.indexOf(archetype);
  if (idx === -1) {
    return { cleared: [], remaining: session.loadedPersonas };
  }

  session.loadedPersonas.splice(idx, 1);
  session.lastAccess = new Date().toISOString();

  if (session.loadedPersonas.length === 0) {
    delete state[sessionId];
  }

  writeState(state);
  return { cleared: [archetype], remaining: session.loadedPersonas };
}

/**
 * Prune stale sessions (older than 7 days)
 */
export function pruneStaleState(): void {
  const state = readState();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let modified = false;

  for (const sessionId of Object.keys(state)) {
    const session = state[sessionId] as SessionState;
    if (session.lastAccess) {
      const lastAccess = new Date(session.lastAccess).getTime();
      if (lastAccess < sevenDaysAgo) {
        delete state[sessionId];
        modified = true;
      }
    }
  }

  if (modified) {
    writeState(state);
  }
}

/**
 * Read project config for auto-load personas
 */
function readConfig(cwd: string): Config {
  const configPath = getLocalConfigPath(cwd);
  try {
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, "utf8"));
    }
  } catch {
    // Ignore
  }
  return {};
}

/**
 * Get auto-load personas from config
 */
export function getAutoLoadPersonas(cwd: string): string[] {
  return readConfig(cwd).autoLoad ?? [];
}

/**
 * Get config file path for display
 */
export function getConfigPath(cwd: string): string {
  return getLocalConfigPath(cwd);
}

/**
 * Track missing auto-load personas for a session
 */
export function setMissingAutoLoad(sessionId: string, missing: string[]): void {
  if (missing.length === 0) return;
  
  const state = readState();

  if (!state[sessionId]) {
    state[sessionId] = { loadedPersonas: [], lastAccess: new Date().toISOString() };
  }

  const session = state[sessionId] as SessionState;
  session.missingAutoLoad = missing;
  session.lastAccess = new Date().toISOString();

  writeState(state);
}

/**
 * Get missing auto-load personas for a session
 */
export function getMissingAutoLoad(sessionId: string): string[] {
  return getSessionState(sessionId)?.missingAutoLoad ?? [];
}
