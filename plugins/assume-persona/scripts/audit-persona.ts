#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Quality check a persona and return structured report.
 *
 * Usage:
 *   audit-persona.ts <file> [--check-age]
 *
 * Output (JSON):
 * {
 *   "archetype": "typescript-fullstack",
 *   "location": "local",
 *   "age": {
 *     "created": "2024-01-15",
 *     "months": 3,
 *     "status": "fresh" | "aging" | "stale"
 *   },
 *   "frontmatter": {
 *     "archetype": { "present": true, "valid": true },
 *     "created": { "present": true, "valid": true },
 *     "category": { "present": true },
 *     "keywords": { "present": false }
 *   },
 *   "sections": {
 *     "roleDescription": { "present": true, "lineCount": 5 },
 *     "coreExpertise": { "present": true, "lineCount": 45 },
 *     ...
 *   },
 *   "quality": {
 *     "totalLines": 245,
 *     "lengthStatus": "good" | "short" | "long",
 *     "completeness": 0.83
 *   },
 *   "suggestions": [
 *     "Add ## Mental Models section",
 *     "Consider updating - persona is 8 months old"
 *   ]
 * }
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

interface AgeInfo {
  created: string;
  months: number;
  status: 'fresh' | 'aging' | 'stale';
}

interface FieldCheck {
  present: boolean;
  valid?: boolean;
  value?: string;
}

interface SectionCheck {
  present: boolean;
  lineCount: number;
}

interface QualityInfo {
  totalLines: number;
  lengthStatus: 'short' | 'good' | 'long';
  completeness: number;
}

interface AuditResult {
  archetype: string;
  location: 'local' | 'user' | 'file';
  age: AgeInfo;
  frontmatter: {
    archetype: FieldCheck;
    created: FieldCheck;
    category: FieldCheck;
    keywords: FieldCheck;
  };
  sections: {
    roleDescription: SectionCheck;
    coreExpertise: SectionCheck;
    mentalModels: SectionCheck;
    bestPractices: SectionCheck;
    pitfalls: SectionCheck;
    tools: SectionCheck;
  };
  quality: QualityInfo;
  suggestions: string[];
}

const PERSONA_SKILL_PREFIX = 'assume-persona--';
const LOCAL_SKILLS = join(process.cwd(), '.claude/skills');
const USER_SKILLS = join(homedir(), '.claude/skills');

function parseArgs(): { file: string; checkAge: boolean } | null {
  const args = process.argv.slice(2);
  let file = '';
  let checkAge = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check-age') {
      checkAge = true;
    } else if (!args[i].startsWith('--')) {
      file = args[i];
    }
  }

  if (!file) return null;
  return { file, checkAge };
}

function isKebabCase(str: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
}

function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function calculateAge(dateStr: string): { months: number; status: 'fresh' | 'aging' | 'stale' } {
  const created = new Date(dateStr);
  const now = new Date();
  const months = Math.floor((now.getTime() - created.getTime()) / (30 * 24 * 60 * 60 * 1000));

  let status: 'fresh' | 'aging' | 'stale';
  if (months < 3) {
    status = 'fresh';
  } else if (months < 6) {
    status = 'aging';
  } else {
    status = 'stale';
  }

  return { months, status };
}

