#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Find all available persona skills across scopes.
 *
 * Usage:
 *   list-personas.ts [--scope <local|user|all>] [--format <json|text>] [--session <id>] [--include-keywords]
 *
 * Defaults: --scope all --format json
 *
 * Options:
 *   --session <id>       Only check this session for loaded status (more accurate)
 *                        Without this flag, shows personas loaded in ANY session
 *   --include-keywords   Include keywords array from frontmatter for each persona
 *
 * Output (JSON):
 * {
 *   "personas": [
 *     {
 *       "archetype": "typescript-fullstack",
 *       "description": "Expert TypeScript fullstack developer...",
 *       "category": "web-development",
 *       "scope": "local",
 *       "path": ".claude/skills/assume-persona--typescript-fullstack/",
 *       "created": "2024-01-15",
 *       "lineCount": 245,
 *       "loaded": true,
 *       "autoLoad": false
 *     }
 *   ],
 *   "summary": {
 *     "total": 2,
 *     "loaded": 1,
 *     "autoLoad": 1
 *   }
 * }
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface PersonaInfo {
  archetype: string;
  description: string;
  category: string;
  scope: 'local' | 'user';
  path: string;
  created: string;
  lineCount: number;
  loaded: boolean;
  autoLoad: boolean;
  keywords?: string[];
}

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

interface ListResult {
  personas: PersonaInfo[];
  summary: {
    total: number;
    loaded: number;
    autoLoad: number;
  };
}

const PERSONA_SKILL_PREFIX = 'assume-persona--';
const STATE_FILE = join(homedir(), '.claude/plugin-data/assume-persona/state.json');
const LOCAL_CONFIG = join(process.cwd(), '.claude/plugin-data/assume-persona/config.json');
const LOCAL_SKILLS = join(process.cwd(), '.claude/skills');
const USER_SKILLS = join(homedir(), '.claude/skills');

function parseArgs(): { scope: 'local' | 'user' | 'all'; format: 'json' | 'text'; session: string | null; includeKeywords: boolean } {
  const args = process.argv.slice(2);
  let scope: 'local' | 'user' | 'all' = 'all';
  let format: 'json' | 'text' = 'json';
  let session: string | null = null;
  let includeKeywords = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scope' && args[i + 1]) {
      const s = args[++i];
      if (s === 'local' || s === 'user' || s === 'all') {
        scope = s;
      }
    } else if (args[i] === '--format' && args[i + 1]) {
      const f = args[++i];
      if (f === 'json' || f === 'text') {
        format = f;
      }
    } else if (args[i] === '--session' && args[i + 1]) {
      session = args[++i];
    } else if (args[i] === '--include-keywords') {
      includeKeywords = true;
    }
  }

  return { scope, format, session, includeKeywords };
}

function parseFrontmatter(content: string): { archetype?: string; created?: string; category?: string; keywords?: string[] } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) return {};

  const yaml = frontmatterMatch[1];
  const result: { archetype?: string; created?: string; category?: string; keywords?: string[] } = {};

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

function extractDescription(content: string): string {
  // Find the "You are" sentence
  const match = content.match(/You are[^.]*\./);
  if (match) {
    return match[0].substring(0, 100) + (match[0].length > 100 ? '...' : '');
  }

  // Fallback: first paragraph after frontmatter
  const body = content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  const firstPara = body.split('\n\n')[0] || '';
  return firstPara.substring(0, 100) + (firstPara.length > 100 ? '...' : '');
}

function findPersonasInDir(dir: string, scope: 'local' | 'user', includeKeywords: boolean): PersonaInfo[] {
  const personas: PersonaInfo[] = [];

  if (!existsSync(dir)) {
    return personas;
  }

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return personas;
  }

  for (const entry of entries) {
    if (!entry.startsWith(PERSONA_SKILL_PREFIX)) continue;

    const skillDir = join(dir, entry);
    const personaPath = join(skillDir, 'persona.md');

    if (!existsSync(personaPath)) continue;

    try {
      const stat = statSync(skillDir);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }

    try {
      const content = readFileSync(personaPath, 'utf8');
      const fm = parseFrontmatter(content);
      const archetype = entry.replace(PERSONA_SKILL_PREFIX, '');

      const personaInfo: PersonaInfo = {
        archetype,
        description: extractDescription(content),
        category: fm.category || 'uncategorized',
        scope,
        path: scope === 'local'
          ? `.claude/skills/${entry}/`
          : `~/.claude/skills/${entry}/`,
        created: fm.created || 'unknown',
        lineCount: content.split('\n').length,
        loaded: false, // Will be filled in later
        autoLoad: false, // Will be filled in later
      };

      if (includeKeywords && fm.keywords) {
        personaInfo.keywords = fm.keywords;
      }

      personas.push(personaInfo);
    } catch {
      // Skip on error
    }
  }

  return personas;
}

