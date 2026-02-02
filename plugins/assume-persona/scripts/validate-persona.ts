#!/usr/bin/env -S node --experimental-strip-types --no-warnings

/**
 * Validate persona.md structure and return machine-readable report.
 *
 * Usage:
 *   validate-persona.ts <file>           # Validate file
 *   validate-persona.ts --stdin          # Validate content from stdin
 *
 * Output (JSON):
 * {
 *   "valid": true/false,
 *   "frontmatter": { "archetype": "...", "category": "...", "created": "..." },
 *   "sections": { "roleDescription": true, "coreExpertise": false, ... },
 *   "errors": ["Missing ## Core Expertise section"],
 *   "warnings": ["Description exceeds recommended length"]
 * }
 */

import { readFileSync, existsSync } from 'fs';

interface Frontmatter {
  archetype?: string;
  created?: string;
  category?: string;
  keywords?: string[];
  [key: string]: unknown;
}

interface SectionChecks {
  roleDescription: boolean;
  coreExpertise: boolean;
  mentalModels: boolean;
  bestPractices: boolean;
  pitfalls: boolean;
  tools: boolean;
}

interface ValidationResult {
  valid: boolean;
  frontmatter: Frontmatter;
  sections: SectionChecks;
  lineCount: number;
  errors: string[];
  warnings: string[];
}

function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content };
  }

  const yamlContent = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  // Simple YAML parser for our known fields
  const frontmatter: Frontmatter = {};

  // Parse archetype
  const archetypeMatch = yamlContent.match(/^archetype:\s*(.+)$/m);
  if (archetypeMatch) {
    frontmatter.archetype = archetypeMatch[1].trim();
  }

  // Parse created
  const createdMatch = yamlContent.match(/^created:\s*(.+)$/m);
  if (createdMatch) {
    frontmatter.created = createdMatch[1].trim();
  }

  // Parse category
  const categoryMatch = yamlContent.match(/^category:\s*(.+)$/m);
  if (categoryMatch) {
    frontmatter.category = categoryMatch[1].trim();
  }

  // Parse keywords (array)
  const keywordsMatch = yamlContent.match(/^keywords:\s*\n((?:\s+-\s+.+\n?)+)/m);
  if (keywordsMatch) {
    const keywordLines = keywordsMatch[1].match(/^\s+-\s+(.+)$/gm);
    if (keywordLines) {
      frontmatter.keywords = keywordLines.map(line => line.replace(/^\s+-\s+/, '').trim());
    }
  }

  return { frontmatter, body };
}

function isKebabCase(str: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(str);
}

function isValidDate(dateStr: string): boolean {
  // Check YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function checkSections(body: string): SectionChecks {
  const lowerBody = body.toLowerCase();

  // Role description: First paragraph after frontmatter should start with "You are"
  const firstParagraph = body.trim().split(/\n\n/)[0] || '';
  const hasRoleDescription = firstParagraph.includes('You are') ||
    body.includes('\nYou are') ||
    body.match(/^#[^#].*\n+You are/m) !== null;

  // Check for required section headings (case-insensitive)
  const hasCoreExpertise = /##\s*core\s+expertise/i.test(body);
  const hasMentalModels = /##\s*mental\s+models/i.test(body);
  const hasBestPractices = /##\s*best\s+practices/i.test(body);
  const hasPitfalls = /##\s*(pitfalls|pitfalls\s+to\s+avoid)/i.test(body);
  const hasTools = /##\s*(tools|tools\s*(&|and)\s*technologies)/i.test(body);

  return {
    roleDescription: hasRoleDescription,
    coreExpertise: hasCoreExpertise,
    mentalModels: hasMentalModels,
    bestPractices: hasBestPractices,
    pitfalls: hasPitfalls,
    tools: hasTools,
  };
}

function validate(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { frontmatter, body } = parseFrontmatter(content);
  const sections = checkSections(body);
  const lineCount = content.split('\n').length;

  // Frontmatter validation
  if (!content.startsWith('---\n')) {
    errors.push('Missing YAML frontmatter');
  }

  // Required: archetype
  if (!frontmatter.archetype) {
    errors.push('Missing required frontmatter field: archetype');
  } else if (!isKebabCase(frontmatter.archetype)) {
    errors.push(`Archetype must be kebab-case: "${frontmatter.archetype}"`);
  }

  // Required: created
  if (!frontmatter.created) {
    errors.push('Missing required frontmatter field: created');
  } else if (!isValidDate(frontmatter.created)) {
    errors.push(`Invalid date format for created (expected YYYY-MM-DD): "${frontmatter.created}"`);
  }

  // Optional but recommended
  if (!frontmatter.category) {
    warnings.push('Missing optional frontmatter field: category');
  }
  if (!frontmatter.keywords || frontmatter.keywords.length === 0) {
    warnings.push('Missing optional frontmatter field: keywords');
  }

  // Section validation
  if (!sections.roleDescription) {
    errors.push('Missing role description (paragraph starting with "You are")');
  }
  if (!sections.coreExpertise) {
    errors.push('Missing required section: ## Core Expertise');
  }
  if (!sections.mentalModels) {
    errors.push('Missing required section: ## Mental Models');
  }
  if (!sections.bestPractices) {
    errors.push('Missing required section: ## Best Practices');
  }
  if (!sections.pitfalls) {
    errors.push('Missing required section: ## Pitfalls (or ## Pitfalls to Avoid)');
  }
  if (!sections.tools) {
    errors.push('Missing required section: ## Tools (or ## Tools & Technologies)');
  }

  // Length checks
  if (lineCount < 100) {
    warnings.push(`Persona is short (${lineCount} lines, recommended: 100-500)`);
  } else if (lineCount > 500) {
    warnings.push(`Persona is long (${lineCount} lines, recommended: 100-500)`);
  }

  return {
    valid: errors.length === 0,
    frontmatter,
    sections,
    lineCount,
    errors,
    warnings,
  };
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: validate-persona.ts <file> | --stdin');
    process.exit(1);
  }

  let content: string;

  if (args[0] === '--stdin') {
    content = readFileSync(0, 'utf8'); // Read from stdin
  } else {
    const filePath = args[0];
    if (!existsSync(filePath)) {
      console.log(JSON.stringify({
        valid: false,
        frontmatter: {},
        sections: {
          roleDescription: false,
          coreExpertise: false,
          mentalModels: false,
          bestPractices: false,
          pitfalls: false,
          tools: false,
        },
        lineCount: 0,
        errors: [`File not found: ${filePath}`],
        warnings: [],
      }, null, 2));
      process.exit(0);
    }
    content = readFileSync(filePath, 'utf8');
  }

  const result = validate(content);
  console.log(JSON.stringify(result, null, 2));
}

main();
