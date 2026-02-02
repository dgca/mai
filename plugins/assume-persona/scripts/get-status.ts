#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Get session state and auto-load configuration.
 *
 * Usage:
 *   get-status.ts --session <id>
 *
 * Output (JSON):
 * {
 *   "loadedPersonas": ["archetype1", "archetype2"],
 *   "autoLoad": ["archetype3"],
 *   "configPath": "<cwd>/.claude/plugin-data/assume-persona/config.json"
 * }
 *
 * If session has no state and no auto-load config:
 * {
 *   "loadedPersonas": [],
 *   "autoLoad": [],
 *   "configPath": "<cwd>/.claude/plugin-data/assume-persona/config.json"
 * }
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
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

interface StatusResult {
  loadedPersonas: string[];
  autoLoad: string[];
  configPath: string;
}

const STATE_FILE = join(homedir(), '.claude/plugin-data/assume-persona/state.json');
const LOCAL_CONFIG = join(process.cwd(), '.claude/plugin-data/assume-persona/config.json');

function parseArgs(): { session: string | null } {
  const args = process.argv.slice(2);
  let session: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--session' && args[i + 1]) {
      session = args[++i];
    }
  }

  return { session };
}

function main(): void {
  const { session } = parseArgs();

  if (!session) {
    console.error('Usage: get-status.ts --session <id>');
    process.exit(1);
  }

  // Get loaded personas from state file
  const loadedPersonas: string[] = [];
  if (existsSync(STATE_FILE)) {
    try {
      const state: State = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
      const sessionState = state[session];
      if (sessionState?.loadedPersonas) {
        loadedPersonas.push(...sessionState.loadedPersonas);
      }
    } catch {
      // Ignore errors
    }
  }

  // Get auto-load from config
  const autoLoad: string[] = [];
  if (existsSync(LOCAL_CONFIG)) {
    try {
      const config: Config = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8'));
      if (config.autoLoad) {
        autoLoad.push(...config.autoLoad);
      }
    } catch {
      // Ignore errors
    }
  }

  const result: StatusResult = {
    loadedPersonas,
    autoLoad,
    configPath: LOCAL_CONFIG,
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
