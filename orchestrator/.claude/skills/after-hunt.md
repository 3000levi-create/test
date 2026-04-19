---
description: >
  Post-hunt feedback loop. Runs after every
  hunt — successful or not. Updates memory,
  creates/refines skills, logs to TARGETS.md,
  cross-references other targets. The engine
  that makes the pipeline self-improving.
allowed_tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Agent
  - Bash(mkdir:*)
when_to_use: >
  Run after every hunt session. Triggers:
  "/after-hunt", "found a bug", "hunt
  complete", "vulnerability confirmed",
  "session done", "wrap up hunt"
---

# After-Hunt — Self-Improvement Feedback Loop

Runs after every hunt session. Implements
the 4-stage learning loop:

```
Execute → Evaluate → Abstract → Refine
```

## Step 1: Evaluate — What Happened?

Analyze the session. Read in parallel:
- Latest reports in `reports/[target]/`
- Verify logs (EXPLOITABLE / NOT / PARTIAL)
- TARGETS.md for prior context
- MEMORY.md for existing techniques

Extract:
- What vulnerability was found (or not)?
- What severity / CVSS?
- What technique led to discovery?
- How long did it take?
- Were there false leads?
- What agents were most useful?
- What bounty-verifier verdict?

**Success criteria**: Clear picture of
what happened this session.

## Step 2: Abstract — Extract the Pattern

For EXPLOITABLE findings:
```markdown
## Pattern: [name]
- Trigger: [what made this target vulnerable]
- Discovery: [step-by-step how found]
- Grep patterns: [concrete searches]
- Positive indicators: [signals]
- False positives: [what to skip]
- Working payload: [exact command]
```

For NOT_EXPLOITABLE findings:
```markdown
## False Positive: [name]
- What it looked like: [pattern]
- Why it wasn't exploitable: [defense]
- Defense: [WAF / encoding / framework]
- Skip condition: [when to skip in future]
```

**Success criteria**: Reusable pattern or
documented false positive.

## Step 3: Update Memory (MEMORY.md)

For successful hunts, append:
```markdown
### Learned: [date] — [vuln type]
- Target: [name]
- Vuln: [type] ([severity])
- Pattern: [key grep]
- Discovery: [how found]
- Verified: EXPLOITABLE
- Bounty: $X,XXX (if known)
- Skill: hunt-[type]
```

For failed hunts, append:
```markdown
### False Positive: [date] — [type]
- Target: [name]
- Pattern: [what looked like a vuln]
- Defense: [what stopped exploitation]
- Skip rule: [when to ignore in future]
```

Update stats:
```markdown
## Pipeline Stats
- Total hunts: N+1
- Total bounties: $X,XXX + new
- Exploitable rate: X% (recalculate)
- False positive rate: X% (recalculate)
- Last session: [date] on [target]
```

**Success criteria**: MEMORY.md reflects
this session's learnings.

## Step 4: Update Target (TARGETS.md)

Update the target's profile:

Findings table:
```markdown
| [date] | [type] | [severity] | [conf] | [status] | [bounty] |
```

Sessions table:
```markdown
| [date] | [focus area] | [result summary] |
```

Tested Areas:
- Check off any areas tested this session

Notes for Next Session:
- Unfinished threads
- Promising leads not yet verified
- Cross-references to investigate

**Success criteria**: Next session can
pick up where this one left off.

## Step 5: Create or Refine Skill

Check existing skills:
```bash
ls .claude/skills/learned/hunt-*.md
```

**If NO skill for this vuln class:**
- Spawn `/learn` to capture the technique
  via the 4-round interview
- Or create directly if pattern is simple

**If skill EXISTS:**
- Append new patterns to "Patterns That Work"
- Increment success counter (+1)
- Add changelog entry: `[date]: [what changed]`
- Append new false positives to filter list
- Update "last refined" / "last success" date

**For NOT_EXPLOITABLE:**
- Add to the relevant skill's false positive
  section with explanation
- This prevents future wasted time

**Success criteria**: Learned skill is
created or refined.

## Step 6: Cross-Reference

For each other target in TARGETS.md:
- Same tech stack? Flag for hunt-[type]
- Similar endpoints? Flag for testing
- Same framework version? Priority target

```markdown
### Cross-Reference Alert
[date]: hunt-[type] may apply to [target].
Evidence: same [framework/endpoint/pattern].
Priority: test on next session.
```

**Success criteria**: Connections between
targets identified.

## Step 7: Summary to User

```markdown
## Post-Hunt Summary

### Finding Recorded
- [vuln type] in [target] — [severity]
- Verdict: [EXPLOITABLE / NOT / PARTIAL]
- Bounty: $X,XXX (if known)

### Skill Update
- hunt-[type]: [created / refined]
  (now used N times, N finds)
- New patterns added: [list]

### Memory Updated
- MEMORY.md: +1 technique (total: N)
- TARGETS.md: finding + session logged
- Stats: exploitable rate now X%

### Cross-References
- [target B] — similar stack, test next?
- [target C] — same framework, check too?

### Pipeline Health
- Skills: N learned, N refined
- Total bounties: $X,XXX
- False positive rate: X% (↓ improving)
```

## Rules

- **Run after EVERY hunt** — even failed ones
  teach something
- **Never skip the false positive log** —
  it's how the pipeline stops chasing ghosts
- **Preserve history** — append, don't
  overwrite
- **Cross-reference always** — connections
  between targets multiply ROI
