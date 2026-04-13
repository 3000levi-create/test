---
description: >
  After a successful bug hunt, captures the
  technique as a reusable skill. Self-improving:
  learns from each session what worked and
  creates/updates skills automatically.
  Similar to Hermes Agent's skill learning loop.
allowed_tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
  - Bash(mkdir:*)
---

# Learn — Self-Improving Skill Creation

You are capturing a successful bug hunting
technique as a reusable, self-improving skill.

This implements the Hermes-style learning loop:
1. Execute task → 2. Evaluate outcome →
3. Abstract into skill → 4. Refine on reuse

## Session Context

<session_memory>
Review the current conversation to understand
what vulnerability was found, how it was found,
and what techniques were used.
</session_memory>

## Your Task

### Step 1: Analyze What Worked

Review the session and extract:
- **Vulnerability type** found (SQLi, XSS, etc.)
- **Discovery technique** (what searches, what
  patterns, what tools)
- **Key indicators** that led to the finding
- **False positives** encountered and how they
  were filtered
- **Time to discovery** (was it fast or slow?)
- **What could be improved** next time

### Step 2: Check Existing Skills

Search for existing skills that cover this
technique:

```
.claude/skills/learned/
```

If a skill already exists for this vuln type:
- **Update it** with new patterns found
- **Add the new indicators** to its checklist
- **Record the refinement** in the skill's
  changelog section
- This is the **self-improvement loop** —
  each use makes the skill better

### Step 3: Create or Update the Skill

Write to `.claude/skills/learned/[technique].md`:

```markdown
---
name: hunt-[vuln-type]
description: >
  Learned technique for finding [vuln type].
  Refined N times. Last success: [date].
allowed_tools:
  - Agent
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
  - WebSearch
when_to_use: >
  Use when looking for [vuln type]
  vulnerabilities. Trigger: "hunt for [type]",
  "check for [type]", "find [type]"
---

# Hunt: [Vulnerability Type]

## Success Rate
- Times used: N
- Vulns found: N
- Last refined: [date]
- Avg severity: [Medium/High/Critical]

## Technique

### Step 1: Initial Indicators
Look for these patterns that indicate
this vuln type might exist:
- [indicator 1 learned from experience]
- [indicator 2]
- [indicator 3]

### Step 2: Confirmation
Run these checks to confirm:
- [check 1]
- [check 2]

### Step 3: Deep Analysis
If confirmed, analyze:
- [analysis step 1]
- [analysis step 2]

### Step 4: PoC Approach
[How to demonstrate this vuln safely]

## Patterns That Work
[Specific grep patterns, code patterns,
URL patterns that successfully found this
vuln type in the past]

## False Positive Filters
[Patterns that look like this vuln but
aren't — skip these to save time]

## Changelog
- [date]: Created from [target] session
- [date]: Added [new pattern] from [target]
- [date]: Refined false positive filter
```

### Step 4: Update Memory

Add to CLAUDE.md under a "## Learned
Techniques" section:
- The vuln type and technique name
- How many times it's been refined
- When it was last successful

### Step 5: Confirm with User

Show the user:
1. What skill was created/updated
2. What patterns were captured
3. How to invoke it: `/hunt-[type]`
4. Suggest what to learn next
