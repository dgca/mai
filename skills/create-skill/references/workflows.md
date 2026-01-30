# Workflow Patterns

## Sequential Workflows

For complex tasks, break operations into clear, sequential steps. Give Claude an overview of the process:

```markdown
Filling a PDF form involves these steps:

1. Analyze the form (run analyze_form.py)
2. Create field mapping (edit fields.json)
3. Validate mapping (run validate_fields.py)
4. Fill the form (run fill_form.py)
5. Verify output (run verify_output.py)
```

## Conditional Workflows

For tasks with branching logic, guide Claude through decision points:

```markdown
1. Determine the modification type:
   **Creating new content?** → Follow "Creation workflow" below
   **Editing existing content?** → Follow "Editing workflow" below

2. Creation workflow: [steps]
3. Editing workflow: [steps]
```

## Decision Trees

For skills with multiple entry points, use a decision tree at the top:

```markdown
## Workflow Decision Tree

**What do you need to do?**

- Read/extract content → See "Reading Documents"
- Create new document → See "Creating Documents"
- Modify existing document → See "Editing Documents"
- Work with tracked changes → See "Tracked Changes"
```

This helps Claude quickly navigate to the relevant section.
