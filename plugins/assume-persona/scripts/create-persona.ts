#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Create persona skill from validated content.
 * Validates persona content, generates SKILL.md, and writes both files atomically.
 *
 * Usage:
 *   create-persona.ts --archetype <name> --scope <local|user> --description <text>
 *
 * Reads persona.md content from stdin.
 *
 * Output (JSON):
 * { "success": true, "path": ".claude/skills/assume-persona--foo/" }
 * { "success": false, "error": "Missing ## Core Expertise section" }
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface Args {
  archetype: string;
  scope: 'local' | 'user';
  description: string;
}

interface Frontmatter {
  archetype?: string;
  created?: string;
  category?: string;
  keywords?: string[];
}

interface Result {
  success: boolean;
  path?: string;
  error?: string;
}

function parseArgs(): Args | null {
  const args = process.argv.slice(2);
  let archetype = '';
  let scope: 'local' | 'user' = 'local';
  let description = '';

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--archetype':
        archetype = args[++i] || '';
        break;
      case '--scope':
        const scopeArg = args[++i];
        if (scopeArg === 'local' || scopeArg === 'user') {
          scope = scopeArg;
        } else {
          return null;
        }
        break;
      case '--description':
        description = args[++i] || '';
        break;
    }
  }

  if (!archetype || !description) {
    return null;
  }

  return { archetype, scope, description };
}

function isKebabCase(str: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
}

function parseFrontmatter(content: string): Frontmatter {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    return {};
  }

  const yamlContent = frontmatterMatch[1];
  const frontmatter: Frontmatter = {};

  const archetypeMatch = yamlContent.match(/^archetype:\s*(.+)$/m);
  if (archetypeMatch) {
    frontmatter.archetype = archetypeMatch[1].trim();
  }

  const createdMatch = yamlContent.match(/^created:\s*(.+)$/m);
  if (createdMatch) {
    frontmatter.created = createdMatch[1].trim();
  }

  const categoryMatch = yamlContent.match(/^category:\s*(.+)$/m);
  if (categoryMatch) {
    frontmatter.category = categoryMatch[1].trim();
  }

  const keywordsMatch = yamlContent.match(/^keywords:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (keywordsMatch) {
    const keywordLines = keywordsMatch[1].match(/^\s+-\s+(.+)$/gm);
    if (keywordLines) {
      frontmatter.keywords = keywordLines.map(line => line.replace(/^\s+-\s+/, '').trim());
    }
  }

  return frontmatter;
}

function checkRequiredSections(content: string): string[] {
  const errors: string[] = [];
  const body = content.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Check for role description
  const hasRoleDescription = body.includes('You are') ||
    body.match(/^#[^#].*\n+You are/m) !== null;
  if (!hasRoleDescription) {
    errors.push('Missing role description (paragraph with "You are")');
  }

  // Check for required sections
  if (!/##\s*core\s+expertise/i.test(content)) {
    errors.push('Missing required section: ## Core Expertise');
  }
  if (!/##\s*mental\s+models/i.test(content)) {
    errors.push('Missing required section: ## Mental Models');
  }
  if (!/##\s*best\s+practices/i.test(content)) {
    errors.push('Missing required section: ## Best Practices');
  }
  if (!/##\s*(pitfalls|pitfalls\s+to\s+avoid)/i.test(content)) {
    errors.push('Missing required section: ## Pitfalls');
  }
  if (!/##\s*(tools|tools\s*(&|and)\s*technologies)/i.test(content)) {
    errors.push('Missing required section: ## Tools');
  }

  return errors;
}

function generateSkillMd(archetype: string, description: string): string {
  // IMPORTANT: ${CLAUDE_SESSION_ID} must remain as a literal string.
  // It gets substituted by Claude Code at runtime.
  // Do NOT use template literal interpolation for this variable.
  const sessionIdVar = '${CLAUDE_SESSION_ID}';

  return `---
name: assume-persona--${archetype}
description: |
  ${description.split('\n').join('\n  ')}
user-invocable: false
---

!\`node --experimental-strip-types --no-warnings "$HOME/.claude/plugin-data/assume-persona/scripts/load-persona.ts" "${sessionIdVar}" "${archetype}"\`
`;
}

function output(result: Result): void {
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}

function main(): void {
  const args = parseArgs();

  if (!args) {
    output({
      success: false,
      error: 'Usage: create-persona.ts --archetype <name> --scope <local|user> --description <text>',
    });
    return;
  }

  const { archetype, scope, description } = args;

  // Validate archetype is kebab-case
  if (!isKebabCase(archetype)) {
    output({
      success: false,
      error: `Archetype must be kebab-case: "${archetype}"`,
    });
    return;
  }

  // Read persona content from stdin
  let personaContent: string;
  try {
    personaContent = readFileSync(0, 'utf8');
  } catch (err) {
    output({
      success: false,
      error: 'Failed to read persona content from stdin',
    });
    return;
  }

  if (!personaContent.trim()) {
    output({
      success: false,
      error: 'No persona content provided on stdin',
    });
    return;
  }

  // Parse and validate frontmatter
  const frontmatter = parseFrontmatter(personaContent);

  if (!frontmatter.archetype) {
    output({
      success: false,
      error: 'Missing required frontmatter field: archetype',
    });
    return;
  }

  if (frontmatter.archetype !== archetype) {
    output({
      success: false,
      error: `Archetype mismatch: --archetype "${archetype}" but frontmatter says "${frontmatter.archetype}"`,
    });
    return;
  }

  if (!frontmatter.created) {
    output({
      success: false,
      error: 'Missing required frontmatter field: created',
    });
    return;
  }

  // Check for required sections
  const sectionErrors = checkRequiredSections(personaContent);
  if (sectionErrors.length > 0) {
    output({
      success: false,
      error: sectionErrors.join('; '),
    });
    return;
  }

  // Determine target directory
  const skillDirName = `assume-persona--${archetype}`;
  const baseDir = scope === 'local'
    ? join(process.cwd(), '.claude/skills')
    : join(homedir(), '.claude/skills');
  const skillDir = join(baseDir, skillDirName);

  // Create skill directory
  try {
    mkdirSync(skillDir, { recursive: true });
  } catch (err) {
    output({
      success: false,
      error: `Failed to create directory: ${skillDir}`,
    });
    return;
  }

  // Generate SKILL.md content
  const skillMdContent = generateSkillMd(archetype, description);

  // Write both files
  const personaPath = join(skillDir, 'persona.md');
  const skillPath = join(skillDir, 'SKILL.md');

  try {
    writeFileSync(personaPath, personaContent);
    writeFileSync(skillPath, skillMdContent);
  } catch (err) {
    output({
      success: false,
      error: `Failed to write files to ${skillDir}`,
    });
    return;
  }

  // Return success with relative path for local, absolute for user
  const displayPath = scope === 'local'
    ? `.claude/skills/${skillDirName}/`
    : `~/.claude/skills/${skillDirName}/`;

  output({
    success: true,
    path: displayPath,
  });
}

main();
