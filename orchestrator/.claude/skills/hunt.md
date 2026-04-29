---
name: hunt
description: >
  Master autonomous bug bounty pipeline. One
  command runs the full engagement end-to-end:
  surface mapping, OSINT, threat emulation,
  6 parallel auditors, verification, chaining,
  cloud pivot, post-exploit, evasion, report.
  Spawns hunt-orchestrator agent which makes
  all decisions autonomously.
argument-hint: "[target.com]"
allowed_tools:
  - Agent
  - Read
  - Glob
  - Grep
  - Bash
  - TodoWrite
  - Write
---

# /hunt — Autonomous Full-Pipeline Engagement

Single command. Full engagement. Zero human
intervention between phases.

## Usage

```bash
claude "/hunt target.com"
```

That's it. The orchestrator decides everything:
- which recon to prioritize
- which auditors to spawn
- which findings to verify
- which to chain
- where to pivot (cloud? post-exploit?)
- what WAF bypass to use
- how to write the report

## What Happens

```
/hunt target.com
  ↓
Spawn hunt-orchestrator agent
  ↓
PHASE 1: Surface + OSINT + Threat (parallel)
  surface-mapper  ──╮
  osint           ──┼─→ orchestrator merges
  threat-emulator ──╯    + picks TTP playbook
  ↓
PHASE 2: Analysis (parallel, 7 auditors)
  code-auditor (injection)    ──╮
  code-auditor (auth)         ──┤
  code-auditor (exposure)     ──┤
  code-auditor (client-side)  ──┼─→ all findings
  api-auditor                 ──┤   collected
  business-logic-auditor      ──┤
  auth-deep-auditor           ──╯
  ↓
PHASE 3: Verify (parallel per finding)
  bounty-verifier × N
  → EXPLOITABLE verdicts only
  ↓
PHASE 4: Chain + Pivot (conditional)
  red-team    (always chains)
  cloud-pivot (if SSRF in chain)
  post-exploit-web (if admin in chain)
  ↓
PHASE 5: Evasion (if WAF)
  evasion-operator
  → working payload for report
  ↓
PHASE 6: OPSEC review (before production runs)
  opsec-operator
  → approves / rejects final PoC
  ↓
PHASE 7: Report
  report-writer
  → HackerOne-grade writeup
  + MITRE ATT&CK mapping
  + defender recommendations
  ↓
PHASE 8: Memory
  learner updates MEMORY.md +
  TARGETS.md + creates/refines
  hunt-[type] skills
```

## Autonomous Decision Points

The orchestrator makes these decisions on
its own:

**After surface map:**
- GraphQL found? → api-auditor priority
- Mobile backend found? → add mobile audit
- Multi-tenant SaaS? → business-logic priority
- WAF detected? → queue evasion-operator
- GitHub leak? → immediate validation
- Subdomain takeover? → 5-min win path

**After threat emulation:**
- Scattered Spider profile? → auth-deep focus
- FIN7 profile? → business-logic focus
- APT29 profile? → post-exploit persistence
  focus

**After analysis:**
- 0 findings conf >= 8? → retry with broader
  scope via OSINT hints
- SSRF found? → cloud-pivot pre-queued
- Auth bypass? → post-exploit-web pre-queued
- Chain potential detected? → prioritize

**After verification:**
- 0 EXPLOITABLE? → feed lessons to /after-hunt,
  don't waste /report
- Multiple on same endpoint? → merge chain
- Critical tier chain? → flag for priority
  submission

## Implementation

Invoke the hunt-orchestrator agent with the
target. The agent handles everything.

```
Agent({
  subagent_type: "hunt-orchestrator",
  description: "Full autonomous engagement",
  prompt: "Run full external engagement
    against [target.com]. Authorized scope
    per program. Follow the 8-phase pipeline.
    Make all decisions autonomously. Stop only
    for: scope ambiguity, destructive action,
    external-to-internal pivot. Return final
    report with MITRE ATT&CK mapping."
})
```

## Input

- `$1` — target domain (required)
- `$2` — scope notes (optional, e.g.
  "no subdomain takeover attempts" or
  "API endpoints only")

## Output

- Final report in orchestrator memory
- MEMORY.md + TARGETS.md updated
- Findings logged with MITRE IDs

## When to Use Other Skills Instead

- **Know what you want** → use specific
  skill (e.g. `/analyze`, `/verify`)
- **Just want report** from existing findings
  → `/report`
- **Just want memory update** → `/after-hunt`

`/hunt` is for "run the whole thing, decide
for me."

## Rules

- **Authorized scope only** — always
- **Autonomous, not unsupervised** — stops
  at scope boundaries and destructive actions
- **Report goes to user** — memory goes to
  disk, report goes to conversation
- **Confidence >= 8 only** — in final report
- **Safe payloads only**
