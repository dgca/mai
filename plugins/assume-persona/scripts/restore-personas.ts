#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Restore active personas on session start.
 * - Installs/updates loader script to user location
 * - Prunes stale sessions from state (older than 7 days)
 * - Loads auto-load personas from project config
 * - Updates state.json so load-persona.ts won't duplicate them
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

interface HookInput {
  session_id?: string;
  source?: 'clear' | 'startup' | 'resume' | 'compact';
  [key: string]: unknown;
}

interface SessionState {
  loadedPersonas: string[];
  lastAccess?: string;
}

interface HandoffState {
  personas: string[];
  timestamp: number;
}

interface State {
  [sessionId: string]: SessionState | HandoffState;
  'session-clear-handoff'?: HandoffState;
}

interface Config {
  autoLoad?: string[];
}

// Storage locations
const USER_SCRIPTS_DIR = join(homedir(), '.claude/plugin-data/assume-persona/scripts');
const LOADER_SCRIPT_NAME = 'load-persona.ts';
const STATE_FILE = join(homedir(), '.claude/plugin-data/assume-persona/state.json');

const LOCAL_CONFIG = join(process.cwd(), '.claude/plugin-data/assume-persona/config.json');

// Skill locations (new architecture)
const LOCAL_SKILLS = join(process.cwd(), '.claude/skills');
const USER_SKILLS = join(homedir(), '.claude/skills');

const PERSONA_SKILL_PREFIX = 'assume-persona--';
const HANDOFF_KEY = 'session-clear-handoff';

// Get plugin root from environment or compute from script location
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || dirname(dirname(import.meta.url.replace('file://', '')));

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, 'utf8')) as T;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

function installLoaderScript(): void {
  // Source script is bundled with the plugin
  const sourceScript = join(PLUGIN_ROOT, 'scripts', LOADER_SCRIPT_NAME);
  const targetScript = join(USER_SCRIPTS_DIR, LOADER_SCRIPT_NAME);

  // Create target directory if needed
  mkdirSync(USER_SCRIPTS_DIR, { recursive: true });

  // Copy the loader script
  try {
    copyFileSync(sourceScript, targetScript);
  } catch {
    // Ignore - might fail if source doesn't exist yet during development
  }
}

function pruneStaleState(): void {
  if (!existsSync(STATE_FILE)) {
    return;
  }

  let state: State;
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return;
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let modified = false;

  for (const sessionId of Object.keys(state)) {
    // Skip the handoff key - it's handled separately
    if (sessionId === HANDOFF_KEY) continue;

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
    if (Object.keys(state).length === 0) {
      // Delete empty state file
      try {
        const { unlinkSync } = require('fs');
        unlinkSync(STATE_FILE);
      } catch {
        // Ignore
      }
    } else {
      writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    }
  }
}

interface PersonaSkill {
  archetype: string;
  personaPath: string;
  source: 'local' | 'user';
}

function findPersonaSkill(archetype: string): PersonaSkill | null {
  const skillDirName = `${PERSONA_SKILL_PREFIX}${archetype}`;

  // Check local first (higher precedence)
  const localSkillDir = join(LOCAL_SKILLS, skillDirName);
  const localPersonaPath = join(localSkillDir, 'persona.md');
  if (existsSync(localPersonaPath)) {
    return { archetype, personaPath: localPersonaPath, source: 'local' };
  }

  // Check user location
  const userSkillDir = join(USER_SKILLS, skillDirName);
  const userPersonaPath = join(userSkillDir, 'persona.md');
  if (existsSync(userPersonaPath)) {
    return { archetype, personaPath: userPersonaPath, source: 'user' };
  }

  return null;
}

function readHandoff(): string[] {
  const state = readJsonFile<State>(STATE_FILE);
  return state?.[HANDOFF_KEY]?.personas ?? [];
}

function clearHandoff(): void {
  if (!existsSync(STATE_FILE)) return;

  let state: State;
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return;
  }

  if (state[HANDOFF_KEY]) {
    delete state[HANDOFF_KEY];
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  }
}

