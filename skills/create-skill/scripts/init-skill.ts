#!/usr/bin/env npx tsx
/**
 * Skill Initializer - Creates a new skill from template
 *
 * Usage:
 *   npx tsx init-skill.ts <skill-name> --path <path>
 *
 * Examples:
 *   npx tsx init-skill.ts my-new-skill --path skills/public
 *   npx tsx init-skill.ts my-api-helper --path ./skills
 */

import * as fs from "fs";
import * as path from "path";

const SKILL_TEMPLATE = `---
name: {{SKILL_NAME}}
description: "[TODO: What does this skill do and when should it be used? Be specific about trigger conditions.]"
---

# {{SKILL_TITLE}}

## Overview

[TODO: 1-2 sentences explaining what this skill enables]

## Intent Discovery

Before implementing, clarify with the user:
- What problem is this solving?
- What does success look like?
- What constraints exist?

[TODO: Remove this section after understanding intent, or adapt it for skills that need to gather context from users]

## Workflow

[TODO: Define the main workflow. Choose a structure that fits:

**Workflow-Based** (sequential processes):
## Workflow → ## Step 1 → ## Step 2...

**Task-Based** (tool collections):
## Quick Start → ## Task 1 → ## Task 2...

**Reference/Guidelines** (standards):
## Guidelines → ## Specifications → ## Usage...

Delete this guidance when done.]

## Resources

[TODO: Document any scripts, references, or assets. Delete unused directories.]

### scripts/
Executable code for automation tasks.

### references/
Documentation loaded into context as needed.

### assets/
Files used in output (templates, images, fonts).
`;

const EXAMPLE_SCRIPT = `#!/usr/bin/env npx tsx
/**
 * Example helper script for {{SKILL_NAME}}
 *
 * Replace with actual implementation or delete if not needed.
 */

function main() {
  console.log("Example script for {{SKILL_NAME}}");
  // TODO: Add actual logic
}

main();
`;

const EXAMPLE_REFERENCE = `# Reference Documentation

[TODO: Add detailed reference material here, or delete this file if not needed.]

## When to Use Reference Files

- Comprehensive API documentation
- Detailed workflow guides
- Complex multi-step processes
- Content too lengthy for SKILL.md
- Information needed only for specific use cases
`;

const EXAMPLE_ASSET = `# Example Asset

This placeholder represents where asset files would be stored.
Replace with actual assets (templates, images, fonts) or delete if not needed.

Asset files are used in output, not loaded into context.
`;

function titleCase(skillName: string): string {
  return skillName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function initSkill(skillName: string, basePath: string): boolean {
  const skillDir = path.resolve(basePath, skillName);

  // Check if directory already exists
  if (fs.existsSync(skillDir)) {
    console.error(`Error: Skill directory already exists: ${skillDir}`);
    return false;
  }

  const skillTitle = titleCase(skillName);

  try {
    // Create skill directory
    fs.mkdirSync(skillDir, { recursive: true });
    console.log(`Created skill directory: ${skillDir}`);

    // Create SKILL.md
    const skillContent = SKILL_TEMPLATE.replace(/\{\{SKILL_NAME\}\}/g, skillName).replace(
      /\{\{SKILL_TITLE\}\}/g,
      skillTitle
    );
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillContent);
    console.log("Created SKILL.md");

    // Create scripts/ with example
    const scriptsDir = path.join(skillDir, "scripts");
    fs.mkdirSync(scriptsDir);
    const scriptContent = EXAMPLE_SCRIPT.replace(/\{\{SKILL_NAME\}\}/g, skillName);
    fs.writeFileSync(path.join(scriptsDir, "example.ts"), scriptContent);
    console.log("Created scripts/example.ts");

    // Create references/ with example
    const referencesDir = path.join(skillDir, "references");
    fs.mkdirSync(referencesDir);
    fs.writeFileSync(path.join(referencesDir, "api-reference.md"), EXAMPLE_REFERENCE);
    console.log("Created references/api-reference.md");

    // Create assets/ with example
    const assetsDir = path.join(skillDir, "assets");
    fs.mkdirSync(assetsDir);
    fs.writeFileSync(path.join(assetsDir, "example.txt"), EXAMPLE_ASSET);
    console.log("Created assets/example.txt");

    console.log(`\nSkill '${skillName}' initialized at ${skillDir}`);
    console.log("\nNext steps:");
    console.log("1. Edit SKILL.md to complete the TODO items");
    console.log("2. Customize or delete example files in scripts/, references/, assets/");
    console.log("3. Run validate-skill.ts to check the skill structure");

    return true;
  } catch (err) {
    console.error(`Error creating skill: ${err}`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 3 || args[1] !== "--path") {
    console.log("Usage: npx tsx init-skill.ts <skill-name> --path <path>");
    console.log("\nSkill name requirements:");
    console.log("  - Hyphen-case (e.g., 'data-analyzer')");
    console.log("  - Lowercase letters, digits, and hyphens only");
    console.log("  - Max 64 characters");
    console.log("\nExamples:");
    console.log("  npx tsx init-skill.ts my-new-skill --path skills/public");
    console.log("  npx tsx init-skill.ts my-api-helper --path ./skills");
    process.exit(1);
  }

  const skillName = args[0];
  const basePath = args[2];

  console.log(`Initializing skill: ${skillName}`);
  console.log(`Location: ${basePath}\n`);

  const success = initSkill(skillName, basePath);
  process.exit(success ? 0 : 1);
}

main();
