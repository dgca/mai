#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Session-aware persona loader.
 * Outputs persona content only if not already loaded in this session.
 * This script is installed to ~/.claude/plugin-data/assume-persona/scripts/
 * and invoked by SKILL.md files via dynamic context (!`command`).
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

const [sessionId, archetype, personaFile] = process.argv.slice(2);

if (!sessionId || !archetype || !personaFile) {
  console.error('Usage: load-persona.ts <sessionId> <archetype> <personaFile>');
  process.exit(1);
}

// Expand $HOME in persona file path
const expandedPersonaFile = personaFile.replace(/^\$HOME/, homedir());

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

// Read persona content
let personaContent: string;
try {
  personaContent = readFileSync(expandedPersonaFile, 'utf8');
} catch (err) {
  console.error(`Failed to read persona file: ${expandedPersonaFile}`);
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
