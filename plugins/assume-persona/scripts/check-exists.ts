#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Check if a persona exists in local or user scope.
 *
 * Usage:
 *   check-exists.ts <archetype>
 *
 * Output (JSON):
 *   { "exists": true, "scope": "local", "path": ".claude/skills/assume-persona--<archetype>/" }
 *   { "exists": true, "scope": "user", "path": "~/.claude/skills/assume-persona--<archetype>/" }
 *   { "exists": false }
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PERSONA_SKILL_PREFIX = 'assume-persona--';
const LOCAL_SKILLS = join(process.cwd(), '.claude/skills');
const USER_SKILLS = join(homedir(), '.claude/skills');

interface ExistsResult {
  exists: boolean;
  scope?: 'local' | 'user';
  path?: string;
}

function main(): void {
  const archetype = process.argv[2];

  if (!archetype) {
    console.error('Usage: check-exists.ts <archetype>');
    process.exit(1);
  }

  const skillDirName = `${PERSONA_SKILL_PREFIX}${archetype}`;

  // Check local scope first (higher precedence)
  const localPath = join(LOCAL_SKILLS, skillDirName);
  const localPersonaPath = join(localPath, 'persona.md');
  if (existsSync(localPersonaPath)) {
    const result: ExistsResult = {
      exists: true,
      scope: 'local',
      path: `.claude/skills/${skillDirName}/`,
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Check user scope
  const userPath = join(USER_SKILLS, skillDirName);
  const userPersonaPath = join(userPath, 'persona.md');
  if (existsSync(userPersonaPath)) {
    const result: ExistsResult = {
      exists: true,
      scope: 'user',
      path: `~/.claude/skills/${skillDirName}/`,
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Not found
  const result: ExistsResult = { exists: false };
  console.log(JSON.stringify(result, null, 2));
}

main();
