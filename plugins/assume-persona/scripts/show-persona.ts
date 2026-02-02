#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Read persona content without updating state.
 *
 * Usage:
 *   show-persona.ts <archetype>
 *
 * Output (JSON):
 * {
 *   "found": true,
 *   "scope": "local",
 *   "archetype": "typescript-fullstack",
 *   "created": "2024-01-15",
 *   "category": "web-development",
 *   "keywords": ["typescript", "react", "node"],
 *   "lineCount": 245,
 *   "content": "---\narchetype: typescript-fullstack\n..."
 * }
 *
 * If not found:
 * { "found": false }
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface ShowResult {
  found: boolean;
  scope?: 'local' | 'user';
  archetype?: string;
  created?: string;
  category?: string;
  keywords?: string[];
  lineCount?: number;
  content?: string;
}

const PERSONA_SKILL_PREFIX = 'assume-persona--';
const LOCAL_SKILLS = join(process.cwd(), '.claude/skills');
const USER_SKILLS = join(homedir(), '.claude/skills');

function parseFrontmatter(content: string): {
  archetype?: string;
  created?: string;
  category?: string;
  keywords?: string[];
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) return {};

  const yaml = frontmatterMatch[1];
  const result: {
    archetype?: string;
    created?: string;
    category?: string;
    keywords?: string[];
  } = {};

  const archetypeMatch = yaml.match(/^archetype:\s*(.+)$/m);
  if (archetypeMatch) result.archetype = archetypeMatch[1].trim();

  const createdMatch = yaml.match(/^created:\s*(.+)$/m);
  if (createdMatch) result.created = createdMatch[1].trim();

  const categoryMatch = yaml.match(/^category:\s*(.+)$/m);
  if (categoryMatch) result.category = categoryMatch[1].trim();

  // Parse keywords list
  const keywordsMatch = yaml.match(/^keywords:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (keywordsMatch) {
    const keywordsBlock = keywordsMatch[1];
    const keywords = keywordsBlock
      .split('\n')
      .map(line => line.replace(/^\s+-\s+/, '').trim())
      .filter(k => k.length > 0);
    if (keywords.length > 0) {
      result.keywords = keywords;
    }
  }

  return result;
}

function main(): void {
  const archetype = process.argv[2];

  if (!archetype) {
    console.error('Usage: show-persona.ts <archetype>');
    process.exit(1);
  }

  const skillDirName = `${PERSONA_SKILL_PREFIX}${archetype}`;

  // Check local scope first (higher precedence)
  const localPath = join(LOCAL_SKILLS, skillDirName, 'persona.md');
  if (existsSync(localPath)) {
    try {
      const content = readFileSync(localPath, 'utf8');
      const fm = parseFrontmatter(content);

      const result: ShowResult = {
        found: true,
        scope: 'local',
        archetype: fm.archetype || archetype,
        created: fm.created,
        category: fm.category,
        keywords: fm.keywords,
        lineCount: content.split('\n').length,
        content,
      };

      console.log(JSON.stringify(result, null, 2));
      return;
    } catch {
      // Fall through to user scope
    }
  }

  // Check user scope
  const userPath = join(USER_SKILLS, skillDirName, 'persona.md');
  if (existsSync(userPath)) {
    try {
      const content = readFileSync(userPath, 'utf8');
      const fm = parseFrontmatter(content);

      const result: ShowResult = {
        found: true,
        scope: 'user',
        archetype: fm.archetype || archetype,
        created: fm.created,
        category: fm.category,
        keywords: fm.keywords,
        lineCount: content.split('\n').length,
        content,
      };

      console.log(JSON.stringify(result, null, 2));
      return;
    } catch {
      // Fall through to not found
    }
  }

  // Not found
  const result: ShowResult = { found: false };
  console.log(JSON.stringify(result, null, 2));
}

main();
