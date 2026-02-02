#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * SessionEnd hook for /clear: saves loaded personas to handoff state.
 * Called when reason=clear. Saves personas so they can be restored in the new session.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';

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

interface HookInput {
  session_id?: string;
  reason?: string;
}

const STATE_FILE = join(homedir(), '.claude/plugin-data/assume-persona/state.json');
const HANDOFF_KEY = 'session-clear-handoff';

// Read hook input from stdin
let input: HookInput = {};
try {
  const stdin = readFileSync('/dev/stdin', 'utf8').trim();
  if (stdin) {
    input = JSON.parse(stdin);
  }
} catch {
  // No input or invalid JSON
}

const sessionId = input.session_id || process.env.CLAUDE_SESSION_ID;

if (!sessionId) {
  // No session ID available - nothing to save
  process.exit(0);
}

// Ensure state directory exists
mkdirSync(dirname(STATE_FILE), { recursive: true });

// Read existing state
let state: State = {};
if (existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    state = {};
  }
}

// Get loaded personas from current session
const sessionState = state[sessionId] as SessionState | undefined;
const loadedPersonas = sessionState?.loadedPersonas ?? [];

// Save to handoff if there are personas to preserve
if (loadedPersonas.length > 0) {
  state[HANDOFF_KEY] = {
    personas: loadedPersonas,
    timestamp: Date.now(),
  };
}

// Delete the old session entry (new session will have new ID)
delete state[sessionId];

// Write updated state
writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

process.exit(0);
