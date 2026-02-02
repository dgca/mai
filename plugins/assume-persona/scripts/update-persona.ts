#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Update persona.md and/or SKILL.md content.
 *
 * Usage:
 *   update-persona.ts --archetype <name> --scope <local|user> [--update-date] [--description <desc>]
 *   Reads new persona.md content from stdin
 *
 * Options:
 *   --archetype <name>    The persona archetype name
 *   --scope <local|user>  Target scope
 *   --update-date         Update the created date in frontmatter to today
 *   --description <desc>  Optional new description for SKILL.md
 *
 * Output (JSON):
 *   { "success": true, "path": ".claude/skills/assume-persona--foo/" }
 *   { "success": false, "error": "Persona not found" }
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface UpdateResult {
  success: boolean;
  path?: string;
  error?: string;
  updatedDate?: boolean;
  updatedDescription?: boolean;
}

const PERSONA_SKILL_PREFIX = 'assume-persona--';
const LOCAL_SKILLS = join(process.cwd(), '.claude/skills');
const USER_SKILLS = join(homedir(), '.claude/skills');

function parseArgs(): {
  archetype: string | null;
  scope: 'local' | 'user' | null;
  updateDate: boolean;
  description: string | null;
} {
  const args = process.argv.slice(2);
  let archetype: string | null = null;
  let scope: 'local' | 'user' | null = null;
  let updateDate = false;
  let description: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--archetype' && args[i + 1]) {
      archetype = args[++i];
    } else if (args[i] === '--scope' && args[i + 1]) {
      const s = args[++i];
      if (s === 'local' || s === 'user') {
        scope = s;
      }
    } else if (args[i] === '--update-date') {
      updateDate = true;
    } else if (args[i] === '--description' && args[i + 1]) {
      description = args[++i];
    }
  }

  return { archetype, scope, updateDate, description };
}

function readStdin(): string {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function updateCreatedDate(content: string): string {
  const today = new Date().toISOString().split('T')[0];

  // Check if frontmatter exists
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    // No frontmatter, add one with created date
    return `---\ncreated: ${today}\n---\n\n${content}`;
  }

  const yaml = frontmatterMatch[1];
  const rest = content.substring(frontmatterMatch[0].length);

  // Update or add created date
  if (/^created:\s*.+$/m.test(yaml)) {
    const newYaml = yaml.replace(/^created:\s*.+$/m, `created: ${today}`);
    return `---\n${newYaml}\n---\n${rest}`;
  } else {
    return `---\n${yaml}\ncreated: ${today}\n---\n${rest}`;
  }
}

function main(): void {
  const { archetype, scope, updateDate, description } = parseArgs();

  if (!archetype || !scope) {
    console.error('Usage: update-persona.ts --archetype <name> --scope <local|user> [--update-date] [--description <desc>]');
    console.error('       Reads new persona.md content from stdin');
    process.exit(1);
  }

  const skillDirName = `${PERSONA_SKILL_PREFIX}${archetype}`;
  const baseDir = scope === 'local' ? LOCAL_SKILLS : USER_SKILLS;
  const skillDir = join(baseDir, skillDirName);
  const personaPath = join(skillDir, 'persona.md');
  const skillPath = join(skillDir, 'SKILL.md');

  // Check if persona exists
  if (!existsSync(personaPath)) {
    const result: UpdateResult = {
      success: false,
      error: `Persona '${archetype}' not found at ${scope} scope`,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  // Read new content from stdin
  let newContent = readStdin();
  if (!newContent.trim()) {
    const result: UpdateResult = {
      success: false,
      error: 'No content provided on stdin',
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  // Update created date if requested
  let updatedDate = false;
  if (updateDate) {
    newContent = updateCreatedDate(newContent);
    updatedDate = true;
  }

  // Write updated persona.md
  try {
    writeFileSync(personaPath, newContent);
  } catch (err) {
    const result: UpdateResult = {
      success: false,
      error: `Failed to write persona.md: ${err}`,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  // Update SKILL.md description if provided
  let updatedDescription = false;
  if (description && existsSync(skillPath)) {
    try {
      let skillContent = readFileSync(skillPath, 'utf8');

      // Update description in frontmatter
      const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---\n/);
      if (frontmatterMatch) {
        const yaml = frontmatterMatch[1];
        const rest = skillContent.substring(frontmatterMatch[0].length);

        if (/^description:\s*.+$/m.test(yaml)) {
          const newYaml = yaml.replace(/^description:\s*.+$/m, `description: ${description}`);
          skillContent = `---\n${newYaml}\n---\n${rest}`;
        } else {
          skillContent = `---\ndescription: ${description}\n${yaml}\n---\n${rest}`;
        }

        writeFileSync(skillPath, skillContent);
        updatedDescription = true;
      }
    } catch {
      // Non-fatal, continue
    }
  }

  const displayPath = scope === 'local'
    ? `.claude/skills/${skillDirName}/`
    : `~/.claude/skills/${skillDirName}/`;

  const result: UpdateResult = {
    success: true,
    path: displayPath,
    updatedDate,
    updatedDescription,
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
