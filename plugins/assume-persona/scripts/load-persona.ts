#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Session-aware persona loader.
 * Outputs persona content only if not already loaded in this session.
 * Automatically finds persona in local or user scope (local takes precedence).
 *
 * Usage: load-persona.ts <sessionId> <archetype>
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';

interface SessionState {
  loadedPersonas: string[];
  lastAccess?: string;
}

interface State {
  [sessionId: string]: SessionState;
}

const STATE_FILE = join(homedir(), '.claude/plugin-data/assume-persona/state.json');
const PERSONA_SKILL_PREFIX = 'assume-persona--';

const [sessionId, archetype] = process.argv.slice(2);

if (!sessionId || !archetype) {
  console.error('Usage: load-persona.ts <sessionId> <archetype>');
  process.exit(1);
}

/**
 * Find persona.md in local or user scope.
 * Local (project) takes precedence over user.
 */
function findPersonaFile(archetype: string): string | null {
  const skillDirName = `${PERSONA_SKILL_PREFIX}${archetype}`;

  // Check local/project scope first
  const localPath = join(process.cwd(), '.claude/skills', skillDirName, 'persona.md');
  if (existsSync(localPath)) {
    return localPath;
  }

  // Fall back to user scope
  const userPath = join(homedir(), '.claude/skills', skillDirName, 'persona.md');
  if (existsSync(userPath)) {
    return userPath;
  }

  return null;
}

// Ensure state directory exists
mkdirSync(dirname(STATE_FILE), { recursive: true });

// Read existing state
let state: State = {};
try {
  if (existsSync(STATE_FILE)) {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  }
} catch {
  // Start fresh if state is corrupted
  state = {};
}

// Check if already loaded this session
if (state[sessionId]?.loadedPersonas?.includes(archetype)) {
  // Already loaded - output nothing (deduplication)
  process.exit(0);
}

// Find persona file
const personaFile = findPersonaFile(archetype);
if (!personaFile) {
  console.error(`Persona '${archetype}' not found in local or user scope`);
  process.exit(1);
}

// Read persona content
let personaContent: string;
try {
  personaContent = readFileSync(personaFile, 'utf8');
} catch (err) {
  console.error(`Failed to read persona file: ${personaFile}`);
  process.exit(1);
}

// Output persona content
console.log(personaContent);

// Update state
if (!state[sessionId]) {
  state[sessionId] = { loadedPersonas: [] };
}
state[sessionId].loadedPersonas.push(archetype);
state[sessionId].lastAccess = new Date().toISOString();

writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
