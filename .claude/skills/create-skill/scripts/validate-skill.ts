#!/usr/bin/env -S node --experimental-strip-types
/**
 * Skill Validator - Validates skill structure and frontmatter
 *
 * Usage:
 *   node --experimental-strip-types validate-skill.ts <path/to/skill-folder>
 *
 * Example:
 *   node --experimental-strip-types validate-skill.ts skills/my-skill
 */

import * as fs from "fs";
import * as path from "path";

interface ValidationResult {
  valid: boolean;
  message: string;
}

const ALLOWED_PROPERTIES = new Set(["name", "description", "license", "allowed-tools", "metadata"]);

export function validateSkill(skillPath: string): ValidationResult {
  const resolvedPath = path.resolve(skillPath);

  // Check SKILL.md exists
  const skillMdPath = path.join(resolvedPath, "SKILL.md");
  if (!fs.existsSync(skillMdPath)) {
    return { valid: false, message: "SKILL.md not found" };
  }

  const content = fs.readFileSync(skillMdPath, "utf-8");

  // Check frontmatter exists
  if (!content.startsWith("---")) {
    return { valid: false, message: "No YAML frontmatter found" };
  }

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { valid: false, message: "Invalid frontmatter format" };
  }

  const frontmatterText = frontmatterMatch[1];

  // Parse frontmatter using regex (simple approach, no yaml dependency)
  const frontmatter: Record<string, string> = {};
  const lines = frontmatterText.split("\n");

  let currentKey = "";
  let currentValue = "";
  let inMultiline = false;

  for (const line of lines) {
    // Check for new key
    const keyMatch = line.match(/^([a-z-]+):\s*(.*)$/);
    if (keyMatch && !inMultiline) {
      if (currentKey) {
        frontmatter[currentKey] = currentValue.trim();
      }
      currentKey = keyMatch[1];
      const value = keyMatch[2];

      // Check if starting multiline with quotes
      if (value.startsWith('"') && !value.endsWith('"')) {
        inMultiline = true;
        currentValue = value.slice(1);
      } else if (value.startsWith('"') && value.endsWith('"')) {
        currentValue = value.slice(1, -1);
      } else {
        currentValue = value;
      }
    } else if (inMultiline) {
      if (line.endsWith('"')) {
        currentValue += " " + line.slice(0, -1);
        inMultiline = false;
      } else {
        currentValue += " " + line;
      }
    }
  }

  // Don't forget the last key
  if (currentKey) {
    frontmatter[currentKey] = currentValue.trim();
  }

  // Check for unexpected properties
  const unexpectedKeys = Object.keys(frontmatter).filter((k) => !ALLOWED_PROPERTIES.has(k));
  if (unexpectedKeys.length > 0) {
    return {
      valid: false,
      message: `Unexpected key(s) in frontmatter: ${unexpectedKeys.join(", ")}. Allowed: ${Array.from(ALLOWED_PROPERTIES).join(", ")}`,
    };
  }

  // Check required fields
  if (!frontmatter.name) {
    return { valid: false, message: "Missing 'name' in frontmatter" };
  }
  if (!frontmatter.description) {
    return { valid: false, message: "Missing 'description' in frontmatter" };
  }

  const name = frontmatter.name;

  // Validate name format (hyphen-case)
  if (!/^[a-z0-9-]+$/.test(name)) {
    return {
      valid: false,
      message: `Name '${name}' should be hyphen-case (lowercase letters, digits, and hyphens only)`,
    };
  }

  if (name.startsWith("-") || name.endsWith("-") || name.includes("--")) {
    return {
      valid: false,
      message: `Name '${name}' cannot start/end with hyphen or contain consecutive hyphens`,
    };
  }

  // Check name length (max 64 characters per spec)
  if (name.length > 64) {
    return {
      valid: false,
      message: `Name is too long (${name.length} characters). Maximum is 64 characters.`,
    };
  }

  const description = frontmatter.description;

  // Check for angle brackets
  if (description.includes("<") || description.includes(">")) {
    return { valid: false, message: "Description cannot contain angle brackets (< or >)" };
  }

  // Check description length (max 1024 characters per spec)
  if (description.length > 1024) {
    return {
      valid: false,
      message: `Description is too long (${description.length} characters). Maximum is 1024 characters.`,
    };
  }

  // Check for TODO placeholders
  if (description.includes("[TODO")) {
    return { valid: false, message: "Description contains incomplete TODO placeholder" };
  }

  return { valid: true, message: "Skill is valid!" };
}

// Only run main if this is the entry point
const isMain = process.argv[1]?.includes("validate-skill");

if (isMain) {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.log("Usage: node --experimental-strip-types validate-skill.ts <skill-directory>");
    process.exit(1);
  }

  const skillPath = args[0];
  const result = validateSkill(skillPath);

  console.log(result.message);
  process.exit(result.valid ? 0 : 1);
}
