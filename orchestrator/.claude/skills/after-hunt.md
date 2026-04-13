---
description: >
  Post-hunt hook: automatically runs after
  a successful vulnerability discovery.
  Updates memory, creates/refines skills,
  updates target profile. This is the
  self-improvement feedback loop.
allowed_tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Agent
  - Bash(mkdir:*)
when_to_use: >
  Run automatically after finding a
  vulnerability. Trigger phrases:
  "found a bug", "vulnerability confirmed",
  "submit this finding", "write it up"
---

# After-Hunt — Self-Improvement Feedback Loop

This runs after every successful vulnerability
discovery. It implements the Hermes-style
4-stage learning loop:

```
Execute → Evaluate → Abstract → Refine
```

## Automatic Steps

### 1. Evaluate: What Happened?

Analyze the session:
- What vulnerability was found?
- What severity / CVSS?
- What technique led to discovery?
- How long did it take?
- Were there false leads?
- What agents were most useful?

### 2. Abstract: Extract the Pattern

Identify the reusable pattern:
- What code pattern was vulnerable?
- What search queries found it?
- What indicators signaled the vuln?
- What grep patterns were effective?

### 3. Update Memory (MEMORY.md)

Add to MEMORY.md:
```markdown
## Learned: [date]
- Target: [name]
- Vuln: [type] ([severity])
- Key pattern: [what to search for]
- Discovery method: [how it was found]
```

### 4. Update Target Profile (TARGETS.md)

Add the finding to the target's profile:
```markdown
| [date] | [vuln] | [severity] | reported | $0 |
```

### 5. Create/Refine Skill

Check if `.claude/skills/learned/hunt-[type].md`
exists:

**If NO** — Create new skill:
- Spawn a learn agent to capture the technique
- Save to `.claude/skills/learned/`

**If YES** — Refine existing skill:
- Add new patterns discovered
- Update success rate counter
- Add new false positive filters
- Update the changelog

### 6. Cross-Reference

Check if this technique could apply to
other targets in TARGETS.md:
- Similar tech stacks?
- Similar endpoints?
- Flag them for future testing

### 7. Summary

Report to user:
```markdown
## Post-Hunt Summary

### Finding Recorded
- [vuln type] in [target] — [severity]

### Skill Updated
- hunt-[type]: refined (now used N times)
- New patterns added: [list]

### Memory Updated
- MEMORY.md: +1 technique
- TARGETS.md: finding added

### Cross-References
- [target B] has similar patterns — test next?
- [target C] uses same framework — check too?
```
