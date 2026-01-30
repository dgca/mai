#!/usr/bin/env npx tsx
/**
 * Skill Packager - Creates a distributable .skill file
 *
 * Usage:
 *   npx tsx package-skill.ts <path/to/skill-folder> [output-directory]
 *
 * Examples:
 *   npx tsx package-skill.ts skills/my-skill
 *   npx tsx package-skill.ts skills/my-skill ./dist
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { validateSkill } from "./validate-skill.js";

function packageSkill(skillPath: string, outputDir?: string): string | null {
  const resolvedPath = path.resolve(skillPath);

  // Check skill folder exists
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Skill folder not found: ${resolvedPath}`);
    return null;
  }

  if (!fs.statSync(resolvedPath).isDirectory()) {
    console.error(`Error: Path is not a directory: ${resolvedPath}`);
    return null;
  }

  // Check SKILL.md exists
  const skillMdPath = path.join(resolvedPath, "SKILL.md");
  if (!fs.existsSync(skillMdPath)) {
    console.error(`Error: SKILL.md not found in ${resolvedPath}`);
    return null;
  }

  // Run validation
  console.log("Validating skill...");
  const validation = validateSkill(resolvedPath);
  if (!validation.valid) {
    console.error(`Validation failed: ${validation.message}`);
    console.error("Please fix the validation errors before packaging.");
    return null;
  }
  console.log(`${validation.message}\n`);

  // Determine output location
  const skillName = path.basename(resolvedPath);
  const outputPath = outputDir ? path.resolve(outputDir) : process.cwd();

  // Create output directory if needed
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  const skillFilename = path.join(outputPath, `${skillName}.skill`);

  try {
    // Use zip command to create the .skill file
    // The .skill file should contain the skill folder at the root
    const parentDir = path.dirname(resolvedPath);
    const folderName = path.basename(resolvedPath);

    execSync(`zip -r "${skillFilename}" "${folderName}"`, {
      cwd: parentDir,
      stdio: "pipe",
    });

    // List contents
    const output = execSync(`unzip -l "${skillFilename}"`, { encoding: "utf-8" });
    const files = output
      .split("\n")
      .filter((line) => line.includes(folderName))
      .map((line) => {
        const match = line.match(/\d+\s+[\d-]+\s+[\d:]+\s+(.+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    for (const file of files) {
      console.log(`  Added: ${file}`);
    }

    console.log(`\nSuccessfully packaged skill to: ${skillFilename}`);
    return skillFilename;
  } catch (err) {
    console.error(`Error creating .skill file: ${err}`);
    return null;
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log("Usage: npx tsx package-skill.ts <path/to/skill-folder> [output-directory]");
    console.log("\nExamples:");
    console.log("  npx tsx package-skill.ts skills/my-skill");
    console.log("  npx tsx package-skill.ts skills/my-skill ./dist");
    process.exit(1);
  }

  const skillPath = args[0];
  const outputDir = args[1];

  console.log(`Packaging skill: ${skillPath}`);
  if (outputDir) {
    console.log(`Output directory: ${outputDir}`);
  }
  console.log();

  const result = packageSkill(skillPath, outputDir);
  process.exit(result ? 0 : 1);
}

main();
