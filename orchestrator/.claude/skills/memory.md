---
description: >
  Persistent memory manager for bug bounty work.
  Maintains MEMORY.md (targets, findings,
  techniques) and TARGETS.md (target profiles).
  Similar to Hermes Agent's multi-level memory.
allowed_tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

# Memory — Persistent Bug Bounty Knowledge

Manages persistent memory across sessions,
inspired by Hermes Agent's memory architecture.

## Memory Architecture

Three memory files, injected at session start:

### 1. MEMORY.md — Global Knowledge
```
orchestrator/MEMORY.md
```
Contains:
- Techniques that work across all targets
- Common vulnerability patterns
- Tools and commands reference
- Lessons learned from past hunts

### 2. TARGETS.md — Target Profiles
```
orchestrator/TARGETS.md
```
Contains:
- Per-target attack surface maps
- Technologies discovered
- Vulnerabilities found (and status)
- Bounty payments received
- Notes for next session

### 3. CLAUDE.md — Session Instructions
```
orchestrator/CLAUDE.md
```
Contains:
- Pipeline instructions
- Agent configurations
- Workflow preferences

## Your Task

### On /memory review

Read all three files and report:

```markdown
# Memory Status

## Global Knowledge (MEMORY.md)
- Techniques stored: N
- Last updated: [date]

## Target Profiles (TARGETS.md)
- Targets tracked: N
- Active programs: N
- Total findings: N
- Total bounties: $X,XXX

## Session Instructions (CLAUDE.md)
- Agents configured: N
- Skills available: N

## Suggestions
- [things to add/update/clean up]
```

### On /memory update

After each session, update memory:

1. **MEMORY.md** — Add any new techniques,
   patterns, or lessons learned
2. **TARGETS.md** — Update target profile
   with new findings, endpoints, or status
3. Remove outdated or duplicate entries
4. Cross-reference: if a technique worked
   on target A, note it might work on
   similar targets

### On /memory target [name]

Create or update a target profile:

```markdown
## [Target Name]

### Program
- Platform: HackerOne/Bugcrowd
- URL: [program URL]
- Scope: [in-scope domains]
- Out of scope: [excluded areas]
- Bounty range: $XXX - $XX,XXX

### Attack Surface
- Subdomains: [list]
- Tech stack: [list]
- Key endpoints: [list]
- Auth mechanism: [description]

### Findings
| Date | Vuln | Severity | Status | Bounty |
|------|------|----------|--------|--------|
| [date] | [type] | [sev] | [status] | [$] |

### Notes
- [observations for next session]
- [areas not yet tested]
- [suspicious patterns to investigate]

### Last Session: [date]
```

### On /memory search [query]

Search across all memory files and past
reports for relevant information:

```bash
# Search memory files
grep -rn "[query]" MEMORY.md TARGETS.md CLAUDE.md

# Search past reports
grep -rn "[query]" reports/
```

Report all matches with context.
