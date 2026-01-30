#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Restore active personas on session start.
 * Reads state file and outputs condensed persona summaries.
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

interface PersonaFile {
  path: string;
  source: 'local' | 'user';
}

// Storage locations
const LOCAL_STATE = join(process.cwd(), '.claude/plugin-data/assume-persona/.state.json');
const USER_STATE = join(homedir(), '.claude/plugin-data/assume-persona/.state.json');

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

  if (!state?.activePersonas?.length) {
    // No active personas, exit silently
    process.exit(0);
  }

  const outputs: string[] = [];

  for (const persona of state.activePersonas) {
    const { archetype, source } = persona;
    const file = findPersonaFile(archetype, source);

    if (!file) {
      continue;
    }

    try {
      const content = readFileSync(file.path, 'utf8');
      const summary = extractCondensedSummary(content);

      outputs.push(`<active-persona archetype="${archetype}" source="${file.source}">
${summary}
</active-persona>`);
    } catch {
      // Skip on error
    }
  }

  if (outputs.length > 0) {
    console.log(`The following persona(s) were active from a previous session and have been restored:\n`);
    console.log(outputs.join('\n\n'));
    console.log(`\nApply this context to your responses. Use /assume-persona:status to see details or /assume-persona:clear to deactivate.`);
  }
}

main();
