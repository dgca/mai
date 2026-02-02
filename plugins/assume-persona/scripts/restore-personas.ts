#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Restore active personas on session start.
 * - Installs/updates loader script to user location
 * - Prunes stale sessions from state (older than 7 days)
 * - Loads auto-load personas from project config
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

interface SessionState {
  loadedPersonas: string[];
  lastAccess?: string;
}

interface State {
  [sessionId: string]: SessionState;
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
    const session = state[sessionId];
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

function main(): void {
  // 1. Install/update loader script
  installLoaderScript();

  // 2. Prune stale sessions
  pruneStaleState();

  // 3. Read config for auto-load personas
  const config = readJsonFile<Config>(LOCAL_CONFIG);
  const autoLoadArchetypes = config?.autoLoad ?? [];

  // If nothing to auto-load, exit silently
  if (autoLoadArchetypes.length === 0) {
    process.exit(0);
  }

  // Load auto-load personas
  const loadedPersonas: Array<{ archetype: string; source: string; content: string }> = [];

  for (const archetype of autoLoadArchetypes) {
    const skill = findPersonaSkill(archetype);

    if (!skill) {
      // Persona skill not found - skip silently
      continue;
    }

    try {
      const content = readFileSync(skill.personaPath, 'utf8');
      loadedPersonas.push({
        archetype,
        source: skill.source,
        content,
      });
    } catch {
      // Skip on error
    }
  }

  if (loadedPersonas.length === 0) {
    process.exit(0);
  }

  // Build notification lines
  const notificationLines: string[] = [];
  const archetypeList = loadedPersonas.map(p => p.archetype).join(', ');
  notificationLines.push(`- Persona loaded from project config: ${archetypeList}`);
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
