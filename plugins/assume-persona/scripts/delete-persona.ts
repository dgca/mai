#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Safely delete persona skill directory and update state.
 *
 * Usage:
 *   delete-persona.ts --archetype <name> --scope <local|user>
 *
 * Output (JSON):
 * { "success": true, "deleted": ".claude/skills/assume-persona--foo/" }
 * { "success": false, "error": "Persona 'foo' not found in local scope" }
 */

import { existsSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface Args {
  archetype: string;
  scope: 'local' | 'user';
}

interface SessionState {
  loadedPersonas: string[];
  lastAccess?: string;
}

interface State {
  [sessionId: string]: SessionState;
}

interface Result {
  success: boolean;
  deleted?: string;
  stateUpdated?: boolean;
  error?: string;
}

const PERSONA_SKILL_PREFIX = 'assume-persona--';
const STATE_FILE = join(homedir(), '.claude/plugin-data/assume-persona/state.json');
const LOCAL_SKILLS = join(process.cwd(), '.claude/skills');
const USER_SKILLS = join(homedir(), '.claude/skills');

function parseArgs(): Args | null {
  const args = process.argv.slice(2);
  let archetype = '';
  let scope: 'local' | 'user' | null = null;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--archetype':
        archetype = args[++i] || '';
        break;
      case '--scope':
        const s = args[++i];
        if (s === 'local' || s === 'user') {
          scope = s;
        }
        break;
    }
  }

  if (!archetype || !scope) {
    return null;
  }

  return { archetype, scope };
}

function removeFromState(archetype: string): boolean {
  if (!existsSync(STATE_FILE)) {
    return false;
  }

  let state: State;
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return false;
  }

  let modified = false;

  // Remove archetype from all sessions
  for (const sessionId of Object.keys(state)) {
    const session = state[sessionId];
    if (session.loadedPersonas?.includes(archetype)) {
      session.loadedPersonas = session.loadedPersonas.filter(a => a !== archetype);
      modified = true;

      // Remove session if now empty
      if (session.loadedPersonas.length === 0) {
        delete state[sessionId];
      }
    }
  }

  if (modified) {
    if (Object.keys(state).length === 0) {
      // Delete empty state file
      try {
        rmSync(STATE_FILE);
      } catch {
        // Ignore
      }
    } else {
      writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    }
  }

  return modified;
}

function output(result: Result): void {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}

function main(): void {
  const args = parseArgs();

  if (!args) {
    output({
      success: false,
      error: 'Usage: delete-persona.ts --archetype <name> --scope <local|user>',
    });
    return;
  }

  const { archetype, scope } = args;
  const skillDirName = `${PERSONA_SKILL_PREFIX}${archetype}`;
  const baseDir = scope === 'local' ? LOCAL_SKILLS : USER_SKILLS;
  const skillDir = join(baseDir, skillDirName);

  // Check if persona exists
  if (!existsSync(skillDir)) {
    output({
      success: false,
      error: `Persona '${archetype}' not found in ${scope} scope`,
    });
    return;
  }

  // Delete the skill directory
  try {
    rmSync(skillDir, { recursive: true, force: true });
  } catch (err) {
    output({
      success: false,
      error: `Failed to delete ${skillDir}: ${err instanceof Error ? err.message : 'unknown error'}`,
    });
    return;
  }

  // Update state to remove archetype from loaded personas
  const stateUpdated = removeFromState(archetype);

  const displayPath = scope === 'local'
    ? `.claude/skills/${skillDirName}/`
    : `~/.claude/skills/${skillDirName}/`;

  output({
    success: true,
    deleted: displayPath,
    stateUpdated,
  });
}

main();