function updateState(sessionId: string, archetypes: string[]): void {
  if (!sessionId || archetypes.length === 0) return;

  // Ensure directory exists
  mkdirSync(dirname(STATE_FILE), { recursive: true });

  // Read existing state
  let state: State = {};
  try {
    if (existsSync(STATE_FILE)) {
      state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {
    state = {};
  }

  // Update session state
  if (!state[sessionId]) {
    state[sessionId] = { loadedPersonas: [] };
  }

  for (const archetype of archetypes) {
    if (!state[sessionId].loadedPersonas.includes(archetype)) {
      state[sessionId].loadedPersonas.push(archetype);
    }
  }
  state[sessionId].lastAccess = new Date().toISOString();

  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function main(): void {
  // Read hook input from stdin to get session ID and source
  let sessionId = '';
  let source: HookInput['source'] = 'startup';
  try {
    const input = readFileSync(0, 'utf8');
    if (input.trim()) {
      const hookInput: HookInput = JSON.parse(input);
      sessionId = hookInput.session_id || '';
      source = hookInput.source || 'startup';
    }
  } catch {
    // No stdin or invalid JSON - continue without session tracking
  }

  // 1. Install/update loader script
  installLoaderScript();

  // 2. Prune stale sessions
  pruneStaleState();

  // 3. Read config for auto-load personas
  const config = readJsonFile<Config>(LOCAL_CONFIG);
  const autoLoadArchetypes = config?.autoLoad ?? [];

  // 4. Handle handoff from /clear
  let handoffArchetypes: string[] = [];
  if (source === 'clear') {
    // Restore personas from handoff
    handoffArchetypes = readHandoff();
    clearHandoff();
  } else if (source === 'startup') {
    // Fresh session - clear any stale handoff (shouldn't happen, but safety)
    clearHandoff();
  }
  // For 'resume' and 'compact', don't touch handoff (session state should persist)

  // 5. Combine auto-load and handoff (deduplicated)
  const allArchetypes = [...new Set([...autoLoadArchetypes, ...handoffArchetypes])];

  // If nothing to load, exit silently
  if (allArchetypes.length === 0) {
    process.exit(0);
  }

  // Load personas (auto-load + handoff), tracking which are which
  const loadedPersonas: Array<{ archetype: string; source: string; content: string; reason: 'auto' | 'restored' }> = [];
  const autoLoadSet = new Set(autoLoadArchetypes);

  for (const archetype of allArchetypes) {
    const skill = findPersonaSkill(archetype);

    if (!skill) {
      // Persona skill not found - skip silently
      continue;
    }

    try {
      const content = readFileSync(skill.personaPath, 'utf8');
      // Determine reason: auto-load takes precedence, then handoff
      const reason = autoLoadSet.has(archetype) ? 'auto' : 'restored';
      loadedPersonas.push({
        archetype,
        source: skill.source,
        content,
        reason,
      });
    } catch {
      // Skip on error
    }
  }

  if (loadedPersonas.length === 0) {
    process.exit(0);
  }

  // Update state so load-persona.ts knows these are already loaded
  updateState(sessionId, loadedPersonas.map(p => p.archetype));

  // Build notification lines
  const notificationLines: string[] = [];
  const autoLoaded = loadedPersonas.filter(p => p.reason === 'auto').map(p => p.archetype);
  const restored = loadedPersonas.filter(p => p.reason === 'restored').map(p => p.archetype);

  if (autoLoaded.length > 0) {
    notificationLines.push(`- Persona loaded from project config: ${autoLoaded.join(', ')}`);
  }
  if (restored.length > 0) {
    notificationLines.push(`- Persona restored from session: ${restored.join(', ')}`);
  }
  notificationLines.push('- /assume-persona:help for more info');

  // Build persona output blocks
  const outputs = loadedPersonas.map(persona => {
    return `<active-persona archetype="${persona.archetype}" source="${persona.source}">
${persona.content}
</active-persona>`;
  });

  // Output persona context for Claude
  console.log(outputs.join('\n\n'));

  // Instruction for Claude to display notification
  console.log(`\nIMPORTANT: At the START of your first response, output these lines exactly, then a blank line before your response:\n${notificationLines.join('\n')}`);
}

main();