function getLoadedPersonas(sessionId: string | null): Set<string> {
  const loaded = new Set<string>();

  if (!existsSync(STATE_FILE)) {
    return loaded;
  }

  try {
    const state: State = JSON.parse(readFileSync(STATE_FILE, 'utf8'));

    if (sessionId) {
      // Check only the specified session
      const sessionState = state[sessionId];
      if (sessionState) {
        for (const archetype of sessionState.loadedPersonas || []) {
          loaded.add(archetype);
        }
      }
    } else {
      // Check all sessions (less accurate, but fallback)
      for (const session of Object.values(state)) {
        for (const archetype of session.loadedPersonas || []) {
          loaded.add(archetype);
        }
      }
    }
  } catch {
    // Ignore
  }

  return loaded;
}

function getAutoLoadPersonas(): Set<string> {
  const autoLoad = new Set<string>();

  if (!existsSync(LOCAL_CONFIG)) {
    return autoLoad;
  }

  try {
    const config: Config = JSON.parse(readFileSync(LOCAL_CONFIG, 'utf8'));
    for (const archetype of config.autoLoad || []) {
      autoLoad.add(archetype);
    }
  } catch {
    // Ignore
  }

  return autoLoad;
}

function formatText(result: ListResult): string {
  if (result.personas.length === 0) {
    return 'No personas found.\n\nCreate one with: /assume-persona:create <archetype>';
  }

  const lines: string[] = ['Available Personas:', ''];

  for (const p of result.personas) {
    const flags: string[] = [];
    if (p.loaded) flags.push('loaded');
    if (p.autoLoad) flags.push('auto-load');
    const flagStr = flags.length > 0 ? ` (${flags.join(', ')})` : '';

    lines.push(`Name: ${p.archetype}${flagStr}`);
    lines.push(`Description: ${p.description}`);
    lines.push(`Category: ${p.category}`);
    lines.push(`Location: ${p.scope}`);
    lines.push(`Created: ${p.created}`);
    lines.push('');
  }

  lines.push(`Total: ${result.summary.total} personas (${result.summary.loaded} loaded, ${result.summary.autoLoad} auto-load)`);

  return lines.join('\n');
}

function main(): void {
  const { scope, format, session, includeKeywords } = parseArgs();

  let personas: PersonaInfo[] = [];

  // Collect personas based on scope
  if (scope === 'local' || scope === 'all') {
    personas.push(...findPersonasInDir(LOCAL_SKILLS, 'local', includeKeywords));
  }

  if (scope === 'user' || scope === 'all') {
    const userPersonas = findPersonasInDir(USER_SKILLS, 'user', includeKeywords);
    // Filter out duplicates (local takes precedence)
    const localArchetypes = new Set(personas.map(p => p.archetype));
    for (const p of userPersonas) {
      if (!localArchetypes.has(p.archetype)) {
        personas.push(p);
      }
    }
  }

  // Enrich with loaded/autoLoad status
  const loadedSet = getLoadedPersonas(session);
  const autoLoadSet = getAutoLoadPersonas();

  for (const p of personas) {
    p.loaded = loadedSet.has(p.archetype);
    p.autoLoad = autoLoadSet.has(p.archetype);
  }

  // Sort by archetype name
  personas.sort((a, b) => a.archetype.localeCompare(b.archetype));

  const result: ListResult = {
    personas,
    summary: {
      total: personas.length,
      loaded: personas.filter(p => p.loaded).length,
      autoLoad: personas.filter(p => p.autoLoad).length,
    },
  };

  if (format === 'text') {
    console.log(formatText(result));
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

main();