function countSectionLines(content: string, sectionPattern: RegExp): number {
  const match = content.match(sectionPattern);
  if (!match) return 0;

  const startIndex = content.indexOf(match[0]) + match[0].length;
  const rest = content.substring(startIndex);

  // Find next section header
  const nextSection = rest.match(/\n##\s/);
  const sectionContent = nextSection
    ? rest.substring(0, nextSection.index)
    : rest;

  return sectionContent.trim().split('\n').length;
}

function determineLocation(filePath: string): 'local' | 'user' | 'file' {
  const absPath = filePath.startsWith('/') ? filePath : join(process.cwd(), filePath);

  if (absPath.startsWith(LOCAL_SKILLS)) {
    return 'local';
  } else if (absPath.startsWith(USER_SKILLS)) {
    return 'user';
  }
  return 'file';
}

function audit(content: string, filePath: string, checkAge: boolean): AuditResult {
  const suggestions: string[] = [];
  const lines = content.split('\n');
  const totalLines = lines.length;

  // Parse frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  const yaml = frontmatterMatch ? frontmatterMatch[1] : '';
  const body = frontmatterMatch ? content.substring(frontmatterMatch[0].length) : content;

  // Extract frontmatter fields
  const archetypeMatch = yaml.match(/^archetype:\s*(.+)$/m);
  const createdMatch = yaml.match(/^created:\s*(.+)$/m);
  const categoryMatch = yaml.match(/^category:\s*(.+)$/m);
  const keywordsMatch = yaml.match(/^keywords:\s*\n((?:\s+-\s+.+\n?)+)/m);

  const archetype = archetypeMatch ? archetypeMatch[1].trim() : '';
  const created = createdMatch ? createdMatch[1].trim() : '';

  // Frontmatter checks
  const frontmatterChecks = {
    archetype: {
      present: !!archetype,
      valid: archetype ? isKebabCase(archetype) : undefined,
      value: archetype || undefined,
    },
    created: {
      present: !!created,
      valid: created ? isValidDate(created) : undefined,
      value: created || undefined,
    },
    category: {
      present: !!categoryMatch,
      value: categoryMatch ? categoryMatch[1].trim() : undefined,
    },
    keywords: {
      present: !!keywordsMatch,
    },
  };

  if (!frontmatterChecks.archetype.present) {
    suggestions.push('Add archetype field to frontmatter');
  } else if (!frontmatterChecks.archetype.valid) {
    suggestions.push('Convert archetype to kebab-case');
  }

  if (!frontmatterChecks.created.present) {
    suggestions.push('Add created date to frontmatter (YYYY-MM-DD)');
  } else if (!frontmatterChecks.created.valid) {
    suggestions.push('Fix created date format (expected YYYY-MM-DD)');
  }

  if (!frontmatterChecks.category.present) {
    suggestions.push('Consider adding category field');
  }

  if (!frontmatterChecks.keywords.present) {
    suggestions.push('Consider adding keywords for better discoverability');
  }

  // Age calculation
  let ageInfo: AgeInfo;
  if (created && isValidDate(created)) {
    const { months, status } = calculateAge(created);
    ageInfo = { created, months, status };

    if (checkAge && status === 'stale') {
      suggestions.push(`Consider updating - persona is ${months} months old`);
    } else if (checkAge && status === 'aging') {
      suggestions.push(`Persona is ${months} months old - may need review soon`);
    }
  } else {
    ageInfo = { created: 'unknown', months: 0, status: 'fresh' };
  }

  // Section checks
  const hasRoleDescription = body.includes('You are') ||
    content.match(/^#[^#].*\n+You are/m) !== null;

  const hasCoreExpertise = /##\s*core\s+expertise/i.test(content);
  const hasMentalModels = /##\s*mental\s+models/i.test(content);
  const hasBestPractices = /##\s*best\s+practices/i.test(content);
  const hasPitfalls = /##\s*(pitfalls|pitfalls\s+to\s+avoid)/i.test(content);
  const hasTools = /##\s*(tools|tools\s*(&|and)\s*technologies)/i.test(content);

  const sectionChecks = {
    roleDescription: {
      present: hasRoleDescription,
      lineCount: hasRoleDescription ? 3 : 0, // Estimate for role description
    },
    coreExpertise: {
      present: hasCoreExpertise,
      lineCount: countSectionLines(content, /##\s*core\s+expertise/i),
    },
    mentalModels: {
      present: hasMentalModels,
      lineCount: countSectionLines(content, /##\s*mental\s+models/i),
    },
    bestPractices: {
      present: hasBestPractices,
      lineCount: countSectionLines(content, /##\s*best\s+practices/i),
    },
    pitfalls: {
      present: hasPitfalls,
      lineCount: countSectionLines(content, /##\s*(pitfalls|pitfalls\s+to\s+avoid)/i),
    },
    tools: {
      present: hasTools,
      lineCount: countSectionLines(content, /##\s*(tools|tools\s*(&|and)\s*technologies)/i),
    },
  };

  // Add suggestions for missing sections
  if (!sectionChecks.roleDescription.present) {
    suggestions.push('Add role description (paragraph with "You are")');
  }
  if (!sectionChecks.coreExpertise.present) {
    suggestions.push('Add ## Core Expertise section');
  }
  if (!sectionChecks.mentalModels.present) {
    suggestions.push('Add ## Mental Models section');
  }
  if (!sectionChecks.bestPractices.present) {
    suggestions.push('Add ## Best Practices section');
  }
  if (!sectionChecks.pitfalls.present) {
    suggestions.push('Add ## Pitfalls section');
  }
  if (!sectionChecks.tools.present) {
    suggestions.push('Add ## Tools section');
  }

  // Quality metrics
  const presentSections = Object.values(sectionChecks).filter(s => s.present).length;
  const totalSections = Object.keys(sectionChecks).length;
  const completeness = presentSections / totalSections;

  let lengthStatus: 'short' | 'good' | 'long';
  if (totalLines < 100) {
    lengthStatus = 'short';
    suggestions.push(`Persona is short (${totalLines} lines) - consider adding more detail`);
  } else if (totalLines > 500) {
    lengthStatus = 'long';
    suggestions.push(`Persona is long (${totalLines} lines) - consider condensing`);
  } else {
    lengthStatus = 'good';
  }

  return {
    archetype: archetype || 'unknown',
    location: determineLocation(filePath),
    age: ageInfo,
    frontmatter: frontmatterChecks,
    sections: sectionChecks,
    quality: {
      totalLines,
      lengthStatus,
      completeness: Math.round(completeness * 100) / 100,
    },
    suggestions,
  };
}

function main(): void {
  const args = parseArgs();

  if (!args) {
    console.error('Usage: audit-persona.ts <file> [--check-age]');
    process.exit(1);
  }

  const { file, checkAge } = args;

  if (!existsSync(file)) {
    console.log(JSON.stringify({
      error: `File not found: ${file}`,
    }, null, 2));
    process.exit(1);
  }

  const content = readFileSync(file, 'utf8');
  const result = audit(content, file, checkAge);

  console.log(JSON.stringify(result, null, 2));
}

main();
