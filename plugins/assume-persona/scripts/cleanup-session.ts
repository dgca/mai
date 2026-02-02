#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * SessionEnd hook: removes current session entry from state.
 * Called via stdin with session info from Claude Code.
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

interface SessionState {
  loadedPersonas: string[];
  lastAccess?: string;
}

interface State {
  [sessionId: string]: SessionState;
}

interface HookInput {
  session_id?: string;
}

const STATE_FILE = join(homedir(), '.claude/plugin-data/assume-persona/state.json');

// Read hook input from stdin
let input: HookInput = {};
try {
  const stdin = readFileSync('/dev/stdin', 'utf8').trim();
  if (stdin) {
    input = JSON.parse(stdin);
  }
} catch {
  // No input or invalid JSON - try environment variable
}

const sessionId = input.session_id || process.env.CLAUDE_SESSION_ID;

if (!sessionId) {
  // No session ID available - nothing to clean up
  process.exit(0);
}

// Read existing state
if (!existsSync(STATE_FILE)) {
  // No state file - nothing to clean up
  process.exit(0);
}

let state: State;
try {
  state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
} catch {
  // Corrupted state - remove it
  try {
    unlinkSync(STATE_FILE);
  } catch {
    // Ignore
  }
  process.exit(0);
}

// Remove current session entry
if (state[sessionId]) {
  delete state[sessionId];

  // If no sessions remain, delete the state file
  if (Object.keys(state).length === 0) {
    try {
      unlinkSync(STATE_FILE);
    } catch {
      // Ignore
    }
  } else {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  }
}

process.exit(0);
