#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Restore active personas on session start.
 * Reads state file and config file, outputs condensed persona summaries.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface ActivePersona {
  archetype: string;
  loadedAt: string;
  source: 'local' | 'user';
}

interface State {
  activePersonas: ActivePersona[];
}

interface Config {
  autoLoad?: string[];
}

interface PersonaFile {
  path: string;
  source: 'local' | 'user';
}

interface LoadedPersona {
  archetype: string;
  source: 'local' | 'user';
  loadSource: 'restored' | 'auto-loaded';
  content: string;
}

// Storage locations
const LOCAL_STATE = join(process.cwd(), '.claude/plugin-data/assume-persona/.state.local.json');
const USER_STATE = join(homedir(), '.claude/plugin-data/assume-persona/.state.local.json');

const LOCAL_CONFIG = join(process.cwd(), '.claude/plugin-data/assume-persona/config.json');

const LOCAL_PERSONAS = join(process.cwd(), '.claude/plugin-data/assume-persona/personas');
const USER_PERSONAS = join(homedir(), '.claude/plugin-data/assume-persona/personas');

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

function findPersonaFile(archetype: string, preferredSource?: string): PersonaFile | null {
  const locations: Record<string, string> = {
    local: join(LOCAL_PERSONAS, `${archetype}.md`),
    user: join(USER_PERSONAS, `${archetype}.md`),
  };

  // Try preferred source first
  if (preferredSource && locations[preferredSource] && existsSync(locations[preferredSource])) {
    return { path: locations[preferredSource], source: preferredSource as PersonaFile['source'] };
  }

  // Fall back to precedence order
  for (const [source, filePath] of Object.entries(locations)) {
    if (existsSync(filePath)) {
      return { path: filePath, source: source as PersonaFile['source'] };
    }
  }
  return null;
}

function extractCondensedSummary(content: string): string {
  // Remove YAML frontmatter
  const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n+/);
  const body = frontmatterMatch ? content.slice(frontmatterMatch[0].length) : content;

  // Extract role (first paragraph after the title)
  const lines = body.split('\n');
  let role = '';
  let inRole = false;

  for (const line of lines) {
    if (line.startsWith('# ')) {
      inRole = true;
      continue;
    }
    if (inRole && line.trim() && !line.startsWith('#')) {
      role = line.trim().split('.')[0] + '.';
      break;
    }
  }

  // Extract key sections with first 3 bullet points each
  const sections: string[] = [];

  // Split by section headers
  const sectionParts = body.split(/^## /m).slice(1); // Skip content before first ##

  for (const part of sectionParts) {
    const newlineIdx = part.indexOf('\n');
    if (newlineIdx === -1) continue;

    const heading = part.slice(0, newlineIdx).trim();
    const sectionContent = part.slice(newlineIdx + 1);

    // Get first 3 bullet points
    const bullets = sectionContent
      .split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .slice(0, 3)
      .map(line => line.trim())
      .join('\n');

    if (bullets) {
      sections.push(`**${heading}**:\n${bullets}`);
    }
  }

  return [role, ...sections].filter(Boolean).join('\n\n');
}

function main(): void {
  // Read state (local takes precedence)
  const state = readJsonFile<State>(LOCAL_STATE) ?? readJsonFile<State>(USER_STATE);

  // Read config for auto-load personas
  const config = readJsonFile<Config>(LOCAL_CONFIG);
  const autoLoadArchetypes = config?.autoLoad ?? [];

  // Get session-restored archetypes
  const sessionArchetypes = state?.activePersonas?.map(p => p.archetype) ?? [];

  // Find auto-load personas not already in session
  const newAutoLoad = autoLoadArchetypes.filter(a => !sessionArchetypes.includes(a));

  // If nothing to load, exit silently
  if (sessionArchetypes.length === 0 && newAutoLoad.length === 0) {
    process.exit(0);
  }

  const loadedPersonas: LoadedPersona[] = [];

  // Load session-restored personas
  for (const persona of state?.activePersonas ?? []) {
    const { archetype, source } = persona;
    const file = findPersonaFile(archetype, source);

    if (!file) continue;

    try {
      const content = readFileSync(file.path, 'utf8');
      loadedPersonas.push({
        archetype,
        source: file.source,
        loadSource: 'restored',
        content,
      });
    } catch {
      // Skip on error
    }
  }

  // Load auto-load personas
  for (const archetype of newAutoLoad) {
    const file = findPersonaFile(archetype);

    if (!file) continue;

    try {
      const content = readFileSync(file.path, 'utf8');
      loadedPersonas.push({
        archetype,
        source: file.source,
        loadSource: 'auto-loaded',
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
  const autoLoaded = loadedPersonas
    .filter(p => p.loadSource === 'auto-loaded')
    .map(p => p.archetype);
  const restored = loadedPersonas
    .filter(p => p.loadSource === 'restored')
    .map(p => p.archetype);

  const notificationLines: string[] = [];
  if (autoLoaded.length > 0) {
    notificationLines.push(`- Persona loaded from project config: ${autoLoaded.join(', ')}`);
  }
  if (restored.length > 0) {
    notificationLines.push(`- Persona loaded from previous session: ${restored.join(', ')}`);
  }
  notificationLines.push('- /assume-persona:help for more info');

  // Build persona output blocks
  const outputs = loadedPersonas.map(persona => {
    const summary = extractCondensedSummary(persona.content);
    return `<active-persona archetype="${persona.archetype}" source="${persona.source}">
${summary}
</active-persona>`;
  });

  // Output persona context for Claude
  console.log(outputs.join('\n\n'));

  // Instruction for Claude to display notification
  console.log(`\nIMPORTANT: At the START of your first response, output these lines exactly, then a blank line before your response:\n${notificationLines.join('\n')}`);
}

main();
