---
name: create-skill
description: Guide for creating effective skills. Use when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations. Skills follow the Agent Skills open standard (https://agentskills.io/specification).
---

# Create Skill

This skill provides guidance for creating effective skills.

## About Skills

Skills are modular packages that extend Claude's capabilities by providing specialized knowledge, workflows, and tools. They transform Claude from a general-purpose agent into a specialized one equipped with procedural knowledge.

Skills provide:
1. **Specialized workflows** - Multi-step procedures for specific domains
2. **Tool integrations** - Instructions for working with specific file formats or APIs
3. **Domain expertise** - Company-specific knowledge, schemas, business logic
4. **Bundled resources** - Scripts, references, and assets for complex and repetitive tasks

Skills follow the [Agent Skills open standard](https://agentskills.io/specification).

## Core Principles

### Concise is Key

The context window is a public good. Skills share it with system prompts, conversation history, other skills' metadata, and user requests.

**Default assumption: Claude is already very smart.** Only add context Claude doesn't already have. Challenge each piece of information: "Does Claude really need this?" and "Does this justify its token cost?"

Prefer concise examples over verbose explanations.

### Set Appropriate Degrees of Freedom

Match specificity to task fragility and variability:

- **High freedom (text-based instructions)**: Multiple approaches valid, decisions depend on context
- **Medium freedom (pseudocode or scripts with parameters)**: Preferred pattern exists, some variation acceptable
- **Low freedom (specific scripts, few parameters)**: Operations fragile, consistency critical

Think of Claude exploring a path: a narrow bridge needs specific guardrails (low freedom), while an open field allows many routes (high freedom).

### Anatomy of a Skill

Every skill consists of a required SKILL.md file and optional bundled resources:

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description - required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/     - Executable code
    ├── references/  - Documentation loaded into context as needed
    └── assets/      - Files used in output (templates, icons, fonts)
```

#### SKILL.md Frontmatter

The `name` and `description` fields are what Claude reads to determine when to use the skill. Be clear and comprehensive about what the skill does and when it should trigger.

#### Bundled Resources

- **scripts/**: Token-efficient executable code for deterministic or repetitive tasks
- **references/**: Documentation Claude references while working (schemas, API docs, policies)
- **assets/**: Files used in output but not loaded into context (templates, images, fonts)

### Progressive Disclosure

Keep SKILL.md under 500 lines. Split content into reference files when approaching this limit. Reference them clearly from SKILL.md with guidance on when to read them.

See `references/output-patterns.md` for template and example patterns.
See `references/workflows.md` for sequential and conditional workflow patterns.

## Skill Creation Process

1. **Discover intent** - Understand user's goals and constraints
2. **Gather concrete examples** - How will the skill be used?
3. **Plan reusable contents** - What scripts, references, assets are needed?
4. **Initialize the skill** - Run init-skill.ts
5. **Edit the skill** - Implement resources, write SKILL.md
6. **Package the skill** - Run package-skill.ts
7. **Iterate** - Refine based on real usage

### Step 0: Discover Intent

Before diving into examples, understand the user's high-level goals:

- What problem is this skill solving?
- Who will use it? (The user themselves? A team? Other Claude instances?)
- What constraints exist? (Technology stack, security requirements, integrations)
- What does success look like?

**Ask clarifying questions.** Propose alternatives if you see better approaches. Fill gaps in requirements rather than assuming. This upfront investment prevents misaligned skills.

### Step 1: Gather Concrete Examples

To create an effective skill, understand concrete examples of usage. Ask questions like:

- "What functionality should this skill support?"
- "Can you give examples of how this would be used?"
- "What would a user say that should trigger this skill?"

Avoid overwhelming users with too many questions at once. Start with the most important and follow up as needed.

### Step 2: Plan Reusable Contents

Analyze each example:
1. How would you execute this from scratch?
2. What scripts, references, or assets would help when repeating this?

Examples:
- PDF rotation → `scripts/rotate_pdf.py` to avoid rewriting code
- Frontend app → `assets/hello-world/` boilerplate template
- BigQuery queries → `references/schema.md` documenting table schemas

### Step 3: Initialize the Skill

Run the init script to create a template skill directory:

```bash
npx tsx scripts/init-skill.ts <skill-name> --path <output-directory>
```

The script creates:
- SKILL.md with proper frontmatter and TODO placeholders
- Example `scripts/`, `references/`, and `assets/` directories

Skip this step if iterating on an existing skill.

### Step 4: Edit the Skill

Remember: you're creating this for another Claude instance to use. Include information that would be beneficial and non-obvious.

#### Frontmatter

Write `name` and `description`:
- `name`: Hyphen-case skill name
- `description`: What it does AND when to use it. Include all trigger conditions here—the body is only loaded after triggering.

Example description:
> "Comprehensive document creation, editing, and analysis with tracked changes support. Use when Claude needs to work with .docx files for creating, modifying, or editing documents."

#### Body

Write instructions for using the skill and its bundled resources. Use imperative form.

#### Test Scripts

Run any added scripts to ensure they work correctly. Test at least a representative sample.

### Step 5: Package the Skill

Package into a distributable .skill file:

```bash
npx tsx scripts/package-skill.ts <path/to/skill-folder> [output-directory]
```

The script validates the skill first, then creates a .skill zip file.

### Step 6: Iterate

After testing with real tasks:
1. Notice struggles or inefficiencies
2. Identify needed updates to SKILL.md or resources
3. Implement changes and test again
