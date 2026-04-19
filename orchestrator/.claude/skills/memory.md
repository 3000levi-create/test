---
description: >
  Review and manage persistent bug bounty
  memory across MEMORY.md, TARGETS.md, and
  learned skills. Detects duplicates,
  conflicts, and outdated entries. Ported
  from Claude Code's /remember skill.
allowed_tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
when_to_use: >
  Review, organize, or clean up memory.
  Triggers: "/memory", "review memory",
  "clean up memory", "memory status",
  "/memory target [name]",
  "/memory search [query]"
---

# Memory — Persistent Knowledge Manager

## Goal

Review the user's memory landscape and produce
a clear report of proposed changes, grouped
by action type. Do NOT apply changes without
approval — present proposals first.

## Memory Architecture

Four layers of persistent knowledge:

| Layer | File | Purpose |
|-------|------|---------|
| Global techniques | MEMORY.md | Patterns, stats, tools |
| Target profiles | TARGETS.md | Per-target findings |
| Learned skills | `.claude/skills/learned/` | Auto-invocable techniques |
| Pipeline config | CLAUDE.md | Instructions (manual) |

---

## Modes

### Mode 1: `/memory` (Review + Cleanup)

Do a full memory audit:

#### Step 1. Gather all layers

Read in parallel:
- MEMORY.md
- TARGETS.md
- All `.claude/skills/learned/*.md`

**Success criteria**: You have contents of
all layers and can compare them.

#### Step 2. Classify each entry

For each substantive entry in MEMORY.md:

| Destination | What belongs there |
|-------------|-------------------|
| **MEMORY.md** | Techniques that apply across targets |
| **TARGETS.md** | Per-target findings & attack surface |
| **Learned skill** | Repeatable pattern worth its own skill |
| **CLAUDE.md** | Pipeline config (rarely updated) |
| **Stay put** | Still fits here |

**Important**: Workflow preferences (auth
approach, payload choices) are ambiguous —
ask the user.

**Success criteria**: Each entry has a
proposed destination or is flagged ambiguous.

#### Step 3. Identify cleanup opportunities

Scan across layers for:

- **Duplicates**: Same pattern in MEMORY.md
  AND a learned skill → propose removing
  from MEMORY.md (skills are more valuable)
- **Outdated**: MEMORY.md entry contradicted
  by newer learned skill changelog
- **Conflicts**: Two skills cover the same
  vuln type → propose merge
- **Dead skills**: `hunt-*.md` with 0 success
  in 90+ days → propose archiving

**Success criteria**: All cross-layer issues
identified.

#### Step 4. Present the report

Group by action type:

```markdown
# Memory Status Report

## 1. Promotions
- [entry] → [destination] because [reason]

## 2. Cleanup
- Duplicate: [entry A] and [entry B]
- Outdated: [entry] (contradicts [skill])
- Conflict: [skill X] vs [skill Y]

## 3. Ambiguous (Need Your Call)
- [entry] could go to [A] or [B]?

## 4. No Action Needed
- Brief note on N entries that stay put

## 5. Stats Summary
- Total techniques: N
- Active learned skills: N
- Targets tracked: N
- Active findings: N
- Last refined skill: [date]
```

**Success criteria**: User can approve/
reject each proposal individually.

---

### Mode 2: `/memory target [name]`

Create or update a target profile in
TARGETS.md:

```markdown
## [Target Name]

### Program Info
- Platform: HackerOne / Bugcrowd / Private
- Program URL:
- Scope (in):
- Scope (out):
- Bounty range: $X - $X,XXX
- Response time: N days

### Attack Surface
- Subdomains: [list]
- Tech stack: [list]
- Key endpoints: [list]
- Auth type:
- API format: REST / GraphQL / gRPC

### Findings
| Date | Type | Severity | Confidence | Status | Bounty |
|------|------|----------|------------|--------|--------|

### Tested Areas
- [ ] Authentication flows
- [ ] API endpoints
- [ ] File upload
- [ ] Payment processing
- [ ] Admin panel
- [ ] GraphQL
- [ ] WebSocket
- [ ] Mobile API

### Cross-References
- [skill X] may apply (similar tech stack)
- [skill Y] NOT applicable because [reason]

### Notes for Next Session
- [Unfinished threads]

### Sessions
| Date | Focus | Result |
|------|-------|--------|
```

If target exists, **update** rather than
overwrite — preserve history.

---

### Mode 3: `/memory search [query]`

Search across all memory layers and past
reports:

```bash
# Search memory files
grep -rn "[query]" MEMORY.md TARGETS.md

# Search learned skills
grep -rn "[query]" .claude/skills/learned/

# Search past reports
grep -rn "[query]" reports/
```

Report all matches with context (3 lines
before/after).

---

### Mode 4: `/memory stats`

Quick dashboard:

```markdown
# Bug Bounty Memory Stats

## Pipeline Health
- Total hunts: N
- Total findings: N
- Total bounties: $X,XXX
- Skills learned: N
- Success rate (exploitable/total): X%

## Top Skills by Finds
1. hunt-idor: N finds, $X,XXX earned
2. hunt-ssrf: N finds, $X,XXX earned
...

## Targets Tracked: N
- Active: N
- Dormant: N (>30 days since session)

## Recent Activity
- Last hunt: [date] on [target]
- Last finding: [date] — [type]
- Last skill update: [skill] ([date])
```

---

## Rules

- **Present ALL proposals before any changes**
- **Do NOT modify files without approval**
- **Do NOT create new files unless the target
  doesn't exist yet**
- **Ask about ambiguous entries** — don't guess
- **Preserve history** — append, don't overwrite
