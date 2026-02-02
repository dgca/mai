#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Clear session state (all or specific archetype).
 *
 * Usage:
 *   clear-session.ts <sessionId>              # Clear all personas from session
 *   clear-session.ts <sessionId> <archetype>  # Clear specific persona
 *
 * Output (JSON):
 *   { "cleared": "all", "remaining": [] }
 *   { "cleared": ["archetype1"], "remaining": ["archetype2"] }
 *   { "error": "No personas loaded in current session" }
 *   { "error": "Persona 'foo' is not loaded in current session", "loaded": ["bar", "baz"] }
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface SessionState {
  loadedPersonas: string[];
  lastAccess?: string;
}

interface State {
  [sessionId: string]: SessionState;
}

interface ClearResult {
  cleared: string | string[];
  remaining: string[];
  error?: string;
  loaded?: string[];
}

const STATE_FILE = join(homedir(), '.claude/plugin-data/assume-persona/state.json');

function main(): void {
  const [sessionId, archetype] = process.argv.slice(2);

  if (!sessionId) {
    console.error('Usage: clear-session.ts <sessionId> [archetype]');
    process.exit(1);
  }

  // Read current state
  if (!existsSync(STATE_FILE)) {
    const result: ClearResult = {
      cleared: [],
      remaining: [],
      error: 'No personas loaded in current session',
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  let state: State;
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    const result: ClearResult = {
      cleared: [],
      remaining: [],
      error: 'No personas loaded in current session',
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const sessionState = state[sessionId];
  if (!sessionState || !sessionState.loadedPersonas || sessionState.loadedPersonas.length === 0) {
    const result: ClearResult = {
      cleared: [],
      remaining: [],
      error: 'No personas loaded in current session',
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const currentLoaded = [...sessionState.loadedPersonas];

  if (archetype) {
    // Clear specific archetype
    if (!currentLoaded.includes(archetype)) {
      const result: ClearResult = {
        cleared: [],
        remaining: currentLoaded,
        error: `Persona '${archetype}' is not loaded in current session`,
        loaded: currentLoaded,
      };
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // Remove the specific archetype
    sessionState.loadedPersonas = currentLoaded.filter(a => a !== archetype);

    if (sessionState.loadedPersonas.length === 0) {
      delete state[sessionId];
    }

    const result: ClearResult = {
      cleared: [archetype],
      remaining: sessionState.loadedPersonas || [],
    };

    // Write updated state
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    console.log(JSON.stringify(result, null, 2));
  } else {
    // Clear all personas from session
    delete state[sessionId];

    const result: ClearResult = {
      cleared: 'all',
      remaining: [],
    };

    // Write updated state
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    console.log(JSON.stringify(result, null, 2));
  }
}

main();
