---
description: >
  Capture a bug hunting technique as a reusable,
  self-improving skill. Uses Claude Code's
  skillify 4-round interview to build high-
  quality skills with success criteria on
  every step.
allowed_tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
  - Bash(mkdir:*)
when_to_use: >
  After a successful bug hunt, or when you
  want to codify a technique you've just
  learned. Triggers: "/learn", "capture this
  as a skill", "make this reusable"
---

# Learn — Capture Hunt as Self-Improving Skill

You are capturing this session's bug hunting
technique as a reusable skill that gets better
over time.

## Session Context

<session_memory>
Review the current conversation. Extract:
- What vulnerability was found
- How it was found (step-by-step)
- What grep patterns / tools worked
- What false positives wasted time
- Where you corrected course mid-hunt
</session_memory>

## Your Task

### Step 1: Analyze the Hunt

Before asking any questions, analyze the session
to identify:
- The vulnerability type (specific CWE)
- The target tech stack (framework, lang)
- The discovery path (step by step)
- The success artifacts (what proved the vuln)
- Where you corrected course (false starts)
- What tools / agents were essential
- What false positives you filtered

**Success criteria**: You have a clear picture
of what made THIS hunt succeed.

### Step 2: Interview the User

Use AskUserQuestion for ALL clarifications.
Never ask via plain text. Iterate until the
user is happy. Each round's "Other" option
lets them steer.

#### Round 1: Skill Identity
- Suggest a skill name (e.g., `hunt-race-idor`,
  `hunt-jwt-none`, `hunt-ssrf-pdf`)
- Suggest a one-line description
- Ask user to confirm or rename
- Confirm trigger phrases that should invoke it

**Success criteria**: Name + description +
trigger phrases locked in.

#### Round 2: Technique Structure
- Present the discovery steps as a numbered list
- Confirm: does this skill need arguments?
  (e.g., target URL, source directory)
- Confirm: should it run inline or forked?
  (Forked = self-contained; inline = steer
  mid-hunt)
- Confirm save location:
  - Learned skill (`.claude/skills/learned/`)
  - Personal (`~/.claude/skills/`)

**Success criteria**: Structure approved.

#### Round 3: Per-Step Detail
For each step, if not glaringly obvious, ask:
- What does this step produce that later
  steps need? (endpoint, token, payload)
- What proves this step succeeded?
- Human checkpoint needed before continuing?
  (e.g., before sending invasive payload)
- Can any sub-steps run in parallel?
  (e.g., probing multiple endpoints)
- Hard rules / must-never-happens?

Iterate per step as needed. Don't over-ask
for simple techniques.

**Success criteria**: Every step has a
success criteria and clear what-to-do.

#### Round 4: Gotchas
- When exactly should this skill auto-invoke?
- Known false positives for this technique?
- Authorized-scope boundaries?
- Any payload safety rails?

**Success criteria**: Edge cases captured.

### Step 3: Check for Existing Skill

Before writing, search:
```bash
ls .claude/skills/learned/
grep -l "[vuln-type]" .claude/skills/learned/*.md
```

**If exists**: Refine the existing skill:
- Merge new patterns into existing sections
- Update success rate counter (+1)
- Add to changelog with today's date
- Add new false positives to filter list
- Add the current target to "Patterns That Work"

**If new**: Create fresh skill.

**Success criteria**: No duplicate skills created.

### Step 4: Write the SKILL.md

Save to the location chosen in Round 2.

Use this format:

```markdown
---
name: hunt-[vuln-type]
description: >
  [one-line description]. Refined N times.
  Last success: [date].
allowed_tools:
  - [minimum tools needed, specific patterns
    like Bash(curl:*) not just Bash]
when_to_use: >
  [Detailed auto-invoke conditions with
  trigger phrases and example messages]
argument-hint: "[if parameterized]"
---

# Hunt: [Vulnerability Type]

## Success Rate
- Times used: N
- Vulns found: N
- Last refined: [date]
- Avg severity: [Critical/High/Medium]
- Avg bounty: $X,XXX

## Goal
[One sentence: what this skill finds]

## Technique

### Step 1: [Name]
[Actionable instructions + grep patterns]

**Success criteria**: [How to know this step
is done — REQUIRED]

**Artifacts**: [What it produces for later
steps — if any]

### Step 2: ...

## Patterns That Work

| Pattern | Context | Confidence |
|---------|---------|------------|

## False Positive Filters
[Patterns that look like this vuln but aren't]

## Safety Rails
- Authorized scope only
- No destructive payloads
- [Specific to this vuln class]

## Changelog
- [date]: Created from [target] session
- [date]: Added [pattern] from [target2]
```

**Per-step annotation rules**:
- **Success criteria**: REQUIRED on every step
- **Execution**: `Direct` (default), `Task agent`,
  `Teammate`, or `[human]`
- **Artifacts**: Only if later steps depend
- **Human checkpoint**: For invasive probes
- **Rules**: Hard constraints

### Step 5: Confirm and Save

Before writing, output the complete SKILL.md
as a YAML code block. Ask user to confirm
via AskUserQuestion: "Does this SKILL.md
look good to save?"

After writing:
- State the save path
- State the invocation: `/hunt-[type]` or
  natural-language trigger
- State how to edit it directly for refinement

### Step 6: Update Memory

1. Append to MEMORY.md under Techniques Library:
```markdown
### Learned: [date] — [vuln type]
- Pattern: [key grep pattern]
- Target type: [tech stack]
- Severity range: [Medium-Critical]
- Skill: hunt-[type]
- Bounty: $X,XXX (if known)
```

2. Update stats in MEMORY.md:
```
- Skills learned: N+1
- Skill list: [append new one]
```

**Success criteria**: Memory reflects the
new skill; future sessions will find it.

---

## Quality Bar (Non-Negotiable)

A good learned skill has:
- ✓ **Specific grep patterns** (not "look for X")
- ✓ **Success criteria on every step**
- ✓ **False positive filter section**
- ✓ **Success counter + changelog**
- ✓ **Evidence-based** (real examples)
- ✓ **Auto-invocable** (clear triggers)

A bad learned skill has:
- ✗ Vague instructions
- ✗ No concrete patterns
- ✗ No false positive section
- ✗ No changelog (hasn't been refined)

Don't write bad skills. Kill them in review.
